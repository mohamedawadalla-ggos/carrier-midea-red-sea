export const MR_COOL_TOUR_STORAGE_KEY = "carrier-midea-mr-cool-tour-seen";

export function hasTourBeenSeen(): boolean {
  try {
    return window.localStorage.getItem(MR_COOL_TOUR_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function markTourSeen(): void {
  try {
    window.localStorage.setItem(MR_COOL_TOUR_STORAGE_KEY, "1");
  } catch {
    // Storage unavailable (private mode, quota, etc.) -- the tour simply
    // replays next visit instead of failing the interaction.
  }
}
