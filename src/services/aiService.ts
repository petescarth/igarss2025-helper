import OpenAI from 'openai';
import { ConferenceData, QueryResponse } from '../types/conference';

export class AIService {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true
    });
  }

  async processQuery(query: string, conferenceData: ConferenceData): Promise<QueryResponse> {
    try {
      // Load the prompt template
      const promptResponse = await fetch('/prompt/prompt.txt');
      const promptTemplate = await promptResponse.text();

      // Construct the system message and user message
      const systemMessage = `${promptTemplate}

You are an expert AI assistant for the IGARSS 2025 conference. Your task is to process user queries about the conference and return structured JSON responses based on the provided conference data.

CRITICAL: You must return ONLY valid JSON in the exact format specified in the prompt. Do not include any markdown formatting, code blocks, or additional text outside the JSON response.`;

      const userMessage = `CONFERENCE DATA:
${JSON.stringify(conferenceData, null, 2)}

USER QUERY:
${query}

Please analyze the user query and return a JSON response following the exact schema specified in the system prompt. Remember to:
1. Search comprehensively through the conference data
2. Match sessions based on titles, paper titles, authors, session types, dates, and keywords
3. Include all relevant sessions and papers that match the query
4. Format the response exactly as specified in the JSON schema
5. Generate a helpful summary of the findings

Return ONLY the JSON response, no additional text or explanations.`;

      console.log('Making request to OpenAI GPT-4.1-nano-2025-04-14...');

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4.1-nano-2025-04-14',
        messages: [
          {
            role: 'system',
            content: systemMessage
          },
          {
            role: 'user',
            content: userMessage
          }
        ],
        temperature: 0.1,
        max_tokens: 4000,
        response_format: { type: 'json_object' }
      });

      const response = completion.choices[0]?.message?.content;
      
      if (!response) {
        throw new Error('No response received from OpenAI');
      }

      console.log('Raw OpenAI response length:', response.length);

      // Parse the JSON response
      try {
        const jsonResponse = JSON.parse(response);
        
        // Add debugging information
        console.log('AI Response Summary:', jsonResponse.summary);
        console.log('Number of sessions returned:', jsonResponse.results?.length || 0);
        console.log('Total papers across all sessions:', jsonResponse.results?.reduce((sum: number, session: any) => sum + (session.papers?.length || 0), 0) || 0);
        
        // Check for duplicate session IDs
        const sessionIds = jsonResponse.results?.map((session: any) => session.session_id) || [];
        const uniqueSessionIds = [...new Set(sessionIds)];
        if (sessionIds.length !== uniqueSessionIds.length) {
          console.warn('Duplicate session IDs detected:', sessionIds);
          console.log('Unique session IDs:', uniqueSessionIds);
        }
        
        // Ensure required fields exist
        if (!jsonResponse.query) jsonResponse.query = query;
        if (!jsonResponse.summary) jsonResponse.summary = "Search completed.";
        if (!jsonResponse.contextual_summary) jsonResponse.contextual_summary = "Additional context not available.";
        if (!jsonResponse.results) jsonResponse.results = [];
        
        return jsonResponse;
      } catch (parseError) {
        console.error('Failed to parse OpenAI response as JSON:', parseError);
        console.log('Raw OpenAI response:', response);
        
        // Fallback response
        return {
          query,
          summary: "Sorry, I encountered an error processing your query. Please try rephrasing your question.",
          contextual_summary: "The system experienced a parsing error while processing the conference data.",
          results: []
        };
      }
    } catch (error: any) {
      console.error('OpenAI Service error:', error);
      
      // Handle specific OpenAI errors
      let errorMessage = "Sorry, I'm unable to process your query at the moment.";
      
      if (error?.error?.code === 'invalid_api_key') {
        errorMessage = "Invalid API key. Please check your OpenAI API key and try again.";
      } else if (error?.error?.code === 'insufficient_quota') {
        errorMessage = "API quota exceeded. Please check your OpenAI account billing.";
      } else if (error?.error?.code === 'rate_limit_exceeded') {
        errorMessage = "Rate limit exceeded. Please wait a moment and try again.";
      }
      
      // Fallback response
      return {
        query,
        summary: errorMessage,
        contextual_summary: "Please verify your API key configuration and try again.",
        results: []
      };
    }
  }
}