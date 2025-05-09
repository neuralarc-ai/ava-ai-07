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
  riskLevel: 'high' | 'medium' | 'low' | 'normal';
  description: string;
  recommendation?: string;
  criticalAction?: string;
  unit?: string;
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

// Helper function to parse numeric value from string
function parseNumericValue(value: string): number | null {
  // Remove any units or special characters, keep only numbers and decimal points
  const numStr = value.replace(/[^0-9.-]/g, '');
  const num = parseFloat(numStr);
  return isNaN(num) ? null : num;
}

// Helper function to parse reference range
function parseReferenceRange(range: string): { min: number | null; max: number | null } {
  const parts = range.split('-').map(part => parseNumericValue(part.trim()));
  return {
    min: parts[0],
    max: parts[1]
  };
}

// Helper function to determine risk level based on value and reference range
function determineRiskLevel(value: string | number, referenceRange: string): 'high' | 'medium' | 'low' | 'normal' {
  const numericValue = typeof value === 'number' ? value : parseNumericValue(value);
  const { min, max } = parseReferenceRange(referenceRange);
  
  if (numericValue === null || min === null || max === null) {
    return 'normal'; // Default to normal if we can't parse the values
  }

  const midpoint = (min + max) / 2;
  const range = max - min;
  const deviation = Math.abs(numericValue - midpoint);
  
  // Calculate how far the value is from the reference range
  if (numericValue < min) {
    const percentBelow = ((min - numericValue) / range) * 100;
    if (percentBelow > 50) return 'high';
    if (percentBelow > 20) return 'medium';
    return 'low';
  } else if (numericValue > max) {
    const percentAbove = ((numericValue - max) / range) * 100;
    if (percentAbove > 50) return 'high';
    if (percentAbove > 20) return 'medium';
    return 'low';
  }
  
  return 'normal';
}

// Convert the analysis metrics to BloodTestResult format with proper risk level determination
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
    const results: BloodTestResult[] = analysisResult.metrics.map(metric => {
      const value = `${metric.value} ${metric.unit}`;
      const riskLevel = determineRiskLevel(metric.value, metric.range);
      
      return {
        parameter: metric.name,
        value: value,
        referenceRange: metric.range,
        description: metric.description || getDefaultDescription(riskLevel, metric.name),
        recommendation: getRecommendation(metric, riskLevel),
        riskLevel: riskLevel,
        criticalAction: riskLevel === 'high' ? getCriticalAction(metric) : undefined,
        unit: metric.unit
      };
    });

    return results;
  } catch (error) {
    console.error('Error processing PDF:', error);
    throw new Error('Failed to process PDF file');
  }
};

// Helper function to get default description based on risk level
function getDefaultDescription(riskLevel: 'high' | 'medium' | 'low' | 'normal', parameterName: string): string {
  switch (riskLevel) {
    case 'high':
      return `${parameterName} levels are significantly outside the normal range and require immediate attention`;
    case 'medium':
      return `${parameterName} levels are moderately elevated/decreased and should be monitored`;
    case 'low':
      return `${parameterName} levels are slightly outside the normal range`;
    case 'normal':
      return `${parameterName} levels are within the normal range`;
  }
}

// Helper function to generate recommendations based on risk level
function getRecommendation(metric: HealthMetric, riskLevel: 'high' | 'medium' | 'low' | 'normal'): string {
  if (riskLevel === 'normal') {
    return 'Continue with your current lifestyle and diet.';
  }

  const numericValue = parseNumericValue(metric.value.toString());
  const { min, max } = parseReferenceRange(metric.range);
  
  if (numericValue === null || min === null || max === null) {
    return `Consult with your healthcare provider about your ${metric.name} levels.`;
  }

  const direction = numericValue < min ? 'low' : 'high';
  
  switch (riskLevel) {
    case 'high':
      return `Urgent: Consult your healthcare provider about ${direction === 'high' ? 'elevated' : 'low'} ${metric.name} levels. Consider immediate lifestyle/dietary changes.`;
    case 'medium':
      return `Monitor your ${metric.name} levels and consider ${direction === 'high' ? 'reducing' : 'increasing'} intake of foods that affect these levels.`;
    case 'low':
      return `Make minor adjustments to your diet and lifestyle to optimize ${metric.name} levels.`;
    default:
      return 'Continue with your current lifestyle and diet.';
  }
}

// Helper function to generate critical actions for high-risk metrics
function getCriticalAction(metric: HealthMetric): string {
  return `Schedule a follow-up appointment within 2 weeks to reassess your ${metric.name} levels.`;
} 