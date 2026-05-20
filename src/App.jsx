import { useState, useMemo, useEffect } from "react";
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
import ShareScreen from "./screens/ShareScreen";
import AddSheet from "./features/transactions/AddSheet";
import { C } from "./constants/theme";
import { STORAGE_KEYS } from "./constants/app";
import { INIT_GOALS, INIT_TX } from "./data/initialData";
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
