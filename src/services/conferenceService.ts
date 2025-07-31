import { ConferenceData, Session, Paper, Author, QueryResponse, SearchResult, AuthorProfile } from '../types/conference';
import { AIService } from './aiService';

export class ConferenceService {
  private conferenceData: ConferenceData | null = null;
  private aiService: AIService | null = null;

  constructor(apiKey?: string) {
    if (apiKey) {
      this.aiService = new AIService(apiKey);
    }
  }

  async loadConferenceData(): Promise<void> {
    try {
      const response = await fetch('/prompt/igarss_2025_program.json');
      if (!response.ok) {
        throw new Error('Failed to load conference data');
      }
      this.conferenceData = await response.json();
    } catch (error) {
      console.error('Error loading conference data:', error);
      throw error;
    }
  }

  async searchConference(query: string): Promise<QueryResponse> {
    if (!this.conferenceData) {
      throw new Error('Conference data not loaded');
    }

    // Use AI service if available, otherwise fall back to basic search
    if (this.aiService) {
      return await this.aiService.processQuery(query, this.conferenceData);
    } else {
      return this.basicSearch(query);
    }
  }

  private basicSearch(query: string): QueryResponse {
    if (!this.conferenceData) {
      throw new Error('Conference data not loaded');
    }

    const normalizedQuery = query.toLowerCase().trim();
    const keywords = this.extractKeywords(normalizedQuery);
    const matchingSessions: Session[] = [];

    // Search through all sessions and papers
    for (const day of this.conferenceData.days) {
      for (const session of day.sessions) {
        if (this.sessionMatches(session, keywords, normalizedQuery)) {
          matchingSessions.push(session);
        }
      }
    }

    // Convert to search results format
    const results: SearchResult[] = matchingSessions.map(session => ({
      session_title: session.title,
      session_id: session.session_id_internal,
      session_type: session.session_type,
      schedule: session.schedule,
      location: session.location,
      track: session.track,
      papers: session.papers.map(paper => ({
        paper_title: paper.title,
        paper_id: paper.paper_id_internal,
        authors: paper.authors.map(author => this.createAuthorProfile(author))
      }))
    }));

    const summary = this.generateSummary(results, query);

    return {
      query,
      summary,
      contextual_summary: this.generateContextualSummary(results, query),
      results
    };
  }

