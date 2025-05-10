import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Layout } from '@/components/layout/Layout';
import { HealthMetricCard } from '@/components/Card/HealthMetricCard';
import { DetailedMetricsTable } from '@/components/reports/DetailedMetricsTable';
import { ChartContainer } from '@/components/ui/chart';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Download, FileText, User, CalendarIcon, Building, Shield, AlertCircle, Activity, AlertTriangle, FileHeart, Save } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useReportFile } from '@/ReportFileContext';
import { performOCR } from '@/services/ocrService';
import { analyzeHealthReport, getStoredReportById } from '@/services/healthAnalysisService';
import type { HealthMetric } from '@/services/healthAnalysisService';
import { toast } from '@/hooks/use-toast';

interface PatientInfo {
  name?: string;
  age?: string;
  gender?: string;
  dateOfBirth?: string;
  patientId?: string;
  collectionDate?: string;
  reportDate?: string;
  doctorName?: string;
  hospitalName?: string;
}

const Results = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { reportId } = useParams<{ reportId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState('all-parameters');
  const { file } = useReportFile();
  
  // Dashboard state
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [highRiskMetrics, setHighRiskMetrics] = useState<HealthMetric[]>([]);
  const [mediumRiskMetrics, setMediumRiskMetrics] = useState<HealthMetric[]>([]);
  const [normalMetrics, setNormalMetrics] = useState<HealthMetric[]>([]);
  const [patientInfo, setPatientInfo] = useState<PatientInfo | undefined>();
  const [summary, setSummary] = useState<string | undefined>();
  const [detailedAnalysis, setDetailedAnalysis] = useState<string | undefined>();
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [reportTitle, setReportTitle] = useState<string>("Health Report");

  // Process the PDF and analyze results
  useEffect(() => {
    const processReport = async () => {
      try {
        setLoading(true);
        setError(null);

        // If we have a reportId, try to load the stored report
        if (reportId) {
          const storedReport = getStoredReportById(reportId);
          if (storedReport) {
            setMetrics(storedReport.metrics);
            setHighRiskMetrics(storedReport.metrics.filter(m => m.status === 'danger' || m.status === 'high_risk'));
            setMediumRiskMetrics(storedReport.metrics.filter(m => m.status === 'warning' || m.status === 'medium_risk'));
            setNormalMetrics(storedReport.metrics.filter(m => m.status === 'normal' || m.status === 'low_risk'));
            setPatientInfo(storedReport.patientInfo);
            setSummary(storedReport.summary);
            setDetailedAnalysis(storedReport.detailedAnalysis);
            setRecommendations(storedReport.recommendations || []);
            setReportTitle(
              storedReport.patientInfo?.name 
                ? `${storedReport.patientInfo.name}'s Health Report`
                : "Health Report"
            );
            setLoading(false);
            return;
          } else {
            // If stored report not found, redirect to reports page
            navigate('/reports');
            return;
          }
        }

        // If no stored report or no reportId, process new file
        if (!file) {
          throw new Error('No report file found. Please upload your report again.');
        }

        // Get the OCR result and analyze it
        const ocrResult = await performOCR(file);
        if (!ocrResult || !ocrResult.text) {
          throw new Error('Failed to extract text from the PDF');
        }

        // Analyze the health report
        const analysisResult = await analyzeHealthReport(ocrResult.text);
        if (!analysisResult) {
          throw new Error('Failed to analyze the health report');
        }

        // Set patient information
        if (analysisResult.patientInfo) {
          setPatientInfo(analysisResult.patientInfo);
          setReportTitle(
            analysisResult.patientInfo.name 
              ? `${analysisResult.patientInfo.name}'s Health Report`
              : "Health Report"
          );
        }

        // Set summary and analysis
        setSummary(analysisResult.summary);
        setDetailedAnalysis(analysisResult.detailedAnalysis);
        setRecommendations(analysisResult.recommendations || []);

        // Process metrics
        const allMetrics = analysisResult.metrics.map(metric => ({
          ...metric,
          value: typeof metric.value === 'object' ? JSON.stringify(metric.value) : metric.value,
          history: (metric.history || []).map(h => ({
            ...h,
            value: typeof h.value === 'object' ? JSON.stringify(h.value) : h.value
          }))
        })) as HealthMetric[];

        setMetrics(allMetrics);

        // Set metrics by risk level
        setHighRiskMetrics(allMetrics.filter(m => m.status === 'danger' || m.status === 'high_risk'));
        setMediumRiskMetrics(allMetrics.filter(m => m.status === 'warning' || m.status === 'medium_risk'));
        setNormalMetrics(allMetrics.filter(m => m.status === 'normal' || m.status === 'low_risk'));

        // Navigate to the stored report view
        if (analysisResult.reportId) {
          navigate(`/results/${analysisResult.reportId}`, { replace: true });
        }

      } catch (err) {
        console.error('Error processing report:', err);
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        setError(`Failed to process report: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };
    
    processReport();
  }, [file, reportId, navigate]);

  const handleExportPDF = () => {
    // This would be implemented with a PDF generation library
    alert("PDF export functionality will be implemented in a future update");
  };

  const handleSaveToProfile = () => {
    try {
      // Get existing saved reports from localStorage
      const savedReports = JSON.parse(localStorage.getItem('savedReports') || '[]');
      
      // Create a new saved report object
      const reportToSave = {
        id: reportId || uuidv4(),
        timestamp: Date.now(),
        patientInfo,
        metrics,
        summary,
        detailedAnalysis,
        recommendations,
        categories: metrics.map(m => m.category).filter((c, i, a) => c && a.indexOf(c) === i)
      };
      
      // Check if this report is already saved
      const isAlreadySaved = savedReports.some((report: any) => report.id === reportToSave.id);
      
      if (isAlreadySaved) {
        toast({
          title: "Already Saved",
          description: "This report is already saved to your profile.",
        });
        return;
      }
      
      // Add the new report to saved reports
      savedReports.push(reportToSave);
      localStorage.setItem('savedReports', JSON.stringify(savedReports));
      
      toast({
        title: "Saved to Profile",
        description: "Report has been saved to your profile for trend analysis.",
      });
    } catch (error) {
      console.error('Error saving report:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save the report to your profile.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6 flex justify-center items-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">
            <div className="text-red-500 text-xl mb-4">Error</div>
            <p className="text-gray-600">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              className="mt-4"
            >
              Refresh Page
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  // Define chart config for the ChartContainer
  const chartConfig = {
    default: { color: "hsl(var(--primary))" },
    normal: { color: "hsl(var(--health-normal))" },
    warning: { color: "hsl(var(--health-warning))" },
    danger: { color: "hsl(var(--health-danger))" }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">{reportTitle}</h1>
            <p className="text-muted-foreground mt-1">
              Report Date: {patientInfo?.collectionDate ? new Date(patientInfo.collectionDate).toLocaleDateString() : 'Not specified'}
            </p>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            <Button 
              variant="outline"
              onClick={handleSaveToProfile}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save to Profile
            </Button>
            <Button 
              variant="outline"
              onClick={handleExportPDF}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Patient Information Card */}
        {patientInfo && Object.values(patientInfo).some(val => val) && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                Patient Information
              </CardTitle>
              <CardDescription>{reportTitle}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {patientInfo.name && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Patient Name</p>
                      <p className="text-sm text-muted-foreground">{patientInfo.name}</p>
                    </div>
                  </div>
                )}
                
                {patientInfo.patientId && (
                  <div className="flex items-center gap-2">
                    <FileHeart className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Patient ID</p>
                      <p className="text-sm text-muted-foreground">{patientInfo.patientId}</p>
                    </div>
                  </div>
                )}
                
                {patientInfo.gender && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Gender</p>
                      <p className="text-sm text-muted-foreground">{patientInfo.gender}</p>
                    </div>
                  </div>
                )}
                
                {(patientInfo.dateOfBirth || patientInfo.age) && (
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Date of Birth / Age</p>
                      <p className="text-sm text-muted-foreground">
                        {patientInfo.dateOfBirth || patientInfo.age}
                      </p>
                    </div>
                  </div>
                )}
                
                {patientInfo.collectionDate && (
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Collection Date</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(patientInfo.collectionDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
                
                {patientInfo.hospitalName && (
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Hospital/Lab</p>
                      <p className="text-sm text-muted-foreground">{patientInfo.hospitalName}</p>
                    </div>
                  </div>
                )}
                
                {patientInfo.doctorName && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Doctor</p>
                      <p className="text-sm text-muted-foreground">{patientInfo.doctorName}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Risk Alert */}
        {(highRiskMetrics.length > 0 || mediumRiskMetrics.length > 0) && (
          <Alert className="mb-6 border-destructive/50 bg-destructive/10">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <AlertTitle>Risk Factors Detected</AlertTitle>
            <AlertDescription>
              Your latest health report shows {highRiskMetrics.length} high risk and {mediumRiskMetrics.length} medium risk parameters that require attention.
            </AlertDescription>
          </Alert>
        )}

        {/* Results Tabs */}
        <Tabs defaultValue="all-parameters" value={currentTab} onValueChange={setCurrentTab} className="mb-8">
          <TabsList>
            <TabsTrigger value="all-parameters">All Parameters</TabsTrigger>
            <TabsTrigger value="at-risk">
              At Risk ({highRiskMetrics.length + mediumRiskMetrics.length})
            </TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all-parameters" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Complete Blood Analysis</CardTitle>
                <CardDescription>
                  All parameters extracted from your health report
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DetailedMetricsTable metrics={metrics} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="at-risk" className="mt-6">
            {highRiskMetrics.length > 0 || mediumRiskMetrics.length > 0 ? (
              <div className="space-y-6">
                {highRiskMetrics.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>High Risk Parameters</CardTitle>
                      <CardDescription>
                        These parameters require immediate attention
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {highRiskMetrics.map((metric) => (
                          <HealthMetricCard 
                            key={metric.name}
                            title={metric.name} 
                            value={metric.value}
                            unit={metric.unit || '-'}
                            status="danger"
                            description={metric.description}
                            range={metric.range}
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {mediumRiskMetrics.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Medium Risk Parameters</CardTitle>
                      <CardDescription>
                        These parameters need monitoring
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {mediumRiskMetrics.map((metric) => (
                          <HealthMetricCard 
                            key={metric.name}
                            title={metric.name} 
                            value={metric.value}
                            unit={metric.unit || '-'}
                            status="warning"
                            description={metric.description}
                            range={metric.range}
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="flex flex-col items-center justify-center py-12">
                    <Shield className="h-12 w-12 text-green-500 mb-3" />
                    <h3 className="text-xl font-semibold mb-2">All Parameters Normal</h3>
                    <p className="text-muted-foreground">
                      Great news! All parameters in your report are within normal ranges.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="trends" className="mt-6">
            <div className="grid grid-cols-1 gap-6">
              {metrics.map((metric) => (
                <Card key={metric.name}>
                  <CardHeader>
                    <CardTitle>{metric.name} Trend</CardTitle>
                    <CardDescription>Historical values over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px] w-full">
                      <ChartContainer config={chartConfig}>
                        {metric.history && metric.history.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={metric.history} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                              <defs>
                                <linearGradient id={`color-${metric.name}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor={`hsl(var(--health-${metric.status}))`} stopOpacity={0.8}/>
                                  <stop offset="95%" stopColor={`hsl(var(--health-${metric.status}))`} stopOpacity={0.1}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                              <XAxis dataKey="date" />
                              <YAxis domain={['auto', 'auto']} />
                              <Tooltip />
                              <Area 
                                type="monotone" 
                                dataKey="value" 
                                stroke={`hsl(var(--health-${metric.status}))`} 
                                fillOpacity={1} 
                                fill={`url(#color-${metric.name})`} 
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <p className="text-muted-foreground">No historical data available</p>
                          </div>
                        )}
                      </ChartContainer>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="summary" className="mt-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Report Summary</CardTitle>
                  <CardDescription>
                    AI-generated overview of your health report
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <p className="text-muted-foreground">{summary}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Detailed Analysis</CardTitle>
                  <CardDescription>
                    Comprehensive breakdown of your health metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <p className="text-muted-foreground whitespace-pre-line">{detailedAnalysis}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="recommendations" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>AI-Generated Recommendations</CardTitle>
                <CardDescription>
                  Based on your blood report analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recommendations && recommendations.length > 0 ? (
                  <ul className="space-y-4">
                    {recommendations.map((recommendation, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="h-6 w-6 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-sm flex-shrink-0">
                          {index + 1}
                        </div>
                        <p>{recommendation}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">No recommendations available for this report.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Results;
