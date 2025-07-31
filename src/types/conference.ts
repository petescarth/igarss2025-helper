export interface Author {
  full_name: string;
  affiliations: Array<{
    institution: string;
    country: string;
  }>;
}

export interface Paper {
  paper_id_internal: string;
  title: string;
  authors: Author[];
}

export interface Session {
  session_id_internal: string;
  title: string;
  session_type: string;
  schedule: {
    date: string;
    start_time: string;
    end_time: string;
  };
  location: string;
  track: string;
  papers: Paper[];
}

export interface Day {
  date: string;
  day_of_week: string;
  sessions: Session[];
}

export interface ConferenceData {
  conference_name: string;
  conference_dates: string;
  location: string;
  days: Day[];
}

export interface AuthorProfile {
  full_name: string;
  institution: string;
  profiles: {
    google_scholar: string | null;
    linkedin: string | null;
    other: string | null;
  };
}

export interface SearchResult {
  session_title: string;
  session_id: string;
  session_type: string;
  schedule: {
    date: string;
    start_time: string;
    end_time: string;
  };
  location: string;
  track: string;
  papers: Array<{
    paper_title: string;
    paper_id: string;
    authors: AuthorProfile[];
  }>;
}

export interface QueryResponse {
  query: string;
  summary: string;
  results: SearchResult[];
}