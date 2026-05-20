import {
  ArrowRightLeft, Bell, Calculator, ChevronRight, CreditCard, Crown,
  FileDown, LayoutGrid, LogOut, Receipt, Shield, Star, Upload, Users
} from "lucide-react";
import Header from "../components/layout/Header";
import Badge from "../components/ui/Badge";
import { C } from "../constants/theme";

const card = {background:"#fff", borderRadius:16, padding:"14px 16px", border:`1px solid ${C.borderL}`, boxShadow:"0 1px 4px rgba(0,0,0,0.03)"};

const MoreScreen = ({setSubPage, openUpgrade, isPro = false, onLogout, onExportBackup, onImportBackup}) => {
  const items = [
    {icon:ArrowRightLeft, label:"Transfer Planner", desc:"Alokasi per anggota keluarga", action:()=>setSubPage("transfer"), color:C.blue},
    {icon:Calculator, label:"Kalkulator Zakat", desc:"Hitung zakat penghasilan 2.5%", action:()=>setSubPage("zakat"), color:C.pri},
    {icon:Users, label:"Family Sync", desc:"Sync data dengan pasangan", pro:true, color:"#ec4899"},
    {icon:Bell, label:"Reminder Tagihan", desc:"Notif jatuh tempo otomatis", pro:true, color:C.gold},
    {icon:FileDown, label:"Export Laporan", desc:"PDF & Excel untuk arsip", pro:true, color:"#8b5cf6", action: isPro ? ()=>setSubPage("share") : null},
    {icon:Receipt, label:"OCR Struk", desc:"Scan struk otomatis", pro:true, color:"#06b6d4"},
  ];
  const backupBtnStyle = {
    flex:1,
    padding:"12px",
    borderRadius:12,
    border:`1.5px solid ${C.border}`,
    background:"#fff",
    color:C.text,
    fontSize:12,
    fontWeight:800,
    cursor:"pointer",
    display:"flex",
    alignItems:"center",
    justifyContent:"center",
    gap:7,
    boxSizing:"border-box",
  };
  const handleImportFile = e => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if(file) onImportBackup(file);
  };

  return (
    <div style={{flex:1, overflowY:"auto", paddingBottom:92, background:C.bg}}>
      <Header title="Lainnya"/>

      <div style={{padding:"14px", display:"flex", flexDirection:"column", gap:12}}>
        {/* Profile card */}
        <div style={card}>
          <div style={{display:"flex", alignItems:"center", gap:12}}>
            <div style={{width:54, height:54, background:`linear-gradient(135deg, ${C.pri}, ${C.priD})`, borderRadius:16, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:22, fontWeight:800}}>M</div>
            <div style={{flex:1}}>
              <p style={{fontSize:15, fontWeight:700, color:C.text, margin:0}}>Malik</p>
              <p style={{fontSize:11, color:C.textM, margin:"2px 0"}}>malik@amandigital.web.id</p>
              <Badge bg={C.borderL} color={C.textM}>FREE PLAN</Badge>
            </div>
            <button style={{background:"none", border:"none", cursor:"pointer", color:C.textM, padding:0}}>
              <ChevronRight size={20}/>
            </button>
          </div>
        </div>

        {/* Upgrade banner */}
        <button onClick={openUpgrade} style={{background:`linear-gradient(135deg, ${C.gold}, #b45309)`, border:"none", borderRadius:18, padding:"16px", cursor:"pointer", color:"#fff", display:"flex", alignItems:"center", gap:12, textAlign:"left", boxShadow:"0 6px 20px rgba(217,119,6,0.3)"}}>
          <div style={{width:44, height:44, background:"rgba(255,255,255,0.2)", borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>
            <Crown size={24} color="#fff"/>
          </div>
          <div style={{flex:1}}>
            <p style={{fontSize:15, fontWeight:800, margin:0}}>Upgrade ke Pro</p>
            <p style={{fontSize:11, opacity:0.9, margin:"2px 0 0"}}>Buka semua fitur premium · Mulai Rp 29rb/bulan</p>
          </div>
          <ChevronRight size={20}/>
        </button>

        {/* Features list */}
        <div style={{...card, padding:0}}>
          {items.map((it, i) => (
            <button key={i} onClick={it.action || openUpgrade} style={{width:"100%", padding:"14px 16px", background:"none", border:"none", borderTop: i>0?`1px solid ${C.borderL}`:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:12, textAlign:"left"}}>
              <div style={{width:38, height:38, borderRadius:11, background:it.color+"15", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>
                <it.icon size={18} color={it.color}/>
              </div>
              <div style={{flex:1}}>
                <div style={{display:"flex", alignItems:"center", gap:6}}>
                  <p style={{fontSize:13, fontWeight:700, color:C.text, margin:0}}>{it.label}</p>
                  {it.pro && <Badge bg={C.goldL} color={C.goldD}>PRO</Badge>}
                </div>
                <p style={{fontSize:11, color:C.textM, margin:"2px 0 0"}}>{it.desc}</p>
              </div>
              <ChevronRight size={16} color={C.textL}/>
            </button>
          ))}
        </div>

        {/* Backup data */}
        <div style={card}>
          <div style={{display:"flex", alignItems:"flex-start", gap:10, marginBottom:12}}>
            <div style={{width:38, height:38, borderRadius:11, background:C.priL, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>
              <FileDown size={18} color={C.pri}/>
            </div>
            <div style={{flex:1}}>
              <p style={{fontSize:13, fontWeight:800, color:C.text, margin:0}}>Backup Data</p>
              <p style={{fontSize:11, color:C.textM, margin:"2px 0 0", lineHeight:1.4}}>Simpan atau pulihkan transaksi, goals, akun, dan periode.</p>
            </div>
          </div>
          <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
            <button onClick={onExportBackup} style={{...backupBtnStyle, color:C.pri, borderColor:C.pri}}>
              <FileDown size={15}/> Export Backup
            </button>
            <label style={backupBtnStyle}>
              <Upload size={15}/> Import Backup
              <input type="file" accept="application/json,.json" onChange={handleImportFile} style={{display:"none"}}/>
            </label>
          </div>
        </div>

        {/* Settings */}
        <div style={{...card, padding:0}}>
          {[
            {icon:CreditCard, label:"Kelola Rekening"},
            {icon:LayoutGrid, label:"Kategori & Grup"},
            {icon:Shield, label:"Keamanan & Privasi"},
            {icon:Star, label:"Beri Rating"},
          ].map((it, i) => (
            <button key={i} style={{width:"100%", padding:"12px 16px", background:"none", border:"none", borderTop: i>0?`1px solid ${C.borderL}`:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:12, textAlign:"left"}}>
              <it.icon size={18} color={C.textM}/>
              <span style={{flex:1, fontSize:13, fontWeight:600, color:C.text}}>{it.label}</span>
              <ChevronRight size={14} color={C.textL}/>
            </button>
          ))}
        </div>

        <button onClick={onLogout} style={{...card, color:C.red, border:"none", display:"flex", alignItems:"center", justifyContent:"center", gap:8, fontSize:13, fontWeight:700, cursor:"pointer"}}>
          <LogOut size={16}/> Keluar Akun
        </button>

        <p style={{textAlign:"center", fontSize:10, color:C.textL, marginTop:4}}>
          AMAN Budget v1.0.0 · © 2026 AMAN Digital<br/>amandigital.web.id
        </p>
      </div>
    </div>
  );
};

export default MoreScreen;
