import { useState } from "react";
import { Lock, Mail, Shield, Sparkles, Users } from "lucide-react";
import Btn from "../components/ui/Button";
import { C } from "../constants/theme";

const inp = {width:"100%", border:`1.5px solid ${C.border}`, borderRadius:12, padding:"11px 14px", fontSize:14, outline:"none", boxSizing:"border-box", background:"#fff", color:C.text};

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

export default LoginScreen;
