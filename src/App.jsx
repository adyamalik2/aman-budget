import { useState, useMemo, useEffect } from "react";
import {
  Home, BarChart3, Target, Plus, Search, X, Trash2,
  Bell, Crown, Sparkles, CheckCircle2, Clock,
  Users, ArrowRightLeft, Plane, GraduationCap, Shield,
  ChevronRight, ChevronLeft, Mail, Lock, Send, Calculator, LayoutGrid,
  Star, Zap, LogOut, CreditCard, Receipt, PiggyBank, Check,
  TrendingUp, TrendingDown, Filter, FileDown, Copy
} from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

// ─── Theme ───
const C = {
  pri: "#16a34a", priD: "#15803d", priL: "#dcfce7", priBg: "#f0fdf4",
  gold: "#d97706", goldL: "#fef3c7", goldD: "#92400e",
  red: "#dc2626", redL: "#fee2e2",
  blue: "#2563eb", blueL: "#dbeafe",
  text: "#111827", textM: "#6b7280", textL: "#9ca3af",
  border: "#e5e7eb", borderL: "#f3f4f6", bg: "#f9fafb",
};

const fmt = n => "Rp " + Math.round(n||0).toLocaleString("id-ID");
const fmtS = n => {
  const a = Math.abs(n||0);
  if (a >= 1e9) return "Rp " + (n/1e9).toFixed(1) + "M";
  if (a >= 1e6) return "Rp " + (n/1e6).toFixed(a >= 1e7 ? 0 : 1) + "jt";
  if (a >= 1e3) return "Rp " + Math.round(n/1e3) + "rb";
  return "Rp " + Math.round(n);
};

// ─── Data ───
const GROUPS = {
  abang: {label:"Abang", color:"#3b82f6"},
  bunda: {label:"Bunda", color:"#ec4899"},
  anak: {label:"Anak", color:"#f59e0b"},
  rumah: {label:"Rumah", color:"#8b5cf6"},
  zakat_sedekah: {label:"Zakat/Sedekah", color:"#10b981"},
  tabungan: {label:"Tabungan", color:"#06b6d4"},
  cicilan: {label:"Cicilan", color:"#ef4444"},
  lain_lain: {label:"Lain-lain", color:"#6b7280"},
};

const STATUS = {
  estimasi: {label:"Estimasi", bg:"#fef9c3", color:"#854d0e"},
  selesai: {label:"Selesai", bg:"#dcfce7", color:"#166534"},
  belum_selesai: {label:"Belum Bayar", bg:"#fee2e2", color:"#991b1b"},
  batal: {label:"Batal", bg:"#f3f4f6", color:"#6b7280"},
};

const INIT_TX = [
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

const INIT_GOALS = [
  {id:"g1", name:"Umroh Keluarga", target:80000000, saved:35000000, deadline:"Des 2027", icon:"plane", color:"#16a34a"},
  {id:"g2", name:"Dana Pendidikan Anak", target:50000000, saved:18500000, deadline:"Jun 2030", icon:"grad", color:"#2563eb"},
  {id:"g3", name:"Dana Darurat", target:30000000, saved:22000000, deadline:"Des 2026", icon:"shield", color:"#d97706"},
];

const MONTHS = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
const MONTH_SHORT = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];

const STORAGE_KEYS = {
  txs: "amanBudget.transactions",
  goals: "amanBudget.goals",
  user: "amanBudget.user",
  period: "amanBudget.period",
};

const loadStored = (key, fallback, validate = () => true) => {
  try {
    const raw = window.localStorage.getItem(key);
    if(!raw) return fallback;
    const value = JSON.parse(raw);
    return validate(value) ? value : fallback;
  } catch {
    return fallback;
  }
};

const saveStored = (key, value) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Keep the app usable even when browser storage is unavailable.
  }
};

const removeStored = key => {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Keep logout usable even when browser storage is unavailable.
  }
};

const getDefaultPeriod = () => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  return {mode:"month", month, year, startMonth:month, startYear:year, endMonth:month, endYear:year};
};

const validMonth = value => Number.isInteger(value) && value >= 1 && value <= 12;
const validYear = value => Number.isInteger(value) && value > 1900 && value < 3000;

const monthKey = (year, month) => year * 12 + month;

const normalizePeriod = period => {
  const fallback = getDefaultPeriod();
  const month = validMonth(Number(period?.month)) ? Number(period.month) : fallback.month;
  const year = validYear(Number(period?.year)) ? Number(period.year) : fallback.year;
  const startMonth = validMonth(Number(period?.startMonth)) ? Number(period.startMonth) : month;
  const startYear = validYear(Number(period?.startYear)) ? Number(period.startYear) : year;
  let endMonth = validMonth(Number(period?.endMonth)) ? Number(period.endMonth) : startMonth;
  let endYear = validYear(Number(period?.endYear)) ? Number(period.endYear) : startYear;
  if(monthKey(endYear, endMonth) < monthKey(startYear, startMonth)) {
    endMonth = startMonth;
    endYear = startYear;
  }
  return {
    mode: period?.mode === "range" ? "range" : "month",
    month,
    year,
    startMonth,
    startYear,
    endMonth,
    endYear,
  };
};

const formatMonthYear = (month, year) => `${MONTHS[month - 1]} ${year}`;

const formatPeriodLabel = period => {
  const p = normalizePeriod(period);
  if(p.mode === "range") return `${formatMonthYear(p.startMonth, p.startYear)} - ${formatMonthYear(p.endMonth, p.endYear)}`;
  return formatMonthYear(p.month, p.year);
};

const isTxInPeriod = (tx, period) => {
  const [year, month] = (tx.date || "").split("-").map(Number);
  if(!validYear(year)||!validMonth(month)) return false;
  const p = normalizePeriod(period);
  if(p.mode === "range") {
    const txKey = monthKey(year, month);
    return txKey >= monthKey(p.startYear, p.startMonth) && txKey <= monthKey(p.endYear, p.endMonth);
  }
  return year === p.year && month === p.month;
};

const getPeriodYears = (txs, period) => {
  const p = normalizePeriod(period);
  const currentYear = new Date().getFullYear();
  const years = new Set([currentYear, currentYear + 1, p.year, p.startYear, p.endYear]);
  txs.forEach(tx=>{
    const year = Number((tx.date || "").slice(0, 4));
    if(validYear(year)) years.add(year);
  });
  return [...years].sort((a,b)=>a-b);
};

const getPrevMonthYear = (month, year) => month === 1 ? {month:12, year:year - 1} : {month:month - 1, year};

const getLastDayOfMonth = (month, year) => new Date(year, month, 0).getDate();

const shiftDateToTargetMonth = (date, targetMonth, targetYear) => {
  const day = Number((date || "").slice(8, 10)) || 1;
  const safeDay = Math.min(day, getLastDayOfMonth(targetMonth, targetYear));
  return `${targetYear}-${String(targetMonth).padStart(2, "0")}-${String(safeDay).padStart(2, "0")}`;
};

const copyBudgetFromPreviousMonth = (txs, period) => {
  const p = normalizePeriod(period);
  const prev = getPrevMonthYear(p.month, p.year);
  const txKey = tx => [tx.type, tx.grp || "", tx.cat || "", tx.desc || "", Number(tx.amt) || 0].join("|");
  const source = txs.filter(tx=>tx.status!=="batal"&&isTxInPeriod(tx, {mode:"month", month:prev.month, year:prev.year}));
  const targetKeys = new Set(txs.filter(tx=>isTxInPeriod(tx, {mode:"month", month:p.month, year:p.year})).map(txKey));
  const items = source
    .filter(tx=>!targetKeys.has(txKey(tx)))
    .map((tx,i)=>({
      ...tx,
      id:`copy-${Date.now()}-${i}`,
      date:shiftDateToTargetMonth(tx.date, p.month, p.year),
      status:"estimasi",
    }));
  return {items, sourceCount:source.length, prev};
};

const getTransactionsByPeriod = (txs, month, year) => txs.filter(tx=>isTxInPeriod(tx, {mode:"month", month, year}));

const getTransactionsByRange = (txs, period) => txs.filter(tx=>isTxInPeriod(tx, {...normalizePeriod(period), mode:"range"}));

const getDeletePeriodLabel = period => formatPeriodLabel(period);

const deleteTransactionsByPeriod = (txs, period) => {
  const p = normalizePeriod(period);
  const deleted = p.mode==="range" ? getTransactionsByRange(txs, p) : getTransactionsByPeriod(txs, p.month, p.year);
  const ids = new Set(deleted.map(tx=>tx.id));
  return {deleted, next:txs.filter(tx=>!ids.has(tx.id))};
};

const formatShortDate = date => {
  const month = Number((date || "").slice(5, 7));
  const day = Number((date || "").slice(8, 10));
  if(!validMonth(month)||!day) return date || "-";
  return `${day} ${MONTH_SHORT[month - 1]}`;
};

// ─── Calc helpers ───
const calcSummary = txs => {
  const incomePlan = txs.filter(x=>x.type==="income"&&x.status!=="batal").reduce((s,x)=>s+x.amt,0);
  const totalIncome = txs.filter(x=>x.type==="income"&&x.status==="selesai").reduce((s,x)=>s+x.amt,0);
  const estExp = txs.filter(x=>x.type==="expense"&&x.status!=="batal").reduce((s,x)=>s+x.amt,0);
  const paid = txs.filter(x=>x.type==="expense"&&x.status==="selesai").reduce((s,x)=>s+x.amt,0);
  const unpaid = txs.filter(x=>x.type==="expense"&&x.status==="belum_selesai").reduce((s,x)=>s+x.amt,0);
  return {
    totalIncome, incomePlan, estExp, paid, unpaid,
    actBal: totalIncome - paid,
    safeBal: incomePlan - estExp,
    prog: estExp>0 ? Math.round(paid/estExp*100) : 0,
  };
};

const calcGroups = txs => {
  const r = {};
  txs.filter(x=>x.type==="expense"&&x.status!=="batal").forEach(x=>{
    const k = x.grp || "lain_lain";
    if(!r[k]) r[k] = {budget:0, paid:0, unpaid:0};
    r[k].budget += x.amt;
    if(x.status==="selesai") r[k].paid += x.amt;
    if(x.status==="belum_selesai") r[k].unpaid += x.amt;
  });
  return r;
};

const calcWeekData = txs => {
  const weeks = Array.from({length:5}, (_,i)=>({w:`M${i+1}`, in:0, out:0}));
  txs.forEach(tx=>{
    const day = Number((tx.date || "").slice(8, 10));
    if(!day) return;
    const idx = Math.min(Math.floor((day - 1) / 7), 4);
    if(tx.type==="income"&&tx.status==="selesai") weeks[idx].in += tx.amt;
    if(tx.type==="expense"&&tx.status==="selesai") weeks[idx].out += tx.amt;
  });
  return weeks;
};

// ─── Reusable UI ───
const card = {background:"#fff", borderRadius:16, padding:"14px 16px", border:`1px solid ${C.borderL}`, boxShadow:"0 1px 4px rgba(0,0,0,0.03)"};
const inp = {width:"100%", border:`1.5px solid ${C.border}`, borderRadius:12, padding:"11px 14px", fontSize:14, outline:"none", boxSizing:"border-box", background:"#fff", color:C.text};
const lbl = {fontSize:12, fontWeight:600, color:C.textM, display:"block", marginBottom:6};

const Btn = ({onClick, children, primary, style={}, disabled}) => (
  <button onClick={onClick} disabled={disabled} style={{
    width:"100%", padding:"13px", borderRadius:12, border:"none", cursor:disabled?"not-allowed":"pointer",
    fontSize:14, fontWeight:700, opacity:disabled?0.5:1,
    background: primary ? C.pri : "#fff", color: primary ? "#fff" : C.pri,
    boxShadow: primary ? "0 4px 14px rgba(22,163,74,0.25)" : `inset 0 0 0 1.5px ${C.pri}`,
    ...style
  }}>{children}</button>
);

