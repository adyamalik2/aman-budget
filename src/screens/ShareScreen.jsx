import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, FileDown, ImageDown, Send, Shield, Sparkles } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { toJpeg } from "html-to-image";
import Header from "../components/layout/Header";
import PeriodPicker from "../components/period/PeriodPicker";
import { STATUS } from "../constants/app";
import { C } from "../constants/theme";
import { fmt, fmtS } from "../utils/format";
import { calcGoalTransactionSaved } from "../utils/goals";
import { getGroupColor, getGroupLabel } from "../utils/groups";
import { formatPeriodLabel, formatShortDate, getPeriodYears, isTxInPeriod, normalizePeriod } from "../utils/period";
import { calcGroups, calcSummary } from "../utils/summary";

const resolveTxGrp = tx => tx.grp || "lain_lain";
const isNativeApp = () => Capacitor.getPlatform() !== "web";
const safeActionPad = "calc(24px + env(safe-area-inset-bottom))";

// ── Ultra-compact table cell styles ──
const TH = {padding:"2px 4px", textAlign:"left", color:"#fff", fontWeight:700, fontSize:7, lineHeight:1.1};
const TD = {padding:"2px 4px", fontSize:7, color:"#111827", borderBottom:"1px solid #e5e7eb", lineHeight:1.1};

const secHead = (bg) => ({
  fontSize:7, color:"#fff", margin:0, fontWeight:800, letterSpacing:0.3,
  background:bg, padding:"2px 5px", borderRadius:"3px 3px 0 0", display:"block", lineHeight:1.1,
});

const calcSubtotal = grpTxs => ({
  total:    grpTxs.reduce((s, tx) => s + tx.amt, 0),
  selesai:  grpTxs.filter(tx => tx.status === "selesai").reduce((s, tx) => s + tx.amt, 0),
  belum:    grpTxs.filter(tx => tx.status === "belum_selesai").reduce((s, tx) => s + tx.amt, 0),
  estimasi: grpTxs.filter(tx => tx.status === "estimasi").reduce((s, tx) => s + tx.amt, 0),
});

