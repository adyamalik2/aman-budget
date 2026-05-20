import { Check, Clock, Send, Users } from "lucide-react";
import Header from "../components/layout/Header";
import Badge from "../components/ui/Badge";
import { GROUPS } from "../constants/app";
import { C } from "../constants/theme";
import { fmt, fmtS } from "../utils/format";
import { calcGroups } from "../utils/summary";

const card = {background:"#fff", borderRadius:16, padding:"14px 16px", border:`1px solid ${C.borderL}`, boxShadow:"0 1px 4px rgba(0,0,0,0.03)"};

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

export default TransferScreen;
