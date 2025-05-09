import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useReportFile } from '@/ReportFileContext';
import { v4 as uuidv4 } from 'uuid';

interface UseFileUploadOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  redirectToResults?: boolean;
}

export const useFileUpload = (options: UseFileUploadOptions = {}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setFile } = useReportFile();
  const [isLoading, setIsLoading] = useState(false);

  const handleFileUpload = async (file: File) => {
    try {
      setIsLoading(true);

      // Create a unique ID for the report
      const reportId = uuidv4();

      // Set the file in the global context
      setFile(file);

      // Store report in localStorage
      const storedReports = localStorage.getItem('scannedReports') || '[]';
      const reports = JSON.parse(storedReports);
      const newReport = {
        id: reportId,
        name: file.name,
        date: new Date().toISOString(),
        status: 'processing',
        type: 'blood_test'
      };
      
      localStorage.setItem('scannedReports', JSON.stringify([newReport, ...reports]));

      // Show success toast
      toast({
        title: "Report Uploaded",
        description: "Your report is being analyzed...",
      });

      // Simulate processing delay
      setTimeout(() => {
        // Update report status
        const updatedReports = JSON.parse(localStorage.getItem('scannedReports') || '[]');
        const updatedReport = updatedReports.find((r: any) => r.id === reportId);
        if (updatedReport) {
          updatedReport.status = 'completed';
          updatedReport.riskLevel = 'medium';
          localStorage.setItem('scannedReports', JSON.stringify(updatedReports));
        }

        setIsLoading(false);
        
        // Call success callback if provided
        options.onSuccess?.();

        // Redirect to results if specified
        if (options.redirectToResults) {
          navigate(`/results?report=${reportId}`);
        }
      }, 2000);

    } catch (error) {
      setIsLoading(false);
      console.error('Error handling file upload:', error);
      
      toast({
        title: "Upload Failed",
        description: "There was an error uploading your report. Please try again.",
        variant: "destructive"
      });

      // Call error callback if provided
      if (error instanceof Error && options.onError) {
        options.onError(error);
      }
    }
  };

  return {
    handleFileUpload,
    isLoading
  };
}; 