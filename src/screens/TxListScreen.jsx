import { useMemo, useState } from "react";
import { ChevronLeft, Copy, Filter, Search, Trash2 } from "lucide-react";
import PeriodPicker from "../components/period/PeriodPicker";
import Badge from "../components/ui/Badge";
import Pill from "../components/ui/Pill";
import DeletePeriodSheet from "../features/transactions/DeletePeriodSheet";
import { GROUPS, STATUS } from "../constants/app";
import { C } from "../constants/theme";
import { fmtS } from "../utils/format";
import { formatPeriodLabel, formatShortDate } from "../utils/period";

const TxListScreen = ({txs, allTxs, goals = [], categoryGroups = [], period, setPeriod, years, onCopyBudget, onDeletePeriod, setSubPage, setEditTx, setAddOpen, onDelete, onDone, onCopy}) => {
  const [fS, setFS] = useState("all");
  const [fG, setFG] = useState("all");
  const [fGoal, setFGoal] = useState("all");
  const [q, setQ] = useState("");
  const [showFilters, setShowFilters] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const periodLabel = formatPeriodLabel(period);
  const openEdit = tx => {
    setEditTx(tx);
    setAddOpen(true);
  };

  // Opsi grup diambil dari grup yang ada di transaksi periode ini (+ grup terpilih bila tidak ada lagi).
  const groupOptions = useMemo(() => {
    const ids = new Set(txs.filter(tx=>tx.type==="expense" && tx.grp).map(tx=>tx.grp));
    if(fG !== "all") ids.add(fG);
    return [...ids]
      .map(id => ({id, label: categoryGroups.find(g=>g.id===id)?.label || GROUPS[id]?.label || id}))
      .sort((a,b)=>a.label.localeCompare(b.label));
  }, [txs, categoryGroups, fG]);

  const anyFilterActive = fS!=="all" || fG!=="all" || fGoal!=="all" || q.trim()!=="";
  const resetFilters = () => {setFS("all"); setFG("all"); setFGoal("all"); setQ("");};

  const filtered = useMemo(()=>txs.filter(tx=>{
    if(fS!=="all"&&tx.status!==fS) return false;
    if(fG!=="all"&&tx.grp!==fG) return false;
    if(fGoal==="none"&&tx.goalId) return false;
    if(fGoal!=="all"&&fGoal!=="none"&&tx.goalId!==fGoal) return false;
    if(q&&!tx.desc.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }).sort((a,b)=>b.date.localeCompare(a.date)),[txs,fS,fG,fGoal,q]);

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
          <button onClick={()=>setShowFilters(s=>!s)} aria-label="Tampilkan filter" style={{background:"rgba(255,255,255,0.2)", border:"none", borderRadius:10, padding:8, cursor:"pointer", color:"#fff", display:"flex", position:"relative"}}>
            <Filter size={16}/>
            {anyFilterActive && <span style={{position:"absolute", top:5, right:5, width:7, height:7, background:C.gold, borderRadius:"50%", border:"1px solid #fff"}}/>}
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

      {showFilters && (
      <div style={{background:"#fff", padding:"10px 14px", borderBottom:`1px solid ${C.borderL}`, display:"flex", flexDirection:"column", gap:8}}>
        <div style={{display:"flex", gap:6, overflowX:"auto", paddingBottom:2}}>
          <Pill active={fS==="all"} onClick={()=>setFS("all")}>Semua</Pill>
          {Object.entries(STATUS).map(([v,s])=><Pill key={v} active={fS===v} onClick={()=>setFS(v)}>{s.label}</Pill>)}
        </div>
        <div style={{display:"flex", alignItems:"center", gap:8}}>
          <span style={{fontSize:11, fontWeight:700, color:C.textM, flexShrink:0, minWidth:36}}>Grup:</span>
          <select value={fG} onChange={e=>setFG(e.target.value)}
            style={{flex:1, fontSize:11, padding:"5px 8px", borderRadius:8, border:`1px solid ${fG!=="all"?C.pri:C.border}`, background:"#fff", color:fG!=="all"?C.pri:C.text, fontWeight:fG!=="all"?"700":"400", outline:"none", cursor:"pointer"}}>
            <option value="all">Semua Grup</option>
            {groupOptions.map(g=><option key={g.id} value={g.id}>{g.label}</option>)}
          </select>
        </div>
        {goals.length > 0 && (
          <div style={{display:"flex", alignItems:"center", gap:8}}>
            <span style={{fontSize:11, fontWeight:700, color:C.textM, flexShrink:0, minWidth:36}}>Goal:</span>
            <select value={fGoal} onChange={e=>setFGoal(e.target.value)}
              style={{flex:1, fontSize:11, padding:"5px 8px", borderRadius:8, border:`1px solid ${fGoal!=="all"?C.pri:C.border}`, background:"#fff", color:fGoal!=="all"?C.pri:C.text, fontWeight:fGoal!=="all"?"700":"400", outline:"none", cursor:"pointer"}}>
              <option value="all">Semua Goal</option>
              <option value="none">Tidak terkait goal</option>
              {goals.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
        )}
        {anyFilterActive && (
          <button type="button" onClick={resetFilters} style={{alignSelf:"flex-end", background:"none", border:"none", color:C.red, fontSize:11, fontWeight:800, cursor:"pointer"}}>Reset filter</button>
        )}
      </div>
      )}

      <div style={{padding:"12px 14px"}}>
        {filtered.length===0 && <p style={{textAlign:"center", color:C.textL, fontSize:13, padding:"3rem 0"}}>Tidak ada transaksi</p>}
        {filtered.length > 0 && (
          <div style={{background:"#fff", border:`1px solid ${C.borderL}`, borderRadius:12, overflow:"hidden"}}>
            {filtered.map((tx,i)=>{
              const goalName = tx.goalId ? (goals.find(g=>g.id===tx.goalId)?.name ?? null) : null;
              return (
              <div key={tx.id} onClick={()=>openEdit(tx)} style={{display:"grid", gridTemplateColumns:"42px minmax(0, 1fr) auto", gap:9, alignItems:"center", padding:"9px 10px", borderBottom:i<filtered.length-1?`1px solid ${C.borderL}`:"none", background:"#fff", cursor:"pointer"}}>
                <div style={{fontSize:11, fontWeight:800, color:C.textM, lineHeight:1.2, textAlign:"center"}}>{formatShortDate(tx.date)}</div>
                <div style={{minWidth:0}}>
                  <p style={{fontSize:13, fontWeight:700, color:C.text, margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", lineHeight:1.25}}>{tx.desc}</p>
                  <div style={{display:"flex", alignItems:"center", gap:5, flexWrap:"wrap", marginTop:3}}>
                    <span style={{fontSize:10, color:C.textL, fontWeight:600}}>
                      {tx.type==="income"?"Pemasukan":`${tx.cat || "Pengeluaran"} · ${GROUPS[tx.grp]?.label || "Lain-lain"}`} · {tx.pay}
                    </span>
                    <Badge bg={STATUS[tx.status]?.bg} color={STATUS[tx.status]?.color}>{STATUS[tx.status]?.label}</Badge>
                    {goalName && (
                      <span style={{fontSize:10, color:C.priD, background:C.priL, borderRadius:5, padding:"1px 6px", fontWeight:700}}>
                        Goal: {goalName}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{display:"flex", flexDirection:"column", alignItems:"flex-end", gap:5}}>
                  <p style={{fontSize:13, fontWeight:800, color:tx.type==="income"?C.pri:C.red, margin:0, whiteSpace:"nowrap"}}>
                    {tx.type==="income"?"+":"-"}{fmtS(tx.amt)}
                  </p>
                  <div style={{display:"flex", gap:4, justifyContent:"flex-end", flexWrap:"wrap"}}>
                    {tx.type==="income" && tx.status==="estimasi" && (
                      <button onClick={e=>{e.stopPropagation(); onDone(tx.id);}} style={{background:C.priL, color:C.priD, border:"none", borderRadius:7, padding:"4px 6px", fontSize:10, fontWeight:800, cursor:"pointer"}}>Diterima</button>
                    )}
                    {tx.status==="belum_selesai" && (
                      <button onClick={e=>{e.stopPropagation(); onDone(tx.id);}} style={{background:C.priL, color:C.priD, border:"none", borderRadius:7, padding:"4px 6px", fontSize:10, fontWeight:800, cursor:"pointer"}}>Lunas</button>
                    )}
                    <button onClick={e=>{e.stopPropagation(); onCopy?.(tx);}} style={{background:C.blueL, color:C.blue, border:"none", borderRadius:7, padding:"4px 6px", fontSize:10, fontWeight:800, cursor:"pointer", display:"flex", alignItems:"center", gap:3}}>
                      <Copy size={11}/> Copy
                    </button>
                    <button onClick={e=>{e.stopPropagation(); openEdit(tx);}} style={{background:C.borderL, color:C.textM, border:"none", borderRadius:7, padding:"4px 6px", fontSize:10, fontWeight:800, cursor:"pointer"}}>Edit</button>
                    <button onClick={e=>{e.stopPropagation(); onDelete(tx.id);}} aria-label="Hapus transaksi" style={{background:"#fef2f2", color:C.red, border:"none", borderRadius:7, padding:"4px 6px", cursor:"pointer", display:"flex"}}>
                      <Trash2 size={12}/>
                    </button>
                  </div>
                </div>
              </div>
            );
            })}
          </div>
        )}
      </div>
      {deleteOpen && <DeletePeriodSheet txs={allTxs} initialPeriod={period} onDelete={onDeletePeriod} onClose={()=>setDeleteOpen(false)}/>}
    </div>
  );
};

export default TxListScreen;
