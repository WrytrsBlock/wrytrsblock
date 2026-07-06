// Shared by song-player.tsx and loop-markers-list.tsx so both mm:ss displays
// stay in sync (previously duplicated with divergent NaN/negative handling).
export function fmtTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
