import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layout } from "@/components/layout/Layout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Download, Upload, FileText, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import FileUpload from '@/components/Upload/FileUpload';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useFileUpload } from '@/hooks/use-file-upload';

interface Report {
  id: string;
  name: string;
  date: string;
  status: 'processing' | 'completed' | 'error';
  type: 'blood_test' | 'general';
  summary?: string;
  riskLevel?: 'high' | 'medium' | 'low' | 'normal';
}

const Reports = () => {
  const [uploadVisible, setUploadVisible] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const { toast } = useToast();
  const { handleFileUpload, isLoading } = useFileUpload({
    onSuccess: () => {
      setUploadVisible(false);
      // Refresh reports list
      const storedReports = localStorage.getItem('scannedReports');
      if (storedReports) {
        try {
          const parsedReports = JSON.parse(storedReports);
          setReports(parsedReports);
        } catch (error) {
          console.error("Error parsing reports:", error);
        }
      }
    }
  });

  useEffect(() => {
    // Get the scanned reports from localStorage
    const storedReports = localStorage.getItem('scannedReports');
    if (storedReports) {
      try {
        const parsedReports = JSON.parse(storedReports);
        setReports(parsedReports);
      } catch (error) {
        console.error("Error parsing reports:", error);
        setReports([]);
      }
    }
  }, []);

  const handleFileSelected = async (file: File) => {
    await handleFileUpload(file);
  };

  const handleDownload = (id: string) => {
    toast({
      title: "Download started",
      description: "Your report download has started",
    });
  };

  const getStatusBadge = (status: Report['status']) => {
    switch (status) {
      case 'processing':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Processing</span>;
      case 'completed':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Completed</span>;
      case 'error':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Error</span>;
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Health Reports</h1>
            <p className="text-muted-foreground mt-1">View and manage your health reports</p>
          </div>
          <Button 
            size="lg" 
            className="mt-4 md:mt-0"
            onClick={() => setUploadVisible(true)}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload New Report
          </Button>
        </div>

        {/* High Risk Alert */}
        {reports.some(r => r.riskLevel === 'high') && (
          <Alert className="mb-6 border-destructive/50 bg-destructive/10">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <AlertTitle>High Risk Parameters Detected</AlertTitle>
            <AlertDescription>
              Some of your reports contain high-risk parameters that require attention
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              All Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reports.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Report Name</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Risk Level</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">{report.name}</TableCell>
                      <TableCell>{new Date(report.date).toLocaleDateString()}</TableCell>
                      <TableCell>{getStatusBadge(report.status)}</TableCell>
                      <TableCell>
                        {report.riskLevel && (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                            ${report.riskLevel === 'high' ? 'bg-red-100 text-red-800' : 
                              report.riskLevel === 'medium' ? 'bg-amber-100 text-amber-800' : 
                              report.riskLevel === 'low' ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-green-100 text-green-800'}`}>
                            {report.riskLevel.charAt(0).toUpperCase() + report.riskLevel.slice(1)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="icon" asChild>
                            <Link to={`/results?report=${report.id}`}>
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">View</span>
                            </Link>
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => handleDownload(report.id)}
                          >
                            <Download className="h-4 w-4" />
                            <span className="sr-only">Download</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">You haven't uploaded any reports yet</p>
                <Button onClick={() => setUploadVisible(true)}>
                  Upload Your First Report
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upload Dialog */}
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

export default Reports; 