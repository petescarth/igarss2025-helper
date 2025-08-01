# igarss2025-helper

An AI-powered conference assistant for IGARSS 2025 that helps users find specific information about conference sessions, papers, and speakers using natural language queries.

## Live Demo

🚀 **[Try the live demo here](https://igarsshelper.netlify.app/)**

## Features

- **Natural Language Search**: Ask questions like "What posters feature Sentinel 2?" or "Show me machine learning sessions on Tuesday"
- **AI-Powered Responses**: Uses OpenAI GPT-4.1-nano to provide rich, contextual answers
- **Comprehensive Data**: Searches through sessions, papers, authors, and affiliations
- **Author Profiles**: Enriched with links to Google Scholar, LinkedIn, and other professional profiles
- **Structured Results**: Clear presentation of session details, schedules, and locations

## Setup

1. **Get a Google AI API Key**:
1. **Get an OpenAI API Key**:
   - Visit [OpenAI Platform](https://platform.openai.com/api-keys)
   - Sign in with your OpenAI account
   - Create a new API key

2. **Configure the API Key**:
   - Copy `.env.example` to `.env`
   - Replace `your_api_key_here` with your actual API key
   - Or enter it directly in the app interface

3. **Install Dependencies**:
   ```bash
   npm install
   ```

4. **Start the Development Server**:
   ```bash
   npm run dev
   ```

## Usage

The assistant can handle various types of queries:

- **Topic-based**: "What sessions are about machine learning?"
- **Session type**: "Show me poster sessions on Tuesday"
- **Technology-specific**: "Find presentations about Sentinel-2"
- **Author-based**: "Who is presenting on remote sensing applications?"
- **Time-based**: "What sessions are in the morning on Wednesday?"
- **Institution-based**: "Find papers by authors from University of California"
- **Track-based**: "What sessions are in the Land Applications track?"

## Technical Details

- **Frontend**: React + TypeScript + Tailwind CSS
- **AI Integration**: OpenAI GPT-4.1-nano-2025-04-14
- **Data Processing**: JSON-based conference program parsing
- **Search**: AI-powered semantic search with fallback to keyword matching

## Data Structure

The application processes conference data in JSON format containing:
- Conference metadata (name, dates, location)
- Daily schedules with sessions
- Session details (title, type, schedule, location, track)
- Paper information (titles, authors, affiliations)
- Author profiles with external links

## License

Apache License 2.0