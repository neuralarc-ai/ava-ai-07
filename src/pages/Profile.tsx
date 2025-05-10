import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Layout } from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChartContainer } from '@/components/ui/chart';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CalendarIcon, FileText, TrendingUp, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface SavedReport {
  id: string;
  timestamp: number;
  patientInfo?: {
    name?: string;
    age?: string;
    gender?: string;
    dateOfBirth?: string;
    patientId?: string;
    collectionDate?: string;
  };
  metrics: Array<{
    name: string;
    value: number | string;
    unit: string;
    status: string;
    range: string;
    category: string;
  }>;
  summary?: string;
  detailedAnalysis?: string;
  recommendations?: string[];
  categories?: string[];
}

const Profile = () => {
  const navigate = useNavigate();
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [currentTab, setCurrentTab] = useState('reports');

  useEffect(() => {
    loadSavedReports();
  }, []);

  const loadSavedReports = () => {
    const reports = JSON.parse(localStorage.getItem('savedReports') || '[]');
    setSavedReports(reports.sort((a: SavedReport, b: SavedReport) => b.timestamp - a.timestamp));
  };

  const handleDeleteReport = (reportId: string) => {
    const updatedReports = savedReports.filter(report => report.id !== reportId);
    localStorage.setItem('savedReports', JSON.stringify(updatedReports));
    setSavedReports(updatedReports);
    toast({
      title: "Report Deleted",
      description: "Report has been removed from your profile.",
    });
  };

  const handleViewReport = (reportId: string) => {
    navigate(`/results/${reportId}`);
  };

  const getMetricTrends = (metricName: string) => {
    return savedReports.map(report => {
      const metric = report.metrics.find(m => m.name === metricName);
      return {
        date: new Date(report.timestamp).toLocaleDateString(),
        value: metric ? parseFloat(metric.value.toString()) : null,
        range: metric?.range
      };
    }).filter(point => point.value !== null);
  };

  if (savedReports.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-3" />
                <h3 className="text-xl font-semibold mb-2">No Saved Reports</h3>
                <p className="text-muted-foreground mb-4">
                  Save reports to your profile to track trends over time.
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
          <h1 className="text-3xl font-bold">Health Profile</h1>
          <Button variant="outline" onClick={() => navigate('/upload')}>
            Upload New Report
          </Button>
        </div>

        <Tabs defaultValue="reports" value={currentTab} onValueChange={setCurrentTab}>
          <TabsList>
            <TabsTrigger value="reports">Saved Reports</TabsTrigger>
            <TabsTrigger value="trends">Trend Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="reports" className="mt-6">
            <div className="grid gap-4">
              {savedReports.map((report) => (
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
                          <p className="text-sm text-muted-foreground">
                            {report.recommendations.length} recommendations available
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="trends" className="mt-6">
            <div className="grid gap-6">
              {savedReports[0]?.metrics.map((metric) => {
                const trends = getMetricTrends(metric.name);
                if (trends.length < 2) return null;

                return (
                  <Card key={metric.name}>
                    <CardHeader>
                      <CardTitle>{metric.name} Trend</CardTitle>
                      <CardDescription>
                        Historical values over time
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[250px] w-full">
                        <ChartContainer>
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trends} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                              <defs>
                                <linearGradient id={`color-${metric.name}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                              <XAxis dataKey="date" />
                              <YAxis domain={['auto', 'auto']} />
                              <Tooltip />
                              <Area 
                                type="monotone" 
                                dataKey="value" 
                                stroke="hsl(var(--primary))" 
                                fillOpacity={1} 
                                fill={`url(#color-${metric.name})`} 
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </ChartContainer>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Profile; 