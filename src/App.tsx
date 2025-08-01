import React, { useState, useEffect } from 'react';
import { Satellite, AlertCircle, Loader2, Settings } from 'lucide-react';
import { ConferenceService } from './services/conferenceService';
import { SearchInterface } from './components/SearchInterface';
import { ConferenceOverview } from './components/ConferenceOverview';
import { QueryResponse } from './types/conference';

function App() {
  const [apiKey, setApiKey] = useState<string>('');
  const [conferenceService, setConferenceService] = useState<ConferenceService | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<any>(null);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);

  useEffect(() => {
    // Check for API key in environment variables
    const envApiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (envApiKey && envApiKey !== 'your_api_key_here') {
      setApiKey(envApiKey);
      initializeService(envApiKey);
    } else {
      setShowApiKeyInput(true);
      setIsLoading(false);
    }
  }, []);

  const initializeService = async (key: string) => {
    try {
      setIsLoading(true);
      const service = new ConferenceService(key);
      await service.loadConferenceData();
      setConferenceService(service);
      setOverview(service.getConferenceOverview());
      setError(null);
      setApiKeyError(null);
      setShowApiKeyInput(false);
    } catch (err) {
      setError('Failed to load conference data. Please try again later.');
      console.error('Initialization error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApiKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      setApiKeyError('Please enter a valid API key');
      return;
    }
    await initializeService(apiKey);
  };

  useEffect(() => {
    const initializeApp = async () => {
      if (!conferenceService) return;
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

    if (conferenceService) {
      initializeApp();
    }
  }, []);

  const handleSearch = async (query: string): Promise<QueryResponse> => {
    if (!conferenceService) {
      throw new Error('Conference service not initialized');
    }
    
    setIsSearching(true);
    try {
      const results = await conferenceService.searchConference(query);
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

  if (showApiKeyInput) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
          <div className="text-center mb-6">
            <Settings className="w-12 h-12 text-primary-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Setup Required</h2>
            <p className="text-gray-600">
              Please enter your OpenAI API key to use the conference assistant.
            </p>
          </div>
          
          <form onSubmit={handleApiKeySubmit} className="space-y-4">
            <div>
              <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-2">
                OpenAI API Key
              </label>
              <input
                type="password"
                id="apiKey"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your API key..."
                className="input-field"
                disabled={isLoading}
              />
              {apiKeyError && (
                <p className="text-red-600 text-sm mt-1">{apiKeyError}</p>
              )}
            </div>
            
            <button
              type="submit"
              disabled={isLoading || !apiKey.trim()}
              className="w-full btn-primary"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Initializing...
                </>
              ) : (
                'Initialize Assistant'
              )}
            </button>
          </form>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-medium text-blue-800 mb-2">How to get your API key:</h3>
            <ol className="text-sm text-blue-700 space-y-1">
              <li>1. Visit <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">OpenAI Platform</a></li>
              <li>2. Sign in with your OpenAI account</li>
              <li>3. Create a new API key</li>
              <li>4. Copy and paste it above</li>
            </ol>
          </div>
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
          <button
            onClick={() => setShowApiKeyInput(true)}
            className="btn-secondary ml-2"
          >
            Change API Key
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
        {conferenceService && (
          <SearchInterface onSearch={handleSearch} isLoading={isSearching} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-gray-600">
            <p>IGARSS 2025 Conference Assistant - Powered by OpenAI GPT-4.1-nano</p>
            <p className="text-sm mt-1">
              Advanced AI-powered search through conference sessions, papers, and speakers
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;