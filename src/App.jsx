import { useState, useMemo, useEffect } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
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
import { auth, googleProvider, isFirebaseConfigured } from "./lib/firebase";
import { backupToCloud, restoreFromCloud } from "./lib/cloudBackup";
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

// ─── GOAL DEFAULTS ───
const GOAL_COLORS = ["#16a34a","#2563eb","#d97706","#dc2626","#7c3aed","#0891b2"];
const GOAL_ICONS  = ["plane","grad","shield"];

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
  const [isPro, setIsPro] = useState(() => loadStored(STORAGE_KEYS.isPro, false, v=>v===true||v===false));
  const [cloudUser, setCloudUser] = useState(null);
  const [cloudBusy, setCloudBusy] = useState(false);

  useEffect(()=>{ saveStored(STORAGE_KEYS.txs, txs); }, [txs]);
  useEffect(()=>{ saveStored(STORAGE_KEYS.goals, goals); }, [goals]);
  useEffect(()=>{ saveStored(STORAGE_KEYS.period, normalizePeriod(period)); }, [period]);
  useEffect(()=>{ saveStored(STORAGE_KEYS.isPro, isPro); }, [isPro]);
  useEffect(()=>{
    if(user) saveStored(STORAGE_KEYS.user, user);
    else removeStored(STORAGE_KEYS.user);
  }, [user]);
  useEffect(() => {
    if(!isFirebaseConfigured || !auth) {
      return undefined;
    }
    const unsubscribe = onAuthStateChanged(auth, firebaseUser => {
      setCloudUser(firebaseUser);
    });
    return unsubscribe;
  }, []);

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
  const onAddGoalSaving = (goal, amount) => {
    const value = Number(amount);
    if(!goal?.id || !Number.isFinite(value) || value <= 0) return;
    setGoals(p=>p.map(g=>g.id===goal.id ? {...g, saved:Number(g.saved||0)+value} : g));
  };
  const onAddGoal = ({name, target}) => {
    setGoals(p => {
      const idx = p.length;
      return [...p, {id:Date.now().toString(), name:name.trim(), target:Number(target), saved:0, deadline:"", icon:GOAL_ICONS[idx%GOAL_ICONS.length], color:GOAL_COLORS[idx%GOAL_COLORS.length]}];
    });
  };
  const onEditGoal = (id, {name, target}) => {
    setGoals(p=>p.map(g=>g.id===id ? {...g, name:name.trim(), target:Number(target)} : g));
  };
  const onDeleteGoal = id => {
    setGoals(p=>p.filter(g=>g.id!==id));
  };
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
  const onCloudLogin = async () => {
    if(!isFirebaseConfigured || !auth || !googleProvider) {
      alert("Firebase belum terkonfigurasi. Restart dev server atau cek .env.local.");
      return;
    }
    setCloudBusy(true);
    try {
      await signInWithPopup(auth, googleProvider);
      alert("Login Google berhasil.");
    } catch {
      alert("Login Google gagal.");
    } finally {
      setCloudBusy(false);
    }
  };
  const onCloudLogout = async () => {
    if(!isFirebaseConfigured || !auth) {
      alert("Firebase belum terkonfigurasi. Restart dev server atau cek .env.local.");
      return;
    }
    setCloudBusy(true);
    try {
      await signOut(auth);
      alert("Logout Google berhasil.");
    } catch {
      alert("Logout Google gagal.");
    } finally {
      setCloudBusy(false);
    }
  };
  const onCloudBackup = async () => {
    if(!isFirebaseConfigured) {
      alert("Firebase belum terkonfigurasi. Restart dev server atau cek .env.local.");
      return;
    }
    if(!cloudUser) {
      alert("Login Google dulu untuk backup cloud.");
      return;
    }
    setCloudBusy(true);
    try {
      await backupToCloud(cloudUser.uid, {
        transactions: txs,
        goals,
        periodSetting: normalizePeriod(period),
        user,
      });
      alert("Backup cloud berhasil.");
    } catch {
      alert("Backup cloud gagal.");
    } finally {
      setCloudBusy(false);
    }
  };
  const onCloudRestore = async () => {
    if(!isFirebaseConfigured) {
      alert("Firebase belum terkonfigurasi. Restart dev server atau cek .env.local.");
      return;
    }
    if(!cloudUser) {
      alert("Login Google dulu untuk restore cloud.");
      return;
    }
    setCloudBusy(true);
    try {
      const data = await restoreFromCloud(cloudUser.uid);
      if(!data) {
        alert("Belum ada backup cloud.");
        return;
      }

      const restoredTxs = Array.isArray(data.transactions) ? data.transactions : [];
      const ok = window.confirm(`Restore cloud akan mengganti ${txs.length} transaksi saat ini dengan ${restoredTxs.length} transaksi cloud. Lanjutkan?`);
      if(!ok) return;

      setTxs(restoredTxs.map(tx=>({...tx, amt:Number(tx.amt)})));
      if(Array.isArray(data.goals)) setGoals(data.goals);
      if(data.periodSetting !== undefined) setPeriod(normalizePeriod(data.periodSetting));
      else if(data.period !== undefined) setPeriod(normalizePeriod(data.period));
      if(data.user && typeof data.user === "object") setUser(data.user);
      alert("Restore cloud berhasil.");
    } catch {
      alert("Restore cloud gagal.");
    } finally {
      setCloudBusy(false);
    }
  };
  const openUpgrade = () => setSubPage("upgrade");
  const onActivatePro   = () => { setIsPro(true);  alert("Mode Pro sementara aktif untuk testing."); };
  const onDeactivatePro = () => setIsPro(false);

  useEffect(() => {
    if (Capacitor.getPlatform() !== "android") return undefined;

    let removeListener;
    const setupBackButton = async () => {
      const listener = await CapacitorApp.addListener("backButton", () => {
        if(addOpen) {
          setAddOpen(false);
          setEditTx(null);
          return;
        }
        if(subPage) {
          setSubPage(null);
          return;
        }
        if(tab !== "home") {
          setTab("home");
          return;
        }
        if(window.confirm("Keluar dari AMAN Budget?")) {
          CapacitorApp.exitApp();
        }
      });
      removeListener = () => listener.remove();
    };

    setupBackButton();
    return () => {
      removeListener?.();
    };
  }, [addOpen, subPage, tab]);

  if(!user) return <LoginScreen onLogin={setUser}/>;

  const renderScreen = () => {
    if(subPage==="upgrade") return <UpgradeScreen setSubPage={setSubPage} isPro={isPro} onActivatePro={onActivatePro} onDeactivatePro={onDeactivatePro}/>;
    if(subPage==="transfer") return <TransferScreen txs={txs} setSubPage={setSubPage}/>;
    if(subPage==="zakat") return <ZakatScreen setSubPage={setSubPage}/>;
    if(subPage==="tx-list") return <TxListScreen txs={periodTxs} allTxs={txs} goals={goals} period={period} setPeriod={setPeriod} years={periodYears} onCopyBudget={onCopyBudget} onDeletePeriod={onDeletePeriod} setSubPage={setSubPage} setEditTx={setEditTx} setAddOpen={setAddOpen} onDelete={onDelete} onDone={onDone}/>;
    if(subPage==="share") return <ShareScreen txs={periodTxs} allTxs={txs} goals={goals} period={period} setSubPage={setSubPage}/>;
    if(tab==="home") return <HomeScreen txs={periodTxs} allTxs={txs} goals={goals} period={period} setPeriod={setPeriod} years={periodYears} onCopyBudget={onCopyBudget} setTab={setTab} setSubPage={setSubPage} setEditTx={setEditTx} setAddOpen={setAddOpen} openUpgrade={openUpgrade} isPro={isPro} user={user}/>;
    if(tab==="reports") return <ReportsScreen txs={periodTxs} period={period} setPeriod={setPeriod} years={periodYears} openUpgrade={openUpgrade}/>;
    if(tab==="goals-tab") return <GoalsScreen goals={goals} txs={txs} isPro={isPro} openUpgrade={openUpgrade} onAddSaving={onAddGoalSaving} onAddGoal={onAddGoal} onEditGoal={onEditGoal} onDeleteGoal={onDeleteGoal}/>;
    if(tab==="more") return <MoreScreen setSubPage={setSubPage} openUpgrade={openUpgrade} isPro={isPro} onLogout={()=>setUser(null)} onExportBackup={onExportBackup} onImportBackup={onImportBackup} cloudUser={cloudUser} cloudBusy={cloudBusy} onCloudLogin={onCloudLogin} onCloudLogout={onCloudLogout} onCloudBackup={onCloudBackup} onCloudRestore={onCloudRestore}/>;
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
        {addOpen && <AddSheet editTx={editTx} goals={goals} onSave={onSave} onClose={()=>{setAddOpen(false); setEditTx(null);}}/>}
      </div>
    </div>
  );
}
