import { useState } from "react";
import { CheckCircle2, Crown, Shield, X } from "lucide-react";
import { C } from "../constants/theme";
import { fmtS } from "../utils/format";

const card = {background:"#fff", borderRadius:20, padding:"16px", border:`1px solid ${C.borderL}`, boxShadow:"0 2px 8px rgba(0,0,0,0.05)"};

const FREE_ITEMS = [
  "Maksimal 3 goals",
  "Backup JSON manual",
  "Laporan dasar",
  "Data tersimpan lokal",
];

const PRO_ITEMS = [
  "Unlimited goals",
  "Export laporan lebih lengkap",
  "Reminder budget",
  "Statistik lebih detail",
  "Prioritas fitur baru",
  "Siap cloud sync nanti",
];

const PLANS = [
  {id:"monthly", label:"Bulanan", price:19000, period:"/bulan"},
  {id:"yearly",  label:"Tahunan", price:149000, period:"/tahun", popular:true},
];

const UpgradeScreen = ({setSubPage}) => {
  const [plan, setPlan] = useState("yearly");

  return (
    <div style={{flex:1, overflowY:"auto", paddingBottom:32, background:C.bg}}>

      {/* Header */}
      <div style={{background:`linear-gradient(160deg, ${C.pri} 0%, ${C.priD} 100%)`, padding:"42px 16px 28px", color:"#fff", borderBottomLeftRadius:24, borderBottomRightRadius:24}}>
        <button onClick={()=>setSubPage(null)}
          style={{background:"rgba(255,255,255,0.2)", border:"none", borderRadius:10, padding:8, cursor:"pointer", color:"#fff", display:"flex", marginBottom:14}}>
          <X size={18}/>
        </button>
        <div style={{textAlign:"center"}}>
          <div style={{width:64, height:64, background:"rgba(255,255,255,0.18)", borderRadius:20, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 12px"}}>
            <Crown size={32} color={C.gold}/>
          </div>
          <p style={{fontSize:24, fontWeight:800, margin:0, letterSpacing:-0.5}}>AMAN Budget Pro</p>
          <p style={{fontSize:13, opacity:0.9, margin:"6px 0 0"}}>Kelola budget keluarga lebih leluasa</p>
        </div>
      </div>

      <div style={{padding:"16px", display:"flex", flexDirection:"column", gap:14}}>

        {/* Free vs Pro comparison */}
        <div style={card}>
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:0}}>

            {/* Free column */}
            <div style={{paddingRight:12}}>
              <p style={{fontSize:11, fontWeight:800, color:C.textM, margin:"0 0 10px", textAlign:"center", letterSpacing:0.5}}>GRATIS</p>
              <div style={{display:"flex", flexDirection:"column", gap:8}}>
                {FREE_ITEMS.map((item,i)=>(
                  <div key={i} style={{display:"flex", alignItems:"flex-start", gap:6}}>
                    <CheckCircle2 size={13} color={C.textL} style={{flexShrink:0, marginTop:2}}/>
                    <span style={{fontSize:11, color:C.textM, lineHeight:1.45}}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pro column */}
            <div style={{borderLeft:`1px solid ${C.borderL}`, paddingLeft:12}}>
              <p style={{fontSize:11, fontWeight:800, color:C.pri, margin:"0 0 10px", textAlign:"center", letterSpacing:0.5}}>PRO ✦</p>
              <div style={{display:"flex", flexDirection:"column", gap:8}}>
                {PRO_ITEMS.map((item,i)=>(
                  <div key={i} style={{display:"flex", alignItems:"flex-start", gap:6}}>
                    <CheckCircle2 size={13} color={C.pri} style={{flexShrink:0, marginTop:2}}/>
                    <span style={{fontSize:11, color:C.text, lineHeight:1.45}}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div style={{display:"flex", flexDirection:"column", gap:8}}>
          <p style={{fontSize:13, fontWeight:700, color:C.text, margin:0}}>Pilih Paket</p>
          {PLANS.map(p=>(
            <button key={p.id} onClick={()=>setPlan(p.id)} style={{
              background:"#fff", borderRadius:16, padding:"13px 16px",
              border: plan===p.id ? `2px solid ${C.pri}` : `2px solid ${C.borderL}`,
              cursor:"pointer", display:"flex", alignItems:"center", gap:12, textAlign:"left",
              boxShadow: plan===p.id ? `0 4px 14px rgba(22,163,74,0.15)` : "none",
              position:"relative",
            }}>
              {p.popular && (
                <span style={{position:"absolute", top:-9, right:14, background:C.pri, color:"#fff", fontSize:10, fontWeight:800, padding:"3px 8px", borderRadius:6, letterSpacing:0.3}}>
                  TERPOPULER
                </span>
              )}
              <div style={{width:22, height:22, borderRadius:"50%", border: plan===p.id ? `7px solid ${C.pri}` : `2px solid ${C.border}`, flexShrink:0}}/>
              <div style={{flex:1}}>
                <p style={{fontSize:14, fontWeight:700, color:C.text, margin:0}}>{p.label}</p>
              </div>
              <div style={{textAlign:"right"}}>
                <p style={{fontSize:16, fontWeight:800, color: plan===p.id ? C.pri : C.text, margin:0}}>{fmtS(p.price)}</p>
                <p style={{fontSize:10, color:C.textM, margin:0}}>{p.period}</p>
              </div>
            </button>
          ))}
          <p style={{fontSize:10, color:C.textM, margin:"2px 0 0", textAlign:"center", fontStyle:"italic"}}>
            Rencana harga, bisa berubah saat rilis resmi
          </p>
        </div>

        {/* Status note */}
        <div style={{background:C.priBg, borderRadius:14, padding:"12px 14px", display:"flex", alignItems:"flex-start", gap:10}}>
          <Shield size={20} color={C.pri} style={{flexShrink:0, marginTop:1}}/>
          <p style={{fontSize:11, color:C.priD, lineHeight:1.6, margin:0}}>
            Saat ini fitur Pro masih dalam tahap persiapan.<br/>
            <b>Semua data tetap aman di perangkat Anda.</b>
          </p>
        </div>

        {/* CTA */}
        <button
          onClick={()=>alert("Fitur pembayaran Google Play Billing akan diaktifkan saat aplikasi resmi rilis.")}
          style={{background:`linear-gradient(135deg, ${C.pri}, ${C.priD})`, border:"none", borderRadius:16, padding:"16px", color:"#fff", fontSize:15, fontWeight:800, cursor:"pointer", boxShadow:`0 6px 20px rgba(22,163,74,0.35)`, display:"flex", alignItems:"center", justifyContent:"center", gap:8}}>
          <Crown size={18} color={C.gold}/> Upgrade ke Pro
        </button>

        <p style={{textAlign:"center", fontSize:10, color:C.textL, margin:0, lineHeight:1.6}}>
          Pembayaran dikelola Google Play · Bisa dibatalkan kapan saja
        </p>
      </div>
    </div>
  );
};

export default UpgradeScreen;
