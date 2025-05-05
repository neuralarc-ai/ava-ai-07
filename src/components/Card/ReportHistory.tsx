
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, CalendarDays } from 'lucide-react';

export interface Report {
  id: string;
  name: string;
  date: string;
  isActive?: boolean;
}

interface ReportHistoryProps {
  reports: Report[];
  onSelectReport: (report: Report) => void;
}

const ReportHistory: React.FC<ReportHistoryProps> = ({ reports, onSelectReport }) => {
  return (
    <Card className="bg-ava-card-bg border-gray-700 w-full">
      <CardHeader>
        <CardTitle className="text-ava-light text-lg flex items-center gap-2">
          <FileText className="h-5 w-5 text-ava-neon-green" /> 
          Report History
        </CardTitle>
        <CardDescription>Your past blood reports</CardDescription>
      </CardHeader>
      <CardContent>
        {reports.length === 0 ? (
          <div className="text-center py-4 text-gray-400">
            No reports uploaded yet
          </div>
        ) : (
          <ul className="space-y-2">
            {reports.map((report) => (
              <li key={report.id}>
                <button 
                  className={`w-full text-left p-3 rounded-md flex items-center gap-3 transition-colors
                    ${report.isActive 
                      ? 'bg-ava-neon-green/20 text-ava-neon-green' 
                      : 'hover:bg-gray-800 text-gray-300'}`}
                  onClick={() => onSelectReport(report)}
                >
                  <FileText className={`h-4 w-4 ${report.isActive ? 'text-ava-neon-green' : 'text-gray-400'}`} />
                  <div className="flex-1 overflow-hidden">
                    <div className="truncate">{report.name}</div>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <CalendarDays className="h-3 w-3" /> {report.date}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default ReportHistory;
