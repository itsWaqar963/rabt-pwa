export type ChatSoundKind = "ting" | "pop";

const VOLUME: Record<ChatSoundKind, number> = {
  ting: 0.5,
  pop: 0.35,
};

/**
 * Play a short chat cue. Swallows autoplay / missing-file failures.
 * Skips when the document is hidden (optional courtesy).
 */
export function playChatSound(kind: ChatSoundKind): void {
  if (typeof document !== "undefined" && document.hidden) return;

  try {
    const audio = new Audio(
      kind === "ting" ? "/sounds/ting.mp3" : "/sounds/pop.mp3",
    );
    audio.volume = VOLUME[kind];
    void audio.play().catch(() => {
      /* autoplay policy or missing asset */
    });
  } catch {
    /* Audio ctor / play unavailable */
  }
}
