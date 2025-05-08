import { GlobalWorkerOptions, version } from 'pdfjs-dist';

// Set the worker source with explicit version
GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.js`; 