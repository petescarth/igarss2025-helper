import React from 'react';
import { Calendar, MapPin, Users, FileText, Clock } from 'lucide-react';

interface ConferenceOverviewProps {
  overview: {
    name: string;
    dates: string;
    location: string;
    totalDays: number;
    totalSessions: number;
    totalPapers: number;
  } | null;
}

export const ConferenceOverview: React.FC<ConferenceOverviewProps> = ({ overview }) => {
  if (!overview) return null;

  return (
    <div className="card mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">{overview.name}</h2>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <Calendar className="w-5 h-5 text-primary-600" />
          <div>
            <p className="text-sm text-gray-600">Dates</p>
            <p className="font-semibold text-gray-800">{overview.dates}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <MapPin className="w-5 h-5 text-primary-600" />
          <div>
            <p className="text-sm text-gray-600">Location</p>
            <p className="font-semibold text-gray-800">{overview.location}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <Clock className="w-5 h-5 text-primary-600" />
          <div>
            <p className="text-sm text-gray-600">Duration</p>
            <p className="font-semibold text-gray-800">{overview.totalDays} Days</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <Users className="w-5 h-5 text-primary-600" />
          <div>
            <p className="text-sm text-gray-600">Sessions</p>
            <p className="font-semibold text-gray-800">{overview.totalSessions}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <FileText className="w-5 h-5 text-primary-600" />
          <div>
            <p className="text-sm text-gray-600">Papers</p>
            <p className="font-semibold text-gray-800">{overview.totalPapers}</p>
          </div>
        </div>
      </div>
    </div>
  );
};