const Pill = ({active, onClick, children, color=C.pri}) => (
  <button onClick={onClick} style={{
    padding:"7px 14px", borderRadius:20, cursor:"pointer",
    fontSize:12, fontWeight:600, whiteSpace:"nowrap",
    background: active ? color : "#fff", color: active ? "#fff" : C.textM,
    border: `1px solid ${active ? color : C.border}`
  }}>{children}</button>
);

const Badge = ({children, bg, color}) => (
  <span style={{background:bg, color, fontSize:10, padding:"3px 8px", borderRadius:6, fontWeight:700, letterSpacing:0.3}}>
    {children}
  </span>
);

const PeriodPicker = ({period, setPeriod, years, onCopyBudget, dark=false, style={}}) => {
  const p = normalizePeriod(period);
  const labelColor = dark ? "rgba(255,255,255,0.8)" : C.textM;
  const selectStyle = {
    border: dark ? "1px solid rgba(255,255,255,0.35)" : `1px solid ${C.border}`,
    background: dark ? "rgba(255,255,255,0.16)" : "#fff",
    color: dark ? "#fff" : C.text,
    borderRadius:10,
    padding:"8px 10px",
    fontSize:12,
    fontWeight:700,
    outline:"none",
    colorScheme:"light",
    width:"100%",
    minWidth:0,
    boxSizing:"border-box",
  };
  const optionStyle = {color:C.text, background:"#fff"};
  const periodSelectorStyle = {display:"flex", flexDirection:"column", gap:8, width:"100%", ...style};
  const periodHeaderStyle = {display:"flex", alignItems:"center", gap:8, flexWrap:"wrap"};
  const periodLabelStyle = {fontSize:11, fontWeight:700, color:labelColor, minWidth:60};
  const singleRowStyle = {display:"grid", gridTemplateColumns:"minmax(0, 1fr) 110px", gap:8, width:"100%"};
  const rangeWrapStyle = {display:"flex", flexDirection:"column", gap:6, width:"100%"};
  const rangeRowStyle = {display:"grid", gridTemplateColumns:"60px minmax(0, 1fr) 110px", gap:8, alignItems:"center", width:"100%"};
  const set = changes => setPeriod(prev=>normalizePeriod({...prev, ...changes}));
  const modeBtn = active => ({
    border:"none",
    borderRadius:9,
    padding:"8px 10px",
    fontSize:12,
    fontWeight:800,
    cursor:"pointer",
    background: active ? (dark ? "#fff" : C.pri) : (dark ? "rgba(255,255,255,0.14)" : C.borderL),
    color: active ? (dark ? C.priD : "#fff") : (dark ? "rgba(255,255,255,0.82)" : C.textM),
  });
  const copyBtnStyle = {
    border:dark?"1px solid rgba(255,255,255,0.35)":`1px solid ${C.pri}`,
    background:dark?"rgba(255,255,255,0.16)":"#fff",
    color:dark?"#fff":C.pri,
    borderRadius:10,
    padding:"8px 10px",
    fontSize:12,
    fontWeight:800,
    cursor:"pointer",
  };
  const monthSelect = (value, onChange, label) => (
    <select aria-label={label} style={selectStyle} value={value} onChange={onChange}>
      {MONTHS.map((m,i)=><option key={m} value={i+1} style={optionStyle}>{m}</option>)}
    </select>
  );
  const yearSelect = (value, onChange, label) => (
    <select aria-label={label} style={selectStyle} value={value} onChange={onChange}>
      {years.map(y=><option key={y} value={y} style={optionStyle}>{y}</option>)}
    </select>
  );
  return (
    <div style={periodSelectorStyle}>
      <div style={periodHeaderStyle}>
        <span style={{...periodLabelStyle, minWidth:"auto"}}>Periode</span>
        <div style={{display:"flex", gap:4, background:dark?"rgba(255,255,255,0.12)":C.borderL, borderRadius:11, padding:2}}>
          <button type="button" onClick={()=>set({mode:"month"})} style={modeBtn(p.mode==="month")}>Bulanan</button>
          <button type="button" onClick={()=>set({mode:"range"})} style={modeBtn(p.mode==="range")}>Range</button>
        </div>
        {p.mode==="month" && onCopyBudget && (
          <button type="button" onClick={onCopyBudget} style={copyBtnStyle}>Copy Bulan Lalu</button>
        )}
      </div>
      {p.mode === "range" ? (
        <div style={rangeWrapStyle}>
          <div style={rangeRowStyle}>
            <span style={periodLabelStyle}>Dari</span>
            {monthSelect(p.startMonth, e=>set({startMonth:Number(e.target.value)}), "Bulan mulai")}
            {yearSelect(p.startYear, e=>set({startYear:Number(e.target.value)}), "Tahun mulai")}
          </div>
          <div style={rangeRowStyle}>
            <span style={periodLabelStyle}>Sampai</span>
            {monthSelect(p.endMonth, e=>set({endMonth:Number(e.target.value)}), "Bulan selesai")}
            {yearSelect(p.endYear, e=>set({endYear:Number(e.target.value)}), "Tahun selesai")}
          </div>
        </div>
      ) : (
        <div style={singleRowStyle}>
          {monthSelect(p.month, e=>set({month:Number(e.target.value)}), "Bulan")}
          {yearSelect(p.year, e=>set({year:Number(e.target.value)}), "Tahun")}
        </div>
      )}
    </div>
  );
};

