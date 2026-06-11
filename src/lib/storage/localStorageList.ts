export function loadListFromStorage<T>(key: string): T[] {
  if (typeof window === "undefined") {
    return [];
  }

  const storedValue = window.localStorage.getItem(key);

  if (!storedValue) {
    return [];
  }

  try {
    return JSON.parse(storedValue) as T[];
  } catch {
    return [];
  }
}

export function saveListToStorage<T>(key: string, value: T[]): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}
