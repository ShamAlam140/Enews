import { useState } from 'react';
import { uploadFiles } from '../services/fileService';

export function useUpload() {
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  async function upload(files: File[], city?: string) {
    setIsUploading(true);
    try {
      const saved = await uploadFiles(
        files,
        (index, total) => {
          setProgress(Math.round(((index + 1) / total) * 100));
        },
        city,
        (percent) => setProgress(percent)
      );
      return saved;
    } finally {
      setIsUploading(false);
    }
  }

  return { upload, isUploading, progress };
}