// ─── LOGIN ───
const LoginScreen = ({onLogin}) => {
  const [email, setEmail] = useState("malik@amandigital.web.id");
  const [pass, setPass] = useState("");
  return (
    <div style={{minHeight:"100vh", background:`linear-gradient(180deg, ${C.pri} 0%, ${C.priD} 100%)`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"2rem"}}>
      <div style={{textAlign:"center", marginBottom:"2rem"}}>
        <div style={{width:80, height:80, background:"#fff", borderRadius:22, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 1rem", boxShadow:"0 8px 32px rgba(0,0,0,0.2)"}}>
          <Shield size={42} color={C.pri} strokeWidth={2.5}/>
        </div>
        <h1 style={{color:"#fff", fontSize:30, fontWeight:800, margin:0, letterSpacing:-0.5}}>AMAN Budget</h1>
        <p style={{color:"#bbf7d0", fontSize:13, margin:"8px 0 0", lineHeight:1.6}}>Atur uang keluarga, raih<br/>ketenangan finansial.</p>
      </div>

      <div style={{width:"100%", maxWidth:360, background:"#fff", borderRadius:24, padding:"1.5rem", boxShadow:"0 12px 48px rgba(0,0,0,0.18)"}}>
        <Btn onClick={()=>onLogin({name:"Malik", email})} primary style={{marginBottom:12, display:"flex", alignItems:"center", justifyContent:"center", gap:10}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#fff"/></svg>
          Masuk dengan Google
        </Btn>

        <div style={{display:"flex", alignItems:"center", gap:10, margin:"14px 0"}}>
          <div style={{flex:1, height:1, background:C.border}}/>
          <span style={{fontSize:11, color:C.textL, fontWeight:500}}>atau</span>
          <div style={{flex:1, height:1, background:C.border}}/>
        </div>

        <div style={{position:"relative", marginBottom:10}}>
          <Mail size={16} style={{position:"absolute", left:14, top:13, color:C.textL}}/>
          <input style={{...inp, paddingLeft:38}} placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}/>
        </div>
        <div style={{position:"relative", marginBottom:14}}>
          <Lock size={16} style={{position:"absolute", left:14, top:13, color:C.textL}}/>
          <input type="password" style={{...inp, paddingLeft:38}} placeholder="Password" value={pass} onChange={e=>setPass(e.target.value)}/>
        </div>
        <Btn onClick={()=>onLogin({name:"Malik", email})}>Masuk dengan Email</Btn>

        <p style={{textAlign:"center", fontSize:12, color:C.textM, marginTop:14, marginBottom:0}}>
          Belum punya akun? <span style={{color:C.pri, fontWeight:700, cursor:"pointer"}}>Daftar gratis</span>
        </p>
      </div>

      <div style={{display:"flex", gap:14, marginTop:24, flexWrap:"wrap", justifyContent:"center"}}>
        {[
          {icon:Shield, label:"100% Aman"},
          {icon:Sparkles, label:"AI Insight"},
          {icon:Users, label:"Family Sync"},
        ].map((it,i)=>(
          <div key={i} style={{display:"flex", alignItems:"center", gap:6, color:"#bbf7d0", fontSize:11, fontWeight:500}}>
            <it.icon size={13}/> {it.label}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── HEADER ───
const Header = ({title, subtitle, onBack, right, dark=true}) => (
  <div style={{background: dark?C.pri:"#fff", padding:"42px 16px 16px", color: dark?"#fff":C.text, borderBottom: dark?"none":`1px solid ${C.borderL}`}}>
    <div style={{display:"flex", alignItems:"center", gap:12}}>
      {onBack && (
        <button onClick={onBack} style={{background:"none", border:"none", padding:0, cursor:"pointer", color:"inherit", display:"flex"}}>
          <ChevronLeft size={26}/>
        </button>
      )}
      <div style={{flex:1}}>
        <p style={{fontSize:18, fontWeight:700, margin:0, letterSpacing:-0.3}}>{title}</p>
        {subtitle && <p style={{fontSize:12, margin:"2px 0 0", opacity:dark?0.8:0.6}}>{subtitle}</p>}
      </div>
      {right}
    </div>
  </div>
);

// ─── HOME ───
const HomeScreen = ({txs, period, setPeriod, years, onCopyBudget, setTab, setSubPage, setEditTx, setAddOpen, openUpgrade, user}) => {
  const s = calcSummary(txs);
  const grps = calcGroups(txs);
  const unpaidItems = txs.filter(x=>x.status==="belum_selesai").slice(0, 3);
  const recent = [...txs].sort((a,b)=>b.date.localeCompare(a.date)).slice(0, 4);
  const periodMode = normalizePeriod(period).mode;
  const periodLabel = formatPeriodLabel(period);

  return (
    <div style={{flex:1, overflowY:"auto", paddingBottom:92, background:C.bg}}>
      {/* Header with greeting */}
      <div style={{background:`linear-gradient(165deg, ${C.pri} 0%, ${C.priD} 100%)`, padding:"42px 16px 20px", color:"#fff", borderBottomLeftRadius:24, borderBottomRightRadius:24}}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16}}>
          <div>
            <p style={{fontSize:12, margin:0, opacity:0.85}}>Assalamu'alaikum,</p>
            <p style={{fontSize:18, fontWeight:700, margin:"2px 0 0"}}>{user.name} 👋</p>
          </div>
          <div style={{display:"flex", gap:8}}>
            <button onClick={openUpgrade} style={{background:`linear-gradient(135deg, ${C.gold}, #f59e0b)`, border:"none", borderRadius:20, padding:"6px 12px", cursor:"pointer", display:"flex", alignItems:"center", gap:5, color:"#fff", fontWeight:700, fontSize:11, boxShadow:"0 4px 12px rgba(217,119,6,0.4)"}}>
              <Crown size={13}/> Pro
            </button>
            <button style={{width:36, height:36, background:"rgba(255,255,255,0.15)", border:"none", borderRadius:10, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", position:"relative"}}>
              <Bell size={17}/>
              <span style={{position:"absolute", top:7, right:7, width:7, height:7, background:C.gold, borderRadius:"50%"}}/>
            </button>
          </div>
        </div>

        {/* Balance card */}
        <div>
          <p style={{fontSize:11, margin:"0 0 4px", opacity:0.85, fontWeight:500}}>SALDO AKTUAL · {periodLabel.toUpperCase()}</p>
          <p style={{fontSize:32, fontWeight:800, margin:0, letterSpacing:-1}}>{fmt(s.actBal)}</p>
          <div style={{display:"flex", gap:12, marginTop:12}}>
            <div style={{flex:1, background:"rgba(255,255,255,0.15)", borderRadius:12, padding:"10px 12px", backdropFilter:"blur(8px)"}}>
              <div style={{display:"flex", alignItems:"center", gap:6, marginBottom:2}}>
                <TrendingUp size={12}/>
                <span style={{fontSize:10, opacity:0.9, fontWeight:600}}>PEMASUKAN</span>
              </div>
              <p style={{fontSize:14, fontWeight:700, margin:0}}>{fmtS(s.totalIncome)}</p>
            </div>
            <div style={{flex:1, background:"rgba(255,255,255,0.15)", borderRadius:12, padding:"10px 12px"}}>
              <div style={{display:"flex", alignItems:"center", gap:6, marginBottom:2}}>
                <TrendingDown size={12}/>
                <span style={{fontSize:10, opacity:0.9, fontWeight:600}}>PENGELUARAN</span>
              </div>
              <p style={{fontSize:14, fontWeight:700, margin:0}}>{fmtS(s.paid)}</p>
            </div>
          </div>
          <PeriodPicker period={period} setPeriod={setPeriod} years={years} onCopyBudget={onCopyBudget} dark style={{marginTop:14}}/>
        </div>
      </div>

      <div style={{padding:"14px", display:"flex", flexDirection:"column", gap:12}}>

        {/* Quick actions */}
        <div style={{display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:8}}>
          {[
            {icon:ArrowRightLeft, label:"Transfer", color:C.blue, action:()=>setSubPage("transfer")},
            {icon:Calculator, label:"Zakat", color:C.pri, action:()=>setSubPage("zakat")},
            {icon:PiggyBank, label:"Goals", color:C.gold, action:()=>{setTab("goals-tab"); setSubPage(null);}},
            {icon:FileDown, label:"Export", color:"#8b5cf6", action:openUpgrade},
          ].map((q,i)=>(
            <button key={i} onClick={q.action} style={{background:"#fff", border:`1px solid ${C.borderL}`, borderRadius:14, padding:"10px 4px", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:4}}>
              <div style={{width:36, height:36, borderRadius:10, background:q.color+"15", display:"flex", alignItems:"center", justifyContent:"center"}}>
                <q.icon size={18} color={q.color}/>
              </div>
              <span style={{fontSize:10, fontWeight:600, color:C.textM}}>{q.label}</span>
            </button>
          ))}
        </div>

        {/* Progress card */}
        <div style={{...card, background:`linear-gradient(135deg, #fff 0%, ${C.priBg} 100%)`}}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8}}>
            <div>
              <p style={{fontSize:11, color:C.textM, margin:0, fontWeight:600, letterSpacing:0.3}}>{periodMode==="range"?"PROGRESS PERIODE":"PROGRESS BULAN INI"}</p>
              <p style={{fontSize:22, fontWeight:800, color:C.priD, margin:"2px 0 0"}}>{s.prog}%</p>
            </div>
            <div style={{textAlign:"right"}}>
              <p style={{fontSize:11, color:C.textM, margin:0, fontWeight:600}}>SISA AMAN</p>
              <p style={{fontSize:16, fontWeight:800, color:s.safeBal<0?C.red:C.pri, margin:"2px 0 0"}}>{fmtS(s.safeBal)}</p>
            </div>
          </div>
          <div style={{background:"#fff", borderRadius:10, height:10, overflow:"hidden", border:`1px solid ${C.priL}`}}>
            <div style={{background:`linear-gradient(90deg, ${C.pri}, ${C.priD})`, borderRadius:10, height:"100%", width:`${Math.min(s.prog, 100)}%`, transition:"width .5s"}}/>
          </div>
          <p style={{fontSize:11, color:C.textM, margin:"8px 0 0", textAlign:"center"}}>
            {fmt(s.paid)} dari {fmt(s.estExp)} target
          </p>
        </div>

        {/* Unpaid alert */}
        {unpaidItems.length > 0 && (
          <div style={{...card, border:`1.5px solid ${C.redL}`, background:"#fffafa"}}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10}}>
              <div style={{display:"flex", alignItems:"center", gap:8}}>
                <div style={{width:32, height:32, background:C.redL, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center"}}>
                  <Clock size={16} color={C.red}/>
                </div>
                <div>
                  <p style={{fontSize:13, fontWeight:700, color:C.text, margin:0}}>Belum Dibayar</p>
                  <p style={{fontSize:11, color:C.textM, margin:0}}>{unpaidItems.length} tagihan menunggu</p>
                </div>
              </div>
              <span style={{fontSize:14, fontWeight:800, color:C.red}}>{fmtS(s.unpaid)}</span>
            </div>
            {unpaidItems.map(tx=>(
              <div key={tx.id} onClick={()=>{setEditTx(tx); setAddOpen(true);}} style={{display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderTop:`1px solid ${C.borderL}`, cursor:"pointer"}}>
                <div>
                  <p style={{fontSize:13, fontWeight:600, color:C.text, margin:0}}>{tx.desc}</p>
                  <p style={{fontSize:10, color:C.textL, margin:0}}>{GROUPS[tx.grp]?.label}</p>
                </div>
                <span style={{fontSize:13, fontWeight:700, color:C.red}}>{fmtS(tx.amt)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Group breakdown */}
        <div style={card}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12}}>
            <p style={{fontSize:13, fontWeight:700, color:C.text, margin:0}}>Rekap per Grup</p>
            <button onClick={()=>setSubPage("transfer")} style={{background:"none", border:"none", color:C.pri, fontSize:11, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:2}}>
              Detail <ChevronRight size={12}/>
            </button>
          </div>
          {Object.entries(grps).slice(0,5).map(([g,v])=>(
            <div key={g} style={{display:"flex", alignItems:"center", gap:10, marginBottom:10}}>
              <div style={{width:8, height:8, borderRadius:"50%", background:GROUPS[g]?.color}}/>
              <span style={{fontSize:12, color:C.text, fontWeight:600, flex:1}}>{GROUPS[g]?.label}</span>
              <div style={{width:64, background:C.borderL, borderRadius:6, height:5, overflow:"hidden"}}>
                <div style={{background:GROUPS[g]?.color, height:"100%", width:v.budget>0?`${Math.min(v.paid/v.budget*100,100)}%`:"0%"}}/>
              </div>
              <span style={{fontSize:11, fontWeight:700, color:C.text, minWidth:60, textAlign:"right"}}>{fmtS(v.budget)}</span>
            </div>
          ))}
        </div>

        {/* Recent transactions */}
        <div style={card}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8}}>
            <p style={{fontSize:13, fontWeight:700, color:C.text, margin:0}}>Transaksi Terbaru</p>
            <button onClick={()=>setSubPage("tx-list")} style={{background:"none", border:"none", color:C.pri, fontSize:11, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:2}}>
              Lihat semua <ChevronRight size={12}/>
            </button>
          </div>
          {recent.map(tx=>(
            <div key={tx.id} onClick={()=>{setEditTx(tx); setAddOpen(true);}} style={{display:"flex", alignItems:"center", gap:10, padding:"10px 0", borderTop:`1px solid ${C.borderL}`, cursor:"pointer"}}>
              <div style={{width:36, height:36, borderRadius:10, background: tx.type==="income"?C.priL:GROUPS[tx.grp]?.color+"15", display:"flex", alignItems:"center", justifyContent:"center"}}>
                {tx.type==="income" ? <TrendingUp size={16} color={C.pri}/> : <Receipt size={16} color={GROUPS[tx.grp]?.color}/>}
              </div>
              <div style={{flex:1, minWidth:0}}>
                <p style={{fontSize:13, fontWeight:600, color:C.text, margin:0, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{tx.desc}</p>
                <p style={{fontSize:10, color:C.textL, margin:0}}>{tx.date.slice(8,10)}/{tx.date.slice(5,7)} · {tx.type==="income"?"Pemasukan":GROUPS[tx.grp]?.label}</p>
              </div>
              <span style={{fontSize:13, fontWeight:700, color: tx.type==="income"?C.pri:C.text}}>{tx.type==="income"?"+":"−"}{fmtS(tx.amt)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── REPORTS ───
const ReportsScreen = ({txs, period, setPeriod, years, openUpgrade}) => {
  const s = calcSummary(txs);
  const grps = calcGroups(txs);
  const pieData = Object.entries(grps).map(([k,v])=>({name:GROUPS[k]?.label, value:v.budget, color:GROUPS[k]?.color}));
  const weekData = calcWeekData(txs);
  const periodLabel = formatPeriodLabel(period);

  const top5 = txs.filter(x=>x.type==="expense"&&x.status!=="batal").sort((a,b)=>b.amt-a.amt).slice(0,5);

  return (
    <div style={{flex:1, overflowY:"auto", paddingBottom:92, background:C.bg}}>
      <Header title="Laporan" subtitle={periodLabel}/>

      <div style={{padding:"14px", display:"flex", flexDirection:"column", gap:12}}>
        <div style={card}>
          <PeriodPicker period={period} setPeriod={setPeriod} years={years}/>
        </div>

        {/* Stats summary */}
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10}}>
          <div style={{...card, background:`linear-gradient(135deg, ${C.priBg}, #fff)`}}>
            <p style={{fontSize:10, color:C.textM, margin:0, fontWeight:600, letterSpacing:0.3}}>PEMASUKAN</p>
            <p style={{fontSize:17, fontWeight:800, color:C.pri, margin:"4px 0"}}>{fmtS(s.totalIncome)}</p>
            <div style={{display:"flex", alignItems:"center", gap:3, fontSize:10, color:C.pri, fontWeight:600}}>
              <TrendingUp size={11}/> +12% vs bulan lalu
            </div>
          </div>
          <div style={{...card, background:`linear-gradient(135deg, #fef2f2, #fff)`}}>
            <p style={{fontSize:10, color:C.textM, margin:0, fontWeight:600, letterSpacing:0.3}}>PENGELUARAN</p>
            <p style={{fontSize:17, fontWeight:800, color:C.red, margin:"4px 0"}}>{fmtS(s.paid)}</p>
            <div style={{display:"flex", alignItems:"center", gap:3, fontSize:10, color:C.red, fontWeight:600}}>
              <TrendingUp size={11}/> +5% vs bulan lalu
            </div>
          </div>
        </div>

        {/* Pie chart */}
        <div style={card}>
          <p style={{fontSize:13, fontWeight:700, color:C.text, margin:"0 0 10px"}}>Distribusi Pengeluaran</p>
          <div style={{display:"flex", alignItems:"center", gap:10}}>
            <div style={{width:130, height:130}}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={pieData} dataKey="value" innerRadius={38} outerRadius={62} paddingAngle={2}>
                    {pieData.map((d,i)=><Cell key={i} fill={d.color}/>)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{flex:1, display:"flex", flexDirection:"column", gap:6}}>
              {pieData.slice(0,5).map((d,i)=>(
                <div key={i} style={{display:"flex", alignItems:"center", gap:6, fontSize:11}}>
                  <div style={{width:8, height:8, borderRadius:"50%", background:d.color}}/>
                  <span style={{flex:1, color:C.textM, fontWeight:600}}>{d.name}</span>
                  <span style={{color:C.text, fontWeight:700}}>{Math.round(d.value/s.estExp*100)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bar chart - weekly */}
        <div style={card}>
          <p style={{fontSize:13, fontWeight:700, color:C.text, margin:"0 0 10px"}}>Arus Kas Mingguan</p>
          <div style={{height:160}}>
            <ResponsiveContainer>
              <BarChart data={weekData} barGap={2}>
                <XAxis dataKey="w" tick={{fontSize:11, fill:C.textM}} axisLine={false} tickLine={false}/>
                <YAxis hide/>
                <Tooltip formatter={v=>fmtS(v)} contentStyle={{borderRadius:10, border:"none", boxShadow:"0 4px 16px rgba(0,0,0,0.1)", fontSize:12}}/>
                <Bar dataKey="in" fill={C.pri} radius={[6,6,0,0]} name="Masuk"/>
                <Bar dataKey="out" fill={C.red} radius={[6,6,0,0]} name="Keluar"/>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{display:"flex", gap:14, justifyContent:"center", marginTop:8}}>
            <div style={{display:"flex", alignItems:"center", gap:5, fontSize:11, color:C.textM}}>
              <div style={{width:10, height:10, background:C.pri, borderRadius:3}}/> Masuk
            </div>
            <div style={{display:"flex", alignItems:"center", gap:5, fontSize:11, color:C.textM}}>
              <div style={{width:10, height:10, background:C.red, borderRadius:3}}/> Keluar
            </div>
          </div>
        </div>

        {/* AI Insight - Pro feature teaser */}
        <div style={{...card, background:`linear-gradient(135deg, ${C.goldL} 0%, #fff 100%)`, border:`1px solid ${C.gold}33`}}>
          <div style={{display:"flex", alignItems:"flex-start", gap:10}}>
            <div style={{width:36, height:36, background:`linear-gradient(135deg, ${C.gold}, #f59e0b)`, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>
              <Sparkles size={18} color="#fff"/>
            </div>
            <div style={{flex:1}}>
              <div style={{display:"flex", alignItems:"center", gap:6, marginBottom:4}}>
                <p style={{fontSize:13, fontWeight:700, color:C.text, margin:0}}>AI Insight</p>
                <Badge bg={C.gold} color="#fff">PRO</Badge>
              </div>
              <p style={{fontSize:12, color:C.textM, margin:"0 0 8px", lineHeight:1.5}}>
                Pengeluaran kategori <b>Belanja</b> naik 23% bulan ini. Pertimbangkan untuk mengurangi pembelian impulsif di minggu ke-2.
              </p>
              <button onClick={openUpgrade} style={{background:"none", border:"none", color:C.goldD, fontSize:11, fontWeight:700, padding:0, cursor:"pointer", display:"flex", alignItems:"center", gap:4}}>
                Aktifkan Pro <ChevronRight size={12}/>
              </button>
            </div>
          </div>
        </div>

        {/* Top spending */}
        <div style={card}>
          <p style={{fontSize:13, fontWeight:700, color:C.text, margin:"0 0 10px"}}>Pengeluaran Terbesar</p>
          {top5.map((tx,i)=>(
            <div key={tx.id} style={{display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderTop:i>0?`1px solid ${C.borderL}`:"none"}}>
              <div style={{width:24, height:24, borderRadius:8, background:C.priL, color:C.priD, fontSize:11, fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center"}}>{i+1}</div>
              <div style={{flex:1, minWidth:0}}>
                <p style={{fontSize:12, fontWeight:600, color:C.text, margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{tx.desc}</p>
                <p style={{fontSize:10, color:C.textL, margin:0}}>{GROUPS[tx.grp]?.label}</p>
              </div>
              <span style={{fontSize:13, fontWeight:700, color:C.text}}>{fmtS(tx.amt)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── GOALS ───
const GoalsScreen = ({goals, openUpgrade}) => {
  const totalTarget = goals.reduce((s,g)=>s+g.target, 0);
  const totalSaved = goals.reduce((s,g)=>s+g.saved, 0);

  const iconMap = {plane:Plane, grad:GraduationCap, shield:Shield};

  return (
    <div style={{flex:1, overflowY:"auto", paddingBottom:92, background:C.bg}}>
      <Header title="Goals" subtitle="Target tabungan keluarga"/>

      <div style={{padding:"14px", display:"flex", flexDirection:"column", gap:12}}>
        {/* Summary */}
        <div style={{background:`linear-gradient(135deg, ${C.pri}, ${C.priD})`, borderRadius:18, padding:"16px", color:"#fff"}}>
          <p style={{fontSize:11, margin:0, opacity:0.85, fontWeight:600, letterSpacing:0.3}}>TOTAL TERKUMPUL</p>
          <p style={{fontSize:26, fontWeight:800, margin:"4px 0 8px", letterSpacing:-0.5}}>{fmt(totalSaved)}</p>
          <div style={{background:"rgba(255,255,255,0.2)", borderRadius:8, height:8, overflow:"hidden"}}>
            <div style={{background:"#fff", height:"100%", width:`${totalSaved/totalTarget*100}%`}}/>
          </div>
          <p style={{fontSize:11, margin:"6px 0 0", opacity:0.85}}>{Math.round(totalSaved/totalTarget*100)}% dari target {fmt(totalTarget)}</p>
        </div>

        {/* Goals list */}
        {goals.map(g=>{
          const pct = Math.round(g.saved/g.target*100);
          const Icon = iconMap[g.icon];
          return (
            <div key={g.id} style={{...card, padding:0, overflow:"hidden"}}>
              <div style={{padding:"14px 16px"}}>
                <div style={{display:"flex", alignItems:"center", gap:12, marginBottom:10}}>
                  <div style={{width:44, height:44, background:g.color+"15", borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center"}}>
                    <Icon size={22} color={g.color}/>
                  </div>
                  <div style={{flex:1}}>
                    <p style={{fontSize:14, fontWeight:700, color:C.text, margin:0}}>{g.name}</p>
                    <p style={{fontSize:11, color:C.textM, margin:0}}>Target: {g.deadline}</p>
                  </div>
                  <span style={{fontSize:16, fontWeight:800, color:g.color}}>{pct}%</span>
                </div>
                <div style={{background:C.borderL, borderRadius:8, height:8, overflow:"hidden", marginBottom:8}}>
                  <div style={{background:g.color, height:"100%", width:`${pct}%`, transition:"width .5s"}}/>
                </div>
                <div style={{display:"flex", justifyContent:"space-between", fontSize:11}}>
                  <span style={{color:C.textM}}>Terkumpul: <b style={{color:C.text}}>{fmtS(g.saved)}</b></span>
                  <span style={{color:C.textM}}>Sisa: <b style={{color:C.text}}>{fmtS(g.target-g.saved)}</b></span>
                </div>
              </div>
              <button style={{width:"100%", padding:"10px", background:g.color+"10", border:"none", color:g.color, fontSize:12, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:5}}>
                <Plus size={14}/> Tambah Tabungan
              </button>
            </div>
          );
        })}

        {/* Upgrade prompt */}
        <button onClick={openUpgrade} style={{...card, border:`2px dashed ${C.gold}66`, background:C.goldL+"40", display:"flex", alignItems:"center", gap:10, cursor:"pointer", textAlign:"left"}}>
          <Crown size={22} color={C.gold}/>
          <div style={{flex:1}}>
            <p style={{fontSize:13, fontWeight:700, color:C.text, margin:0}}>Tambah Goals Tanpa Batas</p>
            <p style={{fontSize:11, color:C.textM, margin:0}}>Free hanya 3 goals · Upgrade ke Pro untuk unlimited</p>
          </div>
          <ChevronRight size={16} color={C.gold}/>
        </button>
      </div>
    </div>
  );
};

// ─── TRANSFER PLANNER ───
const TransferScreen = ({txs, setSubPage}) => {
  const grps = calcGroups(txs);
  const total = Object.values(grps).reduce((s,v)=>s+v.budget, 0);
  const paidTotal = Object.values(grps).reduce((s,v)=>s+v.paid, 0);

  return (
    <div style={{flex:1, overflowY:"auto", paddingBottom:92, background:C.bg}}>
      <Header title="Transfer Planner" subtitle="Alokasi per anggota keluarga" onBack={()=>setSubPage(null)}/>

      <div style={{padding:"14px", display:"flex", flexDirection:"column", gap:12}}>
        <div style={{background:`linear-gradient(135deg, ${C.blue}, #1d4ed8)`, borderRadius:18, padding:"16px", color:"#fff"}}>
          <p style={{fontSize:11, margin:0, opacity:0.85, fontWeight:600, letterSpacing:0.3}}>TOTAL TRANSFER BULAN INI</p>
          <p style={{fontSize:26, fontWeight:800, margin:"4px 0 4px", letterSpacing:-0.5}}>{fmt(total)}</p>
          <div style={{display:"flex", gap:14, fontSize:11, opacity:0.9, marginTop:8}}>
            <span><Check size={11} style={{display:"inline", verticalAlign:-1}}/> Terkirim: <b>{fmtS(paidTotal)}</b></span>
            <span><Clock size={11} style={{display:"inline", verticalAlign:-1}}/> Sisa: <b>{fmtS(total-paidTotal)}</b></span>
          </div>
        </div>

        {Object.entries(grps).map(([g,v])=>{
          const pct = v.budget>0 ? Math.round(v.paid/v.budget*100) : 0;
          return (
            <div key={g} style={card}>
              <div style={{display:"flex", alignItems:"center", gap:12, marginBottom:10}}>
                <div style={{width:42, height:42, background:GROUPS[g]?.color+"15", borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center"}}>
                  <Users size={20} color={GROUPS[g]?.color}/>
                </div>
                <div style={{flex:1}}>
                  <p style={{fontSize:14, fontWeight:700, color:C.text, margin:0}}>{GROUPS[g]?.label}</p>
                  <p style={{fontSize:11, color:C.textM, margin:0}}>{fmtS(v.paid)} dari {fmtS(v.budget)}</p>
                </div>
                {v.unpaid > 0 ? (
                  <button style={{background:GROUPS[g]?.color, border:"none", borderRadius:10, padding:"7px 12px", color:"#fff", fontSize:11, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:4}}>
                    <Send size={11}/> Transfer
                  </button>
                ) : (
                  <Badge bg={C.priL} color={C.priD}>LUNAS</Badge>
                )}
              </div>
              <div style={{background:C.borderL, borderRadius:6, height:6, overflow:"hidden", marginBottom:8}}>
                <div style={{background:GROUPS[g]?.color, height:"100%", width:`${pct}%`}}/>
              </div>
              <div style={{display:"flex", justifyContent:"space-between", fontSize:11}}>
                <span style={{color:C.textM}}>Sudah: <b style={{color:C.pri}}>{fmtS(v.paid)}</b></span>
                {v.unpaid > 0 && <span style={{color:C.textM}}>Belum: <b style={{color:C.red}}>{fmtS(v.unpaid)}</b></span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── ZAKAT CALCULATOR ───
const ZakatScreen = ({setSubPage}) => {
  const [income, setIncome] = useState("18500000");
  const num = Number(income) || 0;
  const zakat = num * 0.025;
  const nisab = 7500000; // approx
  const wajib = num >= nisab;

  return (
    <div style={{flex:1, overflowY:"auto", paddingBottom:92, background:C.bg}}>
      <Header title="Kalkulator Zakat" subtitle="Zakat penghasilan 2.5%" onBack={()=>setSubPage(null)}/>

      <div style={{padding:"14px", display:"flex", flexDirection:"column", gap:14}}>
        <div style={card}>
          <label style={lbl}>Penghasilan Bulanan (Rp)</label>
          <input type="number" style={{...inp, fontSize:18, fontWeight:700, color:C.pri}} value={income} onChange={e=>setIncome(e.target.value)}/>
          <p style={{fontSize:11, color:C.textM, margin:"6px 0 0"}}>Gaji pokok + tunjangan + bonus + pemasukan lain</p>
        </div>

        <div style={{background:`linear-gradient(135deg, ${C.pri}, ${C.priD})`, borderRadius:18, padding:"20px 16px", color:"#fff", textAlign:"center"}}>
          <p style={{fontSize:11, margin:0, opacity:0.85, fontWeight:600, letterSpacing:0.3}}>ZAKAT YANG WAJIB DIKELUARKAN</p>
          <p style={{fontSize:32, fontWeight:800, margin:"6px 0", letterSpacing:-0.8}}>{fmt(zakat)}</p>
          {wajib ? (
            <div style={{display:"inline-flex", alignItems:"center", gap:6, background:"rgba(255,255,255,0.2)", borderRadius:20, padding:"4px 12px", fontSize:11, fontWeight:700}}>
              <CheckCircle2 size={13}/> Sudah mencapai nisab
            </div>
          ) : (
            <div style={{display:"inline-flex", alignItems:"center", gap:6, background:"rgba(255,255,255,0.2)", borderRadius:20, padding:"4px 12px", fontSize:11, fontWeight:700}}>
              Di bawah nisab
            </div>
          )}
        </div>

        <div style={card}>
          <p style={{fontSize:13, fontWeight:700, color:C.text, margin:"0 0 10px"}}>Detail Perhitungan</p>
          {[
            ["Penghasilan", fmt(num)],
            ["Nisab (setara 85gr emas)", fmt(nisab)],
            ["Tarif zakat", "2.5%"],
            ["Total zakat per bulan", fmt(zakat), C.pri, true],
            ["Total zakat per tahun", fmt(zakat*12), C.gold, true],
          ].map(([k,v,c,b],i)=>(
            <div key={i} style={{display:"flex", justifyContent:"space-between", padding:"8px 0", borderTop: i>0?`1px solid ${C.borderL}`:"none"}}>
              <span style={{fontSize:12, color:C.textM}}>{k}</span>
              <span style={{fontSize:13, fontWeight:b?800:600, color:c||C.text}}>{v}</span>
            </div>
          ))}
        </div>

        <Btn primary>
          <span style={{display:"flex", alignItems:"center", justifyContent:"center", gap:6}}>
            <Plus size={16}/> Tambahkan ke Budget Bulan Ini
          </span>
        </Btn>
      </div>
    </div>
  );
};

// ─── TX LIST ───
const TxListScreen = ({txs, allTxs, period, setPeriod, years, onCopyBudget, onDeletePeriod, setSubPage, setEditTx, setAddOpen, onDelete, onDone}) => {
  const [fS, setFS] = useState("all");
  const [fG] = useState("all");
  const [q, setQ] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const periodLabel = formatPeriodLabel(period);

  const filtered = useMemo(()=>txs.filter(tx=>{
    if(fS!=="all"&&tx.status!==fS) return false;
    if(fG!=="all"&&tx.grp!==fG) return false;
    if(q&&!tx.desc.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }).sort((a,b)=>b.date.localeCompare(a.date)),[txs,fS,fG,q]);

  return (
    <div style={{flex:1, overflowY:"auto", paddingBottom:92, background:C.bg}}>
      <div style={{background:C.pri, padding:"42px 16px 16px", color:"#fff"}}>
        <div style={{display:"flex", alignItems:"center", gap:12, marginBottom:14}}>
          <button onClick={()=>setSubPage(null)} style={{background:"none", border:"none", padding:0, cursor:"pointer", color:"#fff", display:"flex"}}>
            <ChevronLeft size={26}/>
          </button>
          <div style={{flex:1}}>
            <p style={{fontSize:18, fontWeight:700, margin:0}}>Transaksi</p>
            <p style={{fontSize:12, margin:"2px 0 0", opacity:0.8}}>{periodLabel}</p>
          </div>
          <button style={{background:"rgba(255,255,255,0.2)", border:"none", borderRadius:10, padding:8, cursor:"pointer", color:"#fff", display:"flex"}}>
            <Filter size={16}/>
          </button>
        </div>
        <div style={{position:"relative"}}>
          <Search size={15} style={{position:"absolute", left:12, top:11, color:"rgba(255,255,255,0.7)"}}/>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Cari transaksi..."
            style={{width:"100%", background:"rgba(255,255,255,0.15)", border:"none", borderRadius:12, padding:"10px 14px 10px 36px", color:"#fff", fontSize:13, outline:"none", boxSizing:"border-box"}}/>
        </div>
        <PeriodPicker period={period} setPeriod={setPeriod} years={years} onCopyBudget={onCopyBudget} dark style={{marginTop:10}}/>
        <div style={{display:"flex", justifyContent:"flex-end", marginTop:8}}>
          <button onClick={()=>setDeleteOpen(true)} style={{background:"rgba(255,255,255,0.16)", color:"#fff", border:"1px solid rgba(255,255,255,0.35)", borderRadius:10, padding:"8px 10px", fontSize:12, fontWeight:800, cursor:"pointer", display:"flex", alignItems:"center", gap:6}}>
            <Trash2 size={13}/> Hapus Periode
          </button>
        </div>
      </div>

      <div style={{background:"#fff", padding:"10px 14px", borderBottom:`1px solid ${C.borderL}`, display:"flex", flexDirection:"column", gap:6}}>
        <div style={{display:"flex", gap:6, overflowX:"auto", paddingBottom:2}}>
          <Pill active={fS==="all"} onClick={()=>setFS("all")}>Semua</Pill>
          {Object.entries(STATUS).map(([v,s])=><Pill key={v} active={fS===v} onClick={()=>setFS(v)}>{s.label}</Pill>)}
        </div>
      </div>

      <div style={{padding:"12px 14px"}}>
        {filtered.length===0 && <p style={{textAlign:"center", color:C.textL, fontSize:13, padding:"3rem 0"}}>Tidak ada transaksi</p>}
        {filtered.length > 0 && (
          <div style={{background:"#fff", border:`1px solid ${C.borderL}`, borderRadius:12, overflow:"hidden"}}>
            {filtered.map((tx,i)=>(
              <div key={tx.id} style={{display:"grid", gridTemplateColumns:"42px minmax(0, 1fr) auto", gap:9, alignItems:"center", padding:"9px 10px", borderBottom:i<filtered.length-1?`1px solid ${C.borderL}`:"none", background:"#fff"}}>
                <div style={{fontSize:11, fontWeight:800, color:C.textM, lineHeight:1.2, textAlign:"center"}}>{formatShortDate(tx.date)}</div>
                <div style={{minWidth:0}}>
                  <p style={{fontSize:13, fontWeight:700, color:C.text, margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", lineHeight:1.25}}>{tx.desc}</p>
                  <div style={{display:"flex", alignItems:"center", gap:5, flexWrap:"wrap", marginTop:3}}>
                    <span style={{fontSize:10, color:C.textL, fontWeight:600}}>
                      {tx.type==="income"?"Pemasukan":`${tx.cat || "Pengeluaran"} · ${GROUPS[tx.grp]?.label || "Lain-lain"}`} · {tx.pay}
                    </span>
                    <Badge bg={STATUS[tx.status]?.bg} color={STATUS[tx.status]?.color}>{STATUS[tx.status]?.label}</Badge>
                  </div>
                </div>
                <div style={{display:"flex", flexDirection:"column", alignItems:"flex-end", gap:5}}>
                  <p style={{fontSize:13, fontWeight:800, color:tx.type==="income"?C.pri:C.red, margin:0, whiteSpace:"nowrap"}}>
                    {tx.type==="income"?"+":"-"}{fmtS(tx.amt)}
                  </p>
                  <div style={{display:"flex", gap:4, justifyContent:"flex-end", flexWrap:"wrap"}}>
                    {tx.type==="income" && tx.status==="estimasi" && (
                      <button onClick={()=>onDone(tx.id)} style={{background:C.priL, color:C.priD, border:"none", borderRadius:7, padding:"4px 6px", fontSize:10, fontWeight:800, cursor:"pointer"}}>Diterima</button>
                    )}
                    {tx.status==="belum_selesai" && (
                      <button onClick={()=>onDone(tx.id)} style={{background:C.priL, color:C.priD, border:"none", borderRadius:7, padding:"4px 6px", fontSize:10, fontWeight:800, cursor:"pointer"}}>Lunas</button>
                    )}
                    <button onClick={()=>{setEditTx(tx); setAddOpen(true);}} style={{background:C.borderL, color:C.textM, border:"none", borderRadius:7, padding:"4px 6px", fontSize:10, fontWeight:800, cursor:"pointer"}}>Edit</button>
                    <button onClick={()=>onDelete(tx.id)} aria-label="Hapus transaksi" style={{background:"#fef2f2", color:C.red, border:"none", borderRadius:7, padding:"4px 6px", cursor:"pointer", display:"flex"}}>
                      <Trash2 size={12}/>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {deleteOpen && <DeletePeriodSheet txs={allTxs} initialPeriod={period} onDelete={onDeletePeriod} onClose={()=>setDeleteOpen(false)}/>}
    </div>
  );
};

const DeletePeriodSheet = ({txs, initialPeriod, onDelete, onClose}) => {
  const [deletePeriod, setDeletePeriod] = useState(() => normalizePeriod(initialPeriod));
  const years = useMemo(()=>getPeriodYears(txs, deletePeriod), [txs, deletePeriod]);
  const result = useMemo(()=>deleteTransactionsByPeriod(txs, deletePeriod), [txs, deletePeriod]);
  const count = result.deleted.length;
  const label = getDeletePeriodLabel(deletePeriod);

  const handleDelete = () => {
    if(count===0) {
      alert(`Tidak ada transaksi pada ${label}.`);
      return;
    }
    if(window.confirm(`Hapus ${count} transaksi pada ${label}?`)) {
      onDelete(deletePeriod);
      onClose();
    }
  };

  return (
    <div style={{position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:100, display:"flex", alignItems:"flex-end", justifyContent:"center"}}>
      <div style={{width:"100%", maxWidth:430, background:"#fff", borderTopLeftRadius:24, borderTopRightRadius:24, maxHeight:"90vh", overflowY:"auto", animation:"slideUp 0.3s"}}>
        <div style={{padding:"16px", borderBottom:`1px solid ${C.borderL}`, position:"sticky", top:0, background:"#fff", zIndex:2, display:"flex", alignItems:"center", justifyContent:"space-between"}}>
          <p style={{fontSize:16, fontWeight:800, color:C.text, margin:0}}>Hapus Transaksi Periode</p>
          <button onClick={onClose} style={{background:C.borderL, border:"none", borderRadius:10, padding:8, cursor:"pointer", display:"flex"}}>
            <X size={16} color={C.textM}/>
          </button>
        </div>

        <div style={{padding:"14px", display:"flex", flexDirection:"column", gap:12}}>
          <div style={card}>
            <PeriodPicker period={deletePeriod} setPeriod={setDeletePeriod} years={years}/>
          </div>

          <div style={{background:"#fef2f2", border:`1px solid ${C.redL}`, borderRadius:12, padding:"12px 14px"}}>
            <p style={{fontSize:12, color:C.textM, margin:"0 0 4px", fontWeight:700}}>Akan dihapus</p>
            <p style={{fontSize:16, color:C.red, margin:0, fontWeight:800}}>{count} transaksi</p>
            <p style={{fontSize:11, color:C.textM, margin:"4px 0 0", lineHeight:1.4}}>{label}</p>
          </div>

          <div style={{display:"flex", gap:8}}>
            <button onClick={onClose} style={{flex:1, padding:"13px", borderRadius:12, border:`1px solid ${C.border}`, background:"#fff", color:C.textM, fontSize:13, fontWeight:800, cursor:"pointer"}}>
              Batal
            </button>
            <button onClick={handleDelete} style={{flex:1, padding:"13px", borderRadius:12, border:"none", background:C.red, color:"#fff", fontSize:13, fontWeight:800, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6}}>
              <Trash2 size={15}/> Hapus
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── MORE ───
const MoreScreen = ({setSubPage, openUpgrade, onLogout}) => {
  const items = [
    {icon:ArrowRightLeft, label:"Transfer Planner", desc:"Alokasi per anggota keluarga", action:()=>setSubPage("transfer"), color:C.blue},
    {icon:Calculator, label:"Kalkulator Zakat", desc:"Hitung zakat penghasilan 2.5%", action:()=>setSubPage("zakat"), color:C.pri},
    {icon:Users, label:"Family Sync", desc:"Sync data dengan pasangan", pro:true, color:"#ec4899"},
    {icon:Bell, label:"Reminder Tagihan", desc:"Notif jatuh tempo otomatis", pro:true, color:C.gold},
    {icon:FileDown, label:"Export Laporan", desc:"PDF & Excel untuk arsip", pro:true, color:"#8b5cf6"},
    {icon:Receipt, label:"OCR Struk", desc:"Scan struk otomatis", pro:true, color:"#06b6d4"},
  ];

  return (
    <div style={{flex:1, overflowY:"auto", paddingBottom:92, background:C.bg}}>
      <Header title="Lainnya"/>

      <div style={{padding:"14px", display:"flex", flexDirection:"column", gap:12}}>
        {/* Profile card */}
        <div style={card}>
          <div style={{display:"flex", alignItems:"center", gap:12}}>
            <div style={{width:54, height:54, background:`linear-gradient(135deg, ${C.pri}, ${C.priD})`, borderRadius:16, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:22, fontWeight:800}}>M</div>
            <div style={{flex:1}}>
              <p style={{fontSize:15, fontWeight:700, color:C.text, margin:0}}>Malik</p>
              <p style={{fontSize:11, color:C.textM, margin:"2px 0"}}>malik@amandigital.web.id</p>
              <Badge bg={C.borderL} color={C.textM}>FREE PLAN</Badge>
            </div>
            <button style={{background:"none", border:"none", cursor:"pointer", color:C.textM, padding:0}}>
              <ChevronRight size={20}/>
            </button>
          </div>
        </div>

        {/* Upgrade banner */}
        <button onClick={openUpgrade} style={{background:`linear-gradient(135deg, ${C.gold}, #b45309)`, border:"none", borderRadius:18, padding:"16px", cursor:"pointer", color:"#fff", display:"flex", alignItems:"center", gap:12, textAlign:"left", boxShadow:"0 6px 20px rgba(217,119,6,0.3)"}}>
          <div style={{width:44, height:44, background:"rgba(255,255,255,0.2)", borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>
            <Crown size={24} color="#fff"/>
          </div>
          <div style={{flex:1}}>
            <p style={{fontSize:15, fontWeight:800, margin:0}}>Upgrade ke Pro</p>
            <p style={{fontSize:11, opacity:0.9, margin:"2px 0 0"}}>Buka semua fitur premium · Mulai Rp 29rb/bulan</p>
          </div>
          <ChevronRight size={20}/>
        </button>

        {/* Features list */}
        <div style={{...card, padding:0}}>
          {items.map((it, i) => (
            <button key={i} onClick={it.action || openUpgrade} style={{width:"100%", padding:"14px 16px", background:"none", border:"none", borderTop: i>0?`1px solid ${C.borderL}`:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:12, textAlign:"left"}}>
              <div style={{width:38, height:38, borderRadius:11, background:it.color+"15", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>
                <it.icon size={18} color={it.color}/>
              </div>
              <div style={{flex:1}}>
                <div style={{display:"flex", alignItems:"center", gap:6}}>
                  <p style={{fontSize:13, fontWeight:700, color:C.text, margin:0}}>{it.label}</p>
                  {it.pro && <Badge bg={C.goldL} color={C.goldD}>PRO</Badge>}
                </div>
                <p style={{fontSize:11, color:C.textM, margin:"2px 0 0"}}>{it.desc}</p>
              </div>
              <ChevronRight size={16} color={C.textL}/>
            </button>
          ))}
        </div>

        {/* Settings */}
        <div style={{...card, padding:0}}>
          {[
            {icon:CreditCard, label:"Kelola Rekening"},
            {icon:LayoutGrid, label:"Kategori & Grup"},
            {icon:Shield, label:"Keamanan & Privasi"},
            {icon:Star, label:"Beri Rating"},
          ].map((it, i) => (
            <button key={i} style={{width:"100%", padding:"12px 16px", background:"none", border:"none", borderTop: i>0?`1px solid ${C.borderL}`:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:12, textAlign:"left"}}>
              <it.icon size={18} color={C.textM}/>
              <span style={{flex:1, fontSize:13, fontWeight:600, color:C.text}}>{it.label}</span>
              <ChevronRight size={14} color={C.textL}/>
            </button>
          ))}
        </div>

        <button onClick={onLogout} style={{...card, color:C.red, border:"none", display:"flex", alignItems:"center", justifyContent:"center", gap:8, fontSize:13, fontWeight:700, cursor:"pointer"}}>
          <LogOut size={16}/> Keluar Akun
        </button>

        <p style={{textAlign:"center", fontSize:10, color:C.textL, marginTop:4}}>
          AMAN Budget v1.0.0 · © 2026 AMAN Digital<br/>amandigital.web.id
        </p>
      </div>
    </div>
  );
};

// ─── UPGRADE PRO ───
const UpgradeScreen = ({setSubPage}) => {
  const [plan, setPlan] = useState("yearly");
  const plans = [
    {id:"monthly", name:"Bulanan", price:29000, period:"/bln", desc:"Bayar tiap bulan"},
    {id:"yearly", name:"Tahunan", price:199000, period:"/thn", desc:"Hemat 43% · Setara Rp 16.500/bln", popular:true},
    {id:"lifetime", name:"Lifetime", price:499000, period:"sekali", desc:"Bayar sekali, pakai selamanya"},
  ];
  const features = [
    "Budget unlimited bulan",
    "Transaksi tanpa batas",
    "Kategori & grup unlimited",
    "Family Sync (suami-istri)",
    "Transfer Planner advanced",
    "Export PDF & Excel",
    "Cloud backup otomatis",
    "Reminder jatuh tempo",
    "AI Insight bulanan",
    "Goals unlimited",
    "Receipt OCR",
    "Tanpa iklan",
  ];

  return (
    <div style={{flex:1, overflowY:"auto", paddingBottom:24, background:C.bg}}>
      <div style={{background:`linear-gradient(160deg, ${C.gold} 0%, #b45309 100%)`, padding:"42px 16px 28px", color:"#fff", borderBottomLeftRadius:24, borderBottomRightRadius:24, position:"relative"}}>
        <button onClick={()=>setSubPage(null)} style={{background:"rgba(255,255,255,0.2)", border:"none", borderRadius:10, padding:8, cursor:"pointer", color:"#fff", display:"flex", marginBottom:14}}>
          <X size={18}/>
        </button>
        <div style={{textAlign:"center"}}>
          <div style={{width:64, height:64, background:"rgba(255,255,255,0.2)", borderRadius:20, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 12px"}}>
            <Crown size={32} color="#fff"/>
          </div>
          <p style={{fontSize:24, fontWeight:800, margin:0, letterSpacing:-0.5}}>AMAN Budget Pro</p>
          <p style={{fontSize:13, opacity:0.9, margin:"6px 0 0"}}>Buka semua fitur premium untuk keluarga Anda</p>
        </div>
      </div>

      <div style={{padding:"14px", display:"flex", flexDirection:"column", gap:12}}>
        {/* Plans */}
        {plans.map(p=>(
          <button key={p.id} onClick={()=>setPlan(p.id)} style={{
            background:"#fff", borderRadius:16, padding:"14px 16px",
            border: plan===p.id ? `2px solid ${C.gold}` : `2px solid ${C.borderL}`,
            cursor:"pointer", display:"flex", alignItems:"center", gap:12, textAlign:"left", position:"relative",
            boxShadow: plan===p.id ? "0 4px 16px rgba(217,119,6,0.15)" : "none"
          }}>
            {p.popular && (
              <span style={{position:"absolute", top:-9, right:14, background:C.gold, color:"#fff", fontSize:10, fontWeight:800, padding:"3px 8px", borderRadius:6, letterSpacing:0.3}}>
                TERPOPULER
              </span>
            )}
            <div style={{width:22, height:22, borderRadius:"50%", border: plan===p.id ? `7px solid ${C.gold}` : `2px solid ${C.border}`, flexShrink:0}}/>
            <div style={{flex:1}}>
              <p style={{fontSize:14, fontWeight:700, color:C.text, margin:0}}>{p.name}</p>
              <p style={{fontSize:11, color:C.textM, margin:"2px 0 0"}}>{p.desc}</p>
            </div>
            <div style={{textAlign:"right"}}>
              <p style={{fontSize:16, fontWeight:800, color:C.text, margin:0}}>{fmtS(p.price)}</p>
              <p style={{fontSize:10, color:C.textM, margin:0}}>{p.period}</p>
            </div>
          </button>
        ))}

        {/* Features */}
        <div style={card}>
          <p style={{fontSize:13, fontWeight:700, color:C.text, margin:"0 0 10px"}}>Yang Kamu Dapatkan:</p>
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8}}>
            {features.map((f,i)=>(
              <div key={i} style={{display:"flex", alignItems:"flex-start", gap:6}}>
                <CheckCircle2 size={14} color={C.pri} style={{flexShrink:0, marginTop:2}}/>
                <span style={{fontSize:11, color:C.text, lineHeight:1.4}}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Trust */}
        <div style={{background:C.priBg, borderRadius:14, padding:"12px 14px", display:"flex", alignItems:"center", gap:10}}>
          <Shield size={20} color={C.pri}/>
          <div style={{flex:1, fontSize:11, color:C.priD, lineHeight:1.5}}>
            <b>Garansi 7 hari uang kembali.</b> Tidak puas? Kami refund 100%.
          </div>
        </div>

        <button onClick={()=>alert("Demo: Berlangganan akan terhubung ke Google Play Billing")} style={{background:`linear-gradient(135deg, ${C.gold}, #b45309)`, border:"none", borderRadius:14, padding:"16px", color:"#fff", fontSize:15, fontWeight:800, cursor:"pointer", boxShadow:"0 6px 20px rgba(217,119,6,0.35)", display:"flex", alignItems:"center", justifyContent:"center", gap:8}}>
          <Zap size={18}/> Mulai Berlangganan Sekarang
        </button>

        <p style={{textAlign:"center", fontSize:10, color:C.textL, margin:0, lineHeight:1.5}}>
          Pembayaran dikelola Google Play.<br/>Bisa dibatalkan kapan saja.
        </p>
      </div>
    </div>
  );
};

// ─── ADD/EDIT SHEET ───
const AddSheet = ({editTx, onSave, onClose}) => {
  const [f, setF] = useState(editTx || {date:new Date().toISOString().slice(0,10), type:"expense", grp:"bunda", cat:"", desc:"", amt:"", status:"estimasi", pay:"transfer", acc:"BSI"});
  const [err, setErr] = useState({});
  const s = (k,v) => setF(p=>({...p, [k]:v}));
  const statusOptions = Object.entries(STATUS).filter(([v])=>f.type==="income" ? ["estimasi","selesai","batal"].includes(v) : true);

  const save = () => {
    const e = {};
    if(!f.desc?.trim()) e.desc = "Wajib diisi";
    if(!f.amt || Number(f.amt)<=0) e.amt = "Nominal harus > 0";
    if(Object.keys(e).length) {setErr(e); return;}
    onSave({...f, amt:Number(f.amt), id:f.id||Date.now().toString()});
    onClose();
  };

  return (
    <div style={{position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:100, display:"flex", alignItems:"flex-end", justifyContent:"center"}}>
      <div style={{width:"100%", maxWidth:430, background:"#fff", borderTopLeftRadius:24, borderTopRightRadius:24, maxHeight:"90vh", overflowY:"auto", animation:"slideUp 0.3s"}}>
        <div style={{padding:"16px", borderBottom:`1px solid ${C.borderL}`, position:"sticky", top:0, background:"#fff", zIndex:2, display:"flex", alignItems:"center", justifyContent:"space-between"}}>
          <p style={{fontSize:16, fontWeight:700, color:C.text, margin:0}}>{editTx ? "Edit Transaksi" : "Tambah Transaksi"}</p>
          <button onClick={onClose} style={{background:C.borderL, border:"none", borderRadius:10, padding:8, cursor:"pointer", display:"flex"}}>
            <X size={16} color={C.textM}/>
          </button>
        </div>

        <div style={{padding:"14px", display:"flex", flexDirection:"column", gap:14}}>
          <div>
            <label style={lbl}>Tipe Transaksi</label>
            <div style={{display:"flex", gap:8}}>
              {[["income","Pemasukan", TrendingUp, C.pri],["expense","Pengeluaran", TrendingDown, C.red]].map(([v,l,Ic,col])=>(
                <button key={v} onClick={()=>{s("type",v); s("status", v==="income"?"selesai":"estimasi");}}
                  style={{flex:1, padding:"12px", borderRadius:12, border:`1.5px solid ${f.type===v?col:C.border}`, background:f.type===v?col+"10":"#fff", color:f.type===v?col:C.textM, fontSize:13, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6}}>
                  <Ic size={15}/> {l}
                </button>
              ))}
            </div>
          </div>

          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10}}>
            <div>
              <label style={lbl}>Tanggal</label>
              <input type="date" style={inp} value={f.date} onChange={e=>s("date", e.target.value)}/>
            </div>
            {f.type==="expense" && (
              <div>
                <label style={lbl}>Grup</label>
                <select style={inp} value={f.grp} onChange={e=>s("grp", e.target.value)}>
                  {Object.entries(GROUPS).map(([v,l])=><option key={v} value={v}>{l.label}</option>)}
                </select>
              </div>
            )}
          </div>

          <div>
            <label style={lbl}>Kategori</label>
            <input style={inp} placeholder="Sekolah, Belanja, Cicilan..." value={f.cat} onChange={e=>s("cat", e.target.value)}/>
          </div>

          <div>
            <label style={lbl}>Deskripsi *</label>
            <input style={{...inp, borderColor:err.desc?C.red:C.border}} placeholder="Nama transaksi" value={f.desc} onChange={e=>s("desc", e.target.value)}/>
            {err.desc && <p style={{color:C.red, fontSize:11, margin:"4px 0 0"}}>{err.desc}</p>}
          </div>

          <div>
            <label style={lbl}>Nominal (Rp) *</label>
            <input type="number" style={{...inp, borderColor:err.amt?C.red:C.border, fontSize:16, fontWeight:700}} placeholder="0" value={f.amt} onChange={e=>s("amt", e.target.value)}/>
            {err.amt && <p style={{color:C.red, fontSize:11, margin:"4px 0 0"}}>{err.amt}</p>}
            {Number(f.amt)>0 && <p style={{color:C.pri, fontSize:12, margin:"4px 0 0", fontWeight:700}}>{fmt(Number(f.amt))}</p>}
          </div>

          <div>
            <label style={lbl}>Status</label>
            <div style={{display:"grid", gridTemplateColumns:f.type==="income"?"repeat(3, 1fr)":"1fr 1fr", gap:8}}>
              {statusOptions.map(([v,st])=>(
                <button key={v} onClick={()=>s("status",v)} style={{padding:"10px", borderRadius:10, border:`1.5px solid ${f.status===v?st.color:C.border}`, background:f.status===v?st.bg:"#fff", color:f.status===v?st.color:C.textM, fontSize:12, fontWeight:700, cursor:"pointer"}}>
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10}}>
            <div>
              <label style={lbl}>Metode</label>
              <select style={inp} value={f.pay} onChange={e=>s("pay", e.target.value)}>
                {["transfer","cash","qris","debit","lainnya"].map(m=><option key={m} value={m}>{m.toUpperCase()}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Rekening</label>
              <select style={inp} value={f.acc} onChange={e=>s("acc", e.target.value)}>
                {["BSI","Mandiri","BCA","Cash","Lainnya"].map(a=><option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>

          <button onClick={save} style={{background:C.pri, color:"#fff", border:"none", borderRadius:14, padding:"15px", fontSize:15, fontWeight:700, cursor:"pointer", marginTop:4, boxShadow:"0 6px 18px rgba(22,163,74,0.3)", display:"flex", alignItems:"center", justifyContent:"center", gap:8}}>
            <Check size={18}/> Simpan Transaksi
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── SHARE / EXPORT LAPORAN ───
const ShareScreen = ({txs, setSubPage}) => {
  const [format, setFormat] = useState("whatsapp");
  const [copied, setCopied] = useState(false);
  const s = calcSummary(txs);
  const grps = calcGroups(txs);
  const unpaid = txs.filter(x=>x.status==="belum_selesai");
  const top5 = txs.filter(x=>x.type==="expense"&&x.status!=="batal").sort((a,b)=>b.amt-a.amt).slice(0,5);

  const waText = useMemo(() => {
    let t = "📊 *LAPORAN KEUANGAN KELUARGA*\n";
    t += "_Mei 2026 · Keluarga Malik_\n";
    t += "━━━━━━━━━━━━━━━━━━━━\n\n";
    t += "💰 *RINGKASAN BULAN INI*\n";
    t += "```\n";
    t += `Pemasukan    : ${fmt(s.totalIncome)}\n`;
    t += `Pengeluaran  : ${fmt(s.paid)}\n`;
    t += `Saldo Aktual : ${fmt(s.actBal)}\n`;
    t += `Sisa Aman    : ${fmt(s.safeBal)}\n`;
    t += `Progress     : ${s.prog}%\n`;
    t += "```\n\n";
    t += "📋 *REKAP PER GRUP*\n";
    Object.entries(grps).sort((a,b)=>b[1].budget-a[1].budget).forEach(([k,v])=>{
      t += `• ${GROUPS[k]?.label} — ${fmt(v.budget)}\n`;
    });
    t += "\n";
    if(unpaid.length > 0) {
      t += "⚠️ *BELUM DIBAYAR*\n";
      unpaid.forEach(tx => { t += `• ${tx.desc} — ${fmt(tx.amt)}\n`; });
      t += "\n";
    }
    t += "🏆 *TOP 5 PENGELUARAN*\n";
    top5.forEach((tx, i) => { t += `${i+1}. ${tx.desc}\n   _${fmt(tx.amt)}_\n`; });
    t += "\n━━━━━━━━━━━━━━━━━━━━\n";
    t += "_Dibuat dengan AMAN Budget_\n";
    t += "🌐 amandigital.web.id";
    return t;
  }, [s, grps, unpaid, top5]);

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(waText);
      setCopied(true);
      setTimeout(()=>setCopied(false), 2000);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = waText;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch {
        // Keep the same fallback flow even if legacy copy is unavailable.
      }
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(()=>setCopied(false), 2000);
    }
  };

  const shareWA = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(waText)}`;
    window.open(url, "_blank");
  };

  const downloadPDF = () => { window.print(); };

  return (
    <>
      <style>{`
        @media print {
          html, body { background: white !important; margin: 0 !important; padding: 0 !important; }
          body > div, body > div > div { max-width: 100% !important; width: 100% !important; background: white !important; }
          .no-print { display: none !important; }
          .print-area {
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            max-width: 100% !important;
          }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          @page { margin: 15mm; size: A4; }
        }
      `}</style>
      <div style={{flex:1, overflowY:"auto", paddingBottom:92, background:C.bg}}>
        <div className="no-print">
          <Header title="Bagikan Laporan" subtitle="Mei 2026 · Keluarga Malik" onBack={()=>setSubPage(null)}/>
        </div>

        <div className="no-print" style={{padding:"14px 14px 0"}}>
          <div style={{background:"#fff", borderRadius:14, padding:4, display:"flex", border:`1px solid ${C.borderL}`, boxShadow:"0 1px 4px rgba(0,0,0,0.03)"}}>
            {[
              {id:"whatsapp", label:"WhatsApp", icon:Send, color:"#25d366"},
              {id:"pdf", label:"PDF", icon:FileDown, color:C.red},
            ].map(opt => (
              <button key={opt.id} onClick={()=>setFormat(opt.id)} style={{
                flex:1, padding:"11px", borderRadius:10, border:"none", cursor:"pointer",
                background: format===opt.id ? opt.color+"15" : "transparent",
                color: format===opt.id ? opt.color : C.textM,
                fontSize:13, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                transition:"all .2s"
              }}>
                <opt.icon size={15}/> {opt.label}
              </button>
            ))}
          </div>
        </div>

        {format === "whatsapp" ? (
          <div className="no-print" style={{padding:"12px 14px 14px", display:"flex", flexDirection:"column", gap:12}}>
            <div style={{background:"#e5ddd5", borderRadius:14, padding:"14px 12px", boxShadow:"inset 0 2px 8px rgba(0,0,0,0.05)"}}>
              <div style={{background:"#dcf8c6", borderRadius:8, borderTopRightRadius:2, padding:"10px 12px 6px", maxWidth:"94%", marginLeft:"auto", boxShadow:"0 1px 2px rgba(0,0,0,0.13)"}}>
                <pre style={{margin:0, fontFamily:"-apple-system, system-ui, sans-serif", fontSize:11.5, color:"#111b21", whiteSpace:"pre-wrap", lineHeight:1.45, wordBreak:"break-word"}}>{waText}</pre>
                <div style={{display:"flex", justifyContent:"flex-end", alignItems:"center", gap:4, marginTop:4, fontSize:10, color:"#667781"}}>
                  <span>16:45</span>
                  <svg width="14" height="11" viewBox="0 0 16 11" fill="#53bdeb"><path d="M11.07.65L4.25 7.48a.35.35 0 01-.49 0L1.05 4.77a.35.35 0 00-.48 0l-.57.57a.35.35 0 000 .49l2.71 2.71a1.16 1.16 0 001.64 0L11.87.99a.35.35 0 000-.49L11.31.04a.35.35 0 00-.49 0z"/></svg>
                </div>
              </div>
            </div>

            <div style={{display:"flex", gap:8}}>
              <button onClick={copyText} style={{flex:1, padding:"14px", borderRadius:12, border:`1.5px solid ${copied?C.pri:C.border}`, background:copied?C.priL:"#fff", color:copied?C.priD:C.text, fontSize:13, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6, transition:"all .2s"}}>
                {copied ? <><Check size={16}/> Tersalin!</> : <><Copy size={16}/> Salin</>}
              </button>
              <button onClick={shareWA} style={{flex:1.5, padding:"14px", borderRadius:12, border:"none", background:"#25d366", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6, boxShadow:"0 6px 18px rgba(37,211,102,0.3)"}}>
                <Send size={16}/> Kirim WhatsApp
              </button>
            </div>

            <div style={{background:C.priBg, borderRadius:12, padding:"12px 14px", display:"flex", gap:10, alignItems:"flex-start"}}>
              <Sparkles size={16} color={C.pri} style={{marginTop:2, flexShrink:0}}/>
              <p style={{margin:0, fontSize:11, color:C.priD, lineHeight:1.5}}>
                Format sudah sesuai standar WhatsApp dengan <b>*bold*</b>, <i>_italic_</i>, dan emoji. Cocok dikirim ke grup keluarga.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="no-print" style={{padding:"12px 14px 0"}}>
              <div style={{background:"#fef2f2", borderRadius:12, padding:"12px 14px", display:"flex", gap:10, alignItems:"flex-start"}}>
                <FileDown size={16} color={C.red} style={{marginTop:2, flexShrink:0}}/>
                <p style={{margin:0, fontSize:11, color:"#991b1b", lineHeight:1.5}}>
                  Tekan tombol <b>Download PDF</b> di bawah → di dialog cetak pilih <b>"Save as PDF"</b>.
                </p>
              </div>
            </div>

            <div className="print-area" style={{margin:"14px", background:"#fff", borderRadius:14, padding:"24px 20px", border:`1px solid ${C.borderL}`, boxShadow:"0 4px 20px rgba(0,0,0,0.06)"}}>
              <div style={{textAlign:"center", paddingBottom:14, borderBottom:`3px solid ${C.pri}`, marginBottom:16}}>
                <div style={{width:46, height:46, background:C.pri, borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 8px"}}>
                  <Shield size={24} color="#fff"/>
                </div>
                <h2 style={{margin:0, fontSize:17, color:C.text, fontWeight:800, letterSpacing:-0.3}}>LAPORAN KEUANGAN</h2>
                <p style={{margin:"3px 0 0", fontSize:11, color:C.textM, fontWeight:600}}>Periode: Mei 2026 · Keluarga Malik</p>
              </div>

              <div style={{marginBottom:18}}>
                <h3 style={{fontSize:11, color:C.pri, margin:"0 0 8px", fontWeight:800, letterSpacing:0.8}}>▎RINGKASAN BULAN INI</h3>
                <table style={{width:"100%", fontSize:11, borderCollapse:"collapse"}}>
                  <tbody>
                    {[
                      ["Total Pemasukan", fmt(s.totalIncome), C.pri],
                      ["Total Pengeluaran (Terbayar)", fmt(s.paid), C.red],
                      ["Estimasi Pengeluaran", fmt(s.estExp), C.text],
                      ["Saldo Aktual", fmt(s.actBal), C.text],
                      ["Estimasi Sisa Aman", fmt(s.safeBal), s.safeBal<0?C.red:C.pri],
                      ["Progress Pembayaran", s.prog+"%", C.text],
                    ].map(([k,v,c],i)=>(
                      <tr key={i} style={{borderBottom:`1px solid ${C.borderL}`}}>
                        <td style={{padding:"7px 0", color:C.textM}}>{k}</td>
                        <td style={{padding:"7px 0", color:c, fontWeight:700, textAlign:"right"}}>{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{marginBottom:18}}>
                <h3 style={{fontSize:11, color:C.pri, margin:"0 0 8px", fontWeight:800, letterSpacing:0.8}}>▎REKAP PER GRUP</h3>
                <table style={{width:"100%", fontSize:11, borderCollapse:"collapse"}}>
                  <thead>
                    <tr style={{borderBottom:`2px solid ${C.text}`}}>
                      <th style={{padding:"7px 0", textAlign:"left", color:C.text, fontWeight:700}}>Grup</th>
                      <th style={{padding:"7px 0", textAlign:"right", color:C.text, fontWeight:700}}>Budget</th>
                      <th style={{padding:"7px 0", textAlign:"right", color:C.pri, fontWeight:700}}>Selesai</th>
                      <th style={{padding:"7px 0", textAlign:"right", color:C.red, fontWeight:700}}>Belum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(grps).sort((a,b)=>b[1].budget-a[1].budget).map(([k,v])=>(
                      <tr key={k} style={{borderBottom:`1px solid ${C.borderL}`}}>
                        <td style={{padding:"6px 0", color:C.text, fontWeight:600}}>{GROUPS[k]?.label}</td>
                        <td style={{padding:"6px 0", textAlign:"right", color:C.text}}>{fmt(v.budget)}</td>
                        <td style={{padding:"6px 0", textAlign:"right", color:C.pri, fontWeight:600}}>{fmt(v.paid)}</td>
                        <td style={{padding:"6px 0", textAlign:"right", color:C.red, fontWeight:600}}>{fmt(v.unpaid)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{marginBottom:18}}>
                <h3 style={{fontSize:11, color:C.pri, margin:"0 0 8px", fontWeight:800, letterSpacing:0.8}}>▎TOP 5 PENGELUARAN</h3>
                <table style={{width:"100%", fontSize:11, borderCollapse:"collapse"}}>
                  <tbody>
                    {top5.map((tx,i)=>(
                      <tr key={tx.id} style={{borderBottom:`1px solid ${C.borderL}`}}>
                        <td style={{padding:"7px 0", width:28, color:C.priD, fontWeight:800}}>#{i+1}</td>
                        <td style={{padding:"7px 0"}}>
                          <div style={{fontWeight:600, color:C.text}}>{tx.desc}</div>
                          <div style={{fontSize:10, color:C.textM, marginTop:1}}>{GROUPS[tx.grp]?.label} · {tx.date}</div>
                        </td>
                        <td style={{padding:"7px 0", textAlign:"right", color:C.text, fontWeight:700}}>{fmt(tx.amt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {unpaid.length > 0 && (
                <div style={{marginBottom:18}}>
                  <h3 style={{fontSize:11, color:C.red, margin:"0 0 8px", fontWeight:800, letterSpacing:0.8}}>▎⚠ BELUM DIBAYAR</h3>
                  <table style={{width:"100%", fontSize:11, borderCollapse:"collapse"}}>
                    <tbody>
                      {unpaid.map(tx=>(
                        <tr key={tx.id} style={{borderBottom:`1px solid ${C.borderL}`}}>
                          <td style={{padding:"6px 0"}}>
                            <div style={{color:C.text, fontWeight:600}}>{tx.desc}</div>
                            <div style={{fontSize:10, color:C.textM}}>{GROUPS[tx.grp]?.label}</div>
                          </td>
                          <td style={{padding:"6px 0", textAlign:"right", color:C.red, fontWeight:700}}>{fmt(tx.amt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div style={{borderTop:`1px solid ${C.borderL}`, paddingTop:12, marginTop:8, textAlign:"center"}}>
                <p style={{fontSize:10, color:C.textM, margin:0}}>
                  Laporan ini dibuat otomatis oleh <b style={{color:C.pri}}>AMAN Budget</b>
                </p>
                <p style={{fontSize:9, color:C.textL, margin:"3px 0 0"}}>
                  amandigital.web.id · Dicetak {new Date().toLocaleDateString("id-ID", {day:"numeric", month:"long", year:"numeric"})}
                </p>
              </div>
            </div>

            <div className="no-print" style={{padding:"0 14px 14px"}}>
              <button onClick={downloadPDF} style={{width:"100%", padding:"15px", borderRadius:14, border:"none", background:`linear-gradient(135deg, ${C.red}, #b91c1c)`, color:"#fff", fontSize:14, fontWeight:800, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8, boxShadow:"0 8px 24px rgba(220,38,38,0.4)"}}>
                <FileDown size={18}/> Download / Cetak PDF
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

// ─── BOTTOM NAV ───
const BottomNav = ({tab, setTab, setAddOpen, setEditTx}) => {
  const items = [
    {id:"home", icon:Home, label:"Beranda"},
    {id:"reports", icon:BarChart3, label:"Laporan"},
    {id:"fab", icon:Plus, label:"", fab:true},
    {id:"goals-tab", icon:Target, label:"Goals"},
    {id:"more", icon:LayoutGrid, label:"Lainnya"},
  ];
  return (
    <div style={{position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:430, background:"#fff", borderTop:`1px solid ${C.borderL}`, display:"flex", alignItems:"center", padding:"6px 4px 10px", zIndex:50, boxSizing:"border-box", boxShadow:"0 -4px 20px rgba(0,0,0,0.04)"}}>
      {items.map(n=>(
        n.fab ? (
          <button key={n.id} onClick={()=>{setEditTx(null); setAddOpen(true);}} style={{flex:1, display:"flex", justifyContent:"center", background:"none", border:"none", padding:0, cursor:"pointer"}}>
            <div style={{width:52, height:52, background:`linear-gradient(135deg, ${C.pri}, ${C.priD})`, borderRadius:16, display:"flex", alignItems:"center", justifyContent:"center", marginTop:-22, boxShadow:`0 8px 20px rgba(22,163,74,0.4)`}}>
              <Plus size={26} color="#fff" strokeWidth={2.5}/>
            </div>
          </button>
        ) : (
          <button key={n.id} onClick={()=>setTab(n.id)} style={{flex:1, display:"flex", flexDirection:"column", alignItems:"center", padding:"6px 0", background:"none", border:"none", cursor:"pointer", color: tab===n.id ? C.pri : C.textL, gap:3}}>
            <n.icon size={20} strokeWidth={tab===n.id ? 2.5 : 2}/>
            <span style={{fontSize:10, fontWeight:tab===n.id?700:500}}>{n.label}</span>
          </button>
        )
      ))}
    </div>
  );
};

// ─── APP ───
export default function App() {
  const [user, setUser] = useState(() => loadStored(STORAGE_KEYS.user, null, v=>v === null || typeof v === "object"));
  const [tab, setTab] = useState("home");
  const [subPage, setSubPage] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editTx, setEditTx] = useState(null);
  const [txs, setTxs] = useState(() => loadStored(STORAGE_KEYS.txs, INIT_TX, Array.isArray));
  const [goals] = useState(() => loadStored(STORAGE_KEYS.goals, INIT_GOALS, Array.isArray));
  const [period, setPeriod] = useState(() => normalizePeriod(loadStored(STORAGE_KEYS.period, getDefaultPeriod(), v=>v&&typeof v==="object"&&!Array.isArray(v))));

  useEffect(()=>{ saveStored(STORAGE_KEYS.txs, txs); }, [txs]);
  useEffect(()=>{ saveStored(STORAGE_KEYS.goals, goals); }, [goals]);
  useEffect(()=>{ saveStored(STORAGE_KEYS.period, normalizePeriod(period)); }, [period]);
  useEffect(()=>{
    if(user) saveStored(STORAGE_KEYS.user, user);
    else removeStored(STORAGE_KEYS.user);
  }, [user]);

  const periodTxs = useMemo(()=>txs.filter(tx=>isTxInPeriod(tx, period)), [txs, period]);
  const periodYears = useMemo(()=>getPeriodYears(txs, period), [txs, period]);

  const onSave = tx => setTxs(p=>{
    const i = p.findIndex(x=>x.id===tx.id);
    if(i>=0) {const n=[...p]; n[i]=tx; return n;}
    return [...p, tx];
  });
  const onDelete = id => setTxs(p=>p.filter(x=>x.id!==id));
  const onDone = id => setTxs(p=>p.map(x=>x.id===id?{...x, status:"selesai"}:x));
  const onDeletePeriod = periodToDelete => setTxs(p=>deleteTransactionsByPeriod(p, periodToDelete).next);
  const onCopyBudget = () => {
    const p = normalizePeriod(period);
    if(p.mode !== "month") return;
    const {items, sourceCount, prev} = copyBudgetFromPreviousMonth(txs, p);
    if(sourceCount === 0) {
      alert(`Tidak ada budget dari ${formatMonthYear(prev.month, prev.year)} untuk dicopy.`);
      return;
    }
    if(items.length === 0) {
      alert("Budget bulan lalu sudah pernah dicopy.");
      return;
    }
    setTxs(prevTxs=>[...prevTxs, ...items]);
    alert(`${items.length} item berhasil dicopy dari ${formatMonthYear(prev.month, prev.year)}.`);
  };
  const openUpgrade = () => setSubPage("upgrade");

  if(!user) return <LoginScreen onLogin={setUser}/>;

  const renderScreen = () => {
    if(subPage==="upgrade") return <UpgradeScreen setSubPage={setSubPage}/>;
    if(subPage==="transfer") return <TransferScreen txs={txs} setSubPage={setSubPage}/>;
    if(subPage==="zakat") return <ZakatScreen setSubPage={setSubPage}/>;
    if(subPage==="tx-list") return <TxListScreen txs={periodTxs} allTxs={txs} period={period} setPeriod={setPeriod} years={periodYears} onCopyBudget={onCopyBudget} onDeletePeriod={onDeletePeriod} setSubPage={setSubPage} setEditTx={setEditTx} setAddOpen={setAddOpen} onDelete={onDelete} onDone={onDone}/>;
    if(subPage==="share") return <ShareScreen txs={txs} setSubPage={setSubPage}/>;
    if(tab==="home") return <HomeScreen txs={periodTxs} period={period} setPeriod={setPeriod} years={periodYears} onCopyBudget={onCopyBudget} setTab={setTab} setSubPage={setSubPage} setEditTx={setEditTx} setAddOpen={setAddOpen} openUpgrade={openUpgrade} user={user}/>;
    if(tab==="reports") return <ReportsScreen txs={periodTxs} period={period} setPeriod={setPeriod} years={periodYears} openUpgrade={openUpgrade}/>;
    if(tab==="goals-tab") return <GoalsScreen goals={goals} openUpgrade={openUpgrade}/>;
    if(tab==="more") return <MoreScreen setSubPage={setSubPage} openUpgrade={openUpgrade} onLogout={()=>setUser(null)}/>;
    return null;
  };

  const hideNav = subPage==="upgrade";

  return (
    <div style={{minHeight:"100vh", background:C.bg, display:"flex", justifyContent:"center", fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"}}>
      <style>{`
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        * { -webkit-tap-highlight-color: transparent; }
        input, select, textarea { font-family: inherit; }
        button { font-family: inherit; }
        ::-webkit-scrollbar { width: 0; }
      `}</style>
      <div style={{width:"100%", maxWidth:430, display:"flex", flexDirection:"column", minHeight:"100vh", position:"relative", background:C.bg}}>
        {renderScreen()}
        {!hideNav && <BottomNav tab={tab} setTab={(t)=>{setTab(t); setSubPage(null);}} setAddOpen={setAddOpen} setEditTx={setEditTx}/>}
        {addOpen && <AddSheet editTx={editTx} onSave={onSave} onClose={()=>{setAddOpen(false); setEditTx(null);}}/>}
      </div>
    </div>
  );
}
