const PARAM = 's';

export function loadSavedState() {
  try {
    const raw = new URLSearchParams(window.location.search).get(PARAM);
    if (!raw) return null;
    return JSON.parse(atob(raw));
  } catch {
    return null;
  }
}

export function buildShareUrl(state) {
  const url = new URL(window.location.href);
  url.search = '';
  try {
    url.searchParams.set(PARAM, btoa(JSON.stringify(state)));
  } catch {
    // ignore encode failures
  }
  return url.toString();
}
