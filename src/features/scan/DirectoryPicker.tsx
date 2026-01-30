import React, { useState } from 'react';
import DriveFolderUploadIcon from '@mui/icons-material/DriveFolderUpload';
import { scanAndStoreFiles } from '../../core/fs/fileScanner';
import Button from '../../shared/ui/Button'; // Import the new Button component

interface DirectoryPickerProps {
  onScanComplete: (result: { newFilesCount: number; handlesOfNewFiles: FileSystemFileHandle[] }) => void;
  onScanProgress: (progress: { loaded: number; total: number }) => void;
  coverUrl?: string;
}

const DirectoryPicker: React.FC<DirectoryPickerProps> = ({ onScanComplete, onScanProgress, coverUrl }) => {
  const [isScanning, setIsScanning] = useState(false);
  const serverUrl = 'http://localhost:3001';
  const backgroundImageUrl = coverUrl ? `${serverUrl}${coverUrl}` : '';

  const handleDirectoryPick = async () => {
    try {
      setIsScanning(true);
      const result = await scanAndStoreFiles(onScanProgress);
      
      if (result.newFilesCount > 0) {
        alert(`${result.newFilesCount} new files found and are being processed in the background.`);
        onScanComplete(result);
      } else {
        alert('No new music files found in the selected directory.');
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.log('Directory picker was cancelled by the user.');
      } else {
        console.error('Error picking or processing directory:', error);
        alert('An error occurred while processing the directory.');
      }
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <Button 
      onClick={handleDirectoryPick}
      className="bg-black text-white"
    >
      {isScanning ? 'Scanning...' : 'Scan Music Directory'}
      <DriveFolderUploadIcon style={{ color: 'white' }} />
    </Button>
  );
};

export default DirectoryPicker;
