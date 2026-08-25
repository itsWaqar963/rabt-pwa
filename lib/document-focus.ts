/** Page focus / visibility helpers for chat notify + ACK policy. */

export function isDocumentVisible(): boolean {
  if (typeof document === "undefined") return true;
  return document.visibilityState === "visible";
}

export function isAppFocused(): boolean {
  if (typeof document === "undefined") return true;
  if (document.visibilityState !== "visible") return false;
  if (typeof document.hasFocus === "function") {
    return document.hasFocus();
  }
  return true;
}

/**
 * True when the user is actively looking at this meetup's chat UI.
 * Hidden / minimized tabs must NOT suppress notifications.
 */
export function isActivelyViewingChat(activeMeetupId: string | null, meetupId: string): boolean {
  if (!activeMeetupId || activeMeetupId !== meetupId) return false;
  return isAppFocused();
}
