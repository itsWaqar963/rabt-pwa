export type YoutubeChannelMeta = {
  channelTitle: string;
  /** Video thumbnail when no channel DP is available without API key. */
  channelAvatarUrl: string | null;
};

type OEmbedResponse = {
  author_name?: string;
  thumbnail_url?: string;
};

export async function fetchYoutubeChannelMeta(
  youtubeUrl: string,
): Promise<YoutubeChannelMeta> {
  const trimmed = youtubeUrl.trim();
  if (!trimmed) {
    return { channelTitle: "YouTube", channelAvatarUrl: null };
  }

  try {
    const endpoint = `https://www.youtube.com/oembed?url=${encodeURIComponent(trimmed)}&format=json`;
    const res = await fetch(endpoint);
    if (!res.ok) {
      return { channelTitle: "YouTube", channelAvatarUrl: null };
    }
    const data = (await res.json()) as OEmbedResponse;
    const channelTitle =
      typeof data.author_name === "string" && data.author_name.trim()
        ? data.author_name.trim()
        : "YouTube";
    const channelAvatarUrl =
      typeof data.thumbnail_url === "string" && data.thumbnail_url.trim()
        ? data.thumbnail_url.trim()
        : null;
    return { channelTitle, channelAvatarUrl };
  } catch {
    return { channelTitle: "YouTube", channelAvatarUrl: null };
  }
}
