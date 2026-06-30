"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getGenreRadioAction } from "@/app/actions/player";
import type { PlayerTrack } from "@/lib/player";

type PlayerContextValue = {
  current: PlayerTrack | null;
  playing: boolean;
  time: number;
  duration: number;
  volume: number;
  canPrev: boolean;
  canNext: boolean;
  /** Load a queue and start playing from `startIndex`. */
  playTracks: (tracks: PlayerTrack[], startIndex?: number) => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (seconds: number) => void;
  setVolume: (v: number) => void;
  closePlayer: () => void;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function useMusicPlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx)
    throw new Error("useMusicPlayer must be used within <MusicPlayerProvider>");
  return ctx;
}

export function MusicPlayerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [queue, setQueue] = useState<PlayerTrack[]>([]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVol] = useState(1);

  const current = queue[index] ?? null;

  // Latest-state ref so the once-bound audio listeners (esp. "ended") never
  // close over stale queue/index.
  const stateRef = useRef({ queue, index });
  stateRef.current = { queue, index };

  const playTracks = useCallback(
    (tracks: PlayerTrack[], startIndex = 0) => {
      if (!tracks.length) return;
      setQueue(tracks);
      setIndex(Math.min(Math.max(0, startIndex), tracks.length - 1));
      setTime(0);
      setPlaying(true);
    },
    []
  );

  const advanceOrRadio = useCallback(async () => {
    const { queue: q, index: i } = stateRef.current;
    if (i < q.length - 1) {
      setIndex(i + 1);
      setTime(0);
      setPlaying(true);
      return;
    }
    // End of queue → same-genre radio from other creators.
    const cur = q[i];
    if (cur) {
      const more = await getGenreRadioAction(cur.genre, cur.creatorHandle, 10);
      const fresh = more.filter((t) => !q.some((x) => x.id === t.id));
      if (fresh.length) {
        setQueue([...q, ...fresh]);
        setIndex(q.length);
        setTime(0);
        setPlaying(true);
        return;
      }
    }
    // Nothing new — loop the queue.
    setIndex(0);
    setTime(0);
    setPlaying(true);
  }, []);

  const endRef = useRef(advanceOrRadio);
  endRef.current = advanceOrRadio;

  // Bind audio element listeners once.
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => setTime(a.currentTime || 0);
    const onMeta = () => setDuration(a.duration || 0);
    const onEnded = () => void endRef.current();
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("ended", onEnded);
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("ended", onEnded);
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
    };
  }, []);

  // Load the current source when it changes.
  useEffect(() => {
    const a = audioRef.current;
    if (!a || !current) return;
    if (a.src !== current.src) {
      a.src = current.src;
      a.load();
    }
    if (playing) a.play().catch(() => setPlaying(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.src]);

  // Play/pause sync.
  useEffect(() => {
    const a = audioRef.current;
    if (!a || !current) return;
    if (playing) a.play().catch(() => setPlaying(false));
    else a.pause();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, current?.src]);

  // Volume sync.
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const toggle = useCallback(() => {
    if (!stateRef.current.queue.length) return;
    setPlaying((p) => !p);
  }, []);

  const next = useCallback(() => void endRef.current(), []);

  const prev = useCallback(() => {
    const a = audioRef.current;
    if (a && a.currentTime > 3) {
      a.currentTime = 0;
      setTime(0);
      return;
    }
    setIndex((i) => (i > 0 ? i - 1 : 0));
    setTime(0);
    setPlaying(true);
  }, []);

  const seek = useCallback((seconds: number) => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = seconds;
    setTime(seconds);
  }, []);

  const setVolume = useCallback((v: number) => {
    setVol(Math.min(1, Math.max(0, v)));
  }, []);

  const closePlayer = useCallback(() => {
    const a = audioRef.current;
    if (a) {
      a.pause();
      a.removeAttribute("src");
      a.load();
    }
    setQueue([]);
    setIndex(0);
    setPlaying(false);
    setTime(0);
    setDuration(0);
  }, []);

  const value = useMemo<PlayerContextValue>(
    () => ({
      current,
      playing,
      time,
      duration,
      volume,
      canPrev: index > 0 || time > 3,
      canNext: queue.length > 1,
      playTracks,
      toggle,
      next,
      prev,
      seek,
      setVolume,
      closePlayer,
    }),
    [
      current,
      playing,
      time,
      duration,
      volume,
      index,
      queue.length,
      playTracks,
      toggle,
      next,
      prev,
      seek,
      setVolume,
      closePlayer,
    ]
  );

  return (
    <PlayerContext.Provider value={value}>
      {children}
      {/* Single persistent audio element — never unmounts across navigation. */}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio ref={audioRef} preload="metadata" />
    </PlayerContext.Provider>
  );
}
