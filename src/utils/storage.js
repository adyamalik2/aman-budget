export const loadStored = (key, fallback, validate = () => true) => {
  try {
    const raw = window.localStorage.getItem(key);
    if(!raw) return fallback;
    const value = JSON.parse(raw);
    return validate(value) ? value : fallback;
  } catch {
    return fallback;
  }
};

export const saveStored = (key, value) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Keep the app usable even when browser storage is unavailable.
  }
};

export const removeStored = key => {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Keep logout usable even when browser storage is unavailable.
  }
};
