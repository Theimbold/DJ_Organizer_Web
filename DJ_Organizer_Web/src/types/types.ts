export interface Track {
    id?: number;
    title: string;
    artist?: string;
    album?: string;
    duration?: number;
    status: 'unrated' | 'partial' | 'rated';
    genre?: string;
    mood?: string;
    mp3_url?: string;
    cover_url?: string;
    original_filename?: string;
    file_size?: number;
    original_path?: string;
    mp3_path?: string;
    cover_path?: string;
    fileHandle?: FileSystemFileHandle; 
}