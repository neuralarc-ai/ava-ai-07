
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, CalendarDays, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface Report {
  id: string;
  name: string;
  date: string;
  isActive?: boolean;
}

interface ReportHistoryProps {
  reports: Report[];
  onSelectReport: (report: Report) => void;
  onDeleteReport: (reportId: string) => void;
}

const ReportHistory: React.FC<ReportHistoryProps> = ({ reports, onSelectReport, onDeleteReport }) => {
  return (
    <Card className="bg-white border-gray-200 w-full shadow-sm">
      <CardHeader>
        <CardTitle className="text-gray-800 text-lg flex items-center gap-2">
          <FileText className="h-5 w-5 text-ava-neon-green" /> 
          Report History
        </CardTitle>
        <CardDescription>Your past blood reports</CardDescription>
      </CardHeader>
      <CardContent>
        {reports.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            No reports uploaded yet
          </div>
        ) : (
          <ul className="space-y-2">
            {reports.map((report) => (
              <li key={report.id}>
                <div className="flex items-center">
                  <button 
                    className={`flex-1 text-left p-3 rounded-md flex items-center gap-3 transition-colors
                      ${report.isActive 
                        ? 'bg-ava-neon-green/20 text-gray-800' 
                        : 'hover:bg-gray-100 text-gray-700'}`}
                    onClick={() => onSelectReport(report)}
                  >
                    <FileText className={`h-4 w-4 ${report.isActive ? 'text-ava-neon-green' : 'text-gray-500'}`} />
                    <div className="flex-1 overflow-hidden">
                      <div className="truncate">{report.name}</div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <CalendarDays className="h-3 w-3" /> {report.date}
                      </div>
                    </div>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDeleteReport(report.id)}
                    className="text-gray-500 hover:text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default ReportHistory;
