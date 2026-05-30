"use client";

// Lightweight, decoupled UI event bus built on CustomEvent. Lets any client
// component open global overlays (dialogs, palettes) without prop drilling or a
// wrapping context provider. Server components can't dispatch — use a client
// trigger button.

type UIEventMap = {
  "wb:new-block": { type?: "collaboration" | "service" } | undefined;
  "wb:open-command": undefined;
  "wb:invite": { blockSlug: string; handle?: string };
  "wb:edit-service": undefined;
};

export function emitUIEvent<K extends keyof UIEventMap>(
  type: K,
  detail?: UIEventMap[K]
) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(type, { detail }));
}

export function onUIEvent<K extends keyof UIEventMap>(
  type: K,
  handler: (detail: UIEventMap[K]) => void
): () => void {
  if (typeof window === "undefined") return () => {};
  const listener = (e: Event) => handler((e as CustomEvent).detail);
  window.addEventListener(type, listener);
  return () => window.removeEventListener(type, listener);
}

export const openNewBlock = (type?: "collaboration" | "service") =>
  emitUIEvent("wb:new-block", type ? { type } : undefined);
export const openCommandPalette = () => emitUIEvent("wb:open-command");
export const openInvite = (blockSlug: string, handle?: string) =>
  emitUIEvent("wb:invite", { blockSlug, handle });
export const openEditService = () => emitUIEvent("wb:edit-service");
