import { getDocument, version } from 'pdfjs-dist';
import { performOCR, OCRResult } from './ocrService';
import { analyzeHealthReport, AnalysisResult, HealthMetric } from './healthAnalysisService';
import './pdfWorker'; // Import the worker configuration

// Initialize PDF.js worker
const initPdfWorker = async () => {
  try {
    // Test the worker by loading a simple PDF
    const testPdf = await getDocument({
      data: new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34, 0x0A, 0x25, 0xE2, 0xE3, 0xCF, 0xD3, 0x0A, 0x31, 0x20, 0x30, 0x20, 0x6F, 0x62, 0x6A, 0x0A, 0x3C, 0x3C, 0x2F, 0x54, 0x79, 0x70, 0x65, 0x2F, 0x43, 0x61, 0x74, 0x61, 0x6C, 0x6F, 0x67, 0x2F, 0x50, 0x61, 0x67, 0x65, 0x73, 0x20, 0x32, 0x20, 0x30, 0x20, 0x52, 0x3E, 0x3E, 0x0A, 0x65, 0x6E, 0x64, 0x6F, 0x62, 0x6A, 0x0A, 0x32, 0x20, 0x30, 0x20, 0x6F, 0x62, 0x6A, 0x0A, 0x3C, 0x3C, 0x2F, 0x54, 0x79, 0x70, 0x65, 0x2F, 0x50, 0x61, 0x67, 0x65, 0x73, 0x2F, 0x4B, 0x69, 0x64, 0x73, 0x5B, 0x33, 0x20, 0x30, 0x20, 0x52, 0x5D, 0x3E, 0x3E, 0x0A, 0x65, 0x6E, 0x64, 0x6F, 0x62, 0x6A, 0x0A, 0x33, 0x20, 0x30, 0x20, 0x6F, 0x62, 0x6A, 0x0A, 0x3C, 0x3C, 0x2F, 0x54, 0x79, 0x70, 0x65, 0x2F, 0x50, 0x61, 0x67, 0x65, 0x2F, 0x4D, 0x65, 0x64, 0x69, 0x61, 0x42, 0x6F, 0x78, 0x5B, 0x30, 0x20, 0x30, 0x20, 0x35, 0x30, 0x20, 0x35, 0x30, 0x5D, 0x3E, 0x3E, 0x0A, 0x65, 0x6E, 0x64, 0x6F, 0x62, 0x6A, 0x0A, 0x78, 0x72, 0x65, 0x66, 0x0A, 0x30, 0x20, 0x34, 0x0A, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x20, 0x36, 0x35, 0x35, 0x33, 0x35, 0x20, 0x66, 0x0A, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x31, 0x30, 0x20, 0x30, 0x30, 0x30, 0x30, 0x30, 0x20, 0x6E, 0x0A, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x32, 0x30, 0x20, 0x30, 0x30, 0x30, 0x30, 0x30, 0x20, 0x6E, 0x0A, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x33, 0x30, 0x20, 0x30, 0x30, 0x30, 0x30, 0x30, 0x20, 0x6E, 0x0A, 0x74, 0x72, 0x61, 0x69, 0x6C, 0x65, 0x72, 0x0A, 0x3C, 0x3C, 0x2F, 0x53, 0x69, 0x7A, 0x65, 0x20, 0x34, 0x2F, 0x52, 0x6F, 0x6F, 0x74, 0x20, 0x31, 0x20, 0x30, 0x20, 0x52, 0x3E, 0x3E, 0x0A, 0x73, 0x74, 0x61, 0x72, 0x74, 0x78, 0x72, 0x65, 0x66, 0x0A, 0x30, 0x0A, 0x25, 0x25, 0x45, 0x4F, 0x46, 0x0A]),
    }).promise;
    await testPdf.destroy();
    console.log('PDF.js worker initialized successfully');
  } catch (error) {
    console.error('Failed to initialize PDF.js worker:', error);
    throw new Error('Failed to initialize PDF.js worker. Please try again.');
  }
};

// Initialize the worker when the module loads
initPdfWorker().catch(console.error);

export interface BloodTestResult {
  parameter: string;
  value: string;
  referenceRange: string;
  description: string;
  recommendation: string;
  riskLevel: 'high' | 'medium' | 'low' | 'normal';
  criticalAction?: string;
}

export interface PDFExtractionResult {
  text: string;
  images: string[];
}

export async function extractTextFromPDF(file: File): Promise<PDFExtractionResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    const images: string[] = [];
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      
      // Extract text
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';

      // Extract images
      const operatorList = await page.getOperatorList();
      for (let j = 0; j < operatorList.fnArray.length; j++) {
        if (operatorList.fnArray[j] === 82) { // 82 is the code for "paintImageXObject"
          const imgData = await page.objs.get(operatorList.argsArray[j][0]);
          if (imgData && imgData.src) {
            images.push(imgData.src);
          }
        }
      }
    }
    
    if (!fullText.trim() && images.length === 0) {
      throw new Error('No content could be extracted from the PDF.');
    }
    
    return { text: fullText, images };
  } catch (error) {
    console.error('Error extracting content from PDF:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to process PDF: ${error.message}`);
    }
    throw new Error('Failed to process PDF. Please ensure the file is a valid PDF document.');
  }
}

export const processPDF = async (file: File): Promise<BloodTestResult[]> => {
  try {
    // First, perform OCR on the PDF
    const ocrResult = await performOCR(file);
    if (!ocrResult || !ocrResult.text) {
      throw new Error('Failed to extract text from the PDF');
    }

    // Then, analyze the health report
    const analysisResult = await analyzeHealthReport(ocrResult.text);
    if (!analysisResult || !analysisResult.metrics) {
      throw new Error('Failed to analyze the health report');
    }

    // Convert the analysis metrics to BloodTestResult format
    const results: BloodTestResult[] = analysisResult.metrics.map(metric => ({
      parameter: metric.name,
      value: `${metric.value} ${metric.unit}`,
      referenceRange: metric.range,
      description: metric.description || '',
      recommendation: getRecommendation(metric),
      riskLevel: mapStatusToRiskLevel(metric.status),
      criticalAction: metric.status === 'danger' ? getCriticalAction(metric) : undefined
    }));

    return results;
  } catch (error) {
    console.error('Error processing PDF:', error);
    throw new Error('Failed to process PDF file');
  }
};

// Helper function to map status to risk level
function mapStatusToRiskLevel(status: string): 'high' | 'medium' | 'low' | 'normal' {
  switch (status) {
    case 'danger':
      return 'high';
    case 'warning':
      return 'medium';
    case 'normal':
      return 'normal';
    default:
      return 'low';
  }
}

// Helper function to generate recommendations based on metric
function getRecommendation(metric: HealthMetric): string {
  if (metric.status === 'normal') {
    return 'Continue with your current lifestyle and diet.';
  }
  
  const direction = typeof metric.value === 'number' && 
    parseFloat(metric.range.split('-')[0]) > metric.value ? 'low' : 'high';
  
  return `Consider ${direction === 'high' ? 'reducing' : 'increasing'} your intake of foods that affect ${metric.name} levels.`;
}

// Helper function to generate critical actions for high-risk metrics
function getCriticalAction(metric: HealthMetric): string {
  return `Schedule a follow-up appointment within 2 weeks to reassess your ${metric.name} levels.`;
} 