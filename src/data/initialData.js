export const INIT_TX = [
  {id:"i1", date:"2026-05-25", type:"income", grp:"", cat:"Gaji", desc:"Gaji Mei 2026", amt:15000000, status:"selesai", pay:"transfer", acc:"BSI"},
  {id:"i2", date:"2026-05-15", type:"income", grp:"", cat:"Freelance", desc:"Project Looker Studio", amt:3500000, status:"selesai", pay:"transfer", acc:"BSI"},
  {id:"e1", date:"2026-05-01", type:"expense", grp:"rumah", cat:"Cicilan", desc:"Cicilan KPR", amt:3500000, status:"selesai", pay:"transfer", acc:"Mandiri"},
  {id:"e2", date:"2026-05-01", type:"expense", grp:"bunda", cat:"Sekolah", desc:"Uang Sekolah Anak", amt:2000000, status:"selesai", pay:"transfer", acc:"BSI"},
  {id:"e3", date:"2026-05-05", type:"expense", grp:"bunda", cat:"Belanja", desc:"Belanja Bulanan", amt:1500000, status:"belum_selesai", pay:"cash", acc:"Cash"},
  {id:"e4", date:"2026-05-01", type:"expense", grp:"zakat_sedekah", cat:"Zakat", desc:"Zakat Penghasilan 2.5%", amt:462500, status:"selesai", pay:"transfer", acc:"BSI"},
  {id:"e5", date:"2026-05-10", type:"expense", grp:"abang", cat:"Transport", desc:"BBM & Parkir", amt:500000, status:"estimasi", pay:"cash", acc:"Cash"},
  {id:"e6", date:"2026-05-15", type:"expense", grp:"tabungan", cat:"Tabungan", desc:"Tabungan Darurat", amt:1500000, status:"estimasi", pay:"transfer", acc:"BSI"},
  {id:"e7", date:"2026-05-20", type:"expense", grp:"rumah", cat:"Utilitas", desc:"Listrik & Air", amt:450000, status:"belum_selesai", pay:"transfer", acc:"BSI"},
  {id:"e8", date:"2026-05-18", type:"expense", grp:"rumah", cat:"Internet", desc:"WiFi Indihome", amt:350000, status:"selesai", pay:"transfer", acc:"BSI"},
  {id:"e9", date:"2026-05-22", type:"expense", grp:"anak", cat:"Susu", desc:"Susu & Popok", amt:600000, status:"belum_selesai", pay:"cash", acc:"Cash"},
  {id:"e10", date:"2026-05-08", type:"expense", grp:"zakat_sedekah", cat:"Sedekah", desc:"Sedekah Jumat", amt:200000, status:"selesai", pay:"cash", acc:"Cash"},
];

export const INIT_GOALS = [
  {id:"g1", name:"Umroh Keluarga", target:80000000, saved:35000000, deadline:"Des 2027", icon:"plane", color:"#16a34a"},
  {id:"g2", name:"Dana Pendidikan Anak", target:50000000, saved:18500000, deadline:"Jun 2030", icon:"grad", color:"#2563eb"},
  {id:"g3", name:"Dana Darurat", target:30000000, saved:22000000, deadline:"Des 2026", icon:"shield", color:"#d97706"},
];
