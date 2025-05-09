import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ReportFileContextType {
  file: File | null;
  setFile: (file: File | null) => void;
}

const ReportFileContext = createContext<ReportFileContextType | undefined>(undefined);

export const useReportFile = () => {
  const context = useContext(ReportFileContext);
  if (!context) {
    throw new Error('useReportFile must be used within a ReportFileProvider');
  }
  return context;
};

export const ReportFileProvider = ({ children }: { children: ReactNode }) => {
  const [file, setFile] = useState<File | null>(null);
  return (
    <ReportFileContext.Provider value={{ file, setFile }}>
      {children}
    </ReportFileContext.Provider>
  );
}; 