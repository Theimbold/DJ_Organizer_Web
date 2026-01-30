import React, { useState } from 'react';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { db } from '../../core/db/db';
import { getFileHandle } from '../../core/fs/fileHandleState';
import Button from '../../shared/ui/Button'; // Import the new Button component

interface ExportButtonProps {
  coverUrl?: string;
}

// Helper function to find a file recursively and return its handle and parent's handle
async function findFileRecursively(
  dirHandle: FileSystemDirectoryHandle,
  fileName: string,
  originalPath: string[] = []
): Promise<{ fileHandle: FileSystemFileHandle; parentHandle: FileSystemDirectoryHandle } | null> {
  const currentPath = [...originalPath, dirHandle.name];
  for await (const entry of dirHandle.values()) {
    if (entry.kind === 'file' && entry.name === fileName) {
      return { fileHandle: entry, parentHandle: dirHandle };
    } else if (entry.kind === 'directory') {
      const result = await findFileRecursively(entry, fileName, currentPath);
      if (result) {
        return result;
      }
    }
  }
  return null;
}


export const ExportButton: React.FC<ExportButtonProps> = ({ coverUrl }) => {
  const [isExporting, setIsExporting] = useState(false);
  const serverUrl = 'http://localhost:3001';
  const backgroundImageUrl = coverUrl ? `${serverUrl}${coverUrl}` : '';

  const handleExport = async () => {
    console.log('Starting export process with advanced logic...');
    setIsExporting(true);
    try {
      const ratedTracks = await db.tracks.where('status').equals('rated').toArray();

      if (ratedTracks.length === 0) {
        alert('No rated tracks to export.');
        setIsExporting(false);
        return;
      }

      const exportDirHandle = await window.showDirectoryPicker();
      
      let copiedCount = 0;
      let movedCount = 0;
      let skippedCount = 0;
      let errorCount = 0;

      for (const track of ratedTracks) {
        if (!track.id || !track.genre || !track.mood || !track.original_filename) {
            console.warn('Skipping track due to missing data (genre/mood):', track);
            skippedCount++;
            continue;
        }

        try {
            const duplicateSearchResult = await findFileRecursively(exportDirHandle, track.original_filename);

            const genreDirHandle = await exportDirHandle.getDirectoryHandle(track.genre, { create: true });
            const targetDirHandle = await genreDirHandle.getDirectoryHandle(track.mood, { create: true });

            if (duplicateSearchResult) {
                const { fileHandle: duplicateFileHandle, parentHandle: duplicateParentHandle } = duplicateSearchResult;

                const isSame = await duplicateParentHandle.isSameEntry(targetDirHandle);

                if (isSame) {
                    console.log(`Skipping '${track.original_filename}' (already in correct folder).`);
                    skippedCount++;
                } else {
                    console.log(`Moving '${track.original_filename}' to its correct folder.`);
                    const fileData = await duplicateFileHandle.getFile();
                    const newFileHandle = await targetDirHandle.getFileHandle(track.original_filename, { create: true });
                    const writable = await newFileHandle.createWritable();
                    await writable.write(fileData);
                    await writable.close();

                    await duplicateParentHandle.removeEntry(track.original_filename);
                    movedCount++;
                }
            } else {
                const sourceHandle = getFileHandle(track.id);
                if (!sourceHandle) {
                    console.error(`Source file handle not found for '${track.original_filename}'. Cannot copy.`);
                    errorCount++;
                    continue;
                }
                
                console.log(`Copying new file '${track.original_filename}'.`);
                const fileData = await sourceHandle.getFile();
                const newFileHandle = await targetDirHandle.getFileHandle(track.original_filename, { create: true });
                const writable = await newFileHandle.createWritable();
                await writable.write(fileData);
                await writable.close();
                copiedCount++;
            }

        } catch (err) {
          console.error(`Error processing track ${track.title}:`, err);
          errorCount++;
        }
      }

      alert(`Export Complete!\n\n- ${copiedCount} new files copied.\n- ${movedCount} files moved.\n- ${skippedCount} files skipped.\n- ${errorCount} errors.`);

    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.log('Directory picker was cancelled by the user.');
      } else {
        console.error('Error during export process:', error);
        alert('An error occurred during the export process.');
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button 
      onClick={handleExport} 
      coverUrl={backgroundImageUrl}
    >
      <FileDownloadIcon />
      {isExporting ? 'Exporting...' : 'Export Rated Tracks'}
    </Button>
  );
};