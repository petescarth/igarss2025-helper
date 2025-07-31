import React, { useState } from 'react';
import { Search, Loader2, Calendar, MapPin, Users, FileText, AlertCircle } from 'lucide-react';
import { QueryResponse } from '../types/conference';

interface SearchInterfaceProps {
  onSearch: (query: string) => Promise<QueryResponse>;
  isLoading: boolean;
}

export const SearchInterface: React.FC<SearchInterfaceProps> = ({ onSearch, isLoading }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<QueryResponse | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    try {
      const response = await onSearch(query);
      setResults(response);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const exampleQueries = [
    "What posters feature Sentinel 2?",
    "Show me sessions about machine learning on Tuesday",
    "Find presentations about hyperspectral data",
    "Who is presenting on SAR applications?",
    "What oral sessions are scheduled for Wednesday morning?",
    "Find papers by authors from University of California",
    "Show me all keynote presentations",
    "What sessions are in the Land Applications track?"
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask me anything about IGARSS 2025... (e.g., 'What sessions are about machine learning?')"
            className="input-field pr-12"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 btn-primary px-3 py-2"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Search className="w-5 h-5" />
            )}
          </button>
        </div>
      </form>

      {/* Example Queries */}
      {!results && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Try these example queries:</h3>
          <div className="grid gap-2">
            {exampleQueries.map((example, index) => (
              <button
                key={index}
                onClick={() => setQuery(example)}
                className="text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200 text-gray-700"
              >
                "{example}"
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search Results */}
      {results && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="card bg-primary-50 border-primary-200">
            <h2 className="text-xl font-semibold text-primary-800 mb-2">Search Results</h2>
            <p className="text-primary-700">{results.summary}</p>
            <p className="text-sm text-primary-600 mt-2">Query: "{results.query}"</p>
          </div>

          {/* Results */}
          {results.results.length > 0 ? (
            <div className="space-y-6">
              <div className="text-sm text-gray-600 mb-4">
                Showing {results.results.length} session{results.results.length !== 1 ? 's' : ''} with {results.results.reduce((sum, session) => sum + session.papers.length, 0)} paper{results.results.reduce((sum, session) => sum + session.papers.length, 0) !== 1 ? 's' : ''}
              </div>
              {results.results.map((session, sessionIndex) => (
                <div key={`session-${sessionIndex}-${session.session_id}-${Date.now()}`} className="card">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">
                        {session.session_title}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                        <span className="bg-primary-100 text-primary-800 px-2 py-1 rounded-full">
                          {session.session_type}
                        </span>
                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                          {session.track}
                        </span>
                      </div>
                    </div>
                    <span className="text-sm font-mono text-gray-500">
                      {session.session_id}
                    </span>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{session.schedule.date}</span>
                      <span>{session.schedule.start_time} - {session.schedule.end_time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{session.location}</span>
                    </div>
                  </div>

                  {session.papers.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Papers ({session.papers.length})
                      </h4>
                      <div className="space-y-3">
                        {session.papers.map((paper, paperIndex) => (
                          <div key={`paper-${sessionIndex}-${paperIndex}-${paper.paper_id}-${Date.now()}`} className="bg-gray-50 p-4 rounded-lg">
                            <h5 className="font-medium text-gray-800 mb-2">
                              {paper.paper_title}
                            </h5>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Users className="w-4 h-4" />
                                <div className="flex flex-wrap gap-2">
                                  {paper.authors.map((author, authorIndex) => (
                                    <span key={`author-${sessionIndex}-${paperIndex}-${authorIndex}`}>
                                      {author.full_name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <span className="text-xs font-mono text-gray-500">
                                {paper.paper_id}
                              </span>
                            </div>
                            {paper.authors.length > 0 && (
                              <div className="mt-2 text-xs text-gray-500">
                                Affiliations: {paper.authors.map(author => author.institution).join('; ')}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="card text-center py-8">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No results found for your query.</p>
              <p className="text-sm text-gray-500">Try different keywords or check the example queries above.</p>
            </div>
          )}

          {/* New Search Button */}
          <div className="text-center">
            <button
              onClick={() => {
                setResults(null);
                setQuery('');
              }}
              className="btn-secondary"
            >
              New Search
            </button>
          </div>
        </div>
      )}
    </div>
  );
};