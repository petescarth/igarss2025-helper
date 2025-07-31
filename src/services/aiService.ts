import { GoogleGenerativeAI } from '@google/generative-ai';
import { ConferenceData, QueryResponse } from '../types/conference';

export class AIService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
  }

  async processQuery(query: string, conferenceData: ConferenceData): Promise<QueryResponse> {
    try {
      // Load the prompt template
      const promptResponse = await fetch('/prompt/prompt.txt');
      const promptTemplate = await promptResponse.text();

      // Construct the full prompt
      const fullPrompt = `${promptTemplate}

CONFERENCE DATA:
${JSON.stringify(conferenceData, null, 2)}

USER QUERY:
${query}

Please analyze the user query and return a JSON response following the exact schema specified in the prompt. Remember to:
1. Search comprehensively through the conference data
2. Match sessions based on titles, paper titles, authors, session types, dates, and keywords
3. Include all relevant sessions and papers that match the query
4. Format the response exactly as specified in the JSON schema
5. Generate a helpful summary of the findings

Return ONLY the JSON response, no additional text or explanations.`;

      // Count tokens before making the request
      const tokenCount = await this.model.countTokens(fullPrompt);
      console.log(`Token count for request: ${tokenCount.totalTokens}`);

      const result = await this.model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();

      // Clean the response by removing markdown code block fences
      let cleanedText = text.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      // Parse the JSON response
      try {
        const jsonResponse = JSON.parse(cleanedText);
        
        // Add debugging information
        console.log('AI Response Summary:', jsonResponse.summary);
        console.log('Number of sessions returned:', jsonResponse.results?.length || 0);
        console.log('Total papers across all sessions:', jsonResponse.results?.reduce((sum, session) => sum + (session.papers?.length || 0), 0) || 0);
        
        return jsonResponse;
      } catch (parseError) {
        console.error('Failed to parse AI response as JSON:', parseError);
        console.log('Raw AI response:', text);
        console.log('Cleaned AI response:', cleanedText);
        
        // Fallback response
        return {
          query,
          summary: "Sorry, I encountered an error processing your query. Please try rephrasing your question.",
          results: []
        };
      }
    } catch (error) {
      console.error('AI Service error:', error);
      
      // Fallback response
      return {
        query,
        summary: "Sorry, I'm unable to process your query at the moment. Please check your API key and try again.",
        results: []
      };
    }
  }

  async enrichWithWebSearch(authors: string[]): Promise<Record<string, any>> {
    // Note: In a real implementation, this would perform web searches
    // For now, we'll return placeholder data as the AI model will handle this
    const enrichedData: Record<string, any> = {};
    
    for (const author of authors) {
      enrichedData[author] = {
        google_scholar: null,
        linkedin: null,
        other: null
      };
    }
    
    return enrichedData;
  }
}