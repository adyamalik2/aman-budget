import { useState } from "react";
import { Check, Fingerprint, Lock, ShieldCheck, X } from "lucide-react";
import Header from "../components/layout/Header";
import { C } from "../constants/theme";
import { verifyPin } from "../utils/lock";

const card = {background:"#fff", borderRadius:16, padding:"14px 16px", border:`1px solid ${C.borderL}`, boxShadow:"0 1px 4px rgba(0,0,0,0.03)"};
const inp = {width:"100%", border:`1.5px solid ${C.border}`, borderRadius:12, padding:"12px 14px", fontSize:18, letterSpacing:6, textAlign:"center", outline:"none", boxSizing:"border-box", background:"#fff", color:C.text, fontWeight:700};
const lbl = {fontSize:12, fontWeight:600, color:C.textM, display:"block", marginBottom:6};
const primaryBtn = {background:C.pri, color:"#fff", border:"none", borderRadius:14, padding:"14px", fontSize:14, fontWeight:800, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8};
const ghostBtn = {background:"#fff", border:`1px solid ${C.border}`, borderRadius:14, padding:"14px", fontSize:14, fontWeight:800, color:C.textM, cursor:"pointer"};

const onlyDigits = value => (value || "").replace(/\D/g, "").slice(0, 6);

const SecurityScreen = ({lockConfig = {}, onSetPin, onDisableLock, setSubPage}) => {
  const enabled = lockConfig.enabled === true;
  const [mode, setMode] = useState(null); // null | "setup" | "change" | "disable"
  const [current, setCurrent] = useState("");
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState("");

  const reset = () => { setMode(null); setCurrent(""); setPin(""); setConfirm(""); setErr(""); };

  const validateNew = () => {
    if(pin.length < 4) return "PIN minimal 4 angka.";
    if(pin !== confirm) return "PIN dan ulangi PIN tidak sama.";
    return "";
  };

  const handleSubmit = () => {
    if(mode === "disable") {
      if(!verifyPin(current, lockConfig)) { setErr("PIN saat ini salah."); return; }
      onDisableLock?.();
      reset();
      alert("Kunci PIN dimatikan.");
      return;
    }
    if(mode === "change" && !verifyPin(current, lockConfig)) { setErr("PIN saat ini salah."); return; }
    const v = validateNew();
    if(v) { setErr(v); return; }
    onSetPin?.(pin);
    reset();
    alert(mode === "change" ? "PIN berhasil diganti." : "Kunci PIN aktif. App akan meminta PIN saat dibuka kembali.");
  };

  const formTitle = mode === "setup" ? "Buat PIN" : mode === "change" ? "Ganti PIN" : "Matikan Kunci PIN";

  return (
    <div style={{flex:1, overflowY:"auto", paddingBottom:92, background:C.bg}}>
      <Header title="Keamanan & Privasi" subtitle="Kunci aplikasi & data" onBack={()=>setSubPage(null)}/>

      <div style={{padding:"14px", display:"flex", flexDirection:"column", gap:12}}>
        {/* Privacy info */}
        <div style={{...card, background:C.priBg}}>
          <p style={{fontSize:11, color:C.priD, margin:0, lineHeight:1.5}}>
            Data AMAN Budget disimpan di perangkat Anda. Backup ke cloud hanya berjalan saat Anda login Google dan menekan Backup. Data tidak dibagikan ke pihak ketiga.
          </p>
        </div>

        {/* Lock status */}
        <div style={card}>
          <div style={{display:"flex", alignItems:"center", gap:12, marginBottom:mode?14:12}}>
            <div style={{width:42, height:42, borderRadius:13, background:enabled?C.priL:C.borderL, color:enabled?C.priD:C.textM, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>
              <Lock size={20}/>
            </div>
            <div style={{flex:1, minWidth:0}}>
              <p style={{fontSize:14, fontWeight:800, color:C.text, margin:0}}>Kunci PIN</p>
              <p style={{fontSize:11, color:enabled?C.priD:C.textM, margin:"2px 0 0", fontWeight:700}}>{enabled ? "Aktif — diminta saat app dibuka" : "Nonaktif"}</p>
            </div>
            {mode && (
              <button type="button" onClick={reset} aria-label="Batal" style={{background:C.borderL, border:"none", borderRadius:10, padding:8, cursor:"pointer", display:"flex"}}>
                <X size={16} color={C.textM}/>
              </button>
            )}
          </div>

          {!mode && (
            <div style={{display:"flex", flexDirection:"column", gap:8}}>
              {!enabled ? (
                <button type="button" onClick={()=>{reset(); setMode("setup");}} style={primaryBtn}>
                  <ShieldCheck size={17}/> Aktifkan Kunci PIN
                </button>
              ) : (
                <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8}}>
                  <button type="button" onClick={()=>{reset(); setMode("change");}} style={ghostBtn}>Ganti PIN</button>
                  <button type="button" onClick={()=>{reset(); setMode("disable");}} style={{...ghostBtn, color:C.red, borderColor:C.redL}}>Matikan Kunci</button>
                </div>
              )}
            </div>
          )}

          {mode && (
            <div style={{display:"flex", flexDirection:"column", gap:12}}>
              <p style={{fontSize:13, fontWeight:800, color:C.text, margin:0}}>{formTitle}</p>
              {(mode === "change" || mode === "disable") && (
                <div>
                  <label style={lbl}>PIN Saat Ini</label>
                  <input type="password" inputMode="numeric" style={inp} value={current} onChange={e=>{setCurrent(onlyDigits(e.target.value)); setErr("");}} placeholder="••••"/>
                </div>
              )}
              {mode !== "disable" && (
                <>
                  <div>
                    <label style={lbl}>PIN Baru (4-6 angka)</label>
                    <input type="password" inputMode="numeric" style={inp} value={pin} onChange={e=>{setPin(onlyDigits(e.target.value)); setErr("");}} placeholder="••••"/>
                  </div>
                  <div>
                    <label style={lbl}>Ulangi PIN Baru</label>
                    <input type="password" inputMode="numeric" style={inp} value={confirm} onChange={e=>{setConfirm(onlyDigits(e.target.value)); setErr("");}} placeholder="••••"/>
                  </div>
                </>
              )}
              {err && <p style={{fontSize:11, color:C.red, margin:0, fontWeight:700}}>{err}</p>}
              <button type="button" onClick={handleSubmit} style={mode === "disable" ? {...primaryBtn, background:C.red} : primaryBtn}>
                <Check size={17}/> {mode === "disable" ? "Matikan Kunci" : "Simpan PIN"}
              </button>
            </div>
          )}
        </div>

        {/* Biometric (segera) */}
        <div style={{...card, opacity:0.7}}>
          <div style={{display:"flex", alignItems:"center", gap:12}}>
            <div style={{width:42, height:42, borderRadius:13, background:C.borderL, color:C.textM, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>
              <Fingerprint size={20}/>
            </div>
            <div style={{flex:1, minWidth:0}}>
              <p style={{fontSize:14, fontWeight:800, color:C.text, margin:0}}>Buka dengan Sidik Jari / Wajah</p>
              <p style={{fontSize:11, color:C.textM, margin:"2px 0 0"}}>Segera hadir di pembaruan berikutnya.</p>
            </div>
            <span style={{fontSize:9, fontWeight:800, color:C.textM, background:C.borderL, borderRadius:999, padding:"4px 8px"}}>SEGERA</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityScreen;
