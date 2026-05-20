import { ChevronRight, Crown, GraduationCap, Plane, Plus, Shield } from "lucide-react";
import Header from "../components/layout/Header";
import { C } from "../constants/theme";
import { fmt, fmtS } from "../utils/format";

const card = {background:"#fff", borderRadius:16, padding:"14px 16px", border:`1px solid ${C.borderL}`, boxShadow:"0 1px 4px rgba(0,0,0,0.03)"};

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

export default GoalsScreen;
