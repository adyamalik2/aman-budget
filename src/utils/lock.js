// Kunci PIN aplikasi. Hash PIN dengan FNV-1a + salt.
// Catatan: ini privasi kasual (menghalangi akses sembarangan), BUKAN enkripsi data —
// data tetap tersimpan apa adanya di localStorage. PIN pendek memang mudah ditebak
// secara teori, tapi cukup untuk mencegah orang lain membuka app di HP Anda.

export const DEFAULT_LOCK = {enabled:false, pinHash:"", salt:"", len:6};

export const makeSalt = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export const hashPin = (pin, salt) => {
  const str = `${salt}:${pin}`;
  let h = 0x811c9dc5;
  for(let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16);
};

export const verifyPin = (pin, config) =>
  Boolean(config?.pinHash) && hashPin(pin, config.salt) === config.pinHash;

export const isValidLock = value =>
  value && typeof value === "object" && !Array.isArray(value);
