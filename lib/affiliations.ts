const MAX_CUSTOM_LENGTH = 60;
const MAX_WORDS = 3;

export function validateCustomAffiliation(
  raw: string,
): { ok: true; value: string } | { ok: false; error: string } {
  const collapsed = raw.trim().replace(/\s+/g, " ");
  if (!collapsed) return { ok: true, value: "" };

  if (collapsed.length > MAX_CUSTOM_LENGTH) {
    return { ok: false, error: `Max ${MAX_CUSTOM_LENGTH} characters.` };
  }

  const words = collapsed.split(/\s+/).filter(Boolean);
  if (words.length > MAX_WORDS) {
    return { ok: false, error: `Up to ${MAX_WORDS} words only.` };
  }

  return { ok: true, value: collapsed };
}
