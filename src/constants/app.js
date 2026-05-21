export const GROUPS = {
  abang: {label:"Ayah", color:"#3b82f6"},
  bunda: {label:"Bunda", color:"#ec4899"},
  anak: {label:"Anak", color:"#f59e0b"},
  rumah: {label:"Rumah", color:"#8b5cf6"},
  dapur_makan: {label:"Dapur / Makan", color:"#f97316"},
  transportasi: {label:"Transportasi", color:"#0ea5e9"},
  pendidikan: {label:"Pendidikan", color:"#2563eb"},
  kesehatan: {label:"Kesehatan", color:"#14b8a6"},
  zakat_sedekah: {label:"Zakat/Sedekah", color:"#10b981"},
  tabungan: {label:"Tabungan", color:"#06b6d4"},
  cicilan: {label:"Cicilan", color:"#ef4444"},
  darurat: {label:"Darurat", color:"#d97706"},
  hiburan: {label:"Hiburan", color:"#a855f7"},
  lain_lain: {label:"Lain-lain", color:"#6b7280"},
};

export const STATUS = {
  estimasi: {label:"Estimasi", bg:"#fef9c3", color:"#854d0e"},
  selesai: {label:"Selesai", bg:"#dcfce7", color:"#166534"},
  belum_selesai: {label:"Belum Bayar", bg:"#fee2e2", color:"#991b1b"},
  batal: {label:"Batal", bg:"#f3f4f6", color:"#6b7280"},
};

export const MONTHS = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
export const MONTH_SHORT = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
export const CHART_MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export const STORAGE_KEYS = {
  txs: "amanBudget.transactions",
  goals: "amanBudget.goals",
  user: "amanBudget.user",
  period: "amanBudget.period",
  isPro: "aman_budget_is_pro",
};
