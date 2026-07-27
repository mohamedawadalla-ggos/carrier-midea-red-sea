export const MR_COOL_TOUR_STORAGE_KEY = "carrier-midea-mr-cool-tour-seen";
export const MR_COOL_TOUR_START_ON_HOME_KEY = "carrier-midea-mr-cool-start-tour-on-home";

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

export function isHomePath(pathname: string, locale: string): boolean {
  return pathname === "/" || pathname === `/${locale}` || pathname === `/${locale}/`;
}

export function requestTourOnHome(): void {
  try {
    window.sessionStorage.setItem(MR_COOL_TOUR_START_ON_HOME_KEY, "1");
  } catch {
    // Storage unavailable -- worst case the tour just doesn't auto-start
    // after navigating home, so this stays best-effort.
  }
}

// Pure read, safe to call from a useState lazy initializer (which React
// StrictMode invokes twice in development) -- it must not mutate storage,
// or the second invocation would see the flag already cleared.
export function peekTourOnHomeRequest(): boolean {
  try {
    return window.sessionStorage.getItem(MR_COOL_TOUR_START_ON_HOME_KEY) === "1";
  } catch {
    return false;
  }
}

export function clearTourOnHomeRequest(): void {
  try {
    window.sessionStorage.removeItem(MR_COOL_TOUR_START_ON_HOME_KEY);
  } catch {
    // Storage unavailable -- nothing to clear.
  }
}
