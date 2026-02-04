import React, { useRef, useEffect, useState } from 'react';
import { Track } from '../../types/types';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import PlaylistPlayIcon from '@mui/icons-material/PlaylistPlay';
import CategoryIcon from '@mui/icons-material/Category';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutline';
import CircularProgress from '@mui/material/CircularProgress'; // For loading spinner
import SelectionOverlay from './SelectionOverlay';

const GENRE_OPTIONS = ["Deep House", "Deep Tech", "Chicago House", "Detroit House", "Progressive"];
const MOOD_OPTIONS = ["Guten Morgen", "Sonnenaufgang", "Mittagsstress", "Feierabend", "Dröhnung", "Viben", "Druckdrauf", "Maximal", "Grooveout", "Electro", "Last-ours-Trance"];

interface PlayerProps {
    track: Track | null;
    previousTrack: Track | null;
    nextTrack: Track | null;
    onNext: () => void;
    onPrevious: () => void;
    onToggleView: () => void;
    onUpdateTrack: (track: Track) => void;
}

const Player: React.FC<PlayerProps> = ({ track, previousTrack, nextTrack, onNext, onPrevious, onToggleView, onUpdateTrack }) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const serverUrl = 'http://localhost:3001';

    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [loading, setLoading] = useState<'genre' | 'mood' | null>(null);
    const [success, setSuccess] = useState<'genre' | 'mood' | null>(null);

    const [overlay, setOverlay] = useState<{ isOpen: boolean; type: 'genre' | 'mood' | null; options: string[]; title: string; }>({
        isOpen: false, type: null, options: [], title: ''
    });

    useEffect(() => {
        if (track && track.mp3_url && audioRef.current) {
            const audioSrc = `${serverUrl}${track.mp3_url}`;
            if (audioRef.current.src !== audioSrc) {
                audioRef.current.src = audioSrc;
                audioRef.current.play().catch(e => console.error("Autoplay was prevented:", e));
            }
        } else if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = '';
        }
    }, [track]);

    const handlePlayPause = () => {
        if (audioRef.current) {
            isPlaying ? audioRef.current.pause() : audioRef.current.play();
        }
    };

    const handleOpenOverlay = (type: 'genre' | 'mood') => {
        if (!track || loading) return;
        setOverlay({
            isOpen: true,
            type: type,
            options: type === 'genre' ? GENRE_OPTIONS : MOOD_OPTIONS,
            title: type === 'genre' ? 'Bitte Genre wählen' : 'Bitte Mood wählen'
        });
    };

    const handleSelectOption = (option: string) => {
        if (!track || !overlay.type) return;
        const currentAction = overlay.type;

        const updatedTrack: Track = { ...track, [currentAction]: option };
        
        const willBeRated = (currentAction === 'genre' && !!updatedTrack.mood) || (currentAction === 'mood' && !!updatedTrack.genre);
        if (willBeRated) {
            updatedTrack.status = 'rated';
        } else if (updatedTrack.status !== 'rated') {
            updatedTrack.status = 'partial';
        }

        onUpdateTrack(updatedTrack);

        setLoading(currentAction);
        setTimeout(() => {
            setLoading(null);
            setSuccess(currentAction);
            setTimeout(() => setSuccess(null), 1000);
        }, 500);

        setOverlay({ isOpen: false, type: null, options: [], title: '' });
    };

    const handleTimeUpdate = (e: React.SyntheticEvent<HTMLAudioElement, Event>) => setCurrentTime(e.currentTarget.currentTime);
    const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLAudioElement, Event>) => setDuration(e.currentTarget.duration);

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (audioRef.current) audioRef.current.currentTime = Number(e.target.value);
    };

    const formatTime = (timeInSeconds: number) => {
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = Math.floor(timeInSeconds % 60);
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    const mainCoverUrl = track?.cover_url ? `${serverUrl}${track.cover_url}` : '';

    const getButtonStyle = (type: 'genre' | 'mood') => ({
        flex: 1,
        background: success === type ? '#28a745' : 'rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        borderRadius: '8px',
        color: 'white',
        cursor: 'pointer',
        padding: '1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        transition: 'background-color 0.3s ease'
    });

    return (
        <div style={{
            position: 'relative', margin: '1rem 0', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#333',
            backgroundImage: `url(${mainCoverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center',
            minHeight: '450px', color: 'white', display: 'flex', flexDirection: 'column',
        }}>
            <SelectionOverlay isOpen={overlay.isOpen} onClose={() => setOverlay({ isOpen: false, type: null, options: [], title: '' })}
                options={overlay.options} onSelect={handleSelectOption} title={overlay.title} />
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(5px)' }} />

            <div style={{ position: 'relative', zIndex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', flex: 1 }}>
                    <img src={previousTrack?.cover_url ? `${serverUrl}${previousTrack.cover_url}` : ''} alt="Previous" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px', opacity: 0.5 }} />
                    <img src={mainCoverUrl} alt={track?.title || 'Current'} style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.5)' }} />
                    <img src={nextTrack?.cover_url ? `${serverUrl}${nextTrack.cover_url}` : ''} alt="Next" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px', opacity: 0.5 }} />
                </div>

                <div style={{ textAlign: 'center', padding: '1rem' }}>
                    <h3>{track ? track.title : 'No Track Selected'}</h3>
                    <p>{track ? track.artist : '---'}</p>
                    <audio ref={audioRef} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onEnded={onNext}
                        onTimeUpdate={handleTimeUpdate} onLoadedMetadata={handleLoadedMetadata} style={{ display: 'none' }} />
                    <div style={{ marginTop: '0.5rem' }}>
                        <input type="range" min="0" max={duration || 0} value={currentTime} onChange={handleSeek} style={{ width: '100%', cursor: 'pointer' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                            <span>{formatTime(currentTime)}</span>
                            <span>{formatTime(duration)}</span>
                        </div>
                    </div>
                    <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
                        <button onClick={onPrevious} disabled={!track} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><SkipPreviousIcon fontSize="large" /></button>
                        <button onClick={handlePlayPause} disabled={!track} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                            {isPlaying ? <PauseCircleOutlineIcon style={{ fontSize: '3rem' }} /> : <PlayCircleOutlineIcon style={{ fontSize: '3rem' }} />}
                        </button>
                        <button onClick={onNext} disabled={!track} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><SkipNextIcon fontSize="large" /></button>
                    </div>
                </div>

                <div style={{ display: 'flex', width: '100%', gap: '1rem', padding: '0.5rem 0' }}>
                    <button onClick={() => handleOpenOverlay('genre')} disabled={!track || loading === 'genre'} style={getButtonStyle('genre')}>
                        {loading === 'genre' ? <CircularProgress size={24} color="inherit" /> : <CategoryIcon />}
                        {loading === 'genre' ? 'Speichern...' : track?.genre || 'Genre wählen'}
                    </button>
                    <button onClick={() => handleOpenOverlay('mood')} disabled={!track || loading === 'mood'} style={getButtonStyle('mood')}>
                        {loading === 'mood' ? <CircularProgress size={24} color="inherit" /> : <SentimentSatisfiedAltIcon />}
                        {loading === 'mood' ? 'Speichern...' : track?.mood || 'Mood wählen'}
                    </button>
                </div>

                <button onClick={onToggleView} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(255, 255, 255, 0.2)', border: 'none', borderRadius: '50%', color: 'white', cursor: 'pointer', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PlaylistPlayIcon />
                </button>
            </div>
        </div>
    );
};

export default Player;
