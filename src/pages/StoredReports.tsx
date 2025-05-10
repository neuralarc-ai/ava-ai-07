import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Layout } from '@/components/layout/Layout';
import { getStoredReports, deleteStoredReport, clearAllStoredReports } from '@/services/healthAnalysisService';
import { CalendarIcon, Trash2, FileText, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const StoredReports = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = () => {
    const storedReports = getStoredReports();
    setReports(storedReports.sort((a, b) => b.timestamp - a.timestamp));
  };

  const handleViewReport = (reportId: string) => {
    navigate(`/results/${reportId}`);
  };

  const handleDeleteReport = (reportId: string) => {
    deleteStoredReport(reportId);
    loadReports();
    toast({
      title: "Report Deleted",
      description: "The report has been removed from storage.",
    });
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to delete all stored reports?')) {
      clearAllStoredReports();
      loadReports();
    }
  };

  if (reports.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-3" />
                <h3 className="text-xl font-semibold mb-2">No Stored Reports</h3>
                <p className="text-muted-foreground mb-4">
                  You haven't analyzed any reports yet.
                </p>
                <Button onClick={() => navigate('/upload')}>
                  Upload New Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Stored Reports</h1>
          <div className="space-x-2">
            <Button variant="outline" onClick={() => navigate('/upload')}>
              Upload New Report
            </Button>
            <Button variant="destructive" onClick={handleClearAll}>
              Clear All Reports
            </Button>
          </div>
        </div>

        <div className="grid gap-4">
          {reports.map((report) => (
            <Card key={report.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>
                      {report.patientInfo?.name || 'Unnamed Report'}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      {new Date(report.timestamp).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleViewReport(report.id)}
                    >
                      View Report
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteReport(report.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Parameters: {report.metrics.length}
                    </p>
                    {report.patientInfo?.patientId && (
                      <p className="text-sm text-muted-foreground">
                        Patient ID: {report.patientInfo.patientId}
                      </p>
                    )}
                  </div>
                  <div>
                    {report.recommendations && report.recommendations.length > 0 && (
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500 mt-1" />
                        <p className="text-sm text-muted-foreground">
                          {report.recommendations.length} recommendations available
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default StoredReports; 