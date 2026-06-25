import { useState } from "react";
import { Delete, Lock, Shield } from "lucide-react";
import { C } from "../constants/theme";
import { verifyPin } from "../utils/lock";

const LockScreen = ({config, onUnlock}) => {
  const len = Number(config?.len) || 6;
  const [entered, setEntered] = useState("");
  const [error, setError] = useState(false);

  const submit = pin => {
    if(verifyPin(pin, config)) {
      onUnlock();
    } else {
      setError(true);
      setTimeout(() => { setEntered(""); setError(false); }, 600);
    }
  };

  const press = digit => {
    if(entered.length >= len) return;
    const next = entered + digit;
    setError(false);
    setEntered(next);
    if(next.length === len) submit(next);
  };

  const backspace = () => { setError(false); setEntered(prev => prev.slice(0, -1)); };

  const keys = ["1","2","3","4","5","6","7","8","9","","0","del"];

  return (
    <div style={{minHeight:"100vh", background:`linear-gradient(180deg, ${C.priBg} 0%, #fff 45%, ${C.bg} 100%)`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"28px 24px", boxSizing:"border-box", fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"}}>
      <div style={{width:72, height:72, borderRadius:22, background:`linear-gradient(145deg, ${C.pri}, ${C.priD})`, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:16, boxShadow:"0 12px 30px rgba(22,163,74,0.28)"}}>
        <Shield size={36} color="#fff" strokeWidth={2.4}/>
      </div>
      <p style={{fontSize:18, fontWeight:800, color:C.text, margin:"0 0 4px"}}>AMAN Budget Terkunci</p>
      <p style={{fontSize:13, color:C.textM, margin:"0 0 22px", display:"flex", alignItems:"center", gap:6}}>
        <Lock size={13}/> Masukkan PIN Anda
      </p>

      {/* PIN dots */}
      <div style={{display:"flex", gap:14, marginBottom:26}}>
        {Array.from({length:len}).map((_, i) => (
          <div key={i} style={{
            width:14, height:14, borderRadius:"50%",
            background: i < entered.length ? (error ? C.red : C.pri) : "transparent",
            border:`2px solid ${error ? C.red : (i < entered.length ? C.pri : C.border)}`,
            transition:"all .15s",
          }}/>
        ))}
      </div>
      <p style={{fontSize:12, color:C.red, height:16, margin:"0 0 14px", fontWeight:700}}>{error ? "PIN salah, coba lagi" : ""}</p>

      {/* Keypad */}
      <div style={{display:"grid", gridTemplateColumns:"repeat(3, 72px)", gap:14}}>
        {keys.map((k, i) => {
          if(k === "") return <div key={i}/>;
          if(k === "del") return (
            <button key={i} type="button" onClick={backspace} aria-label="Hapus" style={{width:72, height:72, borderRadius:"50%", border:"none", background:"transparent", color:C.textM, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer"}}>
              <Delete size={24}/>
            </button>
          );
          return (
            <button key={i} type="button" onClick={()=>press(k)} style={{width:72, height:72, borderRadius:"50%", border:`1px solid ${C.borderL}`, background:"#fff", color:C.text, fontSize:26, fontWeight:700, cursor:"pointer", boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
              {k}
            </button>
          );
        })}
      </div>

      <button type="button" onClick={()=>alert("Jika lupa PIN, hapus data aplikasi dari Pengaturan HP lalu buka kembali. Data lokal akan hilang kecuali sudah Anda backup (Export / Cloud).")} style={{marginTop:24, background:"none", border:"none", color:C.textM, fontSize:12, fontWeight:700, cursor:"pointer"}}>
        Lupa PIN?
      </button>
    </div>
  );
};

export default LockScreen;
