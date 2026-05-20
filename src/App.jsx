import { useState, useMemo, useEffect } from "react";
import {
  Sparkles, Shield,
  Send, Check,
  FileDown, Copy
} from "lucide-react";
import Header from "./components/layout/Header";
import BottomNav from "./components/layout/BottomNav";
import HomeScreen from "./screens/HomeScreen";
import GoalsScreen from "./screens/GoalsScreen";
import TransferScreen from "./screens/TransferScreen";
import ZakatScreen from "./screens/ZakatScreen";
import UpgradeScreen from "./screens/UpgradeScreen";
import MoreScreen from "./screens/MoreScreen";
import ReportsScreen from "./screens/ReportsScreen";
import LoginScreen from "./screens/LoginScreen";
import TxListScreen from "./screens/TxListScreen";
import AddSheet from "./features/transactions/AddSheet";
import { C } from "./constants/theme";
import { GROUPS, STORAGE_KEYS } from "./constants/app";
import { INIT_GOALS, INIT_TX } from "./data/initialData";
import { fmt } from "./utils/format";
import { loadStored, removeStored, saveStored } from "./utils/storage";
import { formatBackupDate, isJsonFile, isValidBackupData } from "./utils/backup";
import {
  copyBudgetFromPreviousMonth,
  deleteTransactionsByPeriod,
  formatMonthYear,
  getDefaultPeriod,
  getPeriodYears,
  isTxInPeriod,
  normalizePeriod,
} from "./utils/period";
import { calcGroups, calcSummary } from "./utils/summary";

