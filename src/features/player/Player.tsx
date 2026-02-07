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

  const handlePlayPause = () => {
    if (!track) return;
    if (audioRef.current) {
      isPlaying ? audioRef.current.pause() : audioRef.current.play();
    }
  };

  const handleOpenOverlay = (type: 'genre' | 'mood') => {
    if (!track || loading) return;
    setOverlay({
      isOpen: true,
      type,
      options: type === 'genre' ? GENRE_OPTIONS : MOOD_OPTIONS,
      title: type === 'genre' ? 'Bitte Genre wählen' : 'Bitte Mood wählen'
    });
  };

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

  const actionBtnBase =
    "flex-1 rounded-xl border border-white/15 bg-white/10 text-white/90 " +
    "px-4 py-4 font-medium tracking-[-0.01em] " +
    "flex items-center justify-center gap-2 " +
    "transition-colors duration-200 " +
    "hover:bg-white/15 active:scale-[0.99] " +
    "disabled:opacity-60 disabled:cursor-not-allowed";

  const actionBtnSuccess = "bg-emerald-600/90 border-emerald-300/40 hover:bg-emerald-600/90";

  if (!track) {
    return (
      <div className="my-2 rounded-xl border border-white/12 bg-white/5 p-5 text-center text-white/80">
        <h3 className="m-0 text-lg font-bold tracking-[-0.01em]">Kein Track geladen</h3>
        <p className="mt-2 text-white/70">Bitte wähle zuerst einen Musik-Ordner aus.</p>
      </div>
    );
  }

  return (
    <div
      className="relative my-2 overflow-hidden rounded-xl border border-white/10 bg-[#222] text-white"
      style={mainCoverUrl ? { backgroundImage: `url(${mainCoverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
    >
      <SelectionOverlay
        isOpen={overlay.isOpen}
        onClose={() => setOverlay({ isOpen: false, type: null, options: [], title: '' })}
        options={overlay.options}
        onSelect={handleSelectOption}
        title={overlay.title}
      />

      {/* dark blur overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[6px]" />

      <div className="relative z-10 flex min-h-[420px] flex-col justify-between p-4">
        {/* Track list toggle */}
        <button
          onClick={onToggleView}
          aria-label="Open track list"
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white hover:bg-white/15 transition-colors duration-200"
        >
          <PlaylistPlayIcon />
        </button>

        {/* Covers row */}
        <div className="flex flex-1 items-center justify-center gap-4 pt-1">
          {prevCoverUrl ? (
            <img
              src={prevCoverUrl}
              alt="Previous"
              className="h-20 w-20 rounded-lg object-cover opacity-60 border border-white/10"
            />
          ) : (
            <div className="h-20 w-20" />
          )}

          {mainCoverUrl ? (
            <img
              src={mainCoverUrl}
              alt={track.title || 'Current'}
              className="h-[150px] w-[150px] rounded-2xl object-cover shadow-2xl border border-white/10"
            />
          ) : (
            <div className="h-[150px] w-[150px] rounded-2xl bg-white/10 border border-white/15" />
          )}

          {nextCoverUrl ? (
            <img
              src={nextCoverUrl}
              alt="Next"
              className="h-20 w-20 rounded-lg object-cover opacity-60 border border-white/10"
            />
          ) : (
            <div className="h-20 w-20" />
          )}
        </div>

        {/* Meta + Seek + Transport */}
        <div className="px-4 pb-2 text-center">
          <h3 className="m-0 text-xl font-extrabold tracking-[-0.01em]">{track.title}</h3>
          <p className="mt-1 text-white/70">{track.artist || '—'}</p>

          <audio
            ref={audioRef}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={onNext}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            className="hidden"
          />

          <div className="mt-3">
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="w-full cursor-pointer"
            />
            <div className="mt-1 flex justify-between text-sm text-white/80">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center gap-4">
            <button
              onClick={onPrevious}
              aria-label="Previous track"
              disabled={!previousTrack}
              className="rounded-lg p-1 text-white/90 hover:text-white disabled:opacity-50"
            >
              <SkipPreviousIcon fontSize="large" />
            </button>

            <button
              onClick={handlePlayPause}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="rounded-lg p-1 text-white hover:text-white"
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
              className="rounded-lg p-1 text-white/90 hover:text-white disabled:opacity-50"
            >
              <SkipNextIcon fontSize="large" />
            </button>
          </div>
        </div>

        {/* Genre / Mood */}
        <div className="flex w-full gap-3 px-1 pb-1">
          <button
            onClick={() => handleOpenOverlay('genre')}
            disabled={loading === 'genre'}
            className={`${actionBtnBase} ${success === 'genre' ? actionBtnSuccess : ''}`}
            aria-label="Select genre"
          >
            {loading === 'genre' ? <CircularProgress size={22} color="inherit" /> : <CategoryIcon />}
            {loading === 'genre' ? 'Speichern…' : (track.genre || 'Genre wählen')}
          </button>

          <button
            onClick={() => handleOpenOverlay('mood')}
            disabled={loading === 'mood'}
            className={`${actionBtnBase} ${success === 'mood' ? actionBtnSuccess : ''}`}
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
