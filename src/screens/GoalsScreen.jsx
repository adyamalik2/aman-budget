import { useState } from "react";
import { ChevronRight, Crown, GraduationCap, Pencil, Plane, Plus, Shield, Trash2 } from "lucide-react";
import Header from "../components/layout/Header";
import { C } from "../constants/theme";
import { fmt, fmtS } from "../utils/format";
import { calcGoalTransactionSaved, getGoalDisplayedSaved } from "../utils/goals";

const card = {background:"#fff", borderRadius:16, padding:"14px 16px", border:`1px solid ${C.borderL}`, boxShadow:"0 1px 4px rgba(0,0,0,0.03)"};
const inp = {width:"100%", border:`1.5px solid ${C.border}`, borderRadius:12, padding:"12px 14px", fontSize:16, outline:"none", boxSizing:"border-box", background:"#fff", color:C.text, fontWeight:700};
const inpMd = {...inp, fontSize:14, padding:"11px 14px", fontWeight:400};
const lbl = {fontSize:12, fontWeight:700, color:C.textM, display:"block", marginBottom:6};

const ICON_MAP = {plane:Plane, grad:GraduationCap, shield:Shield};
const EMPTY_GFORM = {name:"", target:""};

const GoalsScreen = ({goals, txs = [], openUpgrade, onAddSaving, onAddGoal, onEditGoal, onDeleteGoal}) => {
  // Tambah Tabungan modal state
  const [savingGoal, setSavingGoal] = useState(null);
  const [amount, setAmount] = useState("");
  const [amtErr, setAmtErr] = useState("");

  // Add/Edit Goal modal state
  const [goalModal, setGoalModal] = useState(null); // null | {mode:"add"} | {mode:"edit", goal}
  const [gForm, setGForm] = useState(EMPTY_GFORM);
  const [gErr, setGErr] = useState({});

  const totalTarget = goals.reduce((s,g)=>s+Number(g.target||0), 0);
  const totalSaved  = goals.reduce((s,g)=>s+getGoalDisplayedSaved(g, txs), 0);

  // ── Tambah Tabungan handlers ──
  const openSavingModal = goal => { setSavingGoal(goal); setAmount(""); setAmtErr(""); };
  const closeSavingModal = () => { setSavingGoal(null); setAmount(""); setAmtErr(""); };
  const saveSaving = e => {
    e.preventDefault();
    const value = Number(amount);
    if(!amount.trim() || !Number.isFinite(value) || value <= 0) {
      setAmtErr("Nominal harus angka lebih dari 0.");
      return;
    }
    onAddSaving(savingGoal, value);
    closeSavingModal();
  };

  // ── Goal CRUD handlers ──
  const openAddGoal = () => { setGoalModal({mode:"add"}); setGForm(EMPTY_GFORM); setGErr({}); };
  const openEditGoal = goal => { setGoalModal({mode:"edit", goal}); setGForm({name:goal.name, target:String(goal.target)}); setGErr({}); };
  const closeGoalModal = () => { setGoalModal(null); setGErr({}); };

  const validateGForm = (name, target, editId) => {
    const e = {};
    if(!name.trim()) e.name = "Nama goal wajib diisi.";
    const t = Number(target);
    if(!target || !Number.isFinite(t) || t <= 0) e.target = "Target harus angka lebih dari 0.";
    if(name.trim() && goals.find(g => g.name.trim() === name.trim() && g.id !== editId))
      e.name = "Nama goal sudah ada.";
    return e;
  };

  const saveGoalModal = e => {
    e.preventDefault();
    const editId = goalModal.mode === "edit" ? goalModal.goal.id : null;
    const errs = validateGForm(gForm.name, gForm.target, editId);
    if(Object.keys(errs).length) { setGErr(errs); return; }
    if(goalModal.mode === "add") {
      onAddGoal({name: gForm.name.trim(), target: Number(gForm.target)});
    } else {
      onEditGoal(goalModal.goal.id, {name: gForm.name.trim(), target: Number(gForm.target)});
    }
    closeGoalModal();
  };

  const handleDeleteGoal = goal => {
    if(window.confirm(`Hapus goal "${goal.name}"?\nTransaksi yang sudah terhubung tidak akan dihapus.`))
      onDeleteGoal(goal.id);
  };

  return (
    <div style={{flex:1, overflowY:"auto", paddingBottom:92, background:C.bg}}>
      <Header title="Goals" subtitle="Target tabungan keluarga"/>

      <div style={{padding:"14px", display:"flex", flexDirection:"column", gap:12}}>

        {/* Summary — hanya tampil jika ada goals */}
        {goals.length > 0 && (
          <div style={{background:`linear-gradient(135deg, ${C.pri}, ${C.priD})`, borderRadius:18, padding:"16px", color:"#fff"}}>
            <p style={{fontSize:11, margin:0, opacity:0.85, fontWeight:600, letterSpacing:0.3}}>TOTAL TERKUMPUL</p>
            <p style={{fontSize:26, fontWeight:800, margin:"4px 0 8px", letterSpacing:-0.5}}>{fmt(totalSaved)}</p>
            <div style={{background:"rgba(255,255,255,0.2)", borderRadius:8, height:8, overflow:"hidden"}}>
              <div style={{background:"#fff", height:"100%", width:`${totalTarget > 0 ? Math.min(totalSaved/totalTarget*100, 100) : 0}%`}}/>
            </div>
            <p style={{fontSize:11, margin:"6px 0 0", opacity:0.85}}>
              {totalTarget > 0 ? Math.round(totalSaved/totalTarget*100) : 0}% dari target {fmt(totalTarget)}
            </p>
          </div>
        )}

        {/* Goals list */}
        {goals.map(g => {
          const manualSaved  = Number(g.saved || 0);
          const txSaved      = calcGoalTransactionSaved(txs, g);
          const displayedSaved = manualSaved + txSaved;
          const target = Number(g.target || 0);
          const pct    = target > 0 ? Math.min(Math.round(displayedSaved/target*100), 100) : 0;
          const Icon   = ICON_MAP[g.icon] || Shield;
          return (
            <div key={g.id} style={{...card, padding:0, overflow:"hidden"}}>
              <div style={{padding:"14px 16px"}}>

                {/* Header: icon, name, edit/delete, pct */}
                <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:10}}>
                  <div style={{width:44, height:44, background:g.color+"15", borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>
                    <Icon size={22} color={g.color}/>
                  </div>
                  <div style={{flex:1, minWidth:0}}>
                    <p style={{fontSize:14, fontWeight:700, color:C.text, margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{g.name}</p>
                    {g.deadline && <p style={{fontSize:11, color:C.textM, margin:0}}>Target: {g.deadline}</p>}
                  </div>
                  <div style={{display:"flex", alignItems:"center", gap:5, flexShrink:0}}>
                    <button type="button" onClick={()=>openEditGoal(g)} aria-label={`Edit ${g.name}`}
                      style={{background:C.borderL, border:"none", borderRadius:8, padding:"5px 7px", cursor:"pointer", display:"flex", alignItems:"center", color:C.textM}}>
                      <Pencil size={13}/>
                    </button>
                    <button type="button" onClick={()=>handleDeleteGoal(g)} aria-label={`Hapus ${g.name}`}
                      style={{background:C.redL, border:"none", borderRadius:8, padding:"5px 7px", cursor:"pointer", display:"flex", alignItems:"center", color:C.red}}>
                      <Trash2 size={13}/>
                    </button>
                    <span style={{fontSize:15, fontWeight:800, color:g.color, marginLeft:2}}>{pct}%</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{background:C.borderL, borderRadius:8, height:8, overflow:"hidden", marginBottom:8}}>
                  <div style={{background:g.color, height:"100%", width:`${pct}%`, transition:"width .5s"}}/>
                </div>

                {/* Breakdown */}
                <div style={{display:"flex", flexDirection:"column", gap:3}}>
                  <div style={{display:"flex", justifyContent:"space-between", fontSize:11}}>
                    <span style={{color:C.textM}}>Manual: <b style={{color:C.text}}>{fmtS(manualSaved)}</b></span>
                    <span style={{color:C.textM}}>Dari transaksi: <b style={{color:C.text}}>{fmtS(txSaved)}</b></span>
                  </div>
                  <div style={{display:"flex", justifyContent:"space-between", fontSize:11}}>
                    <span style={{color:C.textM}}>Total terkumpul: <b style={{color:g.color}}>{fmtS(displayedSaved)}</b></span>
                    <span style={{color:C.textM}}>Sisa: <b style={{color:C.text}}>{fmtS(target - displayedSaved)}</b></span>
                  </div>
                </div>
              </div>

              {/* Tambah Tabungan button */}
              <button type="button" onClick={()=>openSavingModal(g)} aria-label={`Tambah tabungan ${g.name}`}
                style={{width:"100%", padding:"10px", background:g.color+"10", border:"none", color:g.color, fontSize:12, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:5}}>
                <Plus size={14}/> Tambah Tabungan
              </button>
            </div>
          );
        })}

        {/* Tambah Goal button */}
        <button type="button" onClick={openAddGoal}
          style={{...card, border:`2px dashed ${C.pri}66`, background:C.priBg, display:"flex", alignItems:"center", justifyContent:"center", gap:8, cursor:"pointer", padding:"14px 16px"}}>
          <Plus size={18} color={C.pri}/>
          <span style={{fontSize:13, fontWeight:700, color:C.pri}}>Tambah Goal Baru</span>
        </button>

        {/* Upgrade prompt */}
        <button type="button" onClick={openUpgrade}
          style={{...card, border:`2px dashed ${C.gold}66`, background:C.goldL+"40", display:"flex", alignItems:"center", gap:10, cursor:"pointer", textAlign:"left"}}>
          <Crown size={22} color={C.gold}/>
          <div style={{flex:1}}>
            <p style={{fontSize:13, fontWeight:700, color:C.text, margin:0}}>Tambah Goals Tanpa Batas</p>
            <p style={{fontSize:11, color:C.textM, margin:0}}>Free hanya 3 goals · Upgrade ke Pro untuk unlimited</p>
          </div>
          <ChevronRight size={16} color={C.gold}/>
        </button>
      </div>

      {/* ── Modal: Tambah Tabungan ── */}
      {savingGoal && (
        <div style={{position:"fixed", inset:0, background:"rgba(15,23,42,0.5)", zIndex:120, display:"flex", alignItems:"flex-end", justifyContent:"center", padding:"16px 12px"}}>
          <form onSubmit={saveSaving} style={{width:"100%", maxWidth:430, background:"#fff", borderRadius:24, padding:"18px 16px 16px", boxShadow:"0 24px 70px rgba(15,23,42,0.28)", boxSizing:"border-box"}}>
            <p style={{fontSize:16, fontWeight:800, color:C.text, margin:"0 0 4px"}}>Tambah Tabungan — {savingGoal.name}</p>
            <p style={{fontSize:12, color:C.textM, margin:"0 0 14px"}}>Masukkan nominal tabungan yang ingin ditambahkan.</p>

            <label style={lbl}>Nominal</label>
            <input autoFocus inputMode="decimal"
              style={{...inp, borderColor:amtErr?C.red:C.border}}
              placeholder="0" value={amount}
              onChange={e=>{setAmount(e.target.value); setAmtErr("");}}/>
            {Number(amount)>0 && <p style={{fontSize:12, color:C.pri, fontWeight:800, margin:"6px 0 0"}}>{fmt(Number(amount))}</p>}
            {amtErr && <p style={{fontSize:11, color:C.red, margin:"6px 0 0", fontWeight:600}}>{amtErr}</p>}

            <div style={{display:"flex", gap:10, marginTop:16}}>
              <button type="button" onClick={closeSavingModal}
                style={{flex:1, padding:"13px", borderRadius:13, border:`1px solid ${C.border}`, background:C.borderL, color:C.textM, fontSize:13, fontWeight:800, cursor:"pointer"}}>
                Batal
              </button>
              <button type="submit"
                style={{flex:1, padding:"13px", borderRadius:13, border:"none", background:C.pri, color:"#fff", fontSize:13, fontWeight:800, cursor:"pointer", boxShadow:"0 8px 20px rgba(22,163,74,0.26)"}}>
                Simpan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Modal: Tambah / Edit Goal ── */}
      {goalModal && (
        <div style={{position:"fixed", inset:0, background:"rgba(15,23,42,0.5)", zIndex:120, display:"flex", alignItems:"flex-end", justifyContent:"center", padding:"16px 12px"}}>
          <form onSubmit={saveGoalModal} style={{width:"100%", maxWidth:430, background:"#fff", borderRadius:24, padding:"18px 16px 16px", boxShadow:"0 24px 70px rgba(15,23,42,0.28)", boxSizing:"border-box"}}>
            <p style={{fontSize:16, fontWeight:800, color:C.text, margin:"0 0 16px"}}>
              {goalModal.mode === "add" ? "Tambah Goal Baru" : `Edit Goal — ${goalModal.goal.name}`}
            </p>

            <div style={{display:"flex", flexDirection:"column", gap:12}}>
              <div>
                <label style={lbl}>Nama Goal *</label>
                <input autoFocus
                  style={{...inpMd, borderColor:gErr.name?C.red:C.border}}
                  placeholder="Contoh: Dana Darurat"
                  value={gForm.name}
                  onChange={e=>{setGForm(p=>({...p, name:e.target.value})); setGErr(p=>({...p, name:undefined}));}}/>
                {gErr.name && <p style={{fontSize:11, color:C.red, margin:"4px 0 0", fontWeight:600}}>{gErr.name}</p>}
              </div>

              <div>
                <label style={lbl}>Target Nominal (Rp) *</label>
                <input type="number" min="1"
                  style={{...inpMd, borderColor:gErr.target?C.red:C.border}}
                  placeholder="0"
                  value={gForm.target}
                  onChange={e=>{setGForm(p=>({...p, target:e.target.value})); setGErr(p=>({...p, target:undefined}));}}/>
                {Number(gForm.target)>0 && <p style={{fontSize:12, color:C.pri, fontWeight:700, margin:"4px 0 0"}}>{fmt(Number(gForm.target))}</p>}
                {gErr.target && <p style={{fontSize:11, color:C.red, margin:"4px 0 0", fontWeight:600}}>{gErr.target}</p>}
              </div>
            </div>

            <div style={{display:"flex", gap:10, marginTop:18}}>
              <button type="button" onClick={closeGoalModal}
                style={{flex:1, padding:"13px", borderRadius:13, border:`1px solid ${C.border}`, background:C.borderL, color:C.textM, fontSize:13, fontWeight:800, cursor:"pointer"}}>
                Batal
              </button>
              <button type="submit"
                style={{flex:1, padding:"13px", borderRadius:13, border:"none", background:C.pri, color:"#fff", fontSize:13, fontWeight:800, cursor:"pointer", boxShadow:"0 8px 20px rgba(22,163,74,0.26)"}}>
                Simpan
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default GoalsScreen;
