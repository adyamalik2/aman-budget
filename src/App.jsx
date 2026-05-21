import { useState, useMemo, useEffect } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { GoogleSignIn } from "@capawesome/capacitor-google-sign-in";
import { GoogleAuthProvider, onAuthStateChanged, signInWithCredential, signInWithPopup, signOut } from "firebase/auth";
import BottomNav from "./components/layout/BottomNav";
import HomeScreen from "./screens/HomeScreen";
import GoalsScreen from "./screens/GoalsScreen";
import TransferScreen from "./screens/TransferScreen";
import ZakatScreen from "./screens/ZakatScreen";
import UpgradeScreen from "./screens/UpgradeScreen";
import MoreScreen from "./screens/MoreScreen";
import AccountsScreen from "./screens/AccountsScreen";
import CategoryGroupsScreen from "./screens/CategoryGroupsScreen";
import ReportsScreen from "./screens/ReportsScreen";
import TxListScreen from "./screens/TxListScreen";
import ShareScreen from "./screens/ShareScreen";
import WelcomeScreen from "./screens/WelcomeScreen";
import AddSheet from "./features/transactions/AddSheet";
import { C } from "./constants/theme";
import { DEFAULT_ACCOUNTS, DEFAULT_CATEGORY_GROUPS, STORAGE_KEYS } from "./constants/app";
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
const GOOGLE_WEB_CLIENT_ID = "755957066136-nk0gmi6pf6mqo22r7iu2tr2p6nu6rf4c.apps.googleusercontent.com";
const SKIP_LOGIN_KEY = "aman_budget_skip_login";
const LOCAL_MODE_USER = {name:"Malik", email:"mode-lokal@amanbudget.local"};

