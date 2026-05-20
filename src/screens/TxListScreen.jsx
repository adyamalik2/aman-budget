import { useMemo, useState } from "react";
import { ChevronLeft, Filter, Search, Trash2 } from "lucide-react";
import PeriodPicker from "../components/period/PeriodPicker";
import Badge from "../components/ui/Badge";
import Pill from "../components/ui/Pill";
import DeletePeriodSheet from "../features/transactions/DeletePeriodSheet";
import { GROUPS, STATUS } from "../constants/app";
import { C } from "../constants/theme";
import { fmtS } from "../utils/format";
import { formatPeriodLabel, formatShortDate } from "../utils/period";

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

export default TxListScreen;
