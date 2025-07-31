import requests
from bs4 import BeautifulSoup
import json
import re
import logging
import os
from datetime import datetime
from urllib.parse import urljoin, urlparse, parse_qs
from tqdm import tqdm

# --- Main Configuration ---
BASE_URL = "https://www.2025.ieeeigarss.org/"
TECHNICAL_PROGRAM_URL = urljoin(BASE_URL, "technical_program.php")
TUTORIALS_URL = urljoin(BASE_URL, "tutorials.php")
COMPRESSED_OUTPUT_FILE = "igarss_2025_program.json"
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}

# --- Compression Configuration ---
KEYS_TO_REMOVE = {
    'provenance', 'paper_id_system', 'session_id_system', 
    'abstract', 'country'
}
KEY_RENAME_MAP = {
    "full_name": "name", "affiliations": "aff", "institution": "ins",
    "session_type": "type", "paper_id_internal": "pid", "authors": "aut",
    "location": "loc", "start_time": "start", "end_time": "end"
}

# --- Setup Logging ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')


# --- Data Scraping Functions ---

def get_soup(url):
    """Fetches a URL and returns a BeautifulSoup object, handling errors."""
    try:
        response = requests.get(url, headers=HEADERS, timeout=15)
        response.raise_for_status()
        return BeautifulSoup(response.content, 'html.parser')
    except requests.exceptions.RequestException as e:
        logging.error(f"Could not fetch or parse URL {url}: {e}")
        return None

def parse_paper_page(paper_url):
    """Parses an individual paper page with robust selectors."""
    soup = get_soup(paper_url)
    if not soup: return None
    paper_data = {
        "paper_id_system": None, "title": None, "authors": [], "abstract": None,
        "provenance": {"source_url": paper_url, "extraction_timestamp": datetime.utcnow().isoformat() + "Z"}
    }
    parsed_url = urlparse(paper_url)
    query_params = parse_qs(parsed_url.query)
    paper_data["paper_id_system"] = int(query_params.get('PaperNum', [None])[0]) if query_params.get('PaperNum') else None
    title_tag = soup.find('h3') or soup.find('h2') or soup.find('h1')
    if title_tag: paper_data["title"] = title_tag.get_text(strip=True)
    else: logging.warning(f"Could not find title on {paper_url}")
    author_info_tag = title_tag.find_next_sibling(['p', 'div']) if title_tag else None
    if not author_info_tag: author_info_tag = soup.find(lambda tag: tag.name in ['p', 'div'] and ('University' in tag.get_text() or 'China' in tag.get_text()))
    if author_info_tag:
        full_text = author_info_tag.get_text(strip=True)
        try:
            for group in re.split(r';\s*', full_text):
                parts = [p.strip() for p in group.split(',') if p.strip()]
                if len(parts) > 2:
                    country, institution, names = parts[-1], parts[-2], parts[:-2]
                    for name in names: paper_data["authors"].append({"full_name": name, "affiliations": [{"institution": institution, "country": country}]})
                elif len(parts) == 2: paper_data["authors"].append({"full_name": parts[0], "affiliations": [{"institution": parts[1], "country": None}]})
                elif len(parts) == 1: paper_data["authors"].append({"full_name": parts[0], "affiliations": []})
        except Exception as e:
            logging.error(f"Could not parse author string '{full_text}' on {paper_url}: {e}")
            paper_data["authors"].append({"full_name": full_text, "affiliations":[]})
    else: logging.warning(f"Could not find author information on {paper_url}")
    return paper_data

def parse_session_page(session_url):
    """Parses a session page with robust selectors and fallbacks."""
    soup = get_soup(session_url)
    if not soup: return None
    session_data = {
        "session_id_system": None, "session_id_internal": None, "title": None, "session_type": "",
        "schedule": {"start_time": None, "end_time": None, "date": None}, "location": "", "track": "",
        "chairs_presenters": [], "papers": [],
        "provenance": {"source_url": session_url, "extraction_timestamp": datetime.utcnow().isoformat() + "Z"}
    }
    parsed_url = urlparse(session_url)
    query_params = parse_qs(parsed_url.query)
    session_data["session_id_system"] = int(query_params.get('SessionID', [None])[0]) if query_params.get('SessionID') else None
    title_tag = soup.find('div', class_='card-header') or soup.find('h3') or soup.find('h2') or soup.find('h1')
    if title_tag:
        title_text = title_tag.get_text(strip=True)
        match = re.match(r'^\s*([A-Z0-9\.\-]+):\s*(.*)\s*$', title_text)
        if match: session_data["session_id_internal"], session_data["title"] = match.group(1).strip(), match.group(2).strip()
        else: session_data["title"] = title_text
    details_text = title_tag.parent.get_text(separator=' ', strip=True) if title_tag and title_tag.parent else soup.get_text(separator=' ', strip=True)
    location_match = re.search(r'Location:\s*([^|]+?)(?=\s*\||$)', details_text, re.IGNORECASE)
    if location_match: session_data["location"] = location_match.group(1).strip()
    paper_links = soup.find_all('a', href=re.compile(r'view_paper\.php'))
    for link in tqdm(paper_links, desc=f"  Scraping papers in session {session_data.get('session_id_internal', '...')}", leave=False):
        paper_url = urljoin(BASE_URL, link['href'])
        paper_data = parse_paper_page(paper_url)
        if paper_data: session_data["papers"].append(paper_data)
    return session_data

