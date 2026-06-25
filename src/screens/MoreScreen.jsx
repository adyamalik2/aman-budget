import { useState } from "react";
import {
  ArrowRightLeft, Bell, Calculator, ChevronRight, CreditCard, Crown,
  FileDown, LayoutGrid, LogOut, Receipt, RotateCcw, Shield, Star, Trash2, Upload, Users, X
} from "lucide-react";
import Header from "../components/layout/Header";
import Badge from "../components/ui/Badge";
import { STATUS } from "../constants/app";
import { C } from "../constants/theme";
import { fmtS } from "../utils/format";
import { formatShortDate } from "../utils/period";

const card = {background:"#fff", borderRadius:16, padding:"14px 16px", border:`1px solid ${C.borderL}`, boxShadow:"0 1px 4px rgba(0,0,0,0.03)"};

const MoreScreen = ({
  setSubPage,
  openUpgrade,
  isPro = false,
  onLogout,
  onExportBackup,
  onImportBackup,
  backupMeta = {},
  cloudUser,
  cloudBusy = false,
  hasUnsyncedChanges = false,
  onCloudLogin,
  onCloudLogout,
  onCloudBackup,
  onCloudRestore,
  deletedTxs = [],
  onRestoreTx,
  onPermanentDeleteTx,
}) => {
  const [trashOpen, setTrashOpen] = useState(false);
  const cloudEmail = cloudUser?.email || "";
  const cloudNameFallback = cloudEmail ? cloudEmail.split("@")[0] : "Pengguna";
  const profileName = cloudUser ? (cloudUser.displayName || cloudNameFallback) : "Malik (Lokal)";
  const profileSubtitle = cloudUser ? (cloudEmail || "Email tidak tersedia") : "Mode Lokal - Data di HP";
  const profileInitial = profileName.trim().charAt(0).toUpperCase() || "P";
  const formatMetaDate = value => {
    if(!value) return "Belum ada";
    const date = new Date(value);
    if(Number.isNaN(date.getTime())) return "Belum ada";
    return date.toLocaleString("id-ID", {day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit"});
  };
  const backupRows = [
    ["Mode data", cloudUser ? "Cloud login" : "Lokal"],
    ["Email", cloudUser?.email || "Mode Lokal"],
    ["Backup cloud terakhir", formatMetaDate(backupMeta.lastCloudBackupAt)],
    ["Restore cloud terakhir", formatMetaDate(backupMeta.lastCloudRestoreAt)],
    ["Export lokal terakhir", formatMetaDate(backupMeta.lastLocalExportAt)],
    ["Import lokal terakhir", formatMetaDate(backupMeta.lastLocalImportAt)],
  ];
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
  const cloudBtnStyle = {
    ...backupBtnStyle,
    opacity: cloudBusy ? 0.65 : 1,
    cursor: cloudBusy ? "not-allowed" : "pointer",
  };
  const deletedList = [...deletedTxs].sort((a,b)=>(b.deletedAt || "").localeCompare(a.deletedAt || ""));
  const cloudStatusLabel = hasUnsyncedChanges ? "Ada perubahan baru yang belum dibackup." : "Data terakhir sudah dibackup manual.";

  return (
    <div style={{flex:1, overflowY:"auto", paddingBottom:92, background:C.bg}}>
      <Header title="Lainnya"/>

      <div style={{padding:"14px", display:"flex", flexDirection:"column", gap:12}}>
        {/* Profile card */}
        <div style={card}>
          <div style={{display:"flex", alignItems:"center", gap:12}}>
            <div style={{width:54, height:54, background:`linear-gradient(135deg, ${C.pri}, ${C.priD})`, borderRadius:16, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:22, fontWeight:800}}>{profileInitial}</div>
            <div style={{flex:1}}>
              <p style={{fontSize:15, fontWeight:700, color:C.text, margin:0}}>{profileName}</p>
              <p style={{fontSize:11, color:C.textM, margin:"2px 0"}}>{profileSubtitle}</p>
              {isPro ? <Badge bg={C.goldL} color={C.goldD}>PRO PLAN</Badge> : <Badge bg={C.borderL} color={C.textM}>FREE PLAN</Badge>}
            </div>
          </div>
        </div>

        {/* Upgrade banner */}
        <button onClick={openUpgrade} style={{background:`linear-gradient(135deg, ${C.gold}, #b45309)`, border:"none", borderRadius:18, padding:"16px", cursor:"pointer", color:"#fff", display:"flex", alignItems:"center", gap:12, textAlign:"left", boxShadow:"0 6px 20px rgba(217,119,6,0.3)"}}>
          <div style={{width:44, height:44, background:"rgba(255,255,255,0.2)", borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>
            <Crown size={24} color="#fff"/>
          </div>
          <div style={{flex:1}}>
            <p style={{fontSize:15, fontWeight:800, margin:0}}>Upgrade ke Pro</p>
            <p style={{fontSize:11, opacity:0.9, margin:"2px 0 0"}}>Buka semua fitur premium · Mulai Rp 19rb/bulan</p>
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

        {/* Backup status */}
        <div style={card}>
          <div style={{display:"flex", alignItems:"flex-start", gap:10, marginBottom:10}}>
            <div style={{width:38, height:38, borderRadius:11, background:C.blue+"15", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>
              <Shield size={18} color={C.blue}/>
            </div>
            <div style={{flex:1}}>
              <p style={{fontSize:13, fontWeight:800, color:C.text, margin:0}}>Status Backup</p>
              <p style={{fontSize:11, color:C.textM, margin:"2px 0 0", lineHeight:1.4}}>Riwayat backup dan restore terakhir di perangkat ini.</p>
            </div>
          </div>
          <div style={{display:"flex", flexDirection:"column", gap:7}}>
            {backupRows.map(([label, value])=>(
              <div key={label} style={{display:"flex", justifyContent:"space-between", gap:10, borderTop:`1px solid ${C.borderL}`, paddingTop:7}}>
                <span style={{fontSize:11, color:C.textM}}>{label}</span>
                <span style={{fontSize:11, color:C.text, fontWeight:800, textAlign:"right", wordBreak:"break-word"}}>{value}</span>
              </div>
            ))}
          </div>
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

        {/* Cloud backup */}
        <div style={card}>
          <div style={{display:"flex", alignItems:"flex-start", gap:10, marginBottom:12}}>
            <div style={{width:38, height:38, borderRadius:11, background:C.blue+"15", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>
              <Shield size={18} color={C.blue}/>
            </div>
            <div style={{flex:1}}>
              <p style={{fontSize:13, fontWeight:800, color:C.text, margin:0}}>Cloud Backup</p>
              <p style={{fontSize:11, color:C.textM, margin:"2px 0 0", lineHeight:1.4}}>
                {cloudUser ? `Login sebagai ${cloudUser.email || "Google User"}` : "Login Google untuk backup dan restore data ke cloud."}
              </p>
              {cloudUser && <p style={{fontSize:10, color:hasUnsyncedChanges?C.gold:C.textL, margin:"4px 0 0"}}>{cloudStatusLabel}</p>}
            </div>
          </div>
          {!cloudUser ? (
            <button disabled={cloudBusy} onClick={onCloudLogin} style={{...cloudBtnStyle, width:"100%", color:C.blue, borderColor:C.blue}}>
              <Shield size={15}/> {cloudBusy ? "Memproses..." : "Login Google"}
            </button>
          ) : (
            <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
              <button disabled={cloudBusy} onClick={onCloudBackup} style={{...cloudBtnStyle, color:C.pri, borderColor:C.pri}}>
                <Upload size={15}/> Backup Cloud
              </button>
              <button disabled={cloudBusy} onClick={onCloudRestore} style={{...cloudBtnStyle, color:C.blue, borderColor:C.blue}}>
                <FileDown size={15}/> Restore Cloud
              </button>
              <button disabled={cloudBusy} onClick={onCloudLogout} style={{...cloudBtnStyle, color:C.red, borderColor:C.red}}>
                <LogOut size={15}/> Logout Google
              </button>
            </div>
          )}
        </div>

        {/* Settings */}
        <div style={{...card, padding:0}}>
          {[
            {icon:CreditCard, label:"Kelola Rekening", action:()=>setSubPage("accounts")},
            {icon:LayoutGrid, label:"Kategori & Grup", action:()=>setSubPage("category-groups")},
            {icon:Trash2, label:"Tong Sampah", action:()=>setTrashOpen(true)},
            {icon:Shield, label:"Keamanan & Privasi", action:()=>setSubPage("security")},
            {icon:Star, label:"Beri Rating", action:()=>alert("Terima kasih! 🙏\n\nFitur beri rating akan aktif setelah AMAN Budget rilis resmi di Google Play.")},
          ].map((it, i) => (
            <button key={i} onClick={it.action} style={{width:"100%", padding:"12px 16px", background:"none", border:"none", borderTop: i>0?`1px solid ${C.borderL}`:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:12, textAlign:"left"}}>
              <it.icon size={18} color={C.textM}/>
              <span style={{flex:1, fontSize:13, fontWeight:600, color:C.text}}>{it.label}</span>
              <ChevronRight size={14} color={C.textL}/>
            </button>
          ))}
        </div>

        <button onClick={()=>{if(window.confirm("Keluar dari akun? Data tetap tersimpan di perangkat ini.")) onLogout();}} style={{...card, color:C.red, border:"none", display:"flex", alignItems:"center", justifyContent:"center", gap:8, fontSize:13, fontWeight:700, cursor:"pointer"}}>
          <LogOut size={16}/> Keluar Akun
        </button>

        <p style={{textAlign:"center", fontSize:10, color:C.textL, marginTop:4}}>
          AMAN Budget v1.1.0 · © 2026 AMAN Digital<br/>amandigital.web.id
        </p>
      </div>
      {trashOpen && (
        <div style={{position:"fixed", inset:0, background:"rgba(15,23,42,0.45)", zIndex:60, display:"flex", alignItems:"flex-end", justifyContent:"center"}}>
          <div style={{width:"100%", maxWidth:430, maxHeight:"82vh", background:"#fff", borderTopLeftRadius:22, borderTopRightRadius:22, boxShadow:"0 -16px 40px rgba(15,23,42,0.22)", display:"flex", flexDirection:"column"}}>
            <div style={{padding:"16px 16px 12px", borderBottom:`1px solid ${C.borderL}`, display:"flex", alignItems:"center", gap:10}}>
              <div style={{width:38, height:38, borderRadius:12, background:"#fef2f2", color:C.red, display:"flex", alignItems:"center", justifyContent:"center"}}>
                <Trash2 size={18}/>
              </div>
              <div style={{flex:1}}>
                <p style={{fontSize:15, fontWeight:800, color:C.text, margin:0}}>Tong Sampah</p>
                <p style={{fontSize:11, color:C.textM, margin:"2px 0 0"}}>{deletedList.length} transaksi terhapus</p>
              </div>
              <button type="button" onClick={()=>setTrashOpen(false)} aria-label="Tutup tong sampah" style={{width:34, height:34, borderRadius:10, border:"none", background:C.borderL, color:C.textM, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer"}}>
                <X size={18}/>
              </button>
            </div>
            <div style={{overflowY:"auto", padding:"8px 14px 18px", display:"flex", flexDirection:"column"}}>
              {deletedList.length === 0 && (
                <p style={{textAlign:"center", color:C.textL, fontSize:13, padding:"2.5rem 0"}}>Belum ada transaksi di tong sampah.</p>
              )}
              {deletedList.map(tx=>(
                <div key={tx.id} style={{padding:"10px 0", borderBottom:`1px solid ${C.borderL}`, display:"grid", gridTemplateColumns:"48px minmax(0, 1fr)", gap:8}}>
                  <div style={{fontSize:11, color:C.textM, fontWeight:800, textAlign:"center", lineHeight:1.2, paddingTop:2}}>{formatShortDate(tx.date)}</div>
                  <div style={{minWidth:0}}>
                    <div style={{display:"flex", justifyContent:"space-between", gap:8, alignItems:"flex-start"}}>
                      <div style={{minWidth:0}}>
                        <p style={{fontSize:13, fontWeight:800, color:C.text, margin:0, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{tx.desc}</p>
                        <p style={{fontSize:10, color:C.textL, margin:"2px 0 0"}}>{STATUS[tx.status]?.label || tx.status || "-"} Â· dihapus {formatShortDate(tx.deletedAt)}</p>
                      </div>
                      <span style={{fontSize:12, fontWeight:800, color:tx.type==="income"?C.pri:C.red, whiteSpace:"nowrap"}}>{tx.type==="income"?"+":"-"}{fmtS(tx.amt)}</span>
                    </div>
                    <div style={{display:"flex", gap:6, marginTop:8, flexWrap:"wrap"}}>
                      <button type="button" onClick={()=>onRestoreTx?.(tx.id)} style={{border:"none", borderRadius:8, padding:"6px 8px", background:C.priL, color:C.priD, fontSize:11, fontWeight:800, cursor:"pointer", display:"flex", alignItems:"center", gap:5}}>
                        <RotateCcw size={12}/> Restore
                      </button>
                      <button type="button" onClick={()=>{
                        if(window.confirm("Hapus permanen transaksi ini? Data tidak bisa dikembalikan.")) onPermanentDeleteTx?.(tx.id);
                      }} style={{border:"none", borderRadius:8, padding:"6px 8px", background:"#fef2f2", color:C.red, fontSize:11, fontWeight:800, cursor:"pointer", display:"flex", alignItems:"center", gap:5}}>
                        <Trash2 size={12}/> Hapus Permanen
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MoreScreen;
