import React, { useEffect, useState, useRef, useMemo } from 'react';
import axios from 'axios';
import DirectoryPicker from './features/scan/DirectoryPicker';
import TrackList from './features/scan/TrackList';
import Player from './features/player/Player';
import { Settings } from './features/settings/Settings';
import SettingsButton from './features/settings/SettingsButton';
import { ExportButton } from './features/export/ExportButton';
import { db } from './core/db/db';
import { Track } from './types/types';
import { addFileHandle, getFileHandle } from './core/fs/fileHandleState';

const App: React.FC = () => {
    const [tracks, setTracks] = useState<Track[]>([]);
    const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
    const [processingStatus, setProcessingStatus] = useState<{ isActive: boolean; total: number; processed: number }>({ isActive: false, total: 0, processed: 0 });
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [isTrackListVisible, setIsTrackListVisible] = useState(false);
    
    // New states for conversion progress
    const [conversionStatus, setConversionStatus] = useState<{ total: number; converted: number }>({ total: 0, converted: 0 });
    const [fileConversionProgress, setFileConversionProgress] = useState<{ [filename: string]: number }>({});
    const overallConversionPercentage = useMemo(() => {
        if (conversionStatus.total === 0) return 0;
        const totalProgress = Object.values(fileConversionProgress).reduce((sum, current) => sum + current, 0);
        return totalProgress / conversionStatus.total;
    }, [fileConversionProgress, conversionStatus.total]);


    const selectedTrackRef = useRef(selectedTrack);
    useEffect(() => {
        selectedTrackRef.current = selectedTrack;
    }, [selectedTrack]);

    // WebSocket connection
    useEffect(() => {
        const ws = new WebSocket('ws://localhost:3001');
        ws.onopen = () => console.log('WebSocket connected');
        ws.onclose = () => console.log('WebSocket disconnected');

        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            switch (message.type) {
                case 'conversion_progress': {
                    const { filename, percent } = message.data;
                    setFileConversionProgress(prev => ({ ...prev, [filename]: percent }));
                    break;
                }
                case 'conversion_complete': {
                    const newTrack: Track = message.data;
                    setTracks(prev => [...prev, newTrack]);
                    db.tracks.add(newTrack); // Also add to IndexedDB
                    setConversionStatus(prev => ({ ...prev, converted: prev.converted + 1 }));
                    // NEW: Automatically select the track if no track is currently selected
                    if (!selectedTrackRef.current) {
                        setSelectedTrack(newTrack);
                    }
                    break;
                }
                case 'conversion_error': {
                    console.error('Conversion error:', message.data);
                    // Decrement total so the bar can still complete
                    setConversionStatus(prev => ({ ...prev, total: Math.max(0, prev.total - 1) }));
                    break;
                }
            }
        };

        return () => {
            ws.close();
        };
    }, []);

    const fetchTracksFromServer = async () => {
        try {
            const response = await axios.get('http://localhost:3001/tracks');
            const serverTracks: Track[] = response.data;
            await db.transaction('rw', db.tracks, async () => {
                await db.tracks.clear();
                await db.tracks.bulkAdd(serverTracks);
            });
            setTracks(serverTracks);

            if (!selectedTrackRef.current && serverTracks.length > 0) {
                const unratedTracks = serverTracks.filter(t => t.status !== 'rated');
                setSelectedTrack(unratedTracks.length > 0 ? unratedTracks[0] : serverTracks[0]);
            }
        } catch (error) {
            console.error('Error fetching tracks from server:', error);
        }
    };

    // Effect for initial load
    useEffect(() => {
        fetchTracksFromServer();
    }, []);

    const sortedTracks = useMemo(() => {
        return [...tracks].sort((a, b) => {
            if (a.status === 'rated' && b.status !== 'rated') return 1;
            if (a.status !== 'rated' && b.status === 'rated') return -1;
            return a.title.localeCompare(b.title);
        });
    }, [tracks]);

    const { previousTrack, nextTrack } = useMemo(() => {
        if (!selectedTrack || sortedTracks.length < 2) return { previousTrack: null, nextTrack: null };
        const currentIndex = sortedTracks.findIndex(t => t.id === selectedTrack.id);
        if (currentIndex === -1) return { previousTrack: null, nextTrack: null };
        const prevIndex = (currentIndex - 1 + sortedTracks.length) % sortedTracks.length;
        const nextIndex = (currentIndex + 1) % sortedTracks.length;
        return { previousTrack: sortedTracks[prevIndex], nextTrack: sortedTracks[nextIndex] };
    }, [selectedTrack, sortedTracks]);

    const handleScanProgress = (progress: { loaded: number; total: number }) => {
        setProcessingStatus({ isActive: true, processed: progress.loaded, total: progress.total });
    };

    const handleScanComplete = (result: { newFilesCount: number; handlesOfNewFiles: FileSystemFileHandle[] }) => {
        setProcessingStatus({ isActive: false, total: 0, processed: 0 });
        if (result.newFilesCount > 0) {
            setConversionStatus({ total: result.newFilesCount, converted: 0 });
            const initialProgress = result.handlesOfNewFiles.reduce((acc, handle) => ({ ...acc, [handle.name]: 0 }), {});
            setFileConversionProgress(initialProgress);
        }
        result.handlesOfNewFiles.forEach(handle => {
            // This is a simplified way to associate handles; a robust solution might need more state
        });
    };

    const handleRemoveTrack = async (trackId: number | undefined) => {
        if (trackId === undefined) return;
        try {
            await axios.delete(`http://localhost:3001/tracks/${trackId}`);
            setTracks(prev => prev.filter(t => t.id !== trackId));
            db.tracks.delete(trackId);
            if (selectedTrack?.id === trackId) {
                setSelectedTrack(null);
            }
        } catch (error) {
            console.error(`Error deleting track ${trackId}:`, error);
        }
    };
    
    const handleUpdateTrack = async (updatedTrack: Track) => {
        try {
            await axios.put(`http://localhost:3001/tracks/${updatedTrack.id}`, updatedTrack);
            setTracks(prevTracks => prevTracks.map(t => (t.id === updatedTrack.id ? updatedTrack : t)));
            db.tracks.put(updatedTrack);
            if (selectedTrack?.id === updatedTrack.id) {
                setSelectedTrack(updatedTrack);
            }
        } catch (error) {
            console.error(`Error updating track ${updatedTrack.id}:`, error);
        }
    };

    const handleResetRating = (trackId: number | undefined) => {
        if (trackId === undefined) return;
        const trackToReset = tracks.find(t => t.id === trackId);
        if (!trackToReset) return;
        const resetTrack: Track = { ...trackToReset, status: 'unrated', genre: undefined, mood: undefined };
        handleUpdateTrack(resetTrack);
    };

    const handleNextTrack = () => nextTrack && setSelectedTrack(nextTrack);
    const handlePreviousTrack = () => previousTrack && setSelectedTrack(previousTrack);
    const handleToggleSettings = () => setSettingsOpen(prev => !prev);
    const toggleTrackListView = () => setIsTrackListVisible(prev => !prev);

    const coverUrl = selectedTrack?.cover_url;

        const showConversionProgress = conversionStatus.total > 0 && conversionStatus.converted < conversionStatus.total;

    

        return (

            <div className="bg-black text-white min-h-screen flex flex-col p-5">

                {/* Header */}

                <header className="relative flex justify-center items-center h-[10vh]">

                    <h1 className="text-[#A8AFEC] text-2xl font-bold">DJ Organizer</h1>

                    <div className="absolute top-0 right-0">

                        <SettingsButton isOpen={settingsOpen} onToggle={handleToggleSettings} />

                    </div>

                </header>


                {/* Action Buttons Section */}

                <div className="flex gap-5" style={{ minHeight: '10vh' }}>

                    <div className={tracks.length > 0 ? "w-1/2" : "w-full"}>

                        <DirectoryPicker onScanComplete={handleScanComplete} onScanProgress={handleScanProgress} coverUrl={coverUrl} />

                    </div>

                    {tracks.length > 0 && (

                        <div className="w-1/2">

                            <ExportButton coverUrl={coverUrl} />

                        </div>

                    )}

                </div>

    

                {/* Progress Bars Section */}

                <div className="py-5">

                    {processingStatus.isActive && processingStatus.processed < processingStatus.total && (

                        <div className="p-4 bg-blue-900/50 border border-blue-400 rounded-lg">

                            <p>Uploading files: {Math.round(processingStatus.processed / 1024 / 1024)} MB / {Math.round(processingStatus.total / 1024 / 1024)} MB</p>

                            <progress value={processingStatus.processed} max={processingStatus.total} className="w-full" />

                        </div>

                    )}

    

                    {showConversionProgress && (

                         <div className="p-4 bg-green-900/50 border border-green-400 rounded-lg mt-4">

                            <p>Converting files: {conversionStatus.converted} / {conversionStatus.total}</p>

                            <progress value={conversionStatus.converted} max={conversionStatus.total} className="w-full" />

                        </div>

                    )}

                </div>

    

                {/* Main Content: Settings or Player/TrackList */}

                <main className="flex-grow">

                    {settingsOpen && <div className="my-4"><Settings /></div>}

    

                    {isTrackListVisible ? (

                        <TrackList

                            tracks={sortedTracks}

                            selectedTrack={selectedTrack}

                            setSelectedTrack={setSelectedTrack}

                            onRemoveTrack={handleRemoveTrack}

                            onUpdateTrack={handleUpdateTrack}

                            onResetRating={handleResetRating}

                            onToggleView={toggleTrackListView}

                        />

                    ) : (

                        <Player

                            track={selectedTrack}

                            previousTrack={previousTrack}

                            nextTrack={nextTrack}

                            onNext={handleNextTrack}

                            onPrevious={handlePreviousTrack}

                            onToggleView={toggleTrackListView}

                            onUpdateTrack={handleUpdateTrack}

                        />

                    )}

                </main>

            </div>

        );

    };

    

    export default App;

    