import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, AlertCircle, Scan } from 'lucide-react';

interface RoomVideoPlayerProps {
  videoUrl: string;
  thumbnailUrl?: string | null;
  duration?: number | null;
  title?: string;
  autoPlay?: boolean;
  className?: string;
  initialFillMode?: 'cover' | 'contain';
}

export const RoomVideoPlayer: React.FC<RoomVideoPlayerProps> = ({
  videoUrl,
  thumbnailUrl,
  duration,
  title = 'Video ya Chumba',
  autoPlay = false,
  className,
  initialFillMode = 'cover'
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(duration || 0);
  const [hasStarted, setHasStarted] = useState(autoPlay);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // Default to 'cover' so videos fill the entire screen/container like photo #1
  const [fillMode, setFillMode] = useState<'cover' | 'contain'>(initialFillMode);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onLoadedMetadata = () => {
      setVideoDuration(video.duration || duration || 0);
      setIsLoading(false);
    };
    const onWaiting = () => setIsLoading(true);
    const onPlaying = () => {
      setIsLoading(false);
      setIsPlaying(true);
    };
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      setIsPlaying(false);
      setHasStarted(false);
    };
    const onError = () => {
      setHasError(true);
      setIsLoading(false);
    };

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('pause', onPause);
    video.addEventListener('ended', onEnded);
    video.addEventListener('error', onError);

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('ended', onEnded);
      video.removeEventListener('error', onError);
    };
  }, [duration]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (!hasStarted) {
      setHasStarted(true);
    }
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(() => {
        setIsPlaying(false);
      });
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  const toggleFillMode = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFillMode((prev) => (prev === 'cover' ? 'contain' : 'cover'));
  };

  const formatSeconds = (sec: number) => {
    const s = Math.floor(sec || 0);
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m}:${rem < 10 ? '0' : ''}${rem}`;
  };

  const baseContainerClass = className
    ? `relative bg-neutral-950 overflow-hidden select-none group ${className}`
    : 'relative aspect-video w-full bg-neutral-950 rounded-2xl overflow-hidden shadow-lg group select-none';

  if (hasError) {
    return (
      <div className="relative aspect-video w-full bg-neutral-900 rounded-2xl flex flex-col items-center justify-center p-4 text-center text-white">
        <AlertCircle className="w-10 h-10 text-amber-400 mb-2" />
        <p className="text-sm font-semibold">Video haipatikani au inatayarishwa</p>
        <p className="text-xs text-neutral-400 mt-1">Tafadhali kagua mtandao au picha za chumba</p>
      </div>
    );
  }

  return (
    <div className={baseContainerClass}>
      {/* Ambient background layer - guarantees full-bleed appearance without black voids */}
      {thumbnailUrl && (
        <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
          <img
            src={thumbnailUrl}
            alt=""
            className="w-full h-full object-cover blur-2xl scale-125 opacity-50"
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>
      )}

      {/* Video element - object-cover by default to fill the entire area like picture #1 */}
      <video
        ref={videoRef}
        src={videoUrl}
        poster={thumbnailUrl || undefined}
        preload="none"
        playsInline
        className={`w-full h-full transition-all duration-300 cursor-pointer ${
          fillMode === 'cover' ? 'object-cover' : 'object-contain'
        }`}
        onClick={togglePlay}
      />

      {/* Initial Play Overlay with thumbnail poster */}
      {!hasStarted && (
        <div
          onClick={togglePlay}
          className="absolute inset-0 bg-black/40 hover:bg-black/30 transition-all flex flex-col items-center justify-center cursor-pointer z-10"
        >
          {thumbnailUrl && (
            <img
              src={thumbnailUrl}
              alt={title}
              className="absolute inset-0 w-full h-full object-cover -z-10"
            />
          )}
          <div className="w-16 h-16 rounded-full bg-blue-600/90 text-white flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform">
            <Play className="w-8 h-8 fill-current ml-1" />
          </div>
          <div className="mt-3 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-white text-xs font-medium flex items-center gap-1.5 border border-white/20 shadow-lg">
            <span>Tazama Video ya Chumba</span>
            {duration ? <span className="text-blue-300 font-bold">({duration}s)</span> : null}
          </div>
        </div>
      )}

      {/* Loading spinner */}
      {isLoading && hasStarted && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-xs pointer-events-none z-20">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Controls Bar */}
      {hasStarted && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-3 flex flex-col gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity z-20">
          {/* Progress bar */}
          <div
            className="w-full bg-white/30 h-1.5 rounded-full overflow-hidden cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickPos = (e.clientX - rect.left) / rect.width;
              if (videoRef.current && videoDuration) {
                videoRef.current.currentTime = clickPos * videoDuration;
              }
            }}
          >
            <div
              className="bg-blue-500 h-full rounded-full transition-all"
              style={{ width: `${(currentTime / (videoDuration || 1)) * 100}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-white text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={togglePlay}
                className="p-1 hover:text-blue-400 cursor-pointer"
                aria-label={isPlaying ? 'Sitisha' : 'Cheza'}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              </button>

              <button
                type="button"
                onClick={toggleMute}
                className="p-1 hover:text-blue-400 cursor-pointer"
                aria-label={isMuted ? 'Washa Sauti' : 'Zima Sauti'}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              <span className="font-mono text-[11px] text-neutral-300">
                {formatSeconds(currentTime)} / {formatSeconds(videoDuration)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Fill / Fit Mode Toggle */}
              <button
                type="button"
                onClick={toggleFillMode}
                className="px-2 py-0.5 rounded-md bg-white/20 hover:bg-white/30 text-[10px] font-bold flex items-center gap-1 text-white cursor-pointer transition-all border border-white/20"
                title={fillMode === 'cover' ? 'Bofya kubadili kuweka kawaida (contain)' : 'Bofya kujaza kioo (cover)'}
              >
                <Scan className="w-3 h-3 text-emerald-400" />
                <span>{fillMode === 'cover' ? 'Inajaa Kioo' : 'Kawaida'}</span>
              </button>

              <span className="bg-blue-600/80 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded">
                Video 30s
              </span>

              <button
                type="button"
                onClick={toggleFullscreen}
                className="p-1 hover:text-blue-400 cursor-pointer"
                aria-label="Skrini Kamili"
              >
                <Maximize className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
