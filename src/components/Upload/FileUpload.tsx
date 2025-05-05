
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, FileText } from 'lucide-react';

interface FileUploadProps {
  onFileSelected: (file: File) => void;
  acceptedFileTypes?: string;
  maxSizeMB?: number;
  className?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelected,
  acceptedFileTypes = ".pdf,image/*",
  maxSizeMB = 10,
  className
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateFile = (file: File): boolean => {
    // Check file size
    if (file.size > maxSizeBytes) {
      setError(`File is too large. Maximum size is ${maxSizeMB}MB.`);
      return false;
    }

    // Check file type
    const fileType = file.type.toLowerCase();
    const acceptedTypesArray = acceptedFileTypes.split(',');
    
    const isValidType = acceptedTypesArray.some(type => {
      type = type.trim();
      if (type.startsWith('.')) {
        // Check file extension
        return file.name.toLowerCase().endsWith(type.toLowerCase());
      } else if (type.includes('/*')) {
        // Check MIME type category (e.g., image/*)
        const category = type.split('/')[0];
        return fileType.startsWith(`${category}/`);
      } else {
        // Check exact MIME type
        return fileType === type;
      }
    });

    if (!isValidType) {
      setError(`Invalid file type. Please upload ${acceptedFileTypes}.`);
      return false;
    }
    
    return true;
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError(null);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        onFileSelected(file);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setError(null);
    
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        onFileSelected(file);
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card
      className={`relative border-2 border-dashed rounded-lg p-6 cursor-pointer transition-all ${
        dragActive ? 'border-ava-neon-green bg-ava-neon-green/10' : 'border-gray-700'
      } ${className || ''}`}
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={acceptedFileTypes}
        onChange={handleChange}
      />
      <div className="flex flex-col items-center justify-center gap-4 text-center">
        <div className="p-3 rounded-full bg-ava-muted">
          <Upload className="h-6 w-6 text-ava-neon-green" />
        </div>
        <div>
          <p className="text-sm font-medium">
            <span className="text-ava-neon-green">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-gray-400 mt-1">
            PDF or Image files (max {maxSizeMB}MB)
          </p>
        </div>
        {error && (
          <p className="text-xs text-red-400 mt-2">{error}</p>
        )}
      </div>
    </Card>
  );
};

export default FileUpload;
