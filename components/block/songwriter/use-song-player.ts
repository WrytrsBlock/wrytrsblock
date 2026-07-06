"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Owns the Songwriter instrumental's <audio> element and every bit of
// playback state: play/pause, position, volume, and A/B loop. This hook
// never touches Supabase or a Server Action — that's the concrete mechanism
// keeping playback 100% local to each collaborator (spec: one person's
// playback must never affect another's).
export function useSongPlayer(src: string | null) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [loopA, setLoopA] = useState<number | null>(null);
  const [loopB, setLoopB] = useState<number | null>(null);
  const [loopOn, setLoopOn] = useState(false);

  // Held in a ref so the timeupdate listener always reads the latest loop
  // bounds/on-state without needing to re-bind the listener on every change.
  const loopRef = useRef({ loopA, loopB, loopOn });
  loopRef.current = { loopA, loopB, loopOn };

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => {
      setTime(a.currentTime || 0);
      const { loopA: la, loopB: lb, loopOn: on } = loopRef.current;
      if (on && la != null && lb != null && a.currentTime >= lb) {
        a.currentTime = la;
      }
    };
    const onMeta = () => setDuration(a.duration || 0);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => setPlaying(false);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    a.addEventListener("ended", onEnded);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("ended", onEnded);
    };
  }, []);

  // Load the source when it changes (e.g. instrumental just attached).
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    setTime(0);
    setDuration(0);
    setPlaying(false);
    if (src) {
      a.src = src;
      a.load();
    } else {
      a.removeAttribute("src");
      a.load();
    }
  }, [src]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const toggle = useCallback(() => {
    const a = audioRef.current;
    if (!a || !src) return;
    if (a.paused) a.play().catch(() => {});
    else a.pause();
  }, [src]);

  const seek = useCallback((seconds: number) => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = seconds;
    setTime(seconds);
  }, []);

  const jumpTo = useCallback(
    (seconds: number) => {
      seek(seconds);
      const a = audioRef.current;
      if (a && a.paused && src) a.play().catch(() => {});
    },
    [seek, src]
  );

  const setVolume = useCallback((v: number) => {
    setVolumeState(Math.min(1, Math.max(0, v)));
  }, []);

  const setA = useCallback(() => {
    setLoopA(audioRef.current?.currentTime ?? 0);
  }, []);

  const setB = useCallback(() => {
    setLoopB(audioRef.current?.currentTime ?? 0);
  }, []);

  const toggleLoop = useCallback(() => {
    setLoopOn((on) => !on);
  }, []);

  const clearLoop = useCallback(() => {
    setLoopA(null);
    setLoopB(null);
    setLoopOn(false);
  }, []);

  return {
    audioRef,
    playing,
    time,
    duration,
    volume,
    loopA,
    loopB,
    loopOn,
    toggle,
    seek,
    jumpTo,
    setVolume,
    setA,
    setB,
    toggleLoop,
    clearLoop,
  };
}

export type SongPlayer = ReturnType<typeof useSongPlayer>;
