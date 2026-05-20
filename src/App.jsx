import { useState, useMemo, useEffect } from "react";
import {
  Search, X, Trash2,
  Bell, Crown, Sparkles, Clock,
  Users, ArrowRightLeft, Shield,
  ChevronRight, ChevronLeft, Mail, Lock, Send, Calculator,
  Receipt, PiggyBank, Check,
  TrendingUp, TrendingDown, Filter, FileDown, Copy
} from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import Btn from "./components/ui/Button";
import Pill from "./components/ui/Pill";
import Badge from "./components/ui/Badge";
import Header from "./components/layout/Header";
import BottomNav from "./components/layout/BottomNav";
import PeriodPicker from "./components/period/PeriodPicker";
import GoalsScreen from "./screens/GoalsScreen";
import TransferScreen from "./screens/TransferScreen";
import ZakatScreen from "./screens/ZakatScreen";
import UpgradeScreen from "./screens/UpgradeScreen";
import MoreScreen from "./screens/MoreScreen";
import { C } from "./constants/theme";
import { GROUPS, STATUS, STORAGE_KEYS } from "./constants/app";
import { INIT_GOALS, INIT_TX } from "./data/initialData";
import { fmt, fmtS } from "./utils/format";
import { loadStored, removeStored, saveStored } from "./utils/storage";
import { formatBackupDate, isJsonFile, isValidBackupData } from "./utils/backup";
import {
  copyBudgetFromPreviousMonth,
  deleteTransactionsByPeriod,
  formatMonthYear,
  formatPeriodLabel,
  formatShortDate,
  getDefaultPeriod,
  getDeletePeriodLabel,
  getPeriodYears,
  isTxInPeriod,
  normalizePeriod,
} from "./utils/period";
import { calcCashflowChartData, calcGroups, calcSummary } from "./utils/summary";

// ─── Reusable UI ───
const card = {background:"#fff", borderRadius:16, padding:"14px 16px", border:`1px solid ${C.borderL}`, boxShadow:"0 1px 4px rgba(0,0,0,0.03)"};
const inp = {width:"100%", border:`1.5px solid ${C.border}`, borderRadius:12, padding:"11px 14px", fontSize:14, outline:"none", boxSizing:"border-box", background:"#fff", color:C.text};
const lbl = {fontSize:12, fontWeight:600, color:C.textM, display:"block", marginBottom:6};

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
  const chartData = calcCashflowChartData(txs, period);
  const chartTitle = normalizePeriod(period).mode === "range" ? "Arus Kas Bulanan" : "Arus Kas Mingguan";
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

        {/* Bar chart */}
        <div style={card}>
          <p style={{fontSize:13, fontWeight:700, color:C.text, margin:"0 0 10px"}}>{chartTitle}</p>
          <div style={{height:160}}>
            <ResponsiveContainer>
              <BarChart data={chartData} barGap={2}>
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

// ─── APP ───
export default function App() {
  const [user, setUser] = useState(() => loadStored(STORAGE_KEYS.user, null, v=>v === null || typeof v === "object"));
  const [tab, setTab] = useState("home");
  const [subPage, setSubPage] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editTx, setEditTx] = useState(null);
  const [txs, setTxs] = useState(() => loadStored(STORAGE_KEYS.txs, INIT_TX, Array.isArray));
  const [goals, setGoals] = useState(() => loadStored(STORAGE_KEYS.goals, INIT_GOALS, Array.isArray));
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
  const onExportBackup = () => {
    try {
      const backup = {
        app:"AMAN Budget",
        version:1,
        exportedAt:new Date().toISOString(),
        transactions:txs,
        goals,
        user,
        period:normalizePeriod(period),
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], {type:"application/json"});
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `aman-budget-backup-${formatBackupDate(new Date())}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert("Gagal membuat file backup.");
    }
  };
  const onImportBackup = async file => {
    if(!isJsonFile(file)) {
      alert("File backup harus berformat JSON.");
      return;
    }

    try {
      const raw = await file.text();
      const data = JSON.parse(raw);
      if(!isValidBackupData(data)) {
        alert("File backup tidak valid.");
        return;
      }

      const ok = window.confirm(`Import backup akan mengganti ${txs.length} transaksi saat ini dengan ${data.transactions.length} transaksi dari file. Lanjutkan?`);
      if(!ok) return;

      setTxs(data.transactions.map(tx=>({...tx, amt:Number(tx.amt)})));
      if(data.goals !== undefined) setGoals(data.goals);
      if(Object.prototype.hasOwnProperty.call(data, "user")) setUser(data.user);
      if(data.period !== undefined) setPeriod(normalizePeriod(data.period));
      alert("Backup berhasil diimport.");
    } catch {
      alert("Gagal membaca file backup. Pastikan file JSON tidak rusak.");
    }
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
    if(tab==="more") return <MoreScreen setSubPage={setSubPage} openUpgrade={openUpgrade} onLogout={()=>setUser(null)} onExportBackup={onExportBackup} onImportBackup={onImportBackup}/>;
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
