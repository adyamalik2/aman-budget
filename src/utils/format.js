export const fmt = n => "Rp " + Math.round(n||0).toLocaleString("id-ID");

export const fmtS = n => {
  const a = Math.abs(n||0);
  if (a >= 1e9) return "Rp " + (n/1e9).toFixed(1) + "M";
  if (a >= 1e6) return "Rp " + (n/1e6).toFixed(a >= 1e7 ? 0 : 1) + "jt";
  if (a >= 1e3) return "Rp " + Math.round(n/1e3) + "rb";
  return "Rp " + Math.round(n);
};
