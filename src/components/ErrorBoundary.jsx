import { Component } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { C } from "../constants/theme";

// Menahan error render agar app tidak jadi layar putih total.
// Data tetap aman karena tersimpan di localStorage, bukan di state yang error.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {hasError:false, message:""};
  }

  static getDerivedStateFromError(error) {
    return {hasError:true, message: error?.message || "Terjadi kesalahan tak terduga."};
  }

  componentDidCatch(error, info) {
    // Sengaja hanya dicatat ke console; tidak mengirim ke mana pun.
    console.error("AMAN Budget error:", error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if(!this.state.hasError) return this.props.children;
    return (
      <div style={{minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:"24px 18px", fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"}}>
        <div style={{width:"100%", maxWidth:380, textAlign:"center", background:"#fff", borderRadius:20, padding:"28px 20px", border:`1px solid ${C.borderL}`, boxShadow:"0 6px 24px rgba(0,0,0,0.06)"}}>
          <div style={{width:60, height:60, borderRadius:18, background:C.redL, color:C.red, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px"}}>
            <AlertTriangle size={30}/>
          </div>
          <p style={{fontSize:17, fontWeight:800, color:C.text, margin:"0 0 6px"}}>Ups, terjadi kesalahan</p>
          <p style={{fontSize:13, color:C.textM, lineHeight:1.55, margin:"0 0 18px"}}>
            Jangan khawatir — <b style={{color:C.text}}>data keuangan Anda tetap tersimpan aman</b> di perangkat. Coba muat ulang aplikasi.
          </p>
          <button type="button" onClick={this.handleReload} style={{width:"100%", border:"none", borderRadius:14, padding:"14px", background:C.pri, color:"#fff", fontSize:14, fontWeight:800, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8, boxShadow:"0 8px 20px rgba(22,163,74,0.25)"}}>
            <RefreshCw size={16}/> Muat Ulang
          </button>
          {this.state.message && (
            <p style={{fontSize:10, color:C.textL, margin:"14px 0 0", wordBreak:"break-word"}}>Detail: {this.state.message}</p>
          )}
        </div>
      </div>
    );
  }
}
