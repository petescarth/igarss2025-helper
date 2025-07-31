import React, { useState, useEffect } from 'react';
import { Satellite, AlertCircle, Loader2 } from 'lucide-react';
import { ConferenceService } from './services/conferenceService';
import { SearchInterface } from './components/SearchInterface';
import { ConferenceOverview } from './components/ConferenceOverview';
import { QueryResponse } from './types/conference';

function App() {
  const [conferenceService] = useState(() => new ConferenceService());
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<any>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        setIsLoading(true);
        await conferenceService.loadConferenceData();
        setOverview(conferenceService.getConferenceOverview());
        setError(null);
      } catch (err) {
        setError('Failed to load conference data. Please try again later.');
        console.error('Initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, [conferenceService]);

  const handleSearch = async (query: string): Promise<QueryResponse> => {
    setIsSearching(true);
    try {
      const results = conferenceService.searchConference(query);
      return results;
    } catch (err) {
      console.error('Search error:', err);
      throw err;
    } finally {
      setIsSearching(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading conference data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <Satellite className="w-8 h-8 text-primary-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                IGARSS 2025 Conference Assistant
              </h1>
              <p className="text-gray-600">
                Find sessions, papers, and speakers using natural language queries
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ConferenceOverview overview={overview} />
        <SearchInterface onSearch={handleSearch} isLoading={isSearching} />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-gray-600">
            <p>IGARSS 2025 Conference Assistant - Powered by AI</p>
            <p className="text-sm mt-1">
              Search through conference sessions, papers, and speakers using natural language
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;