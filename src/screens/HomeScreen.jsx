import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowRightLeft,
  ArrowUp,
  Bell,
  Calculator,
  Check,
  ChevronRight,
  Clock,
  CloudOff,
  CloudCheck,
  Crown,
  FileDown,
  Pencil,
  Plus,
  Receipt,
  Settings,
  Target,
  TrendingDown,
  TrendingUp,
  Trash2,
  X,
} from "lucide-react";
import PeriodPicker from "../components/period/PeriodPicker";
import { GROUPS } from "../constants/app";
import { C } from "../constants/theme";
import { fmt, fmtS } from "../utils/format";
import { formatPeriodLabel, normalizePeriod } from "../utils/period";
import { calcGroups, calcSummary } from "../utils/summary";
import { getGoalDisplayedSaved } from "../utils/goals";

const card = {background:"#fff", borderRadius:16, padding:"14px 16px", border:`1px solid ${C.borderL}`, boxShadow:"0 1px 4px rgba(0,0,0,0.03)"};
const inp = {width:"100%", border:`1.5px solid ${C.border}`, borderRadius:12, padding:"11px 14px", fontSize:14, outline:"none", boxSizing:"border-box", background:"#fff", color:C.text};
const lbl = {fontSize:12, fontWeight:600, color:C.textM, display:"block", marginBottom:6};

const newShortcutForm = group => ({
  id:null,
  label:"",
  type:"expense",
  group,
  category:"",
  description:"",
  amount:"",
  account:"",
  isActive:true,
});