const downloadJpgInBrowser = (dataUrl, fname) => {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = fname;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

const shareJpgInNativeApp = async (dataUrl, fname) => {
  const base64 = dataUrl.split(",")[1];
  if (!base64) throw new Error("Invalid JPG data");

  const saved = await Filesystem.writeFile({
    path: fname,
    data: base64,
    directory: Directory.Cache,
  });
  const canShare = await Share.canShare();
  if (!canShare.value) throw new Error("Share is not available");

  await Share.share({
    title: "AMAN Budget",
    text: "Laporan AMAN Budget",
    files: [saved.uri],
    dialogTitle: "Bagikan laporan JPG",
  });
};

const GrpTable = ({grpKey, txList, goals, categoryGroups = []}) => {
  const sub     = calcSubtotal(txList);
  const grpInfo = {color: getGroupColor(grpKey, categoryGroups), label: getGroupLabel(grpKey, categoryGroups)};
  const hasGoal = txList.some(tx => tx.goalId);
  return (
    <div className="rpt-sec" style={{marginBottom:5}}>
      <span className="rpt-hd" style={secHead(grpInfo.color)}>
        PENGELUARAN {grpInfo.label.toUpperCase()} ({txList.length})
      </span>
      <table className="rpt-table" style={{width:"100%", fontSize:7, borderCollapse:"collapse", border:`1px solid ${C.borderL}`, borderTop:"none"}}>
        <thead>
          <tr style={{background:grpInfo.color + "22"}}>
            <th style={{...TH, color:grpInfo.color, width:18, textAlign:"center"}}>#</th>
            <th style={{...TH, color:grpInfo.color}}>Deskripsi</th>
            <th style={{...TH, color:grpInfo.color, textAlign:"right"}}>Jumlah</th>
            <th style={{...TH, color:grpInfo.color, textAlign:"center"}}>Status</th>
            {hasGoal && <th style={{...TH, color:grpInfo.color}}>Goal</th>}
          </tr>
        </thead>
        <tbody>
          {txList.map((tx, i) => {
            const st       = STATUS[tx.status];
            const goalName = tx.goalId ? (goals.find(g => g.id === tx.goalId)?.name ?? null) : null;
            return (
              <tr className="rpt-tr" key={tx.id} style={{background: i % 2 === 0 ? "#fff" : grpInfo.color + "09"}}>
                <td style={{...TD, textAlign:"center", color:C.textM}}>{i + 1}</td>
                <td style={TD}>
                  <div style={{fontWeight:600, lineHeight:1.2}}>{tx.desc}</div>
                  <div style={{fontSize:6, color:C.textL, lineHeight:1.05}}>{formatShortDate(tx.date)} · {tx.cat}</div>
                </td>
                <td style={{...TD, textAlign:"right", fontWeight:700}}>{fmtS(tx.amt)}</td>
                <td style={{...TD, textAlign:"center"}}>
                  {st && <span style={{background:st.bg, color:st.color, fontSize:6, fontWeight:700, padding:"1px 2px", borderRadius:2, lineHeight:1.1, display:"inline-block"}}>{st.label}</span>}
                </td>
                {hasGoal && <td style={{...TD, fontSize:6, color:C.priD}}>{goalName || ""}</td>}
              </tr>
            );
          })}
        </tbody>
        <tfoot className="rpt-tfoot">
          <tr style={{background:grpInfo.color + "18"}}>
            <td colSpan={2} style={{padding:"2px 4px", fontWeight:800, color:grpInfo.color, fontSize:7, lineHeight:1.1}}>Subtotal</td>
            <td style={{padding:"2px 4px", fontWeight:800, color:grpInfo.color, textAlign:"right", fontSize:7, lineHeight:1.1}}>{fmt(sub.total)}</td>
            <td style={{padding:"2px 4px", fontSize:6, color:C.textM, lineHeight:1.1}}>
              {sub.selesai  > 0 && <span style={{color:C.pri}}>✓ {fmtS(sub.selesai)}</span>}
              {sub.belum    > 0 && <span style={{color:C.red, marginLeft:sub.selesai > 0 ? 3 : 0}}>⚠ {fmtS(sub.belum)}</span>}
              {sub.estimasi > 0 && sub.selesai === 0 && sub.belum === 0 &&
                <span style={{color:C.textM}}>~ {fmtS(sub.estimasi)}</span>}
            </td>
            {hasGoal && <td/>}
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

const ShareScreen = ({allTxs = [], goals = [], period = null, categoryGroups = [], setSubPage}) => {
  const [format, setFormat]       = useState("whatsapp");
  const [copied, setCopied]       = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(() => normalizePeriod(period));
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [exportingJpg, setExportingJpg] = useState(false);
  const reportRef = useRef(null);
  const resetCopyTimeoutRef = useRef(null);

  const periodYears = useMemo(()=>getPeriodYears(allTxs, selectedPeriod), [allTxs, selectedPeriod]);
  const periodTxs = useMemo(()=>allTxs.filter(tx=>isTxInPeriod(tx, selectedPeriod)), [allTxs, selectedPeriod]);
  const reportTxs = useMemo(()=>(
    selectedGroups.length === 0
      ? periodTxs
      : periodTxs.filter(tx=>tx.type === "expense" && selectedGroups.includes(resolveTxGrp(tx)))
  ), [periodTxs, selectedGroups]);
  const s           = calcSummary(reportTxs);
  const grps        = calcGroups(reportTxs);
  const unpaid      = reportTxs.filter(x => x.status === "belum_selesai");
  const periodLabel = formatPeriodLabel(selectedPeriod);
  const nativeApp   = isNativeApp();
  const filterGroups = categoryGroups
    .filter(group=>group?.active !== false && group?.id)
    .map(group=>({key:group.id, label:getGroupLabel(group.id, categoryGroups)}));
  const selectedGroupLabel = selectedGroups.length === 0
    ? "Semua Grup"
    : selectedGroups.map(key=>getGroupLabel(key, categoryGroups)).join(" + ");
  const toggleGroup = key => {
    setSelectedGroups(prev=>prev.includes(key) ? prev.filter(item=>item !== key) : [...prev, key]);
  };

  const goalsCalc = useMemo(() => goals.map(g => {
    const manualSaved    = Number(g.saved || 0);
    const txSaved        = calcGoalTransactionSaved(reportTxs, g);
    const displayedSaved = manualSaved + txSaved;
    const target         = Number(g.target || 0);
    const pct            = target > 0 ? Math.min(Math.round(displayedSaved / target * 100), 100) : 0;
    return {...g, manualSaved, txSaved, displayedSaved, pct};
  }), [goals, reportTxs]);

  const totalGoalTarget = goalsCalc.reduce((sum, g) => sum + Number(g.target || 0), 0);
  const totalGoalSaved  = goalsCalc.reduce((sum, g) => sum + g.displayedSaved, 0);

  useEffect(() => () => {
    if (resetCopyTimeoutRef.current) {
      clearTimeout(resetCopyTimeoutRef.current);
    }
  }, []);

  const scheduleCopyReset = () => {
    if (resetCopyTimeoutRef.current) {
      clearTimeout(resetCopyTimeoutRef.current);
    }
    resetCopyTimeoutRef.current = setTimeout(() => {
      setCopied(false);
      resetCopyTimeoutRef.current = null;
    }, 2000);
  };

  const incomeTxs = useMemo(() =>
    reportTxs.filter(tx => tx.type === "income").sort((a, b) => b.date.localeCompare(a.date)),
  [reportTxs]);

  const groupedExpenses = useMemo(() => {
    const map = {};
    reportTxs.filter(tx => tx.type === "expense").forEach(tx => {
      const key = resolveTxGrp(tx);
      (map[key] = map[key] || []).push(tx);
    });
    Object.keys(map).forEach(k => map[k].sort((a, b) => b.date.localeCompare(a.date)));
    return map;
  }, [reportTxs]);

  const activeGroups = Object.keys(groupedExpenses)
    .filter(k => groupedExpenses[k]?.length > 0)
    .sort((a, b) => calcSubtotal(groupedExpenses[b]).total - calcSubtotal(groupedExpenses[a]).total);
  const visibleGroups = selectedGroups.length === 0
    ? activeGroups
    : selectedGroups.filter(key=>groupedExpenses[key]?.length > 0);

  const kpis = [
    {label:"Total Pemasukan",  value:fmt(s.totalIncome), color:C.pri,                                border:`2px solid ${C.pri}`},
    {label:"Est. Pengeluaran", value:fmt(s.estExp),       color:C.text,                               border:`2px solid ${C.border}`},
    {label:"Sdh Dibayar",      value:fmt(s.paid),         color:C.red,                                border:`2px solid ${C.red}`},
    {label:"Saldo Aktual",     value:fmt(s.actBal),       color:s.actBal  >= 0 ? C.pri : C.red,      border:`2px solid ${s.actBal  >= 0 ? C.pri : C.red}`},
    {label:"Sisa Aman",        value:fmt(s.safeBal),      color:s.safeBal >= 0 ? C.pri : C.red,      border:`2px solid ${s.safeBal >= 0 ? C.pri : C.red}`},
    {label:"Belum Bayar",      value:fmt(s.unpaid),       color:unpaid.length > 0 ? C.red : C.textM, border:`2px solid ${unpaid.length > 0 ? C.red : C.border}`},
  ];

  // ── WhatsApp text ──
  let waText = "📊 *LAPORAN KEUANGAN KELUARGA*\n";
  waText += `_${periodLabel}_\n`;
  if (selectedGroups.length > 0) waText += `_Grup: ${selectedGroupLabel}_\n`;
  waText += "━━━━━━━━━━━━━━━━━━━━\n\n";
  waText += "💰 *RINGKASAN*\n";
  waText += "```\n";
  waText += `Pemasukan    : ${fmt(s.totalIncome)}\n`;
  waText += `Pengeluaran  : ${fmt(s.paid)}\n`;
  waText += `Saldo Aktual : ${fmt(s.actBal)}\n`;
  waText += `Sisa Aman    : ${fmt(s.safeBal)}\n`;
  waText += `Progress     : ${s.prog}%\n`;
  if (unpaid.length > 0) waText += `Belum Bayar  : ${fmt(s.unpaid)} (${unpaid.length} item)\n`;
  waText += "```\n\n";
  waText += "📋 *REKAP PER GRUP*\n";
  Object.entries(grps).sort((a, b) => b[1].budget - a[1].budget).forEach(([k, v]) => {
    waText += `• ${getGroupLabel(k, categoryGroups)} — ${fmt(v.budget)}\n`;
  });
  waText += "\n";
  if (goalsCalc.length > 0) {
    waText += "🎯 *PROGRESS GOALS*\n";
    waText += "```\n";
    goalsCalc.forEach(g => {
      waText += `${g.name}\n  ${fmt(g.displayedSaved)} / ${fmt(Number(g.target || 0))} (${g.pct}%)\n`;
    });
    waText += "```\n\n";
  }
  if (unpaid.length > 0) {
    waText += "⚠️ *BELUM DIBAYAR*\n";
    unpaid.forEach(tx => { waText += `• ${tx.desc} — ${fmt(tx.amt)}\n`; });
    waText += "\n";
  }
  waText += "━━━━━━━━━━━━━━━━━━━━\n";
  waText += "_Dibuat dengan AMAN Budget_\n";
  waText += "🌐 amandigital.web.id";

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(waText);
      setCopied(true);
      scheduleCopyReset();
    } catch {
      const ta = document.createElement("textarea");
      ta.value = waText;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch { /* ignore */ }
      document.body.removeChild(ta);
      setCopied(true);
      scheduleCopyReset();
    }
  };

  const shareWA = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(waText)}`, "_blank");
  };

  const printPdf = () => {
    if (isNativeApp()) {
      alert("Print/PDF belum didukung stabil di APK Android. Gunakan Export JPG untuk membagikan laporan dari HP.");
      return;
    }
    window.print();
  };

  const exportJpg = async () => {
    if (!reportRef.current) return;
    setExportingJpg(true);
    try {
      const dataUrl = await toJpeg(reportRef.current, {
        quality: 0.93,
        pixelRatio: 2,
        backgroundColor: "#fff",
        skipAutoScale: false,
      });
      const now = new Date();
      const pad = n => String(n).padStart(2, "0");
      const fname = `aman-budget-report-${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}.jpg`;
      if (isNativeApp()) {
        await shareJpgInNativeApp(dataUrl, fname);
      } else {
        downloadJpgInBrowser(dataUrl, fname);
      }
    } catch {
      alert("Gagal export JPG. Coba lagi.");
    } finally {
      setExportingJpg(false);
    }
  };

  return (
    <>
      <style>{`
        @media print {
          html, body { background: white !important; margin: 0 !important; padding: 0 !important; }
          body * { visibility: hidden !important; }
          .print-area, .print-area * { visibility: visible !important; }
          .print-area {
            position: absolute !important; top: 0 !important; left: 0 !important;
            right: 0 !important; width: 100% !important; overflow: visible !important;
            padding: 6px !important; margin: 0 !important; border: none !important;
            box-shadow: none !important; border-radius: 0 !important;
          }
          .rpt-table th { padding: 1px 3px !important; font-size: 6pt !important; line-height: 1.1 !important; }
          .rpt-table td { padding: 1px 3px !important; font-size: 6pt !important; line-height: 1.1 !important; }
          .rpt-hd     { font-size: 6pt !important; padding: 2px 5px !important; line-height: 1.1 !important; page-break-after: avoid !important; break-after: avoid !important; }
          .rpt-tfoot  { page-break-before: avoid !important; break-before: avoid !important; }
          .rpt-sec-sm { page-break-inside: avoid !important; break-inside: avoid !important; }
          .rpt-tr     { page-break-inside: avoid !important; break-inside: avoid !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          @page { margin: 7mm; size: A4; }
        }
      `}</style>

      <div style={{flex:1, overflowY:"auto", paddingBottom:92, background:C.bg}}>

        <div className="no-print">
          <Header title="Export Laporan" subtitle={periodLabel} onBack={()=>setSubPage(null)}/>
        </div>

        <div className="no-print" style={{padding:"14px 14px 0"}}>
          <div style={{background:"#fff", borderRadius:14, padding:4, display:"flex", border:`1px solid ${C.borderL}`, boxShadow:"0 1px 4px rgba(0,0,0,0.03)"}}>
            {[
              {id:"whatsapp", label:"WhatsApp",   icon:Send,     color:"#25d366"},
              {id:"pdf",      label:"PDF / Print", icon:FileDown, color:C.red},
            ].map(opt => (
              <button key={opt.id} onClick={()=>setFormat(opt.id)} style={{
                flex:1, padding:"11px", borderRadius:10, border:"none", cursor:"pointer",
                background: format===opt.id ? opt.color+"15" : "transparent",
                color:      format===opt.id ? opt.color      : C.textM,
                fontSize:13, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                transition:"all .2s",
              }}>
                <opt.icon size={15}/> {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* ─── WhatsApp Tab ─── */}
        <div className="no-print" style={{padding:"12px 14px 0", display:"flex", flexDirection:"column", gap:10}}>
          <div style={{background:"#fff", borderRadius:14, padding:"12px", border:`1px solid ${C.borderL}`, boxShadow:"0 1px 4px rgba(0,0,0,0.03)"}}>
            <p style={{fontSize:11, fontWeight:800, color:C.textM, margin:"0 0 8px"}}>Periode Laporan</p>
            <PeriodPicker period={selectedPeriod} setPeriod={setSelectedPeriod} years={periodYears}/>
          </div>
          <div style={{background:"#fff", borderRadius:14, padding:"12px", border:`1px solid ${C.borderL}`, boxShadow:"0 1px 4px rgba(0,0,0,0.03)"}}>
            <p style={{fontSize:11, fontWeight:800, color:C.textM, margin:"0 0 8px"}}>Filter Grup</p>
            <div style={{display:"flex", gap:6, overflowX:"auto", paddingBottom:2, scrollbarWidth:"none"}}>
              <button type="button" onClick={()=>setSelectedGroups([])} style={{padding:"7px 13px", borderRadius:20, border:"none", cursor:"pointer", whiteSpace:"nowrap", fontSize:11, fontWeight:800, flexShrink:0, background:selectedGroups.length===0?C.pri:C.borderL, color:selectedGroups.length===0?"#fff":C.textM}}>
                Semua Grup
              </button>
              {filterGroups.map(opt => {
                const active = selectedGroups.includes(opt.key);
                return (
                  <button key={opt.key} type="button" onClick={()=>toggleGroup(opt.key)} style={{padding:"7px 13px", borderRadius:20, border:"none", cursor:"pointer", whiteSpace:"nowrap", fontSize:11, fontWeight:800, flexShrink:0, background:active?C.pri:C.borderL, color:active?"#fff":C.textM}}>
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {format === "whatsapp" ? (
          <div className="no-print" style={{padding:"12px 14px 14px", display:"flex", flexDirection:"column", gap:12}}>
            <div style={{background:"#e5ddd5", borderRadius:14, padding:"14px 12px", boxShadow:"inset 0 2px 8px rgba(0,0,0,0.05)"}}>
              <div style={{background:"#dcf8c6", borderRadius:8, borderTopRightRadius:2, padding:"10px 12px 6px", maxWidth:"94%", marginLeft:"auto", boxShadow:"0 1px 2px rgba(0,0,0,0.13)"}}>
                <pre style={{margin:0, fontFamily:"-apple-system, system-ui, sans-serif", fontSize:11.5, color:"#111b21", whiteSpace:"pre-wrap", lineHeight:1.45, wordBreak:"break-word"}}>{waText}</pre>
                <div style={{display:"flex", justifyContent:"flex-end", alignItems:"center", gap:4, marginTop:4, fontSize:10, color:"#667781"}}>
                  <span>{new Date().toLocaleTimeString("id-ID", {hour:"2-digit", minute:"2-digit"})}</span>
                  <svg width="14" height="11" viewBox="0 0 16 11" fill="#53bdeb"><path d="M11.07.65L4.25 7.48a.35.35 0 01-.49 0L1.05 4.77a.35.35 0 00-.48 0l-.57.57a.35.35 0 000 .49l2.71 2.71a1.16 1.16 0 001.64 0L11.87.99a.35.35 0 000-.49L11.31.04a.35.35 0 00-.49 0z"/></svg>
                </div>
              </div>
            </div>
            <div style={{display:"flex", gap:8, paddingBottom:safeActionPad}}>
              <button onClick={copyText} style={{flex:1, padding:"14px", borderRadius:12, border:`1.5px solid ${copied?C.pri:C.border}`, background:copied?C.priL:"#fff", color:copied?C.priD:C.text, fontSize:13, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6, transition:"all .2s"}}>
                {copied ? <><Check size={16}/> Tersalin!</> : <><Copy size={16}/> Salin Teks</>}
              </button>
              <button onClick={shareWA} style={{flex:1.5, padding:"14px", borderRadius:12, border:"none", background:"#25d366", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6, boxShadow:"0 6px 18px rgba(37,211,102,0.3)"}}>
                <Send size={16}/> Kirim WhatsApp
              </button>
            </div>
            <div style={{background:C.priBg, borderRadius:12, padding:"12px 14px", display:"flex", gap:10, alignItems:"flex-start"}}>
              <Sparkles size={16} color={C.pri} style={{marginTop:2, flexShrink:0}}/>
              <p style={{margin:0, fontSize:11, color:C.priD, lineHeight:1.5}}>
                Format sudah sesuai standar WhatsApp dengan <b>*bold*</b>, <i>_italic_</i>, dan emoji.
              </p>
            </div>
          </div>

        ) : (
        /* ─── PDF / Print Tab ─── */
          <>
            <div className="no-print" style={{padding:"12px 14px 0"}}>
              <div style={{background:"#fef2f2", borderRadius:12, padding:"10px 14px", display:"flex", gap:10, alignItems:"flex-start"}}>
                <FileDown size={15} color={C.red} style={{marginTop:2, flexShrink:0}}/>
                <p style={{margin:0, fontSize:11, color:"#991b1b", lineHeight:1.5}}>
                  {nativeApp ? (
                    <>PDF hanya tersedia di browser. Untuk APK Android gunakan <b>Export JPG</b>.</>
                  ) : (
                    <>Tekan <b>Print / Simpan PDF</b> → pilih <b>"Save as PDF"</b> di dialog cetak.</>
                  )}
                </p>
              </div>
            </div>

            {/* ═══ PRINT AREA ═══ */}
            <div ref={reportRef} className="print-area" style={{margin:"12px", background:"#fff", borderRadius:14, padding:"14px 12px 10px", border:`1px solid ${C.borderL}`, boxShadow:"0 4px 20px rgba(0,0,0,0.06)"}}>

              {/* Report header */}
              <div className="rpt-sec-sm" style={{textAlign:"center", paddingBottom:7, borderBottom:`2px solid ${C.pri}`, marginBottom:10}}>
                <div style={{width:28, height:28, background:C.pri, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 4px"}}>
                  <Shield size={16} color="#fff"/>
                </div>
                <h2 style={{margin:0, fontSize:13, color:C.text, fontWeight:800, letterSpacing:-0.3}}>AMAN BUDGET</h2>
                <p style={{margin:"1px 0 0", fontSize:10, color:C.pri, fontWeight:700}}>Laporan Keuangan Keluarga</p>
                <p style={{margin:"1px 0 0", fontSize:9, color:C.textM}}>Periode: {periodLabel}</p>
                {selectedGroups.length > 0 && (
                  <span style={{display:"inline-block", marginTop:3, background:C.priL, color:C.priD, fontSize:8, fontWeight:700, padding:"2px 7px", borderRadius:7}}>
                    Filter: {selectedGroupLabel}
                  </span>
                )}
              </div>

              {/* KPI Cards */}
              <div className="rpt-sec-sm" style={{marginBottom:5}}>
                <p style={{fontSize:7, fontWeight:800, color:C.textM, margin:"0 0 3px", letterSpacing:0.5}}>RINGKASAN UTAMA</p>
                <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:4}}>
                  {kpis.map((kpi, i) => (
                    <div key={i} style={{background:"#fff", border:kpi.border, borderRadius:6, padding:"5px 4px", textAlign:"center"}}>
                      <p style={{fontSize:7, color:C.textM, margin:0, fontWeight:600, lineHeight:1.2}}>{kpi.label}</p>
                      <p style={{fontSize:9, fontWeight:800, color:kpi.color, margin:"2px 0 0", lineHeight:1.2}}>{kpi.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rekapitulasi */}
              {selectedGroups.length === 0 && (
                <div className="rpt-sec-sm" style={{marginBottom:5}}>
                  <span className="rpt-hd" style={secHead(C.pri)}>REKAPITULASI</span>
                  <table className="rpt-table" style={{width:"100%", fontSize:7, borderCollapse:"collapse", border:`1px solid ${C.borderL}`, borderTop:"none"}}>
                    <tbody>
                      {[
                        ["Rencana Pemasukan",   fmt(s.incomePlan),  C.pri],
                        ["Pemasukan Aktual",     fmt(s.totalIncome), C.pri],
                        ["Estimasi Pengeluaran", fmt(s.estExp),      C.text],
                        ["Pengeluaran Selesai",  fmt(s.paid),        C.red],
                        ["Belum Dibayar",        fmt(s.unpaid),      unpaid.length > 0 ? C.red : C.textM],
                        ["Saldo Aktual",         fmt(s.actBal),      s.actBal  >= 0 ? C.pri : C.red],
                        ["Sisa Aman",            fmt(s.safeBal),     s.safeBal >= 0 ? C.pri : C.red],
                        ["Progress Pembayaran",  s.prog + "%",       C.text],
                      ].map(([k, v, c], i) => (
                        <tr className="rpt-tr" key={i} style={{background: i % 2 === 0 ? C.priBg : "#fff"}}>
                          <td style={{padding:"2px 4px", color:C.textM, borderBottom:`1px solid ${C.borderL}`, fontSize:7, lineHeight:1.1}}>{k}</td>
                          <td style={{padding:"2px 4px", color:c, fontWeight:700, textAlign:"right", borderBottom:`1px solid ${C.borderL}`, fontSize:7, lineHeight:1.1}}>{v}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pemasukan section */}
              {selectedGroups.length === 0 && incomeTxs.length > 0 && (
                <div className="rpt-sec" style={{marginBottom:5}}>
                  <span className="rpt-hd" style={secHead(C.pri)}>PEMASUKAN ({incomeTxs.length})</span>
                  <table className="rpt-table" style={{width:"100%", fontSize:7, borderCollapse:"collapse", border:`1px solid ${C.borderL}`, borderTop:"none"}}>
                    <thead>
                      <tr style={{background:C.priBg}}>
                        <th style={{...TH, color:C.priD, width:18, textAlign:"center"}}>#</th>
                        <th style={{...TH, color:C.priD}}>Deskripsi</th>
                        <th style={{...TH, color:C.priD, textAlign:"right"}}>Jumlah</th>
                        <th style={{...TH, color:C.priD, textAlign:"center"}}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {incomeTxs.map((tx, i) => {
                        const st = STATUS[tx.status];
                        return (
                          <tr className="rpt-tr" key={tx.id} style={{background: i % 2 === 0 ? "#fff" : C.priBg}}>
                            <td style={{...TD, textAlign:"center", color:C.textM}}>{i + 1}</td>
                            <td style={TD}>
                              <div style={{fontWeight:600, lineHeight:1.2}}>{tx.desc}</div>
                              <div style={{fontSize:6, color:C.textL, lineHeight:1.05}}>{formatShortDate(tx.date)} · {tx.cat}</div>
                            </td>
                            <td style={{...TD, textAlign:"right", fontWeight:700, color:C.pri}}>{fmtS(tx.amt)}</td>
                            <td style={{...TD, textAlign:"center"}}>
                              {st && <span style={{background:st.bg, color:st.color, fontSize:6, fontWeight:700, padding:"1px 2px", borderRadius:2, lineHeight:1.1, display:"inline-block"}}>{st.label}</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="rpt-tfoot">
                      <tr style={{background:C.priL}}>
                        <td colSpan={2} style={{padding:"2px 4px", fontWeight:800, color:C.priD, fontSize:7, lineHeight:1.1}}>Total Pemasukan</td>
                        <td style={{padding:"2px 4px", fontWeight:800, color:C.priD, textAlign:"right", fontSize:7, lineHeight:1.1}}>{fmt(s.totalIncome)}</td>
                        <td/>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              {/* Per-group expense sections */}
              {visibleGroups.map(grpKey => (
                <GrpTable key={grpKey} grpKey={grpKey} txList={groupedExpenses[grpKey]} goals={goals} categoryGroups={categoryGroups}/>
              ))}

              {visibleGroups.length === 0 && selectedGroups.length > 0 && (
                <div style={{textAlign:"center", padding:"20px 0", color:C.textL}}>
                  <p style={{fontSize:11, margin:0}}>Tidak ada transaksi untuk grup ini.</p>
                </div>
              )}

              {/* Goals summary */}
              {goalsCalc.length > 0 && (
                <div className="rpt-sec-sm" style={{marginBottom:5}}>
                  <span className="rpt-hd" style={secHead(C.gold)}>RINGKASAN GOALS</span>
                  <table className="rpt-table" style={{width:"100%", fontSize:7, borderCollapse:"collapse", border:`1px solid ${C.borderL}`, borderTop:"none"}}>
                    <thead>
                      <tr style={{background:"#fffbeb"}}>
                        <th style={{...TH, color:C.goldD}}>Goal</th>
                        <th style={{...TH, color:C.goldD, textAlign:"right"}}>Target</th>
                        <th style={{...TH, color:C.goldD, textAlign:"right"}}>Terkumpul</th>
                        <th style={{...TH, color:C.goldD, textAlign:"right", width:28}}>%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {goalsCalc.map((g, i) => (
                        <tr className="rpt-tr" key={g.id} style={{background: i % 2 === 0 ? "#fff" : "#fffbeb"}}>
                          <td style={TD}><span style={{fontWeight:600}}>{g.name}</span></td>
                          <td style={{...TD, textAlign:"right", color:C.textM}}>{fmtS(Number(g.target || 0))}</td>
                          <td style={{...TD, textAlign:"right", fontWeight:700, color:C.pri}}>{fmtS(g.displayedSaved)}</td>
                          <td style={{...TD, textAlign:"right", fontWeight:700, color:g.pct >= 100 ? C.pri : C.text}}>{g.pct}%</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="rpt-tfoot">
                      <tr style={{background:C.goldL}}>
                        <td style={{padding:"2px 4px", fontWeight:800, color:C.goldD, fontSize:7, lineHeight:1.1}}>Total</td>
                        <td style={{padding:"2px 4px", textAlign:"right", fontWeight:800, color:C.goldD, fontSize:7, lineHeight:1.1}}>{fmtS(totalGoalTarget)}</td>
                        <td style={{padding:"2px 4px", textAlign:"right", fontWeight:800, color:C.pri,   fontSize:7, lineHeight:1.1}}>{fmtS(totalGoalSaved)}</td>
                        <td style={{padding:"2px 4px", textAlign:"right", fontWeight:800, color:C.goldD, fontSize:7, lineHeight:1.1}}>
                          {totalGoalTarget > 0 ? Math.round(totalGoalSaved / totalGoalTarget * 100) : 0}%
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              {/* Footer */}
              <div style={{borderTop:`1px solid ${C.borderL}`, paddingTop:4, textAlign:"center"}}>
                <p style={{fontSize:7, color:C.textM, margin:0}}>
                  Laporan dibuat otomatis oleh <b style={{color:C.pri}}>AMAN Budget</b>
                </p>
                <p style={{fontSize:6, color:C.textL, margin:"1px 0 0"}}>
                  amandigital.web.id · Dicetak {new Date().toLocaleDateString("id-ID", {day:"numeric", month:"long", year:"numeric"})}
                </p>
              </div>
            </div>
            {/* ═══ END PRINT AREA ═══ */}

            <div className="no-print" style={{padding:`0 14px ${safeActionPad}`, display:"flex", flexDirection:"column", gap:8}}>
              {!nativeApp && (
                <button onClick={printPdf} style={{width:"100%", padding:"15px", borderRadius:14, border:"none", background:`linear-gradient(135deg, ${C.red}, #b91c1c)`, color:"#fff", fontSize:14, fontWeight:800, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8, boxShadow:"0 8px 24px rgba(220,38,38,0.4)"}}>
                  <FileDown size={18}/> Print / Simpan PDF
                </button>
              )}
              <button onClick={exportJpg} disabled={exportingJpg} style={{width:"100%", padding:"13px", borderRadius:14, border:`2px solid ${C.pri}`, background: exportingJpg ? C.borderL : "#fff", color: exportingJpg ? C.textM : C.pri, fontSize:13, fontWeight:800, cursor: exportingJpg ? "not-allowed" : "pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8, transition:"all .2s", opacity: exportingJpg ? 0.7 : 1}}>
                <ImageDown size={16}/> {exportingJpg ? "Mengekspor..." : "Export JPG"}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default ShareScreen;
