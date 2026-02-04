import axios from 'axios';
import { addFileHandle } from './fileHandleState';

async function* getFilesRecursively(entry: FileSystemDirectoryHandle): AsyncGenerator<FileSystemFileHandle> {
  for await (const handle of entry.values()) {
    if (handle.kind === 'file') {
      const file = await handle.getFile();
      if (['.mp3', '.aiff', '.aif', '.wav'].some(ext => file.name.endsWith(ext))) {
        yield handle;
      }
    } else if (handle.kind === 'directory') {
      yield* getFilesRecursively(handle);
    }
  }
}

interface ScanResult {
  newFilesCount: number;
  handlesOfNewFiles: FileSystemFileHandle[];
}

export const scanAndStoreFiles = async (
  onProgress: (progress: { loaded: number; total: number }) => void
): Promise<ScanResult> => {
    const dirHandle = await window.showDirectoryPicker();
    
    const response = await axios.get('http://localhost:3001/api/files');
    const existingFiles: { original_filename: string, file_size: number }[] = response.data;
    const existingFileSet = new Set(existingFiles.map(f => `${f.original_filename}-${f.file_size}`));
    
    const filesToUpload = new FormData();
    const handlesOfNewFiles: FileSystemFileHandle[] = [];
    
    for await (const fileHandle of getFilesRecursively(dirHandle)) {
        const file = await fileHandle.getFile();
        const fileIdentifier = `${file.name}-${file.size}`;

        if (!existingFileSet.has(fileIdentifier)) {
            filesToUpload.append('tracks', file, file.name);
            handlesOfNewFiles.push(fileHandle);
        }
    }
    
    const newFilesCount = handlesOfNewFiles.length;

    if (newFilesCount > 0) {
        axios.post('http://localhost:3001/upload', filesToUpload, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (progressEvent) => {
              if (progressEvent.total) {
                const progress = {
                    loaded: progressEvent.loaded,
                    total: progressEvent.total,
                };
                onProgress(progress);
              }
            },
        });
    }

    return { newFilesCount, handlesOfNewFiles };
};