// ─── SHARE / EXPORT LAPORAN ───
const ShareScreen = ({txs, setSubPage}) => {
  const [format, setFormat] = useState("whatsapp");
  const [copied, setCopied] = useState(false);
  const s = calcSummary(txs);
  const grps = calcGroups(txs);
  const unpaid = txs.filter(x=>x.status==="belum_selesai");
  const top5 = txs.filter(x=>x.type==="expense"&&x.status!=="batal").sort((a,b)=>b.amt-a.amt).slice(0,5);

  const waText = useMemo(() => {
    let t = "📊 *LAPORAN KEUANGAN KELUARGA*\n";
    t += "_Mei 2026 · Keluarga Malik_\n";
    t += "━━━━━━━━━━━━━━━━━━━━\n\n";
    t += "💰 *RINGKASAN BULAN INI*\n";
    t += "```\n";
    t += `Pemasukan    : ${fmt(s.totalIncome)}\n`;
    t += `Pengeluaran  : ${fmt(s.paid)}\n`;
    t += `Saldo Aktual : ${fmt(s.actBal)}\n`;
    t += `Sisa Aman    : ${fmt(s.safeBal)}\n`;
    t += `Progress     : ${s.prog}%\n`;
    t += "```\n\n";
    t += "📋 *REKAP PER GRUP*\n";
    Object.entries(grps).sort((a,b)=>b[1].budget-a[1].budget).forEach(([k,v])=>{
      t += `• ${GROUPS[k]?.label} — ${fmt(v.budget)}\n`;
    });
    t += "\n";
    if(unpaid.length > 0) {
      t += "⚠️ *BELUM DIBAYAR*\n";
      unpaid.forEach(tx => { t += `• ${tx.desc} — ${fmt(tx.amt)}\n`; });
      t += "\n";
    }
    t += "🏆 *TOP 5 PENGELUARAN*\n";
    top5.forEach((tx, i) => { t += `${i+1}. ${tx.desc}\n   _${fmt(tx.amt)}_\n`; });
    t += "\n━━━━━━━━━━━━━━━━━━━━\n";
    t += "_Dibuat dengan AMAN Budget_\n";
    t += "🌐 amandigital.web.id";
    return t;
  }, [s, grps, unpaid, top5]);

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(waText);
      setCopied(true);
      setTimeout(()=>setCopied(false), 2000);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = waText;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch {
        // Keep the same fallback flow even if legacy copy is unavailable.
      }
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(()=>setCopied(false), 2000);
    }
  };

  const shareWA = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(waText)}`;
    window.open(url, "_blank");
  };

  const downloadPDF = () => { window.print(); };

  return (
    <>
      <style>{`
        @media print {
          html, body { background: white !important; margin: 0 !important; padding: 0 !important; }
          body > div, body > div > div { max-width: 100% !important; width: 100% !important; background: white !important; }
          .no-print { display: none !important; }
          .print-area {
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            max-width: 100% !important;
          }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          @page { margin: 15mm; size: A4; }
        }
      `}</style>
      <div style={{flex:1, overflowY:"auto", paddingBottom:92, background:C.bg}}>
        <div className="no-print">
          <Header title="Bagikan Laporan" subtitle="Mei 2026 · Keluarga Malik" onBack={()=>setSubPage(null)}/>
        </div>

        <div className="no-print" style={{padding:"14px 14px 0"}}>
          <div style={{background:"#fff", borderRadius:14, padding:4, display:"flex", border:`1px solid ${C.borderL}`, boxShadow:"0 1px 4px rgba(0,0,0,0.03)"}}>
            {[
              {id:"whatsapp", label:"WhatsApp", icon:Send, color:"#25d366"},
              {id:"pdf", label:"PDF", icon:FileDown, color:C.red},
            ].map(opt => (
              <button key={opt.id} onClick={()=>setFormat(opt.id)} style={{
                flex:1, padding:"11px", borderRadius:10, border:"none", cursor:"pointer",
                background: format===opt.id ? opt.color+"15" : "transparent",
                color: format===opt.id ? opt.color : C.textM,
                fontSize:13, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                transition:"all .2s"
              }}>
                <opt.icon size={15}/> {opt.label}
              </button>
            ))}
          </div>
        </div>

        {format === "whatsapp" ? (
          <div className="no-print" style={{padding:"12px 14px 14px", display:"flex", flexDirection:"column", gap:12}}>
            <div style={{background:"#e5ddd5", borderRadius:14, padding:"14px 12px", boxShadow:"inset 0 2px 8px rgba(0,0,0,0.05)"}}>
              <div style={{background:"#dcf8c6", borderRadius:8, borderTopRightRadius:2, padding:"10px 12px 6px", maxWidth:"94%", marginLeft:"auto", boxShadow:"0 1px 2px rgba(0,0,0,0.13)"}}>
                <pre style={{margin:0, fontFamily:"-apple-system, system-ui, sans-serif", fontSize:11.5, color:"#111b21", whiteSpace:"pre-wrap", lineHeight:1.45, wordBreak:"break-word"}}>{waText}</pre>
                <div style={{display:"flex", justifyContent:"flex-end", alignItems:"center", gap:4, marginTop:4, fontSize:10, color:"#667781"}}>
                  <span>16:45</span>
                  <svg width="14" height="11" viewBox="0 0 16 11" fill="#53bdeb"><path d="M11.07.65L4.25 7.48a.35.35 0 01-.49 0L1.05 4.77a.35.35 0 00-.48 0l-.57.57a.35.35 0 000 .49l2.71 2.71a1.16 1.16 0 001.64 0L11.87.99a.35.35 0 000-.49L11.31.04a.35.35 0 00-.49 0z"/></svg>
                </div>
              </div>
            </div>

            <div style={{display:"flex", gap:8}}>
              <button onClick={copyText} style={{flex:1, padding:"14px", borderRadius:12, border:`1.5px solid ${copied?C.pri:C.border}`, background:copied?C.priL:"#fff", color:copied?C.priD:C.text, fontSize:13, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6, transition:"all .2s"}}>
                {copied ? <><Check size={16}/> Tersalin!</> : <><Copy size={16}/> Salin</>}
              </button>
              <button onClick={shareWA} style={{flex:1.5, padding:"14px", borderRadius:12, border:"none", background:"#25d366", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6, boxShadow:"0 6px 18px rgba(37,211,102,0.3)"}}>
                <Send size={16}/> Kirim WhatsApp
              </button>
            </div>

            <div style={{background:C.priBg, borderRadius:12, padding:"12px 14px", display:"flex", gap:10, alignItems:"flex-start"}}>
              <Sparkles size={16} color={C.pri} style={{marginTop:2, flexShrink:0}}/>
              <p style={{margin:0, fontSize:11, color:C.priD, lineHeight:1.5}}>
                Format sudah sesuai standar WhatsApp dengan <b>*bold*</b>, <i>_italic_</i>, dan emoji. Cocok dikirim ke grup keluarga.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="no-print" style={{padding:"12px 14px 0"}}>
              <div style={{background:"#fef2f2", borderRadius:12, padding:"12px 14px", display:"flex", gap:10, alignItems:"flex-start"}}>
                <FileDown size={16} color={C.red} style={{marginTop:2, flexShrink:0}}/>
                <p style={{margin:0, fontSize:11, color:"#991b1b", lineHeight:1.5}}>
                  Tekan tombol <b>Download PDF</b> di bawah → di dialog cetak pilih <b>"Save as PDF"</b>.
                </p>
              </div>
            </div>

            <div className="print-area" style={{margin:"14px", background:"#fff", borderRadius:14, padding:"24px 20px", border:`1px solid ${C.borderL}`, boxShadow:"0 4px 20px rgba(0,0,0,0.06)"}}>
              <div style={{textAlign:"center", paddingBottom:14, borderBottom:`3px solid ${C.pri}`, marginBottom:16}}>
                <div style={{width:46, height:46, background:C.pri, borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 8px"}}>
                  <Shield size={24} color="#fff"/>
                </div>
                <h2 style={{margin:0, fontSize:17, color:C.text, fontWeight:800, letterSpacing:-0.3}}>LAPORAN KEUANGAN</h2>
                <p style={{margin:"3px 0 0", fontSize:11, color:C.textM, fontWeight:600}}>Periode: Mei 2026 · Keluarga Malik</p>
              </div>

              <div style={{marginBottom:18}}>
                <h3 style={{fontSize:11, color:C.pri, margin:"0 0 8px", fontWeight:800, letterSpacing:0.8}}>▎RINGKASAN BULAN INI</h3>
                <table style={{width:"100%", fontSize:11, borderCollapse:"collapse"}}>
                  <tbody>
                    {[
                      ["Total Pemasukan", fmt(s.totalIncome), C.pri],
                      ["Total Pengeluaran (Terbayar)", fmt(s.paid), C.red],
                      ["Estimasi Pengeluaran", fmt(s.estExp), C.text],
                      ["Saldo Aktual", fmt(s.actBal), C.text],
                      ["Estimasi Sisa Aman", fmt(s.safeBal), s.safeBal<0?C.red:C.pri],
                      ["Progress Pembayaran", s.prog+"%", C.text],
                    ].map(([k,v,c],i)=>(
                      <tr key={i} style={{borderBottom:`1px solid ${C.borderL}`}}>
                        <td style={{padding:"7px 0", color:C.textM}}>{k}</td>
                        <td style={{padding:"7px 0", color:c, fontWeight:700, textAlign:"right"}}>{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{marginBottom:18}}>
                <h3 style={{fontSize:11, color:C.pri, margin:"0 0 8px", fontWeight:800, letterSpacing:0.8}}>▎REKAP PER GRUP</h3>
                <table style={{width:"100%", fontSize:11, borderCollapse:"collapse"}}>
                  <thead>
                    <tr style={{borderBottom:`2px solid ${C.text}`}}>
                      <th style={{padding:"7px 0", textAlign:"left", color:C.text, fontWeight:700}}>Grup</th>
                      <th style={{padding:"7px 0", textAlign:"right", color:C.text, fontWeight:700}}>Budget</th>
                      <th style={{padding:"7px 0", textAlign:"right", color:C.pri, fontWeight:700}}>Selesai</th>
                      <th style={{padding:"7px 0", textAlign:"right", color:C.red, fontWeight:700}}>Belum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(grps).sort((a,b)=>b[1].budget-a[1].budget).map(([k,v])=>(
                      <tr key={k} style={{borderBottom:`1px solid ${C.borderL}`}}>
                        <td style={{padding:"6px 0", color:C.text, fontWeight:600}}>{GROUPS[k]?.label}</td>
                        <td style={{padding:"6px 0", textAlign:"right", color:C.text}}>{fmt(v.budget)}</td>
                        <td style={{padding:"6px 0", textAlign:"right", color:C.pri, fontWeight:600}}>{fmt(v.paid)}</td>
                        <td style={{padding:"6px 0", textAlign:"right", color:C.red, fontWeight:600}}>{fmt(v.unpaid)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{marginBottom:18}}>
                <h3 style={{fontSize:11, color:C.pri, margin:"0 0 8px", fontWeight:800, letterSpacing:0.8}}>▎TOP 5 PENGELUARAN</h3>
                <table style={{width:"100%", fontSize:11, borderCollapse:"collapse"}}>
                  <tbody>
                    {top5.map((tx,i)=>(
                      <tr key={tx.id} style={{borderBottom:`1px solid ${C.borderL}`}}>
                        <td style={{padding:"7px 0", width:28, color:C.priD, fontWeight:800}}>#{i+1}</td>
                        <td style={{padding:"7px 0"}}>
                          <div style={{fontWeight:600, color:C.text}}>{tx.desc}</div>
                          <div style={{fontSize:10, color:C.textM, marginTop:1}}>{GROUPS[tx.grp]?.label} · {tx.date}</div>
                        </td>
                        <td style={{padding:"7px 0", textAlign:"right", color:C.text, fontWeight:700}}>{fmt(tx.amt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {unpaid.length > 0 && (
                <div style={{marginBottom:18}}>
                  <h3 style={{fontSize:11, color:C.red, margin:"0 0 8px", fontWeight:800, letterSpacing:0.8}}>▎⚠ BELUM DIBAYAR</h3>
                  <table style={{width:"100%", fontSize:11, borderCollapse:"collapse"}}>
                    <tbody>
                      {unpaid.map(tx=>(
                        <tr key={tx.id} style={{borderBottom:`1px solid ${C.borderL}`}}>
                          <td style={{padding:"6px 0"}}>
                            <div style={{color:C.text, fontWeight:600}}>{tx.desc}</div>
                            <div style={{fontSize:10, color:C.textM}}>{GROUPS[tx.grp]?.label}</div>
                          </td>
                          <td style={{padding:"6px 0", textAlign:"right", color:C.red, fontWeight:700}}>{fmt(tx.amt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div style={{borderTop:`1px solid ${C.borderL}`, paddingTop:12, marginTop:8, textAlign:"center"}}>
                <p style={{fontSize:10, color:C.textM, margin:0}}>
                  Laporan ini dibuat otomatis oleh <b style={{color:C.pri}}>AMAN Budget</b>
                </p>
                <p style={{fontSize:9, color:C.textL, margin:"3px 0 0"}}>
                  amandigital.web.id · Dicetak {new Date().toLocaleDateString("id-ID", {day:"numeric", month:"long", year:"numeric"})}
                </p>
              </div>
            </div>

            <div className="no-print" style={{padding:"0 14px 14px"}}>
              <button onClick={downloadPDF} style={{width:"100%", padding:"15px", borderRadius:14, border:"none", background:`linear-gradient(135deg, ${C.red}, #b91c1c)`, color:"#fff", fontSize:14, fontWeight:800, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8, boxShadow:"0 8px 24px rgba(220,38,38,0.4)"}}>
                <FileDown size={18}/> Download / Cetak PDF
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

// ─── APP ───
export default function App() {
  const [user, setUser] = useState(() => loadStored(STORAGE_KEYS.user, null, v=>v === null || typeof v === "object"));
  const [tab, setTab] = useState("home");
  const [subPage, setSubPage] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editTx, setEditTx] = useState(null);
  const [txs, setTxs] = useState(() => loadStored(STORAGE_KEYS.txs, INIT_TX, Array.isArray));
  const [goals, setGoals] = useState(() => loadStored(STORAGE_KEYS.goals, INIT_GOALS, Array.isArray));
  const [period, setPeriod] = useState(() => normalizePeriod(loadStored(STORAGE_KEYS.period, getDefaultPeriod(), v=>v&&typeof v==="object"&&!Array.isArray(v))));

  useEffect(()=>{ saveStored(STORAGE_KEYS.txs, txs); }, [txs]);
  useEffect(()=>{ saveStored(STORAGE_KEYS.goals, goals); }, [goals]);
  useEffect(()=>{ saveStored(STORAGE_KEYS.period, normalizePeriod(period)); }, [period]);
  useEffect(()=>{
    if(user) saveStored(STORAGE_KEYS.user, user);
    else removeStored(STORAGE_KEYS.user);
  }, [user]);

  const periodTxs = useMemo(()=>txs.filter(tx=>isTxInPeriod(tx, period)), [txs, period]);
  const periodYears = useMemo(()=>getPeriodYears(txs, period), [txs, period]);

  const onSave = tx => setTxs(p=>{
    const i = p.findIndex(x=>x.id===tx.id);
    if(i>=0) {const n=[...p]; n[i]=tx; return n;}
    return [...p, tx];
  });
  const onDelete = id => setTxs(p=>p.filter(x=>x.id!==id));
  const onDone = id => setTxs(p=>p.map(x=>x.id===id?{...x, status:"selesai"}:x));
  const onDeletePeriod = periodToDelete => setTxs(p=>deleteTransactionsByPeriod(p, periodToDelete).next);
  const onCopyBudget = () => {
    const p = normalizePeriod(period);
    if(p.mode !== "month") return;
    const {items, sourceCount, prev} = copyBudgetFromPreviousMonth(txs, p);
    if(sourceCount === 0) {
      alert(`Tidak ada budget dari ${formatMonthYear(prev.month, prev.year)} untuk dicopy.`);
      return;
    }
    if(items.length === 0) {
      alert("Budget bulan lalu sudah pernah dicopy.");
      return;
    }
    setTxs(prevTxs=>[...prevTxs, ...items]);
    alert(`${items.length} item berhasil dicopy dari ${formatMonthYear(prev.month, prev.year)}.`);
  };
  const onExportBackup = () => {
    try {
      const backup = {
        app:"AMAN Budget",
        version:1,
        exportedAt:new Date().toISOString(),
        transactions:txs,
        goals,
        user,
        period:normalizePeriod(period),
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], {type:"application/json"});
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `aman-budget-backup-${formatBackupDate(new Date())}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert("Gagal membuat file backup.");
    }
  };
  const onImportBackup = async file => {
    if(!isJsonFile(file)) {
      alert("File backup harus berformat JSON.");
      return;
    }

    try {
      const raw = await file.text();
      const data = JSON.parse(raw);
      if(!isValidBackupData(data)) {
        alert("File backup tidak valid.");
        return;
      }

      const ok = window.confirm(`Import backup akan mengganti ${txs.length} transaksi saat ini dengan ${data.transactions.length} transaksi dari file. Lanjutkan?`);
      if(!ok) return;

      setTxs(data.transactions.map(tx=>({...tx, amt:Number(tx.amt)})));
      if(data.goals !== undefined) setGoals(data.goals);
      if(Object.prototype.hasOwnProperty.call(data, "user")) setUser(data.user);
      if(data.period !== undefined) setPeriod(normalizePeriod(data.period));
      alert("Backup berhasil diimport.");
    } catch {
      alert("Gagal membaca file backup. Pastikan file JSON tidak rusak.");
    }
  };
  const openUpgrade = () => setSubPage("upgrade");

  if(!user) return <LoginScreen onLogin={setUser}/>;

  const renderScreen = () => {
    if(subPage==="upgrade") return <UpgradeScreen setSubPage={setSubPage}/>;
    if(subPage==="transfer") return <TransferScreen txs={txs} setSubPage={setSubPage}/>;
    if(subPage==="zakat") return <ZakatScreen setSubPage={setSubPage}/>;
    if(subPage==="tx-list") return <TxListScreen txs={periodTxs} allTxs={txs} period={period} setPeriod={setPeriod} years={periodYears} onCopyBudget={onCopyBudget} onDeletePeriod={onDeletePeriod} setSubPage={setSubPage} setEditTx={setEditTx} setAddOpen={setAddOpen} onDelete={onDelete} onDone={onDone}/>;
    if(subPage==="share") return <ShareScreen txs={txs} setSubPage={setSubPage}/>;
    if(tab==="home") return <HomeScreen txs={periodTxs} period={period} setPeriod={setPeriod} years={periodYears} onCopyBudget={onCopyBudget} setTab={setTab} setSubPage={setSubPage} setEditTx={setEditTx} setAddOpen={setAddOpen} openUpgrade={openUpgrade} user={user}/>;
    if(tab==="reports") return <ReportsScreen txs={periodTxs} period={period} setPeriod={setPeriod} years={periodYears} openUpgrade={openUpgrade}/>;
    if(tab==="goals-tab") return <GoalsScreen goals={goals} openUpgrade={openUpgrade}/>;
    if(tab==="more") return <MoreScreen setSubPage={setSubPage} openUpgrade={openUpgrade} onLogout={()=>setUser(null)} onExportBackup={onExportBackup} onImportBackup={onImportBackup}/>;
    return null;
  };

  const hideNav = subPage==="upgrade";

  return (
    <div style={{minHeight:"100vh", background:C.bg, display:"flex", justifyContent:"center", fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"}}>
      <style>{`
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        * { -webkit-tap-highlight-color: transparent; }
        input, select, textarea { font-family: inherit; }
        button { font-family: inherit; }
        ::-webkit-scrollbar { width: 0; }
      `}</style>
      <div style={{width:"100%", maxWidth:430, display:"flex", flexDirection:"column", minHeight:"100vh", position:"relative", background:C.bg}}>
        {renderScreen()}
        {!hideNav && <BottomNav tab={tab} setTab={(t)=>{setTab(t); setSubPage(null);}} setAddOpen={setAddOpen} setEditTx={setEditTx}/>}
        {addOpen && <AddSheet editTx={editTx} onSave={onSave} onClose={()=>{setAddOpen(false); setEditTx(null);}}/>}
      </div>
    </div>
  );
}
