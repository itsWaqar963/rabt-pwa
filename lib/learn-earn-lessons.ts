export type LearnLesson = {
  id: string;
  title: string;
  youtubeId: string;
  contributor: string;
  channelTitle: string;
  channelAvatarUrl?: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
};

export const DAILY_QUIZ_GOAL = 10;

export function extractYoutubeId(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;
  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{6,})/);
  if (shortMatch?.[1]) return shortMatch[1];
  const watchMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{6,})/);
  if (watchMatch?.[1]) return watchMatch[1];
  const shortsMatch = trimmed.match(/\/shorts\/([a-zA-Z0-9_-]{6,})/);
  if (shortsMatch?.[1]) return shortsMatch[1];
  if (/^[a-zA-Z0-9_-]{6,}$/.test(trimmed)) return trimmed;
  return null;
}
