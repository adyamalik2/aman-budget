import { useCallback, useMemo, useState } from "react";
import { ArrowDownWideNarrow, FolderTree, Filter, X } from "lucide-react";
import Header from "../components/layout/Header";
import PeriodPicker from "../components/period/PeriodPicker";
import Pill from "../components/ui/Pill";
import { C } from "../constants/theme";
import { fmt, fmtS } from "../utils/format";
import { getGroupColor as groupColor, getGroupLabel as groupLabel } from "../utils/groups";
import { formatPeriodLabel } from "../utils/period";

const card = {background:"#fff", borderRadius:16, padding:"14px 16px", border:`1px solid ${C.borderL}`, boxShadow:"0 1px 4px rgba(0,0,0,0.03)"};

// Status filter → key transaksi yang dihitung. "all" = semua kecuali batal.
const STATUS_FILTERS = [
  {value:"all", label:"Semua"},
  {value:"estimasi", label:"Estimasi"},
  {value:"selesai", label:"Selesai"},
  {value:"belum_selesai", label:"Belum Bayar"},
];

const GroupRecapScreen = ({txs = [], period, setPeriod, years, categoryGroups = [], setSubPage}) => {
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedGroups, setSelectedGroups] = useState([]); // kosong = semua grup
  const [sortByAmount, setSortByAmount] = useState(true);
  const periodLabel = formatPeriodLabel(period);

  // Hitung statistik per grup dari transaksi pengeluaran (kecuali batal).
  const stats = useMemo(() => {
    const map = {};
    txs.filter(tx=>!tx.deletedAt && tx.type==="expense" && tx.status!=="batal").forEach(tx=>{
      const key = tx.grp || "lain_lain";
      if(!map[key]) map[key] = {id:key, budget:0, estimasi:0, paid:0, unpaid:0, count:0};
      map[key].budget += tx.amt;
      map[key].count += 1;
      if(tx.status==="estimasi") map[key].estimasi += tx.amt;
      if(tx.status==="selesai") map[key].paid += tx.amt;
      if(tx.status==="belum_selesai") map[key].unpaid += tx.amt;
    });
    return map;
  }, [txs]);

  // Nominal yang ditonjolkan mengikuti filter status.
  const amountForStatus = useCallback(group => {
    if(statusFilter==="estimasi") return group.estimasi;
    if(statusFilter==="selesai") return group.paid;
    if(statusFilter==="belum_selesai") return group.unpaid;
    return group.budget;
  }, [statusFilter]);

  // Daftar grup yang punya transaksi pada periode ini (untuk chip pemilih grup).
  const availableGroups = useMemo(() =>
    Object.values(stats)
      .map(group=>({id:group.id, label:groupLabel(group.id, categoryGroups)}))
      .sort((a,b)=>a.label.localeCompare(b.label)),
  [stats, categoryGroups]);

  const toggleGroup = id => setSelectedGroups(prev =>
    prev.includes(id) ? prev.filter(g=>g!==id) : [...prev, id]);

  const rows = useMemo(() => {
    let list = Object.values(stats);
    if(selectedGroups.length) list = list.filter(group=>selectedGroups.includes(group.id));
    list = list.filter(group=>amountForStatus(group) > 0);
    list.sort((a,b)=> sortByAmount
      ? amountForStatus(b) - amountForStatus(a)
      : groupLabel(a.id, categoryGroups).localeCompare(groupLabel(b.id, categoryGroups)));
    return list;
  }, [stats, selectedGroups, sortByAmount, categoryGroups, amountForStatus]);

  const totals = useMemo(() => rows.reduce((acc, group)=>({
    amount: acc.amount + amountForStatus(group),
    budget: acc.budget + group.budget,
    paid: acc.paid + group.paid,
    unpaid: acc.unpaid + group.unpaid,
  }), {amount:0, budget:0, paid:0, unpaid:0}), [rows, amountForStatus]);

  const activeStatusLabel = STATUS_FILTERS.find(s=>s.value===statusFilter)?.label || "Semua";
  const hasFilter = statusFilter!=="all" || selectedGroups.length > 0;

  return (
    <div style={{flex:1, overflowY:"auto", paddingBottom:92, background:C.bg}}>
      <Header title="Rekap per Grup" subtitle={periodLabel} onBack={()=>setSubPage(null)}/>

      <div style={{padding:"14px", display:"flex", flexDirection:"column", gap:12}}>
        {/* Period */}
        <div style={card}>
          <PeriodPicker period={period} setPeriod={setPeriod} years={years}/>
        </div>

        {/* Summary */}
        <div style={{...card, background:`linear-gradient(135deg, ${C.priBg}, #fff)`}}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10}}>
            <p style={{fontSize:11, color:C.textM, margin:0, fontWeight:700, letterSpacing:0.3}}>TOTAL {activeStatusLabel.toUpperCase()}</p>
            <span style={{fontSize:11, color:C.textM, fontWeight:600}}>{rows.length} grup</span>
          </div>
          <p style={{fontSize:26, fontWeight:800, color:C.priD, margin:0, letterSpacing:-0.5}}>{fmt(totals.amount)}</p>
          <div style={{display:"flex", gap:14, marginTop:10, flexWrap:"wrap"}}>
            <span style={{fontSize:11, color:C.textM}}>Terbayar: <b style={{color:C.pri}}>{fmtS(totals.paid)}</b></span>
            <span style={{fontSize:11, color:C.textM}}>Belum bayar: <b style={{color:C.red}}>{fmtS(totals.unpaid)}</b></span>
            <span style={{fontSize:11, color:C.textM}}>Total budget: <b style={{color:C.text}}>{fmtS(totals.budget)}</b></span>
          </div>
        </div>

        {/* Filters */}
        <div style={{...card, display:"flex", flexDirection:"column", gap:10}}>
          <div style={{display:"flex", alignItems:"center", justifyContent:"space-between"}}>
            <div style={{display:"flex", alignItems:"center", gap:6, color:C.textM}}>
              <Filter size={14}/>
              <span style={{fontSize:12, fontWeight:800}}>Filter</span>
            </div>
            {hasFilter && (
              <button type="button" onClick={()=>{setStatusFilter("all"); setSelectedGroups([]);}}
                style={{background:"none", border:"none", color:C.red, fontSize:11, fontWeight:800, cursor:"pointer", display:"flex", alignItems:"center", gap:3}}>
                <X size={12}/> Reset
              </button>
            )}
          </div>

          {/* Status filter */}
          <div style={{display:"flex", gap:6, overflowX:"auto", paddingBottom:2}}>
            {STATUS_FILTERS.map(s=>(
              <Pill key={s.value} active={statusFilter===s.value} onClick={()=>setStatusFilter(s.value)}>{s.label}</Pill>
            ))}
          </div>

          {/* Group multi-select */}
          {availableGroups.length > 0 && (
            <div style={{display:"flex", gap:6, flexWrap:"wrap"}}>
              <button type="button" onClick={()=>setSelectedGroups([])}
                style={chip(selectedGroups.length===0, C.pri)}>Semua grup</button>
              {availableGroups.map(group=>(
                <button key={group.id} type="button" onClick={()=>toggleGroup(group.id)}
                  style={chip(selectedGroups.includes(group.id), groupColor(group.id, categoryGroups))}>
                  {group.label}
                </button>
              ))}
            </div>
          )}

          {/* Sort toggle */}
          <button type="button" onClick={()=>setSortByAmount(prev=>!prev)}
            style={{display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"9px", borderRadius:10, border:`1px solid ${sortByAmount?C.pri:C.border}`, background:sortByAmount?C.priBg:"#fff", color:sortByAmount?C.priD:C.textM, fontSize:12, fontWeight:800, cursor:"pointer"}}>
            <ArrowDownWideNarrow size={14}/> {sortByAmount ? "Urut: Nominal terbesar" : "Urut: Nama grup (A-Z)"}
          </button>
        </div>

        {/* Group list */}
        {rows.length === 0 ? (
          <div style={{...card, textAlign:"center", padding:"28px 16px"}}>
            <div style={{width:46, height:46, borderRadius:14, background:C.priL, color:C.pri, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 10px"}}>
              <FolderTree size={22}/>
            </div>
            <p style={{fontSize:14, fontWeight:800, color:C.text, margin:"0 0 4px"}}>Tidak ada data</p>
            <p style={{fontSize:11, color:C.textM, margin:0}}>Belum ada pengeluaran yang cocok dengan filter pada periode ini.</p>
          </div>
        ) : rows.map(group=>{
          const color = groupColor(group.id, categoryGroups);
          const amount = amountForStatus(group);
          const pct = group.budget > 0 ? Math.min(Math.round(group.paid/group.budget*100), 100) : 0;
          const remaining = group.budget - group.paid;
          return (
            <div key={group.id} style={card}>
              <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:10}}>
                <div style={{width:36, height:36, borderRadius:11, background:color+"18", color, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>
                  <FolderTree size={18}/>
                </div>
                <div style={{flex:1, minWidth:0}}>
                  <p style={{fontSize:14, fontWeight:800, color:C.text, margin:0, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{groupLabel(group.id, categoryGroups)}</p>
                  <p style={{fontSize:10, color:C.textL, margin:"2px 0 0"}}>{group.count} transaksi</p>
                </div>
                <span style={{fontSize:15, fontWeight:800, color:C.text, whiteSpace:"nowrap"}}>{fmt(amount)}</span>
              </div>
              <div style={{background:C.borderL, borderRadius:6, height:6, overflow:"hidden", marginBottom:8}}>
                <div style={{background:color, height:"100%", width:`${pct}%`, transition:"width .4s"}}/>
              </div>
              <div style={{display:"flex", justifyContent:"space-between", gap:8, flexWrap:"wrap", fontSize:11, color:C.textM}}>
                <span>Terbayar: <b style={{color:C.pri}}>{fmtS(group.paid)}</b></span>
                <span>Belum: <b style={{color:C.red}}>{fmtS(group.unpaid)}</b></span>
                <span>Sisa: <b style={{color:remaining<0?C.red:C.text}}>{fmtS(remaining)}</b></span>
                <span>{pct}% terbayar</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const chip = (active, color) => ({
  border:`1px solid ${active?color:C.border}`,
  background:active?color+"15":"#fff",
  color:active?color:C.textM,
  borderRadius:999,
  padding:"6px 12px",
  fontSize:11,
  fontWeight:800,
  cursor:"pointer",
});

export default GroupRecapScreen;
