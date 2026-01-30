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
import ConversionProgress from './features/scan/ConversionProgress';


const App: React.FC = () => {
    const [tracks, setTracks] = useState<Track[]>([]);
    const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
    const [processingStatus, setProcessingStatus] = useState<{ isActive: boolean; total: number; processed: number }>({ isActive: false, total: 0, processed: 0 });
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [isTrackListVisible, setIsTrackListVisible] = useState(false);
    
    // New states for conversion progress
    const [conversionStatus, setConversionStatus] = useState<{ total: number; converted: number }>({ total: 0, converted: 0 });
    
    const showConversionProgress = conversionStatus.total > 0 && conversionStatus.converted < conversionStatus.total;

    const progressInfo = useMemo(() => {
        if (processingStatus.isActive) {
            const percentage = processingStatus.total > 0 ? (processingStatus.processed / processingStatus.total) * 50 : 0;
            const processedMB = Math.round(processingStatus.processed / 1024 / 1024);
            const totalMB = Math.round(processingStatus.total / 1024 / 1024);
            return { percentage, text: `Lade Dateien hoch: ${processedMB}MB / ${totalMB}MB` };
        }
        if (showConversionProgress) {
            const percentage = 50 + (conversionStatus.converted / conversionStatus.total) * 50;
            return { percentage, text: `${conversionStatus.converted} von ${conversionStatus.total} Tracks konvertiert` };
        }
        return { percentage: 0, text: '' };
    }, [processingStatus, conversionStatus, showConversionProgress]);


    const selectedTrackRef = useRef(selectedTrack);
    useEffect(() => {
        selectedTrackRef.current = selectedTrack;
    }, [selectedTrack]);

    // WebSocket connection with reconnection logic
    useEffect(() => {
        let ws: WebSocket | null = null;
        let connectInterval: NodeJS.Timeout | null = null;

        const connect = () => {
            ws = new WebSocket('ws://localhost:3001');

            ws.onopen = () => {
                console.log('WebSocket connected');
                if (connectInterval) {
                    clearInterval(connectInterval); // Clear interval on successful connection
                }
            };

            ws.onclose = () => {
                console.log('WebSocket disconnected');
                // Reconnect logic
                if (!connectInterval) {
                    connectInterval = setInterval(() => {
                        console.log('Attempting to reconnect WebSocket...');
                        connect();
                    }, 2000);
                }
            };

            ws.onerror = (err) => {
                console.error('WebSocket error:', err);
                ws?.close(); // This will trigger onclose and the reconnect logic
            };

            ws.onmessage = (event) => {
                const message = JSON.parse(event.data);
                switch (message.type) {
                    case 'conversion_complete': {
                        const newTrack: Track = message.data;
                        setTracks(prev => [...prev, newTrack]);
                        db.tracks.add(newTrack);
                        setConversionStatus(prev => ({ ...prev, converted: prev.converted + 1 }));
                        if (!selectedTrackRef.current) {
                            setSelectedTrack(newTrack);
                        }
                        break;
                    }
                    case 'conversion_error': {
                        console.error('Conversion error:', message.data);
                        setConversionStatus(prev => ({ ...prev, total: Math.max(0, prev.total - 1) }));
                        break;
                    }
                }
            };
        };

        connect(); // Initial connection attempt

        return () => {
            if (connectInterval) {
                clearInterval(connectInterval);
            }
            if (ws) {
                ws.onclose = null; // Prevent reconnect logic from firing on component unmount
                ws.close();
            }
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

                return (

                    <div className="bg-black text-white min-h-screen flex flex-col p-5">

                        {/* Header */}

                        <header className="flex justify-between items-center w-full max-w-4xl mx-auto">

                            <h1 className="text-[#A8AFEC] text-2xl font-bold">File Dancer</h1>

                            <SettingsButton isOpen={settingsOpen} onToggle={handleToggleSettings} />

                        </header>

        

                        {/* Centered Content Area */}

                        <div className="w-full max-w-4xl mx-auto mt-4 flex flex-col gap-4">

                            

                            {/* Action Buttons Section */}

                            <div className="w-full">

                                <DirectoryPicker onScanComplete={handleScanComplete} onScanProgress={handleScanProgress} />

                            </div>

                            

                            {/* Progress Bars Section */}

                            {(progressInfo.percentage > 0 && progressInfo.percentage < 100) && (

                                <div className="w-full">

                                    <ConversionProgress 

                                        text={progressInfo.text}

                                        overallPercentage={progressInfo.percentage}

                                    />

                                </div>

                            )}

        

                            {/* Main Content: Settings or Player/TrackList */}

                            <main className="w-full">

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

        

                        <footer className="app-footer">

                            <ExportButton coverUrl={coverUrl} />

                        </footer>

                    </div>

                );

            };

    

    export default App;

    