// ─── APP ───
export default function App() {
  const [user, setUser] = useState(() => loadStored(STORAGE_KEYS.user, null, v=>v === null || typeof v === "object"));
  const [tab, setTab] = useState("home");
  const [subPage, setSubPage] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editTx, setEditTx] = useState(null);
  const [txs, setTxs] = useState(() => loadStored(STORAGE_KEYS.txs, INIT_TX, Array.isArray));
  const [goals, setGoals] = useState(() => loadStored(STORAGE_KEYS.goals, INIT_GOALS, Array.isArray));
  const [accounts, setAccounts] = useState(() => loadStored(STORAGE_KEYS.accounts, DEFAULT_ACCOUNTS, Array.isArray));
  const [categoryGroups, setCategoryGroups] = useState(() => loadStored(STORAGE_KEYS.categoryGroups, DEFAULT_CATEGORY_GROUPS, Array.isArray));
  const [lastTxDate, setLastTxDate] = useState(() => loadStored(STORAGE_KEYS.lastTxDate, "", v=>typeof v==="string"));
  const [period, setPeriod] = useState(() => normalizePeriod(loadStored(STORAGE_KEYS.period, getDefaultPeriod(), v=>v&&typeof v==="object"&&!Array.isArray(v))));
  const [isPro, setIsPro] = useState(() => loadStored(STORAGE_KEYS.isPro, false, v=>v===true||v===false));
  const [cloudUser, setCloudUser] = useState(null);
  const [cloudBusy, setCloudBusy] = useState(false);
  const [hasUnsyncedChanges, setHasUnsyncedChanges] = useState(false);
  const [hasSkippedLogin, setHasSkippedLogin] = useState(() => loadStored(SKIP_LOGIN_KEY, false, v=>v===true||v===false));
  const appUser = user || (hasSkippedLogin ? LOCAL_MODE_USER : null);

  useEffect(()=>{ saveStored(STORAGE_KEYS.txs, txs); }, [txs]);
  useEffect(()=>{ saveStored(STORAGE_KEYS.goals, goals); }, [goals]);
  useEffect(()=>{ saveStored(STORAGE_KEYS.accounts, accounts); }, [accounts]);
  useEffect(()=>{ saveStored(STORAGE_KEYS.categoryGroups, categoryGroups); }, [categoryGroups]);
  useEffect(()=>{ saveStored(STORAGE_KEYS.lastTxDate, lastTxDate); }, [lastTxDate]);
  useEffect(()=>{ saveStored(STORAGE_KEYS.period, normalizePeriod(period)); }, [period]);
  useEffect(()=>{ saveStored(STORAGE_KEYS.isPro, isPro); }, [isPro]);
  useEffect(()=>{ saveStored(SKIP_LOGIN_KEY, hasSkippedLogin); }, [hasSkippedLogin]);
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
      if(firebaseUser) {
        setUser(prev=>prev || {name:firebaseUser.displayName || "Google User", email:firebaseUser.email || ""});
        setHasSkippedLogin(true);
      }
    });
    return unsubscribe;
  }, []);

  const activeTxs = useMemo(()=>txs.filter(tx=>!tx.deletedAt), [txs]);
  const deletedTxs = useMemo(()=>txs.filter(tx=>tx.deletedAt), [txs]);
  const periodTxs = useMemo(()=>activeTxs.filter(tx=>isTxInPeriod(tx, period)), [activeTxs, period]);
  const periodYears = useMemo(()=>getPeriodYears(activeTxs, period), [activeTxs, period]);
  const cloudBackupPayload = useMemo(()=>({
    transactions: txs,
    goals,
    accounts,
    categoryGroups,
    periodSetting: normalizePeriod(period),
    user: appUser,
  }), [txs, goals, accounts, categoryGroups, period, appUser]);
  const onContinueLocal = () => {
    setHasSkippedLogin(true);
    setUser(LOCAL_MODE_USER);
  };
  const updatePeriod = nextPeriod => {
    setHasUnsyncedChanges(true);
    setPeriod(nextPeriod);
  };

  const onSave = (tx, meta = {}) => {
    setHasUnsyncedChanges(true);
    if(meta.isNew && tx.date) setLastTxDate(tx.date);
    setTxs(p=>{
      const i = p.findIndex(x=>x.id===tx.id);
      if(i>=0) {const n=[...p]; n[i]=tx; return n;}
      return [...p, tx];
    });
  };
  const onDelete = id => {
    const deletedAt = new Date().toISOString();
    setHasUnsyncedChanges(true);
    setTxs(p=>p.map(x=>x.id===id ? {...x, deletedAt} : x));
  };
  const onDone = id => {
    setHasUnsyncedChanges(true);
    setTxs(p=>p.map(x=>x.id===id?{...x, status:"selesai"}:x));
  };
  const onDeletePeriod = periodToDelete => {
    const deletedAt = new Date().toISOString();
    setHasUnsyncedChanges(true);
    setTxs(p=>{
      const result = deleteTransactionsByPeriod(p.filter(tx=>!tx.deletedAt), periodToDelete);
      const ids = new Set(result.deleted.map(tx=>tx.id));
      return p.map(tx=>ids.has(tx.id) ? {...tx, deletedAt} : tx);
    });
  };
  const onRestoreTx = id => {
    setHasUnsyncedChanges(true);
    setTxs(p=>p.map(tx=>{
      if(tx.id !== id) return tx;
      const restored = {...tx};
      delete restored.deletedAt;
      return restored;
    }));
  };
  const onPermanentDeleteTx = id => {
    setHasUnsyncedChanges(true);
    setTxs(p=>p.filter(tx=>tx.id!==id));
  };
  const onAddGoalSaving = (goal, amount) => {
    const value = Number(amount);
    if(!goal?.id || !Number.isFinite(value) || value <= 0) return;
    setHasUnsyncedChanges(true);
    setGoals(p=>p.map(g=>g.id===goal.id ? {...g, saved:Number(g.saved||0)+value} : g));
  };
  const onAddGoal = ({name, target}) => {
    setHasUnsyncedChanges(true);
    setGoals(p => {
      const idx = p.length;
      return [...p, {id:Date.now().toString(), name:name.trim(), target:Number(target), saved:0, deadline:"", icon:GOAL_ICONS[idx%GOAL_ICONS.length], color:GOAL_COLORS[idx%GOAL_COLORS.length]}];
    });
  };
  const onEditGoal = (id, {name, target}) => {
    setHasUnsyncedChanges(true);
    setGoals(p=>p.map(g=>g.id===id ? {...g, name:name.trim(), target:Number(target)} : g));
  };
  const onDeleteGoal = id => {
    setHasUnsyncedChanges(true);
    setGoals(p=>p.filter(g=>g.id!==id));
  };
  const onAccountsChange = nextAccounts => {
    setHasUnsyncedChanges(true);
    setAccounts(nextAccounts);
  };
  const onCategoryGroupsChange = nextCategoryGroups => {
    setHasUnsyncedChanges(true);
    setCategoryGroups(nextCategoryGroups);
  };
  const getPeriodDate = activePeriod => {
    const p = normalizePeriod(activePeriod);
    const month = p.mode === "range" ? p.startMonth : p.month;
    const year = p.mode === "range" ? p.startYear : p.year;
    return `${year}-${String(month).padStart(2, "0")}-01`;
  };
  const getZakatGroup = () => {
    const isZakat = group => `${group?.id || ""} ${group?.label || ""}`.toLowerCase().includes("zakat");
    return categoryGroups.find(group=>group.active !== false && isZakat(group))
      || categoryGroups.find(isZakat)
      || {id:"zakat_sedekah", categories:[{name:"Zakat", active:true}]};
  };
  const onAddZakatBudget = amount => {
    const value = Math.round(Number(amount) || 0);
    if(value <= 0) {
      alert("Nominal zakat belum valid.");
      return;
    }
    const now = new Date().toISOString();
    const group = getZakatGroup();
    const categories = Array.isArray(group.categories) ? group.categories : [];
    const category = categories.find(cat=>cat.active !== false && (cat.name || "").toLowerCase().includes("zakat"))
      || categories.find(cat=>(cat.name || "").toLowerCase().includes("zakat"))
      || {name:"Zakat"};
    const account = accounts.find(acc=>acc.active !== false && acc.name)?.name || "";
    setHasUnsyncedChanges(true);
    setTxs(prevTxs=>[...prevTxs, {
      id:`zakat-${Date.now()}`,
      date:getPeriodDate(period),
      type:"expense",
      grp:group.id || "zakat_sedekah",
      cat:category.name || "Zakat",
      desc:"Zakat Penghasilan",
      amt:value,
      status:"estimasi",
      pay:"transfer",
      acc:account,
      goalId:null,
      createdAt:now,
      updatedAt:now,
    }]);
    alert("Zakat Penghasilan berhasil ditambahkan ke budget.");
  };
  const onCopyTx = tx => {
    const now = new Date().toISOString();
    const {id, deletedAt, ...copySource} = tx;
    void id;
    void deletedAt;
    setHasUnsyncedChanges(true);
    setTxs(prevTxs=>[...prevTxs, {
      ...copySource,
      id:`copy-${Date.now()}`,
      desc:tx.desc ? `${tx.desc} (Copy)` : "Transaksi (Copy)",
      createdAt:now,
      updatedAt:now,
    }]);
    alert("Transaksi berhasil diduplikasi.");
  };
  const onCopyBudget = () => {
    const p = normalizePeriod(period);
    if(p.mode !== "month") return;
    const {items, sourceCount, prev} = copyBudgetFromPreviousMonth(activeTxs, p);
    if(sourceCount === 0) {
      alert(`Tidak ada budget dari ${formatMonthYear(prev.month, prev.year)} untuk dicopy.`);
      return;
    }
    if(items.length === 0) {
      alert("Budget bulan lalu sudah pernah dicopy.");
      return;
    }
    setHasUnsyncedChanges(true);
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
        accounts,
        categoryGroups,
        user,
        periodSetting:normalizePeriod(period),
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
      setAccounts(Array.isArray(data.accounts) ? data.accounts : DEFAULT_ACCOUNTS);
      setCategoryGroups(Array.isArray(data.categoryGroups) ? data.categoryGroups : DEFAULT_CATEGORY_GROUPS);
      if(Object.prototype.hasOwnProperty.call(data, "user")) setUser(data.user);
      if(data.periodSetting !== undefined) setPeriod(normalizePeriod(data.periodSetting));
      else if(data.period !== undefined) setPeriod(normalizePeriod(data.period));
      setHasUnsyncedChanges(true);
      alert("Backup berhasil diimport.");
    } catch {
      alert("Gagal membaca file backup. Pastikan file JSON tidak rusak.");
    }
  };
  const onCloudLogin = async () => {
    if(!isFirebaseConfigured || !auth || !googleProvider) {
      alert("Firebase belum terkonfigurasi. Restart dev server atau cek .env.local.");
      return false;
    }
    setCloudBusy(true);
    try {
      let credentialResult;
      if(Capacitor.isNativePlatform()) {
        await GoogleSignIn.initialize({
          clientId: GOOGLE_WEB_CLIENT_ID,
        });
        const googleUser = await GoogleSignIn.signIn();
        if(!googleUser.idToken) throw new Error("Google ID token kosong.");
        const credential = GoogleAuthProvider.credential(googleUser.idToken);
        credentialResult = await signInWithCredential(auth, credential);
      } else {
        credentialResult = await signInWithPopup(auth, googleProvider);
      }
      const firebaseUser = credentialResult.user;
      setUser({name:firebaseUser.displayName || "Google User", email:firebaseUser.email || ""});
      setHasSkippedLogin(true);
      alert("Login Google berhasil.");
      return true;
    } catch {
      alert("Login Google gagal.");
      return false;
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
      if(Capacitor.isNativePlatform()) {
        try {
          await GoogleSignIn.signOut();
        } catch {
          // Firebase sign out tetap dijalankan walau native credential state sudah kosong.
        }
      }
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
      await backupToCloud(cloudUser.uid, cloudBackupPayload);
      setHasUnsyncedChanges(false);
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
      setAccounts(Array.isArray(data.accounts) ? data.accounts : DEFAULT_ACCOUNTS);
      setCategoryGroups(Array.isArray(data.categoryGroups) ? data.categoryGroups : DEFAULT_CATEGORY_GROUPS);
      if(data.periodSetting !== undefined) setPeriod(normalizePeriod(data.periodSetting));
      else if(data.period !== undefined) setPeriod(normalizePeriod(data.period));
      if(data.user && typeof data.user === "object") setUser(data.user);
      setHasUnsyncedChanges(false);
      alert("Restore cloud berhasil.");
    } catch {
      alert("Restore cloud gagal.");
    } finally {
      setCloudBusy(false);
    }
  };
  const openUpgrade = () => setSubPage("upgrade");
  const onLocalLogout = () => {
    setHasSkippedLogin(false);
    setUser(null);
  };
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

  if(!user && !hasSkippedLogin) {
    return <WelcomeScreen onGoogleLogin={onCloudLogin} onContinueLocal={onContinueLocal} busy={cloudBusy}/>;
  }

  const renderScreen = () => {
    if(subPage==="upgrade") return <UpgradeScreen setSubPage={setSubPage} isPro={isPro} onActivatePro={onActivatePro} onDeactivatePro={onDeactivatePro}/>;
    if(subPage==="transfer") return <TransferScreen txs={activeTxs} setSubPage={setSubPage}/>;
    if(subPage==="zakat") return <ZakatScreen setSubPage={setSubPage} onAddZakatBudget={onAddZakatBudget}/>;
    if(subPage==="accounts") return <AccountsScreen accounts={accounts} txs={txs} onAccountsChange={onAccountsChange} setSubPage={setSubPage}/>;
    if(subPage==="category-groups") return <CategoryGroupsScreen categoryGroups={categoryGroups} txs={txs} onCategoryGroupsChange={onCategoryGroupsChange} setSubPage={setSubPage}/>;
    if(subPage==="tx-list") return <TxListScreen txs={periodTxs} allTxs={activeTxs} goals={goals} period={period} setPeriod={updatePeriod} years={periodYears} onCopyBudget={onCopyBudget} onDeletePeriod={onDeletePeriod} setSubPage={setSubPage} setEditTx={setEditTx} setAddOpen={setAddOpen} onDelete={onDelete} onDone={onDone} onCopy={onCopyTx}/>;
    if(subPage==="share") return <ShareScreen txs={periodTxs} allTxs={activeTxs} goals={goals} period={period} categoryGroups={categoryGroups} setSubPage={setSubPage}/>;
    if(tab==="home") return <HomeScreen txs={periodTxs} allTxs={activeTxs} goals={goals} period={period} setPeriod={updatePeriod} years={periodYears} onCopyBudget={onCopyBudget} setTab={setTab} setSubPage={setSubPage} setEditTx={setEditTx} setAddOpen={setAddOpen} openUpgrade={openUpgrade} isPro={isPro} user={appUser} cloudUser={cloudUser} hasUnsyncedChanges={hasUnsyncedChanges} onCloudBackup={onCloudBackup}/>;
    if(tab==="reports") return <ReportsScreen txs={periodTxs} period={period} setPeriod={updatePeriod} years={periodYears} openUpgrade={openUpgrade}/>;
    if(tab==="goals-tab") return <GoalsScreen goals={goals} txs={activeTxs} isPro={isPro} openUpgrade={openUpgrade} onAddSaving={onAddGoalSaving} onAddGoal={onAddGoal} onEditGoal={onEditGoal} onDeleteGoal={onDeleteGoal}/>;
    if(tab==="more") return <MoreScreen setSubPage={setSubPage} openUpgrade={openUpgrade} isPro={isPro} onLogout={onLocalLogout} onExportBackup={onExportBackup} onImportBackup={onImportBackup} cloudUser={cloudUser} cloudBusy={cloudBusy} hasUnsyncedChanges={hasUnsyncedChanges} onCloudLogin={onCloudLogin} onCloudLogout={onCloudLogout} onCloudBackup={onCloudBackup} onCloudRestore={onCloudRestore} deletedTxs={deletedTxs} onRestoreTx={onRestoreTx} onPermanentDeleteTx={onPermanentDeleteTx}/>;
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
        {addOpen && <AddSheet editTx={editTx} goals={goals} accounts={accounts} categoryGroups={categoryGroups} lastTxDate={lastTxDate} onSave={onSave} onClose={()=>{setAddOpen(false); setEditTx(null);}}/>}
      </div>
    </div>
  );
}