  private extractKeywords(query: string): string[] {
    // Remove common stop words and extract meaningful keywords
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'what', 'who', 'when', 'where', 'how', 'about', 'find', 'show', 'get'];
    return query.split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word))
      .map(word => word.replace(/[^\w]/g, ''));
  }

  private sessionMatches(session: Session, keywords: string[], fullQuery: string): boolean {
    const searchableText = [
      session.title,
      session.session_type,
      session.track,
      session.location,
      ...session.papers.map(p => p.title),
      ...session.papers.flatMap(p => p.authors.map(a => a.full_name)),
      ...session.papers.flatMap(p => p.authors.flatMap(a => a.affiliations.map(af => af.institution)))
    ].join(' ').toLowerCase();

    // Check for exact phrase matches first
    if (searchableText.includes(fullQuery)) {
      return true;
    }

    // Check for session type matches
    if (fullQuery.includes('poster') && session.session_type.toLowerCase().includes('poster')) {
      return true;
    }
    if (fullQuery.includes('oral') && session.session_type.toLowerCase().includes('oral')) {
      return true;
    }
    if (fullQuery.includes('keynote') && session.session_type.toLowerCase().includes('keynote')) {
      return true;
    }

    // Check for day/date matches
    if (fullQuery.includes('monday') || fullQuery.includes('tuesday') || fullQuery.includes('wednesday') || 
        fullQuery.includes('thursday') || fullQuery.includes('friday')) {
      const dayMatch = fullQuery.match(/(monday|tuesday|wednesday|thursday|friday)/i);
      if (dayMatch && session.schedule.date.toLowerCase().includes(dayMatch[1])) {
        return true;
      }
    }

    // Check if most keywords match
    const matchingKeywords = keywords.filter(keyword => searchableText.includes(keyword));
    return matchingKeywords.length >= Math.min(2, keywords.length);
  }

  private createAuthorProfile(author: Author): AuthorProfile {
    return {
      full_name: author.full_name,
      institution: author.affiliations[0]?.institution || ''
    };
  }

  private generateSummary(results: SearchResult[], query: string): string {
    if (results.length === 0) {
      return `No sessions or papers found matching "${query}".`;
    }

    const sessionCount = results.length;
    const paperCount = results.reduce((sum, session) => sum + session.papers.length, 0);
    
    let summary = `Found ${sessionCount} session${sessionCount !== 1 ? 's' : ''}`;
    if (paperCount > 0) {
      summary += ` and ${paperCount} paper${paperCount !== 1 ? 's' : ''}`;
    }
    summary += ` related to "${query}".`;

    // Add specific details based on query type
    if (query.toLowerCase().includes('poster')) {
      const posterSessions = results.filter(r => r.session_type.toLowerCase().includes('poster'));
      if (posterSessions.length > 0) {
        summary += ` Includes ${posterSessions.length} poster session${posterSessions.length !== 1 ? 's' : ''}.`;
      }
    }

    return summary;
  }

  private generateContextualSummary(results: SearchResult[], query: string): string {
    if (results.length === 0) {
      return "No additional context available as no matching results were found.";
    }

    const normalizedQuery = query.toLowerCase();
    
    // Check if query is author-focused
    const authorNames = results.flatMap(r => r.papers.flatMap(p => p.authors.map(a => a.full_name.toLowerCase())));
    const uniqueAuthors = [...new Set(authorNames)];
    
    if (uniqueAuthors.some(author => normalizedQuery.includes(author.split(' ')[0].toLowerCase()))) {
      const institutions = [...new Set(results.flatMap(r => r.papers.flatMap(p => p.authors.map(a => a.institution))))];
      const topics = [...new Set(results.flatMap(r => r.papers.map(p => p.paper_title)))];
      
      return `The search reveals contributions from researchers across ${institutions.length} institution${institutions.length !== 1 ? 's' : ''}, with work spanning ${topics.length} paper${topics.length !== 1 ? 's' : ''} in areas such as ${topics.slice(0, 3).join(', ')}${topics.length > 3 ? ', and others' : ''}. This demonstrates active research collaboration and diverse expertise in the queried domain.`;
    }
    
    // Check if query is topic-focused
    if (normalizedQuery.includes('machine learning') || normalizedQuery.includes('ai') || normalizedQuery.includes('deep learning')) {
      const tracks = [...new Set(results.map(r => r.track))];
      return `The machine learning and AI research at this conference spans ${tracks.length} track${tracks.length !== 1 ? 's' : ''} (${tracks.join(', ')}), indicating the interdisciplinary nature of AI applications in remote sensing and geoscience. The ${results.length} session${results.length !== 1 ? 's' : ''} demonstrate${results.length === 1 ? 's' : ''} the growing integration of advanced computational methods across various Earth observation domains.`;
    }
    
    // Check if query is session-type focused
    if (normalizedQuery.includes('poster')) {
      const posterSessions = results.filter(r => r.session_type.toLowerCase().includes('poster'));
      return `Poster sessions provide an interactive forum for detailed technical discussions. The ${posterSessions.length} poster session${posterSessions.length !== 1 ? 's' : ''} found cover diverse research areas, offering opportunities for in-depth conversations between researchers and attendees about cutting-edge developments in their respective fields.`;
    }
    
    // Generic contextual summary
    const tracks = [...new Set(results.map(r => r.track))];
    const sessionTypes = [...new Set(results.map(r => r.session_type))];
    
    return `The search results span ${tracks.length} conference track${tracks.length !== 1 ? 's' : ''} and include ${sessionTypes.length} different session type${sessionTypes.length !== 1 ? 's' : ''} (${sessionTypes.join(', ')}). This diversity reflects the multidisciplinary nature of the research area and provides multiple venues for knowledge sharing, from formal presentations to interactive discussions.`;
  }

  getConferenceOverview(): any {
    if (!this.conferenceData) return null;
    
    return {
      name: this.conferenceData.conference_name,
      dates: this.conferenceData.conference_dates,
      location: this.conferenceData.location,
      totalDays: this.conferenceData.days.length,
      totalSessions: this.conferenceData.days.reduce((sum, day) => sum + day.sessions.length, 0),
      totalPapers: this.conferenceData.days.reduce((sum, day) => 
        sum + day.sessions.reduce((sessionSum, session) => sessionSum + session.papers.length, 0), 0
      )
    };
  }
}