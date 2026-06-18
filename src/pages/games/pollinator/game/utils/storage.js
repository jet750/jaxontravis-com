// localStorage persistence for The Great Pollinator.
// Every access is wrapped in try/catch so the game keeps running in
// private-mode browsers or when storage is unavailable.

const STORAGE_KEYS = {
  HIGH_SCORE: 'pollinator_highscore',
  TOTAL_BANKED: 'pollinator_total_banked',
  UPGRADES: 'pollinator_upgrades',
  FOG: 'pollinator_minimap_fog',
};

// Upgrade levels shape. All default to 0 / empty.
const DEFAULT_UPGRADES = {
  maxHp: 0, // +20 HP per level, max 5
  damageReduction: 0, // ×0.95 per level, max 5
  attackBoost: 0, // ×1.05 per level, max 5
  healingItems: 0, // consumables currently held, max 3
};

function readNumber(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    const n = Number(raw);
    return Number.isFinite(n) ? n : fallback;
  } catch {
    return fallback;
  }
}

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch {
    return fallback;
  }
}

/** Returns the full progress object with sensible defaults. */
export function loadProgress() {
  const upgrades = { ...DEFAULT_UPGRADES, ...readJSON(STORAGE_KEYS.UPGRADES, {}) };
  return {
    highScore: readNumber(STORAGE_KEYS.HIGH_SCORE, 0),
    totalBanked: readNumber(STORAGE_KEYS.TOTAL_BANKED, 0),
    upgrades,
    // Fog is stored as a flat array of [x,y] world points the player has visited.
    fog: readJSON(STORAGE_KEYS.FOG, []),
  };
}

/** Writes the full progress object. Partial objects are merged on read elsewhere. */
export function saveProgress(data) {
  try {
    if (data.highScore != null) {
      localStorage.setItem(STORAGE_KEYS.HIGH_SCORE, String(data.highScore));
    }
    if (data.totalBanked != null) {
      localStorage.setItem(STORAGE_KEYS.TOTAL_BANKED, String(data.totalBanked));
    }
    if (data.upgrades != null) {
      localStorage.setItem(STORAGE_KEYS.UPGRADES, JSON.stringify(data.upgrades));
    }
    if (data.fog != null) {
      localStorage.setItem(STORAGE_KEYS.FOG, JSON.stringify(data.fog));
    }
  } catch {
    // Storage full or blocked — fail silently, the run continues in memory.
  }
}

/** Clears every pollinator_ key (full progress reset). */
export function resetProgress() {
  try {
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
  } catch {
    // no-op
  }
}

export { STORAGE_KEYS, DEFAULT_UPGRADES };
