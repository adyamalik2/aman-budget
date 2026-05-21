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

const DEFAULT_GROUP_CATEGORIES = {
  rumah: ["Listrik & Air", "WiFi Indihome", "Cicilan KPR", "Maintenance Rumah"],
  bunda: ["Belanja Bulanan", "Uang Sekolah Anak", "Dapur", "Kebutuhan Bunda"],
  abang: ["Transportasi", "Pulsa", "Kerja", "Kopi"],
  anak: ["Susu & Popok", "Sekolah", "Kesehatan Anak", "Mainan"],
  zakat_sedekah: ["Zakat", "Sedekah", "Donasi"],
  tabungan: ["Tabungan Darurat", "Umroh", "Pendidikan Anak"],
  kesehatan: ["Obat", "Dokter", "BPJS"],
  darurat: ["Emergency", "Bantuan Keluarga"],
  hiburan: ["Liburan", "Makan di Luar"],
  dapur_makan: ["Dapur", "Makan di Luar", "Belanja Bulanan"],
  transportasi: ["Transportasi", "BBM", "Parkir"],
  pendidikan: ["Uang Sekolah Anak", "Pendidikan Anak", "Buku"],
  cicilan: ["Cicilan KPR", "Cicilan Kendaraan", "Cicilan Lainnya"],
  lain_lain: ["Lain-lain"],
};

const toCategory = (groupId, name, index) => ({
  id: `${groupId}-${index + 1}`,
  name,
  active: true,
});

export const DEFAULT_ACCOUNTS = [
  {id:"bsi", name:"BSI", type:"Bank", active:true},
  {id:"cash", name:"Cash", type:"Cash", active:true},
];

export const DEFAULT_CATEGORY_GROUPS = Object.entries(GROUPS).map(([id, group]) => ({
  id,
  label: group.label,
  color: group.color,
  active: true,
  categories: (DEFAULT_GROUP_CATEGORIES[id] || [group.label]).map((name, index) => toCategory(id, name, index)),
}));

export const DEFAULT_QUICK_SHORTCUTS = [
  {id:"quick-dapur", label:"Dapur", type:"expense", group:"dapur_makan", category:"Dapur", description:"Dapur", amount:"", account:"", sortOrder:0, isActive:true, createdAt:"", updatedAt:""},
  {id:"quick-transportasi", label:"Transportasi", type:"expense", group:"transportasi", category:"Transportasi", description:"Transportasi", amount:"", account:"", sortOrder:1, isActive:true, createdAt:"", updatedAt:""},
  {id:"quick-anak", label:"Anak", type:"expense", group:"anak", category:"Sekolah", description:"Anak", amount:"", account:"", sortOrder:2, isActive:true, createdAt:"", updatedAt:""},
  {id:"quick-zakat", label:"Zakat", type:"expense", group:"zakat_sedekah", category:"Zakat", description:"Zakat", amount:"", account:"", sortOrder:3, isActive:true, createdAt:"", updatedAt:""},
];

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
  accounts: "amanBudget.accounts",
  categoryGroups: "amanBudget.categoryGroups",
  lastTxDate: "amanBudget.lastTransactionDate",
  transfers: "amanBudget.transfers",
  quickShortcuts: "amanBudget.quickShortcuts",
};