const HomeScreen = ({txs, allTxs = [], goals = [], period, setPeriod, years, onCopyBudget, setTab, setSubPage, setEditTx, setAddOpen, quickShortcuts = [], accounts = [], categoryGroups = [], onOpenShortcut, onQuickShortcutsChange, openUpgrade, isPro = false, user, cloudUser = null, hasUnsyncedChanges = false, onCloudBackup}) => {
  const [shortcutSheetOpen, setShortcutSheetOpen] = useState(false);
  const [shortcutForm, setShortcutForm] = useState(null);
  const [shortcutErr, setShortcutErr] = useState({});
  const s = calcSummary(txs);
  const grps = calcGroups(txs);
  const cloudMeta = !cloudUser
    ? {icon:CloudOff, label:"Mode Lokal", color:C.gold}
    : hasUnsyncedChanges
      ? {icon:CloudOff, label:"Ada perubahan belum dibackup", color:C.gold}
      : {icon:CloudCheck, label:"Data sudah dibackup", color:"#bbf7d0"};
  const CloudIcon = cloudMeta.icon;
  const handleCloudClick = () => {
    if(!cloudUser) {
      alert("Anda sedang dalam Mode Lokal. Data hanya tersimpan di HP. Silakan login Google di menu 'Lainnya' untuk mengaktifkan Cloud Backup.");
      return;
    }
    onCloudBackup?.();
  };

  // Goal summary — pakai semua transaksi (allTxs) dan manual saved, konsisten dengan GoalsScreen
  const goalsWithSaved = goals.map(g => ({...g, _saved: getGoalDisplayedSaved(g, allTxs)}));
  const totalGoalSaved  = goalsWithSaved.reduce((sum, g) => sum + g._saved, 0);
  const totalGoalTarget = goalsWithSaved.reduce((sum, g) => sum + Number(g.target||0), 0);
  const goalPct = totalGoalTarget > 0 ? Math.min(Math.round(totalGoalSaved/totalGoalTarget*100), 100) : 0;
  const topGoal = goalsWithSaved.length > 0
    ? goalsWithSaved.reduce((best, g) => {
        const pG = Number(g.target||0) > 0 ? g._saved/Number(g.target) : 0;
        const pB = Number(best.target||0) > 0 ? best._saved/Number(best.target) : 0;
        return pG > pB ? g : best;
      })
    : null;
  const unpaidItems = txs.filter(x=>x.status==="belum_selesai").slice(0, 3);
  const unpaidCount = txs.filter(x=>x.status==="belum_selesai").length;
  const recent = [...txs].sort((a,b)=>b.date.localeCompare(a.date)).slice(0, 4);
  const periodMode = normalizePeriod(period).mode;
  const periodLabel = formatPeriodLabel(period);
  const handleBellClick = () => {
    if(unpaidCount > 0) alert(`Pengingat: ada ${unpaidCount} tagihan belum dibayar senilai ${fmt(s.unpaid)} pada ${periodLabel}.`);
    else alert("Belum ada pengingat. Tagihan berstatus \"Belum Bayar\" akan muncul di sini.");
  };
  const activeGroupOptions = categoryGroups
    .filter(group=>group?.active !== false && group?.id)
    .map(group=>({id:group.id, label:group.label || GROUPS[group.id]?.label || group.id}));
  const accountOptions = accounts.filter(account=>account?.active !== false && account?.name).map(account=>account.name);
  const shortcutRows = useMemo(() => [...quickShortcuts].sort((a,b)=>{
    const activeA = a.isActive !== false;
    const activeB = b.isActive !== false;
    if(activeA !== activeB) return activeA ? -1 : 1;
    return Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0);
  }), [quickShortcuts]);
  const activeShortcuts = shortcutRows.filter(shortcut=>shortcut.isActive !== false);
  const shortcutGroup = categoryGroups.find(group=>group.id === shortcutForm?.group);
  const shortcutCategories = (shortcutGroup?.categories || []).filter(category=>category?.active !== false && category?.name);
  const resetShortcutForm = () => {
    setShortcutForm(null);
    setShortcutErr({});
  };
  const openNewShortcut = () => {
    setShortcutForm(newShortcutForm(activeGroupOptions[0]?.id || ""));
    setShortcutErr({});
  };
  const openEditShortcut = shortcut => {
    setShortcutForm({
      id:shortcut.id,
      label:shortcut.label || "",
      type:shortcut.type === "income" ? "income" : "expense",
      group:shortcut.group || activeGroupOptions[0]?.id || "",
      category:shortcut.category || "",
      description:shortcut.description || "",
      amount:shortcut.amount ?? "",
      account:shortcut.account || "",
      isActive:shortcut.isActive !== false,
    });
    setShortcutErr({});
  };
  const saveShortcut = () => {
    const label = shortcutForm?.label?.trim() || "";
    const description = shortcutForm?.description?.trim() || "";
    const category = shortcutForm?.category?.trim() || "";
    const amountText = String(shortcutForm?.amount ?? "").trim();
    const errors = {};
    let amount = "";
    if(!label) errors.label = "Label wajib diisi.";
    if(quickShortcuts.some(item=>item.id !== shortcutForm?.id && (item.label || "").trim().toLowerCase() === label.toLowerCase())) {
      errors.label = "Label shortcut sudah ada.";
    }
    if(amountText) {
      const amountNumber = Number(amountText);
      if(!Number.isFinite(amountNumber) || amountNumber <= 0) errors.amount = "Nominal harus lebih dari 0 atau kosongkan.";
      else amount = amountNumber;
    }
    if(Object.keys(errors).length) {
      setShortcutErr(errors);
      return;
    }
    const now = new Date().toISOString();
    const existing = quickShortcuts.find(item=>item.id === shortcutForm.id);
    const nextShortcut = {
      ...(existing || {}),
      id:existing?.id || `shortcut-${Date.now()}`,
      label,
      type:shortcutForm.type === "income" ? "income" : "expense",
      group:shortcutForm.group || "",
      category,
      description,
      amount,
      account:shortcutForm.account || "",
      sortOrder:Number.isFinite(Number(existing?.sortOrder)) ? Number(existing.sortOrder) : quickShortcuts.length,
      isActive:shortcutForm.isActive !== false,
      createdAt:existing?.createdAt || now,
      updatedAt:now,
    };
    const next = existing
      ? quickShortcuts.map(item=>item.id === existing.id ? nextShortcut : item)
      : [...quickShortcuts, nextShortcut];
    onQuickShortcutsChange?.(next);
    resetShortcutForm();
  };
  const toggleShortcut = shortcut => {
    const now = new Date().toISOString();
    onQuickShortcutsChange?.(quickShortcuts.map(item=>item.id === shortcut.id ? {...item, isActive:item.isActive === false, updatedAt:now} : item));
  };
  const deleteShortcut = shortcut => {
    if(window.confirm(`Hapus shortcut "${shortcut.label}"?`)) {
      onQuickShortcutsChange?.(quickShortcuts.filter(item=>item.id !== shortcut.id).map((item, index)=>({...item, sortOrder:index})));
      if(shortcutForm?.id === shortcut.id) resetShortcutForm();
    }
  };
  const moveShortcut = (shortcut, direction) => {
    const list = [...shortcutRows];
    const index = list.findIndex(item=>item.id === shortcut.id);
    const target = index + direction;
    if(index < 0 || target < 0 || target >= list.length) return;
    [list[index], list[target]] = [list[target], list[index]];
    onQuickShortcutsChange?.(list.map((item, order)=>({...item, sortOrder:order})));
  };

  return (
    <div style={{flex:1, overflowY:"auto", paddingBottom:92, background:C.bg}}>
      {/* Header with greeting */}
      <div style={{background:`linear-gradient(165deg, ${C.pri} 0%, ${C.priD} 100%)`, padding:"42px 16px 20px", color:"#fff", borderBottomLeftRadius:24, borderBottomRightRadius:24}}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16}}>
          <div>
            <p style={{fontSize:12, margin:0, opacity:0.85}}>Assalamu'alaikum,</p>
            <p style={{fontSize:18, fontWeight:700, margin:"2px 0 0"}}>{user.name} 👋</p>
          </div>
          <div style={{display:"flex", gap:8}}>
            <button onClick={openUpgrade} style={{background:`linear-gradient(135deg, ${C.gold}, #f59e0b)`, border:"none", borderRadius:20, padding:"6px 12px", cursor:"pointer", display:"flex", alignItems:"center", gap:5, color:"#fff", fontWeight:700, fontSize:11, boxShadow:"0 4px 12px rgba(217,119,6,0.4)"}}>
              <Crown size={13}/> Pro
            </button>
            <button type="button" onClick={handleCloudClick} title={cloudMeta.label} aria-label={cloudMeta.label} style={{width:36, height:36, background:"rgba(255,255,255,0.15)", border:"none", borderRadius:10, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff"}}>
              <CloudIcon size={17} color={cloudMeta.color}/>
            </button>
            <button onClick={handleBellClick} aria-label="Notifikasi" style={{width:36, height:36, background:"rgba(255,255,255,0.15)", border:"none", borderRadius:10, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", position:"relative"}}>
              <Bell size={17}/>
              {unpaidCount > 0 && <span style={{position:"absolute", top:7, right:7, width:7, height:7, background:C.gold, borderRadius:"50%"}}/>}
            </button>
          </div>
        </div>

        {/* Balance card */}
        <div>
          <p style={{fontSize:11, margin:"0 0 4px", opacity:0.85, fontWeight:500}}>SALDO AKTUAL · {periodLabel.toUpperCase()}</p>
          <p style={{fontSize:32, fontWeight:800, margin:0, letterSpacing:-1}}>{fmt(s.actBal)}</p>
          <div style={{display:"flex", gap:12, marginTop:12}}>
            <div style={{flex:1, background:"rgba(255,255,255,0.15)", borderRadius:12, padding:"10px 12px", backdropFilter:"blur(8px)"}}>
              <div style={{display:"flex", alignItems:"center", gap:6, marginBottom:2}}>
                <TrendingUp size={12}/>
                <span style={{fontSize:10, opacity:0.9, fontWeight:600}}>PEMASUKAN</span>
              </div>
              <p style={{fontSize:14, fontWeight:700, margin:0}}>{fmtS(s.totalIncome)}</p>
            </div>
            <div style={{flex:1, background:"rgba(255,255,255,0.15)", borderRadius:12, padding:"10px 12px"}}>
              <div style={{display:"flex", alignItems:"center", gap:6, marginBottom:2}}>
                <TrendingDown size={12}/>
                <span style={{fontSize:10, opacity:0.9, fontWeight:600}}>PENGELUARAN</span>
              </div>
              <p style={{fontSize:14, fontWeight:700, margin:0}}>{fmtS(s.paid)}</p>
            </div>
          </div>
          <PeriodPicker period={period} setPeriod={setPeriod} years={years} onCopyBudget={onCopyBudget} dark style={{marginTop:14}}/>
        </div>
      </div>

      <div style={{padding:"14px", display:"flex", flexDirection:"column", gap:12}}>

        {/* Quick actions */}
        <div style={{display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:8}}>
          {[
            {icon:ArrowRightLeft, label:"Transfer", color:C.blue, action:()=>setSubPage("transfer")},
            {icon:Calculator, label:"Zakat", color:C.pri, action:()=>setSubPage("zakat")},
            {icon:Target, label:"Goals", color:C.gold, action:()=>{setTab("goals-tab"); setSubPage(null);}},
            {icon:FileDown, label:"Export", color:"#8b5cf6", action:isPro ? ()=>setSubPage("share") : openUpgrade},
          ].map((q,i)=>(
            <button key={i} onClick={q.action} style={{background:"#fff", border:`1px solid ${C.borderL}`, borderRadius:14, padding:"10px 4px", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:4}}>
              <div style={{width:36, height:36, borderRadius:10, background:q.color+"15", display:"flex", alignItems:"center", justifyContent:"center"}}>
                <q.icon size={18} color={q.color}/>
              </div>
              <span style={{fontSize:10, fontWeight:600, color:C.textM}}>{q.label}</span>
            </button>
          ))}
        </div>

        {/* Quick transaction shortcuts */}
        <div style={card}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10}}>
            <p style={{fontSize:13, fontWeight:700, color:C.text, margin:0}}>Transaksi Cepat</p>
            <button type="button" onClick={()=>{setShortcutSheetOpen(true); resetShortcutForm();}} style={{background:"none", border:"none", color:C.pri, fontSize:11, fontWeight:800, cursor:"pointer", display:"flex", alignItems:"center", gap:4}}>
              <Settings size={13}/> Atur
            </button>
          </div>
          {activeShortcuts.length > 0 ? (
            <div style={{display:"grid", gridTemplateColumns:"repeat(2, minmax(0, 1fr))", gap:8}}>
              {activeShortcuts.slice(0, 6).map(shortcut => {
                const groupColor = GROUPS[shortcut.group]?.color || C.pri;
                return (
                  <button key={shortcut.id} type="button" onClick={()=>onOpenShortcut?.(shortcut)} style={{border:`1px solid ${C.borderL}`, borderRadius:14, background:"#fff", padding:"10px", cursor:"pointer", textAlign:"left", minHeight:64}}>
                    <div style={{display:"flex", alignItems:"center", gap:8}}>
                      <div style={{width:30, height:30, borderRadius:10, background:groupColor+"15", color:groupColor, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>
                        <Plus size={16}/>
                      </div>
                      <div style={{minWidth:0}}>
                        <p style={{fontSize:12, fontWeight:800, color:C.text, margin:0, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{shortcut.label}</p>
                        <p style={{fontSize:10, color:C.textL, margin:"2px 0 0", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{shortcut.category || (shortcut.type === "income" ? "Pemasukan" : GROUPS[shortcut.group]?.label || "Pengeluaran")}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <button type="button" onClick={()=>{setShortcutSheetOpen(true); openNewShortcut();}} style={{width:"100%", border:`1px dashed ${C.border}`, borderRadius:14, background:C.bg, padding:"14px", color:C.textM, fontSize:12, fontWeight:700, cursor:"pointer"}}>
              Tambah shortcut transaksi harian
            </button>
          )}
        </div>

        {/* Goals summary card */}
        {goals.length > 0 && (
          <div style={card}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8}}>
              <p style={{fontSize:13, fontWeight:700, color:C.text, margin:0}}>Progress Goals</p>
              <button onClick={()=>{setTab("goals-tab"); setSubPage(null);}}
                style={{background:"none", border:"none", color:C.pri, fontSize:11, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:2}}>
                Lihat Goals <ChevronRight size={12}/>
              </button>
            </div>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:6}}>
              <div>
                <p style={{fontSize:11, color:C.textM, margin:0, fontWeight:600}}>TOTAL TERKUMPUL</p>
                <p style={{fontSize:18, fontWeight:800, color:C.priD, margin:"2px 0 0"}}>{fmtS(totalGoalSaved)}</p>
              </div>
              <p style={{fontSize:22, fontWeight:800, color:C.pri, margin:0}}>{goalPct}%</p>
            </div>
            <div style={{background:C.borderL, borderRadius:8, height:8, overflow:"hidden", marginBottom:6}}>
              <div style={{background:`linear-gradient(90deg, ${C.pri}, ${C.priD})`, height:"100%", width:`${goalPct}%`, borderRadius:8, transition:"width .5s"}}/>
            </div>
            <p style={{fontSize:11, color:C.textM, margin:"0 0 0"}}>
              dari target {fmtS(totalGoalTarget)} · {goals.length} goal
            </p>
            {topGoal && (
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:8, marginTop:8, borderTop:`1px solid ${C.borderL}`}}>
                <div style={{display:"flex", alignItems:"center", gap:6}}>
                  <div style={{width:8, height:8, borderRadius:"50%", background:topGoal.color||C.pri, flexShrink:0}}/>
                  <span style={{fontSize:11, color:C.textM}}>Tertinggi: <b style={{color:C.text}}>{topGoal.name}</b></span>
                </div>
                <span style={{fontSize:11, fontWeight:800, color:topGoal.color||C.pri}}>
                  {Number(topGoal.target||0)>0 ? Math.min(Math.round(topGoal._saved/Number(topGoal.target)*100),100) : 0}%
                </span>
              </div>
            )}
          </div>
        )}

        {/* Progress card */}
        <div style={{...card, background:`linear-gradient(135deg, #fff 0%, ${C.priBg} 100%)`}}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8}}>
            <div>
              <p style={{fontSize:11, color:C.textM, margin:0, fontWeight:600, letterSpacing:0.3}}>{periodMode==="range"?"PROGRESS PERIODE":"PROGRESS BULAN INI"}</p>
              <p style={{fontSize:22, fontWeight:800, color:C.priD, margin:"2px 0 0"}}>{s.prog}%</p>
            </div>
            <div style={{textAlign:"right"}}>
              <p style={{fontSize:11, color:C.textM, margin:0, fontWeight:600}}>SISA AMAN</p>
              <p style={{fontSize:16, fontWeight:800, color:s.safeBal<0?C.red:C.pri, margin:"2px 0 0"}}>{fmtS(s.safeBal)}</p>
            </div>
          </div>
          <div style={{background:"#fff", borderRadius:10, height:10, overflow:"hidden", border:`1px solid ${C.priL}`}}>
            <div style={{background:`linear-gradient(90deg, ${C.pri}, ${C.priD})`, borderRadius:10, height:"100%", width:`${Math.min(s.prog, 100)}%`, transition:"width .5s"}}/>
          </div>
          <p style={{fontSize:11, color:C.textM, margin:"8px 0 0", textAlign:"center"}}>
            {fmt(s.paid)} dari {fmt(s.estExp)} target
          </p>
        </div>

        {/* Unpaid alert */}
        {unpaidItems.length > 0 && (
          <div style={{...card, border:`1.5px solid ${C.redL}`, background:"#fffafa"}}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10}}>
              <div style={{display:"flex", alignItems:"center", gap:8}}>
                <div style={{width:32, height:32, background:C.redL, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center"}}>
                  <Clock size={16} color={C.red}/>
                </div>
                <div>
                  <p style={{fontSize:13, fontWeight:700, color:C.text, margin:0}}>Belum Dibayar</p>
                  <p style={{fontSize:11, color:C.textM, margin:0}}>{unpaidItems.length} tagihan menunggu</p>
                </div>
              </div>
              <span style={{fontSize:14, fontWeight:800, color:C.red}}>{fmtS(s.unpaid)}</span>
            </div>
            {unpaidItems.map(tx=>(
              <div key={tx.id} onClick={()=>{setEditTx(tx); setAddOpen(true);}} style={{display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderTop:`1px solid ${C.borderL}`, cursor:"pointer"}}>
                <div>
                  <p style={{fontSize:13, fontWeight:600, color:C.text, margin:0}}>{tx.desc}</p>
                  <p style={{fontSize:10, color:C.textL, margin:0}}>{GROUPS[tx.grp]?.label}</p>
                </div>
                <span style={{fontSize:13, fontWeight:700, color:C.red}}>{fmtS(tx.amt)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Group breakdown */}
        <div style={card}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12}}>
            <p style={{fontSize:13, fontWeight:700, color:C.text, margin:0}}>Rekap per Grup</p>
            <button onClick={()=>setSubPage("group-recap")} style={{background:"none", border:"none", color:C.pri, fontSize:11, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:2}}>
              Detail <ChevronRight size={12}/>
            </button>
          </div>
          {Object.entries(grps).slice(0,5).map(([g,v])=>(
            <div key={g} style={{display:"flex", alignItems:"center", gap:10, marginBottom:10}}>
              <div style={{width:8, height:8, borderRadius:"50%", background:GROUPS[g]?.color}}/>
              <span style={{fontSize:12, color:C.text, fontWeight:600, flex:1}}>{GROUPS[g]?.label}</span>
              <div style={{width:64, background:C.borderL, borderRadius:6, height:5, overflow:"hidden"}}>
                <div style={{background:GROUPS[g]?.color, height:"100%", width:v.budget>0?`${Math.min(v.paid/v.budget*100,100)}%`:"0%"}}/>
              </div>
              <span style={{fontSize:11, fontWeight:700, color:C.text, minWidth:60, textAlign:"right"}}>{fmtS(v.budget)}</span>
            </div>
          ))}
        </div>

        {/* Recent transactions */}
        <div style={card}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8}}>
            <p style={{fontSize:13, fontWeight:700, color:C.text, margin:0}}>Transaksi Terbaru</p>
            <button onClick={()=>setSubPage("tx-list")} style={{background:"none", border:"none", color:C.pri, fontSize:11, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:2}}>
              Lihat semua <ChevronRight size={12}/>
            </button>
          </div>
          {recent.map(tx=>(
            <div key={tx.id} onClick={()=>{setEditTx(tx); setAddOpen(true);}} style={{display:"flex", alignItems:"center", gap:10, padding:"10px 0", borderTop:`1px solid ${C.borderL}`, cursor:"pointer"}}>
              <div style={{width:36, height:36, borderRadius:10, background: tx.type==="income"?C.priL:GROUPS[tx.grp]?.color+"15", display:"flex", alignItems:"center", justifyContent:"center"}}>
                {tx.type==="income" ? <TrendingUp size={16} color={C.pri}/> : <Receipt size={16} color={GROUPS[tx.grp]?.color}/>}
              </div>
              <div style={{flex:1, minWidth:0}}>
                <p style={{fontSize:13, fontWeight:600, color:C.text, margin:0, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{tx.desc}</p>
                <p style={{fontSize:10, color:C.textL, margin:0}}>{tx.date.slice(8,10)}/{tx.date.slice(5,7)} · {tx.type==="income"?"Pemasukan":GROUPS[tx.grp]?.label}</p>
              </div>
              <span style={{fontSize:13, fontWeight:700, color: tx.type==="income"?C.pri:C.text}}>{tx.type==="income"?"+":"−"}{fmtS(tx.amt)}</span>
            </div>
          ))}
        </div>
      </div>

      {shortcutSheetOpen && (
        <div style={{position:"fixed", inset:0, background:"rgba(15,23,42,0.45)", zIndex:120, display:"flex", alignItems:"flex-end", justifyContent:"center"}}>
          <div style={{width:"100%", maxWidth:430, background:"#fff", borderTopLeftRadius:24, borderTopRightRadius:24, maxHeight:"90vh", overflowY:"auto", animation:"slideUp 0.3s"}}>
            <div style={{padding:"16px", borderBottom:`1px solid ${C.borderL}`, position:"sticky", top:0, background:"#fff", zIndex:2, display:"flex", alignItems:"center", justifyContent:"space-between"}}>
              <div>
                <p style={{fontSize:16, fontWeight:800, color:C.text, margin:0}}>Shortcut Transaksi</p>
                <p style={{fontSize:11, color:C.textM, margin:"2px 0 0"}}>Shortcut hanya mengisi form, transaksi tetap disimpan manual.</p>
              </div>
              <button type="button" onClick={()=>{setShortcutSheetOpen(false); resetShortcutForm();}} aria-label="Tutup shortcut" style={{background:C.borderL, border:"none", borderRadius:10, padding:8, cursor:"pointer", display:"flex"}}>
                <X size={16} color={C.textM}/>
              </button>
            </div>
            <div style={{padding:"14px 14px calc(32px + env(safe-area-inset-bottom))", display:"flex", flexDirection:"column", gap:12}}>
              <button type="button" onClick={openNewShortcut} style={{background:C.pri, color:"#fff", border:"none", borderRadius:14, padding:"13px", fontSize:13, fontWeight:800, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:7}}>
                <Plus size={16}/> Tambah Shortcut
              </button>

              {shortcutForm && (
                <div style={{...card, boxShadow:"none", background:C.bg}}>
                  <p style={{fontSize:13, fontWeight:800, color:C.text, margin:"0 0 12px"}}>{shortcutForm.id ? "Edit Shortcut" : "Shortcut Baru"}</p>
                  <div style={{display:"flex", flexDirection:"column", gap:12}}>
                    <div>
                      <label style={lbl}>Label Shortcut *</label>
                      <input style={{...inp, borderColor:shortcutErr.label?C.red:C.border}} value={shortcutForm.label} onChange={e=>setShortcutForm(p=>({...p, label:e.target.value}))} placeholder="Contoh: Dapur"/>
                      {shortcutErr.label && <p style={{color:C.red, fontSize:11, margin:"4px 0 0"}}>{shortcutErr.label}</p>}
                    </div>
                    <div>
                      <label style={lbl}>Tipe Transaksi</label>
                      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8}}>
                        {[["expense","Pengeluaran", C.red],["income","Pemasukan", C.pri]].map(([value, label, color])=>(
                          <button key={value} type="button" onClick={()=>setShortcutForm(p=>({...p, type:value}))} style={{padding:"10px", borderRadius:12, border:`1.5px solid ${shortcutForm.type===value?color:C.border}`, background:shortcutForm.type===value?color+"10":"#fff", color:shortcutForm.type===value?color:C.textM, fontSize:12, fontWeight:800, cursor:"pointer"}}>
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10}}>
                      <div>
                        <label style={lbl}>Grup</label>
                        <select style={inp} value={shortcutForm.group} onChange={e=>setShortcutForm(p=>({...p, group:e.target.value, category:""}))}>
                          <option value="">Tanpa grup</option>
                          {activeGroupOptions.map(group=><option key={group.id} value={group.id}>{group.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={lbl}>Kategori</label>
                        <select style={inp} value={shortcutForm.category} onChange={e=>setShortcutForm(p=>({...p, category:e.target.value}))}>
                          <option value="">Tanpa kategori</option>
                          {shortcutForm.category && !shortcutCategories.some(category=>category.name === shortcutForm.category) && <option value={shortcutForm.category}>{shortcutForm.category}</option>}
                          {shortcutCategories.map(category=><option key={category.id || category.name} value={category.name}>{category.name}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label style={lbl}>Deskripsi</label>
                      <input style={inp} value={shortcutForm.description} onChange={e=>setShortcutForm(p=>({...p, description:e.target.value}))} placeholder="Nama transaksi"/>
                    </div>
                    <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10}}>
                      <div>
                        <label style={lbl}>Nominal Default</label>
                        <input type="number" style={{...inp, borderColor:shortcutErr.amount?C.red:C.border}} value={shortcutForm.amount} onChange={e=>setShortcutForm(p=>({...p, amount:e.target.value}))} placeholder="Kosongkan"/>
                        {shortcutErr.amount && <p style={{color:C.red, fontSize:11, margin:"4px 0 0"}}>{shortcutErr.amount}</p>}
                      </div>
                      <div>
                        <label style={lbl}>Rekening</label>
                        <select style={inp} value={shortcutForm.account} onChange={e=>setShortcutForm(p=>({...p, account:e.target.value}))}>
                          <option value="">Default</option>
                          {accountOptions.map(account=><option key={account} value={account}>{account}</option>)}
                        </select>
                      </div>
                    </div>
                    <button type="button" onClick={()=>setShortcutForm(p=>({...p, isActive:p.isActive === false}))} style={{padding:"10px", borderRadius:12, border:`1.5px solid ${shortcutForm.isActive!==false?C.pri:C.border}`, background:shortcutForm.isActive!==false?C.priBg:"#fff", color:shortcutForm.isActive!==false?C.priD:C.textM, fontSize:12, fontWeight:800, cursor:"pointer"}}>
                      {shortcutForm.isActive !== false ? "Aktif" : "Nonaktif"}
                    </button>
                    <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8}}>
                      <button type="button" onClick={resetShortcutForm} style={{border:`1px solid ${C.border}`, borderRadius:12, background:"#fff", color:C.textM, padding:"12px", fontSize:12, fontWeight:800, cursor:"pointer"}}>Batal</button>
                      <button type="button" onClick={saveShortcut} style={{border:"none", borderRadius:12, background:C.pri, color:"#fff", padding:"12px", fontSize:12, fontWeight:800, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6}}>
                        <Check size={15}/> Simpan
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div style={{display:"flex", flexDirection:"column", gap:8}}>
                {shortcutRows.length === 0 && (
                  <div style={{...card, textAlign:"center", boxShadow:"none"}}>
                    <p style={{fontSize:12, color:C.textM, margin:0}}>Belum ada shortcut.</p>
                  </div>
                )}
                {shortcutRows.map((shortcut, index)=>(
                  <div key={shortcut.id} style={{...card, boxShadow:"none", padding:"12px"}}>
                    <div style={{display:"flex", alignItems:"center", gap:10}}>
                      <div style={{flex:1, minWidth:0}}>
                        <div style={{display:"flex", alignItems:"center", gap:6, marginBottom:2}}>
                          <p style={{fontSize:13, fontWeight:800, color:C.text, margin:0, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{shortcut.label}</p>
                          <span style={{fontSize:9, fontWeight:800, color:shortcut.isActive!==false?C.priD:C.textM, background:shortcut.isActive!==false?C.priL:C.borderL, borderRadius:999, padding:"3px 7px", flexShrink:0}}>
                            {shortcut.isActive !== false ? "Aktif" : "Nonaktif"}
                          </span>
                        </div>
                        <p style={{fontSize:10, color:C.textM, margin:0, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>
                          {shortcut.type === "income" ? "Pemasukan" : GROUPS[shortcut.group]?.label || "Pengeluaran"}{shortcut.category ? ` · ${shortcut.category}` : ""}{shortcut.amount ? ` · ${fmtS(Number(shortcut.amount))}` : ""}
                        </p>
                      </div>
                      <div style={{display:"flex", gap:4, flexWrap:"wrap", justifyContent:"flex-end"}}>
                        <button type="button" onClick={()=>moveShortcut(shortcut, -1)} disabled={index===0} aria-label="Naik" style={{width:30, height:30, borderRadius:9, border:`1px solid ${C.border}`, background:"#fff", color:index===0?C.textL:C.textM, cursor:index===0?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center"}}>
                          <ArrowUp size={13}/>
                        </button>
                        <button type="button" onClick={()=>moveShortcut(shortcut, 1)} disabled={index===shortcutRows.length-1} aria-label="Turun" style={{width:30, height:30, borderRadius:9, border:`1px solid ${C.border}`, background:"#fff", color:index===shortcutRows.length-1?C.textL:C.textM, cursor:index===shortcutRows.length-1?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center"}}>
                          <ArrowDown size={13}/>
                        </button>
                        <button type="button" onClick={()=>openEditShortcut(shortcut)} aria-label="Edit" style={{width:30, height:30, borderRadius:9, border:`1px solid ${C.border}`, background:"#fff", color:C.textM, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center"}}>
                          <Pencil size={13}/>
                        </button>
                        <button type="button" onClick={()=>toggleShortcut(shortcut)} aria-label="Aktifkan atau nonaktifkan" style={{width:30, height:30, borderRadius:9, border:`1px solid ${shortcut.isActive!==false?C.goldL:C.priL}`, background:"#fff", color:shortcut.isActive!==false?C.goldD:C.priD, cursor:"pointer", fontSize:10, fontWeight:900}}>
                          {shortcut.isActive !== false ? "Off" : "On"}
                        </button>
                        <button type="button" onClick={()=>deleteShortcut(shortcut)} aria-label="Hapus" style={{width:30, height:30, borderRadius:9, border:`1px solid ${C.redL}`, background:"#fff", color:C.red, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center"}}>
                          <Trash2 size={13}/>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeScreen;
