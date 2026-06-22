// Lightweight client-side persistence for notification state. Notifications are
// demo/seed data with no backend table yet, so "Clear all" / "Mark all read"
// are remembered in localStorage — the action actually sticks across reloads
// and is shared between the bell menu and the /notifications page.

const DISMISS_KEY = "wb:notifs-dismissed";
const READ_KEY = "wb:notifs-read";

function readSet(key: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    return new Set(JSON.parse(localStorage.getItem(key) || "[]"));
  } catch {
    return new Set();
  }
}

function writeSet(key: string, set: Set<string>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify([...set]));
  } catch {
    /* storage unavailable (private mode) — degrade gracefully */
  }
}

export function getDismissed(): Set<string> {
  return readSet(DISMISS_KEY);
}

export function addDismissed(ids: string[]): void {
  const s = readSet(DISMISS_KEY);
  ids.forEach((id) => s.add(id));
  writeSet(DISMISS_KEY, s);
}

export function getRead(): Set<string> {
  return readSet(READ_KEY);
}

export function addRead(ids: string[]): void {
  const s = readSet(READ_KEY);
  ids.forEach((id) => s.add(id));
  writeSet(READ_KEY, s);
}