def parse_tutorials_page():
    """Parses the single, comprehensive tutorials page."""
    soup = get_soup(TUTORIALS_URL)
    if not soup: return []
    sessions = []
    for div in tqdm(soup.find_all('div', class_='col-lg-12 mb-4'), desc="Scraping tutorials"):
        title_tag = div.find('strong')
        if not title_tag: continue
        match = re.match(r'([A-Z0-9\-]+):\s*(.*)', title_tag.get_text(strip=True))
        if not match: continue
        session_data = {
            "session_id_internal": match.group(1), "title": match.group(2), "session_type": "Tutorial",
            "schedule": {}, "location": None, "chairs_presenters": [], "papers":[],
            "provenance": {"source_url": TUTORIALS_URL, "extraction_timestamp": datetime.utcnow().isoformat() + "Z"}
        }
        for item in div.find_all('li'):
            item_text = item.get_text(strip=True)
            if item_text.startswith("Date:"): session_data["schedule"]["date"] = item_text.replace("Date:", "").strip()
            elif item_text.startswith("Location:"): session_data["location"] = item_text.replace("Location:", "").strip()
        sessions.append(session_data)
    return sessions

# --- Data Processing Function ---

def process_data_recursive(obj, keys_to_remove, key_rename_map):
    """Recursively removes/renames keys and cleans non-ASCII characters from strings."""
    if isinstance(obj, dict):
        for key in list(obj.keys()):
            process_data_recursive(obj[key], keys_to_remove, key_rename_map)
            if isinstance(obj.get(key), str): obj[key] = obj[key].encode('ascii', 'ignore').decode('ascii')
            if key in keys_to_remove: del obj[key]
            elif key in key_rename_map: obj[key_rename_map[key]] = obj.pop(key)
    elif isinstance(obj, list):
        for i, item in enumerate(obj):
            process_data_recursive(item, keys_to_remove, key_rename_map)
            if isinstance(obj[i], str): obj[i] = obj[i].encode('ascii', 'ignore').decode('ascii')
    return obj

# --- Main Execution ---

def main():
    """Main function to orchestrate the scraping and processing."""
    logging.info("Starting IGARSS 2025 program scrape.")
    conference_data = {
        "conference_name": "IGARSS 2025", "conference_dates": "2025-08-03 to 2025-08-08",
        "location": "Brisbane, Australia", "main_program_url": TECHNICAL_PROGRAM_URL, "days": {}
    }

    # Scrape all data
    all_sessions = parse_tutorials_page()
    soup = get_soup(TECHNICAL_PROGRAM_URL)
    if soup:
        unique_urls = set(urljoin(BASE_URL, link['href']) for link in soup.find_all('a', href=re.compile(r'view_session\.php')))
        logging.info(f"Found {len(unique_urls)} unique technical session URLs.")
        for url in tqdm(unique_urls, desc="Scraping technical sessions"):
            session_data = parse_session_page(url)
            if session_data: all_sessions.append(session_data)
    
    # Organize data by day
    for session in all_sessions:
        date_key = session.get("schedule", {}).get("date")
        if date_key:
            try:
                date_obj = datetime.strptime(date_key, "%A, %d %B %Y").replace(year=2025)
                formatted_date, day_of_week = date_obj.strftime("%Y-%m-%d"), date_obj.strftime("%A")
            except (ValueError, TypeError):
                formatted_date, day_of_week = date_key, None
            if formatted_date:
                conference_data["days"].setdefault(formatted_date, {"date": formatted_date, "day_of_week": day_of_week, "sessions": []})["sessions"].append(session)
    
    conference_data["days"] = sorted(conference_data["days"].values(), key=lambda x: x["date"] or "")
    logging.info("Scraping complete.")

    # Process and compress the data in memory
    logging.info("Cleaning, renaming keys, and removing non-standard characters...")
    cleaned_data = process_data_recursive(conference_data, KEYS_TO_REMOVE, KEY_RENAME_MAP)

    # Save the final compressed file
    logging.info(f"Saving compressed data to {COMPRESSED_OUTPUT_FILE}...")
    try:
        with open(COMPRESSED_OUTPUT_FILE, 'w', encoding='ascii') as f:
            json.dump(cleaned_data, f, separators=(',', ':'))
        file_size = os.path.getsize(COMPRESSED_OUTPUT_FILE)
        logging.info(f"Successfully created compressed file. Size: {file_size / 1024:.2f} KB")
    except Exception as e:
        logging.error(f"An unexpected error occurred while saving the file: {e}")

if __name__ == "__main__":
    main()
