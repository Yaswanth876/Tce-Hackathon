'use client';

import React, { useCallback, useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from './button';

interface ImageUploadProps {
  onImageUpload: (file: File, previewUrl: string) => void;
  accept?: string;
  maxSizeBytes?: number;
  className?: string;
  disabled?: boolean;
}

export const ImageUpload = ({
  onImageUpload,
  accept = 'image/jpeg,image/png,image/webp',
  maxSizeBytes = 5 * 1024 * 1024, // 5MB default
  className,
  disabled = false,
}: ImageUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateFile = useCallback(
    (file: File): string | null => {
      if (!file.type.startsWith('image/')) {
        return 'Please select an image file';
      }
      if (file.size > maxSizeBytes) {
        return `File size must be less than ${Math.round(maxSizeBytes / (1024 * 1024))}MB`;
      }
      return null;
    },
    [maxSizeBytes]
  );

  const handleFile = useCallback(
    (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      setError(null);
      const reader = new FileReader();
      reader.onload = (e) => {
        const previewUrl = e.target?.result as string;
        setPreview(previewUrl);
        onImageUpload(file, previewUrl);
      };
      reader.readAsDataURL(file);
    },
    [onImageUpload, validateFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (disabled) return;

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile, disabled]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) {
        setIsDragging(true);
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
      // Reset input value to allow same file selection
      e.target.value = '';
    },
    [handleFile]
  );

  const clearPreview = useCallback(() => {
    setPreview(null);
    setError(null);
  }, []);

  const handleCameraCapture = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // Use rear camera on mobile
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
    };
    input.click();
  }, [handleFile]);

  return (
    <div className={cn('space-y-3', className)}>
      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          'relative rounded-xl border-2 border-dashed p-4 text-center transition-all',
          'border-blue-300 bg-white hover:border-blue-500 hover:bg-blue-50',
          isDragging && 'border-blue-500 bg-blue-100',
          disabled && 'cursor-not-allowed opacity-50',
          !disabled && 'cursor-pointer'
        )}
      >
        <input
          type="file"
          accept={accept}
          onChange={handleFileInput}
          className="absolute inset-0 cursor-pointer opacity-0"
          disabled={disabled}
        />

        <div className="space-y-2">
          <div className="text-2xl">�</div>
          <div className="text-sm font-medium text-black sm:text-base">
            Drop image here or click to upload
          </div>
          <div className="text-xs text-gray-600">
            Analyze crops, diseases, pests, soil - up to {Math.round(maxSizeBytes / (1024 * 1024))}
            MB
          </div>
        </div>
      </div>

      {/* Mobile Camera Button */}
      <div className="flex gap-2 sm:hidden">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCameraCapture}
          disabled={disabled}
          className="flex-1 border-blue-500 bg-white text-black hover:bg-blue-50"
        >
          📷 Take Photo
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium text-black sm:text-base">Preview:</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearPreview}
              className="border-red-300 bg-white text-xs text-red-600 hover:bg-red-50"
            >
              Remove
            </Button>
          </div>
          <div className="relative overflow-hidden rounded-lg border-2 border-blue-200">
            <Image
              src={preview}
              alt="Upload preview"
              width={320}
              height={160}
              className="h-32 w-full object-cover sm:h-40"
            />
          </div>
        </div>
      )}
    </div>
  );
};
