import React, { useEffect, useState } from 'react';
import { Track } from '../../types/types';

interface TrackListProps {
    tracks: Track[];
    setSelectedTrack: (track: Track) => void;
    selectedTrack: Track | null;
    onRemoveTrack: (trackId: number | undefined) => Promise<void> | void;
    onUpdateTrack: (track: Track) => Promise<void> | void;
    onResetRating: (trackId: number | undefined) => void;
    onToggleView: () => void;
}

const TrackList: React.FC<TrackListProps> = ({ tracks, setSelectedTrack, selectedTrack, onRemoveTrack, onResetRating, onToggleView }) => {
    const [exportableTracksCount, setExportableTracksCount] = useState<number>(0);
    const serverUrl = 'http://localhost:3001';

    useEffect(() => {
        const filteredTracks = tracks.filter(track => track.genre && track.mood && track.status === 'rated');
        setExportableTracksCount(filteredTracks.length);
    }, [tracks]);

    const backgroundCoverUrl = selectedTrack?.cover_url ? `${serverUrl}${selectedTrack.cover_url}` : '';

    return (
        <div style={{ 
            position: 'relative',
            padding: '1rem', 
            margin: '1rem 0', 
            borderRadius: '8px', 
            backgroundColor: '#333',
            backgroundImage: `url(${backgroundCoverUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            overflow: 'hidden',
            color: 'white',
        }}>
            <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                backdropFilter: 'blur(5px)',
            }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4>Track List</h4>
                    <button onClick={onToggleView} style={{ padding: '0.5rem 1rem', cursor: 'pointer', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '4px', color: 'white' }}>Back to Player</button>
                </div>
                <p>Exportable Tracks: {exportableTracksCount}</p>
                <ul style={{ listStyleType: 'none', padding: 0 }}>
                    {tracks.map(track => (
                        <li 
                            key={track.id} 
                            onClick={() => setSelectedTrack(track)} 
                            className={selectedTrack?.id === track.id ? 'selected-track' : ''} 
                            aria-label={`Track: ${track.title}, Status: ${track.status}`}
                            style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                padding: '0.5rem', 
                                borderBottom: '1px solid rgba(255, 255, 255, 0.2)', 
                                cursor: 'pointer',
                                backgroundColor: selectedTrack?.id === track.id ? 'rgba(0, 135, 108, 0.5)' : 'transparent',
                                transition: 'background-color 0.2s',
                            }}
                        > 
                            {track?.cover_url && (
                                <img src={`${serverUrl}${track.cover_url}`} alt="Album Cover" style={{ width: '50px', height: '50px', marginRight: '10px', objectFit: 'cover', borderRadius: '4px' }} />
                            )}
                            <div>
                                <strong>{track.title}</strong> by {track.artist} <br />
                                <small>Status: {track.status} {track.genre && `(Genre: ${track.genre})`} {track.mood && `(Mood: ${track.mood})`}</small>
                            </div>
                            <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
                                {track.status === 'rated' && (
                                    <button 
                                        style={{
                                            padding: '0.5rem', 
                                            border: '1px solid white', 
                                            borderRadius: '8px', 
                                            backgroundColor: 'transparent',
                                            color: 'white',
                                            cursor: 'pointer',
                                            fontSize: '0.8rem'
                                        }} 
                                        onClick={(e) => { e.stopPropagation(); onResetRating(track.id); }} 
                                        aria-label={`Reset rating for ${track.title}`}
                                    >
                                        Reset Rating
                                    </button>
                                )}
                                {track.id && (
                                    <button 
                                    style={{
                                            padding: '0.5rem', 
                                            border: 'none', 
                                            borderRadius: '8px', 
                                            backgroundColor: '#d43d51',
                                            color: 'white',
                                            cursor: 'pointer',
                                            fontSize: '0.8rem'
                                        }} 
                                        onClick={(e) => { e.stopPropagation(); onRemoveTrack(track.id); }} 
                                        aria-label={`Remove ${track.title}`}
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default TrackList;