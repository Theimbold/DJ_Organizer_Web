import { Track } from '../types/types';
import * as musicMetadata from 'music-metadata-browser';

export const readAudioMetadata = async (file: File): Promise<any> => {
    try {
        const metadata = await musicMetadata.parseBlob(file);
        const common = metadata.common;
        const format = metadata.format;

        let coverArt = null;
        if (common.picture && common.picture.length > 0) {
            const picture = common.picture[0];
            const blob = new Blob([new Uint8Array(picture.data)], { type: picture.format });
            coverArt = URL.createObjectURL(blob);
        }

        return {
            title: common.title || file.name,
            artist: common.artist || 'Unknown Artist',
            album: common.album || 'Unknown Album',
            duration: format.duration || 0,
            coverArt: coverArt,
        };
    } catch (error) {
        console.error(`Error reading metadata for ${file.name}:`, error);
        return {
            title: file.name,
            artist: 'Unknown Artist',
            album: 'Unknown Album',
            duration: 0,
            coverArt: null,
        };
    }
};

export const scanDirectory = async (
    directoryHandle: FileSystemDirectoryHandle,
    allowedFormats: string[],
    setProgress: (progress: { scanned: number; total: number }) => void,
    canceled: boolean
): Promise<Track[]> => {
    let scannedCount = 0;
    const allTracks: Track[] = [];
    const filesToProcess: { fileHandle: FileSystemFileHandle; path: string[] }[] = [];

    // First pass: collect all files and count total
    const collectFiles = async (handle: FileSystemDirectoryHandle, path: string[]) => {
        for await (const entry of (handle as any).entries()) {
            if (canceled) return;

            if (entry[1].kind === 'file') {
                if (allowedFormats.some(format => entry[1].name.toLowerCase().endsWith(format))) {
                    filesToProcess.push({ fileHandle: entry[1], path: [...path, entry[1].name] });
                }
            } else if (entry[1].kind === 'directory') {
                await collectFiles(entry[1], [...path, entry[1].name]);
            }
        }
    };

    await collectFiles(directoryHandle, []);
    const totalFiles = filesToProcess.length;
    setProgress({ scanned: 0, total: totalFiles });

    // Second pass: process files and extract metadata
    for (const { fileHandle } of filesToProcess) {
        if (canceled) break;

        try {
            const file = await fileHandle.getFile();
            const audioMetadata = await readAudioMetadata(file);

            allTracks.push({
                title: audioMetadata.title,
                artist: audioMetadata.artist,
                album: audioMetadata.album,
                duration: audioMetadata.duration, // Assign directly
                cover_url: audioMetadata.coverArt, // Assign directly
                status: 'unrated',
                genre: '',
                mood: '',
            });
        } catch (error) {
            console.error(`Failed to process file ${fileHandle.name}:`, error);
        }

        scannedCount++;
        setProgress({ scanned: scannedCount, total: totalFiles });
    }

    return allTracks;
};

export const scanFileList = async (
    files: FileList,
    allowedFormats: string[]
): Promise<Track[]> => {
    const allTracks: Track[] = [];
    let idCounter = Date.now(); // Simple unique ID generation

    for (const file of Array.from(files)) {
        if (allowedFormats.some(format => file.name.toLowerCase().endsWith(format))) {
            try {
                const audioMetadata = await readAudioMetadata(file);

                allTracks.push({
                    title: audioMetadata.title,
                    artist: audioMetadata.artist,
                    album: audioMetadata.album,
                    duration: audioMetadata.duration, // Assign directly
                    cover_url: audioMetadata.coverArt, // Assign directly
                    status: 'unrated',
                    genre: '',
                    mood: '',
                });
            } catch (error) {
                console.error(`Failed to process file ${file.name}:`, error);
            }
        }
    }

    return allTracks;
};
