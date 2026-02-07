import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Track } from '../../types/types';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import PlaylistPlayIcon from '@mui/icons-material/PlaylistPlay';
import CategoryIcon from '@mui/icons-material/Category';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutline';
import CircularProgress from '@mui/material/CircularProgress';
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

const Player: React.FC<PlayerProps> = ({
  track,
  previousTrack,
  nextTrack,
  onNext,
  onPrevious,
  onToggleView,
  onUpdateTrack
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const serverUrl = 'http://localhost:3001';

  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [loading, setLoading] = useState<'genre' | 'mood' | null>(null);
  const [success, setSuccess] = useState<'genre' | 'mood' | null>(null);

  const [overlay, setOverlay] = useState<{
    isOpen: boolean;
    type: 'genre' | 'mood' | null;
    options: string[];
    title: string;
  }>({ isOpen: false, type: null, options: [], title: '' });

  // CHANGE: Cover-URLs stabilisieren (UI ruckelt weniger, weniger string-duplication)
  const prevCoverUrl = useMemo(
    () => (previousTrack?.cover_url ? `${serverUrl}${previousTrack.cover_url}` : null),
    [previousTrack]
  );
  const nextCoverUrl = useMemo(
    () => (nextTrack?.cover_url ? `${serverUrl}${nextTrack.cover_url}` : null),
    [nextTrack]
  );
  const mainCoverUrl = useMemo(
    () => (track?.cover_url ? `${serverUrl}${track.cover_url}` : null),
    [track]
  );

  // CHANGE: Beim Track-Wechsel UI-States sauber zurücksetzen (Time/Duration/Play) → wirkt “professioneller”
  useEffect(() => {
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);

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

  // CHANGE: Guard gegen “Play ohne Track” (verhindert edge-case clicks)
  const handlePlayPause = () => {
    if (!track) return;
    if (audioRef.current) {
      isPlaying ? audioRef.current.pause() : audioRef.current.play();
    }
  };

  // CHANGE: Overlay-Öffnen bleibt logisch gleich, nur etwas klarer strukturiert
  const handleOpenOverlay = (type: 'genre' | 'mood') => {
    if (!track || loading) return;
    setOverlay({
      isOpen: true,
      type,
      options: type === 'genre' ? GENRE_OPTIONS : MOOD_OPTIONS,
      title: type === 'genre' ? 'Bitte Genre wählen' : 'Bitte Mood wählen'
    });
  };

  // CHANGE: Auswahl-Handling bleibt 1:1, nur visuelles Feedback timing minimal “snappier”
  const handleSelectOption = (option: string) => {
    if (!track || !overlay.type) return;
    const currentAction = overlay.type;

    const updatedTrack: Track = { ...track, [currentAction]: option };

    const willBeRated =
      (currentAction === 'genre' && !!updatedTrack.mood) ||
      (currentAction === 'mood' && !!updatedTrack.genre);

    if (willBeRated) updatedTrack.status = 'rated';
    else if (updatedTrack.status !== 'rated') updatedTrack.status = 'partial';

    onUpdateTrack(updatedTrack);

    setLoading(currentAction);
    setTimeout(() => {
      setLoading(null);
      setSuccess(currentAction);
      setTimeout(() => setSuccess(null), 900);
    }, 450);

    setOverlay({ isOpen: false, type: null, options: [], title: '' });
  };

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLAudioElement, Event>) =>
    setCurrentTime(e.currentTarget.currentTime);

  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLAudioElement, Event>) =>
    setDuration(e.currentTarget.duration);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) audioRef.current.currentTime = Number(e.target.value);
  };

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  // CHANGE: Einheitliche “Card”-Optik mit Glass/Blur via Inline-Styles (build-sicher)
  const cardStyle: React.CSSProperties = {
    position: 'relative',
    margin: '0.5rem 0',
    borderRadius: 16,
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.10)',
    backgroundColor: '#1f1f1f',
    color: 'white',
    minHeight: 420
  };

  // CHANGE: Hintergrundbild + Blur-Layer (keine Tailwind arbitrary utilities)
  const bgStyle: React.CSSProperties = mainCoverUrl
    ? { backgroundImage: `url(${mainCoverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : {};

  const blurOverlayStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.62)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)'
  };

  // CHANGE: Falls kein Track vorhanden ist, zeigen wir eine saubere “Empty Card” statt eines “halb kaputten Players”
  if (!track) {
    return (
      <div style={{ ...cardStyle, backgroundColor: 'rgba(255,255,255,0.06)' }}>
        <div style={{ padding: 20, textAlign: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, letterSpacing: '-0.01em' }}>Kein Track geladen</h3>
          <p style={{ marginTop: 10, color: 'rgba(255,255,255,0.7)' }}>
            Bitte wähle zuerst einen Musik-Ordner aus.
          </p>
        </div>
      </div>
    );
  }

  // CHANGE: Action Button Style vereinheitlichen (Genre/Mood bleiben “schön”, Rest zieht nach)
  const actionBtnStyle = (type: 'genre' | 'mood'): React.CSSProperties => {
    const isSuccess = success === type;
    return {
      flex: 1,
      borderRadius: 14,
      border: `1px solid ${isSuccess ? 'rgba(167,243,208,0.35)' : 'rgba(255,255,255,0.14)'}`,
      background: isSuccess ? 'rgba(16,185,129,0.85)' : 'rgba(255,255,255,0.10)',
      color: 'rgba(255,255,255,0.92)',
      padding: '14px 14px',
      fontWeight: 650,
      letterSpacing: '-0.01em',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      cursor: loading ? 'not-allowed' : 'pointer',
      opacity: loading === type ? 0.75 : 1,
      transition: 'transform 120ms ease, background 200ms ease, border-color 200ms ease',
      userSelect: 'none'
    };
  };

  // CHANGE: Transport Buttons bekommen “Touch Targets” + consistent hover feel
  const iconBtnStyle: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    color: 'rgba(255,255,255,0.92)',
    cursor: 'pointer',
    padding: 6,
    borderRadius: 10
  };

  // CHANGE: Toggle (TrackList) modern als “floating pill button”
  const toggleBtnStyle: React.CSSProperties = {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 40,
    height: 40,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    border: '1px solid rgba(255,255,255,0.14)',
    background: 'rgba(255,255,255,0.10)',
    color: 'white',
    cursor: 'pointer',
    transition: 'background 200ms ease, transform 120ms ease'
  };

  return (
    <div style={{ ...cardStyle, ...bgStyle }}>
      <SelectionOverlay
        isOpen={overlay.isOpen}
        // CHANGE: Close handler bleibt, aber aus UX-Sicht stets “safe”
        onClose={() => setOverlay({ isOpen: false, type: null, options: [], title: '' })}
        options={overlay.options}
        onSelect={handleSelectOption}
        title={overlay.title}
      />

      {/* CHANGE: Blur overlay layer (macht es “modern & ruhig”) */}
      <div style={blurOverlayStyle} />

      <div style={{ position: 'relative', zIndex: 1, padding: 16, display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* CHANGE: TrackList Toggle Button */}
        <button
          onClick={onToggleView}
          aria-label="Open track list"
          style={toggleBtnStyle}
          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <PlaylistPlayIcon />
        </button>

        {/* CHANGE: Cover Row als klares Zentrum */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, paddingTop: 6, flex: 1 }}>
          {/* Prev cover placeholder: kein “hässliches Bild”, sondern leerer Slot */}
          {prevCoverUrl ? (
            <img
              src={prevCoverUrl}
              alt="Previous"
              style={{
                width: 80,
                height: 80,
                borderRadius: 12,
                objectFit: 'cover',
                opacity: 0.6,
                border: '1px solid rgba(255,255,255,0.10)'
              }}
            />
          ) : (
            <div style={{ width: 80, height: 80 }} />
          )}

          {/* Main cover */}
          {mainCoverUrl ? (
            <img
              src={mainCoverUrl}
              alt={track.title || 'Current'}
              style={{
                width: 160,
                height: 160,
                borderRadius: 22,
                objectFit: 'cover',
                border: '1px solid rgba(255,255,255,0.10)',
                boxShadow: '0 18px 50px rgba(0,0,0,0.55)'
              }}
            />
          ) : (
            <div
              style={{
                width: 160,
                height: 160,
                borderRadius: 22,
                background: 'rgba(255,255,255,0.10)',
                border: '1px solid rgba(255,255,255,0.14)'
              }}
            />
          )}

          {/* Next cover placeholder */}
          {nextCoverUrl ? (
            <img
              src={nextCoverUrl}
              alt="Next"
              style={{
                width: 80,
                height: 80,
                borderRadius: 12,
                objectFit: 'cover',
                opacity: 0.6,
                border: '1px solid rgba(255,255,255,0.10)'
              }}
            />
          ) : (
            <div style={{ width: 80, height: 80 }} />
          )}
        </div>

        {/* CHANGE: Meta-Block kompakter + Title/Artist klar zentriert */}
        <div style={{ textAlign: 'center', padding: '8px 12px 0' }}>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 850, letterSpacing: '-0.01em' }}>
            {track.title}
          </h3>
          <p style={{ margin: '6px 0 0', color: 'rgba(255,255,255,0.70)' }}>
            {track.artist || '—'}
          </p>

          <audio
            ref={audioRef}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={onNext}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            style={{ display: 'none' }}
          />

          {/* CHANGE: Seekbar + Times sauberer und moderner */}
          <div style={{ marginTop: 14 }}>
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              style={{ width: '100%', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginTop: 6, color: 'rgba(255,255,255,0.80)' }}>
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* CHANGE: Transport Controls als kompakter “Center Cluster” */}
          <div style={{ marginTop: 14, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 18 }}>
            <button
              onClick={onPrevious}
              aria-label="Previous track"
              disabled={!previousTrack}
              style={{ ...iconBtnStyle, opacity: previousTrack ? 1 : 0.45, cursor: previousTrack ? 'pointer' : 'not-allowed' }}
            >
              <SkipPreviousIcon fontSize="large" />
            </button>

            <button
              onClick={handlePlayPause}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              style={{ ...iconBtnStyle }}
            >
              {isPlaying ? (
                <PauseCircleOutlineIcon style={{ fontSize: '3.1rem' }} />
              ) : (
                <PlayCircleOutlineIcon style={{ fontSize: '3.1rem' }} />
              )}
            </button>

            <button
              onClick={onNext}
              aria-label="Next track"
              disabled={!nextTrack}
              style={{ ...iconBtnStyle, opacity: nextTrack ? 1 : 0.45, cursor: nextTrack ? 'pointer' : 'not-allowed' }}
            >
              <SkipNextIcon fontSize="large" />
            </button>
          </div>
        </div>

        {/* CHANGE: Genre/Mood Panel unten als “Action Row” (modern & konsistent) */}
        <div style={{ display: 'flex', gap: 12, marginTop: 16, padding: '0 2px 2px' }}>
          <button
            onClick={() => handleOpenOverlay('genre')}
            disabled={loading === 'genre'}
            style={actionBtnStyle('genre')}
            aria-label="Select genre"
          >
            {loading === 'genre' ? <CircularProgress size={22} color="inherit" /> : <CategoryIcon />}
            {loading === 'genre' ? 'Speichern…' : (track.genre || 'Genre wählen')}
          </button>

          <button
            onClick={() => handleOpenOverlay('mood')}
            disabled={loading === 'mood'}
            style={actionBtnStyle('mood')}
            aria-label="Select mood"
          >
            {loading === 'mood' ? <CircularProgress size={22} color="inherit" /> : <SentimentSatisfiedAltIcon />}
            {loading === 'mood' ? 'Speichern…' : (track.mood || 'Mood wählen')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Player;
