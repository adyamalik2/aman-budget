import { useState } from "react";
import { CheckCircle2, Crown, Shield, X, Zap } from "lucide-react";
import { C } from "../constants/theme";
import { fmtS } from "../utils/format";

const card = {background:"#fff", borderRadius:16, padding:"14px 16px", border:`1px solid ${C.borderL}`, boxShadow:"0 1px 4px rgba(0,0,0,0.03)"};

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

export default UpgradeScreen;
