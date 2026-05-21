import { ArrowRight, Cloud, Shield } from "lucide-react";
import { C } from "../constants/theme";

const WelcomeScreen = ({onGoogleLogin, onContinueLocal, busy = false}) => (
  <div style={{minHeight:"100vh", background:`linear-gradient(180deg, ${C.priBg} 0%, #fff 42%, ${C.bg} 100%)`, display:"flex", alignItems:"center", justifyContent:"center", padding:"28px 18px", boxSizing:"border-box"}}>
    <div style={{width:"100%", maxWidth:380, textAlign:"center"}}>
      <div style={{width:82, height:82, borderRadius:26, background:`linear-gradient(145deg, ${C.pri}, ${C.priD})`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 18px", boxShadow:"0 14px 34px rgba(22,163,74,0.28)"}}>
        <Shield size={42} color="#fff" strokeWidth={2.4}/>
      </div>
      <p style={{fontSize:12, color:C.priD, fontWeight:800, letterSpacing:1, margin:"0 0 8px"}}>AMAN DIGITAL</p>
      <h1 style={{fontSize:32, lineHeight:1.08, color:C.text, margin:"0 0 10px", fontWeight:900}}>AMAN Budget</h1>
      <p style={{fontSize:14, lineHeight:1.65, color:C.textM, margin:"0 auto 28px", maxWidth:300}}>
        Catat, rencanakan, dan backup keuangan keluarga dengan tenang.
      </p>

      <button type="button" disabled={busy} onClick={onGoogleLogin} style={{width:"100%", border:"none", borderRadius:16, padding:"14px 16px", background:C.pri, color:"#fff", fontSize:14, fontWeight:800, cursor:busy?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:10, boxShadow:"0 12px 24px rgba(22,163,74,0.25)", opacity:busy?0.72:1}}>
        <span style={{width:24, height:24, borderRadius:"50%", background:"#fff", color:C.priD, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:900}}>G</span>
        {busy ? "Menghubungkan..." : "Masuk dengan Google"}
        <ArrowRight size={16}/>
      </button>

      <button type="button" onClick={onContinueLocal} style={{marginTop:14, background:"transparent", border:"none", color:C.textM, fontSize:13, fontWeight:700, cursor:"pointer", display:"inline-flex", alignItems:"center", gap:6}}>
        <Cloud size={14}/> Lanjutkan Tanpa Login (Mode Lokal)
      </button>
    </div>
  </div>
);

export default WelcomeScreen;
