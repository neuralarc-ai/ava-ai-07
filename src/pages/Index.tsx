import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Layout } from '@/components/layout/Layout';
import { FloatingChat } from '@/components/Chat/FloatingChat';
import { Activity, AlertTriangle, Calendar, FileText, Upload, TrendingUp, BarChart3, Shield, User, FileHeart, Building, Clock, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HealthMetricCard } from '@/components/Card/HealthMetricCard';
import { useReportFile } from '@/ReportFileContext';
import { v4 as uuidv4 } from 'uuid';
import ReportHistory from '@/components/Card/ReportHistory';
import AnalysisCard from '@/components/Card/AnalysisCard';
import { DetailedMetricsTable } from '@/components/reports/DetailedMetricsTable';
import ProgressBar from '@/components/ProgressBar';
import { useToast } from '@/hooks/use-toast';
import type { HealthMetric } from '@/services/healthAnalysisService';
import '@/styles/dashboard.css';
import { useFileUpload } from '@/hooks/use-file-upload';
import FileUpload from '@/components/Upload/FileUpload';

interface Report {
  id: string;
  name: string;
  date: string;
  isActive?: boolean;
}

interface DashboardMetric {
  name: string;
  value: string;
  unit: string;
  status: 'normal' | 'warning' | 'danger' | 'high_risk' | 'medium_risk' | 'low_risk';
  description: string;
  range: string;
}

const Index = () => {
  const navigate = useNavigate();
  const [uploadVisible, setUploadVisible] = useState(false);
  const { handleFileUpload, isLoading } = useFileUpload({ redirectToResults: true });
  const { setFile } = useReportFile();
  const [reports, setReports] = useState<Report[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();

  // Mock data for demonstration
  const mockMetrics: { high: DashboardMetric[]; medium: DashboardMetric[]; normal: DashboardMetric[] } = {
    high: [
      {
        name: "Packed Cell Volume (PCV)",
        value: "57.5",
        unit: "%",
        status: "danger",
        description: "Outside normal range",
        range: "40 - 50"
      },
      {
        name: "Hemoglobin (Hb)",
        value: "12.5",
        unit: "g/dL",
        status: "danger",
        description: "Outside normal range",
        range: "13.5 - 17.5"
      }
    ],
    medium: [
      {
        name: "White Blood Cells",
        value: "11.2",
        unit: "K/µL",
        status: "warning",
        description: "Slightly elevated",
        range: "4.5 - 11.0"
      }
    ],
    normal: [
      {
        name: "Platelets",
        value: "250",
        unit: "K/µL",
        status: "normal",
        description: "Within normal range",
        range: "150 - 450"
      }
    ]
  };

  const handleFileSelected = async (file: File) => {
    await handleFileUpload(file);
    setUploadVisible(false);
  };

  return (
    <Layout>
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold">Health Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                View and analyze your health reports
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => navigate("/reports")}>
                <FileText className="h-4 w-4 mr-2" />
                View Reports
              </Button>
              <Button onClick={() => setUploadVisible(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Report
              </Button>
            </div>
          </div>

          {/* Loading Progress */}
          {isLoading && (
            <Card>
              <CardContent className="py-6">
                <ProgressBar stage="analyzing" />
              </CardContent>
            </Card>
          )}

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="metrics">Health Metrics</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Patient Information Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="mr-2 h-5 w-5" />
                    Patient Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Patient Name</p>
                        <p className="text-sm text-muted-foreground">Yash M. Patel</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Collection Date</p>
                        <p className="text-sm text-muted-foreground">May 9, 2025</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Hospital/Lab</p>
                        <p className="text-sm text-muted-foreground">Smart Pathology Laboratory</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Risk Alerts */}
              {mockMetrics.high.length > 0 && (
                <Alert className="border-destructive/50 bg-destructive/10">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <AlertTitle>High Risk Parameters Detected</AlertTitle>
                  <AlertDescription>
                    {mockMetrics.high.length} parameters require immediate attention
                  </AlertDescription>
                </Alert>
              )}

              {/* Risk Metrics Grid */}
              <div className="grid dashboard-grid gap-4">
                {mockMetrics.high.map((metric, index) => (
                  <HealthMetricCard
                    key={index}
                    title={metric.name}
                    value={metric.value}
                    unit={metric.unit}
                    status={metric.status}
                    description={metric.description}
                    range={metric.range}
                    className="dashboard-card risk-high fade-in"
                  />
                ))}
                {mockMetrics.medium.map((metric, index) => (
                  <HealthMetricCard
                    key={index}
                    title={metric.name}
                    value={metric.value}
                    unit={metric.unit}
                    status={metric.status}
                    description={metric.description}
                    range={metric.range}
                    className="dashboard-card risk-medium fade-in"
                  />
                ))}
              </div>

              {/* Health Trends Card */}
              <Card className="dashboard-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <BarChart3 className="h-5 w-5 mr-2" />
                      <CardTitle>Health Trends</CardTitle>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab('history')}>
                      View All <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                  <CardDescription>Your health metrics over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex flex-col items-center justify-center border border-dashed rounded-md">
                    <Activity className="h-12 w-12 text-muted-foreground mb-3" />
                    <p className="text-muted-foreground text-center">Chart will appear when you have more data</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="metrics" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Health Metrics</CardTitle>
                  <CardDescription>
                    Complete analysis of all health parameters
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DetailedMetricsTable metrics={[
                    ...mockMetrics.high.map(m => ({
                      ...m,
                      riskLevel: m.status === 'danger' ? 'high' : m.status === 'warning' ? 'medium' : 'normal'
                    })),
                    ...mockMetrics.medium.map(m => ({
                      ...m,
                      riskLevel: 'medium'
                    })),
                    ...mockMetrics.normal.map(m => ({
                      ...m,
                      riskLevel: 'normal'
                    }))
                  ] as HealthMetric[]} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Report History</CardTitle>
                  <CardDescription>
                    Your previous health reports and analyses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ReportHistory
                    reports={reports}
                    onSelectReport={(report) => navigate(`/results?report=${report.id}`)}
                    onDeleteReport={(id) => {
                      setReports(prev => prev.filter(r => r.id !== id));
                      toast({
                        title: "Report Deleted",
                        description: "The report has been removed from your history",
                      });
                    }}
                  />
                </CardContent>
              </Card>

              {/* Analysis History */}
              <Card>
                <CardHeader>
                  <CardTitle>Analysis History</CardTitle>
                  <CardDescription>
                    Track changes in your health parameters over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockMetrics.high.concat(mockMetrics.medium).map((metric, index) => (
                      <AnalysisCard
                        key={index}
                        item={{
                          parameter: metric.name,
                          value: metric.value,
                          referenceRange: metric.range,
                          description: metric.description,
                          recommendation: "Schedule a follow-up with your healthcare provider",
                          riskLevel: metric.status === "danger" ? "high" : "medium"
                        }}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Floating Chat Component */}
        <FloatingChat />

        {/* Upload Modal */}
        {uploadVisible && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
              <h2 className="text-xl font-semibold mb-4">Upload Report</h2>
              <FileUpload onFileSelected={handleFileSelected} />
              <div className="mt-4 flex justify-end">
                <Button variant="outline" onClick={() => setUploadVisible(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Index;
