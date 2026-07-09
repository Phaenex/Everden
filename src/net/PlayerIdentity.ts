const STORAGE_KEY = 'everden_player_id';

/** Stable guest id for multiplayer sessions (localStorage). */
export function getOrCreatePlayerId(): string {
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, id);
    return id;
  } catch {
    return `guest-${Date.now()}`;
  }
}
