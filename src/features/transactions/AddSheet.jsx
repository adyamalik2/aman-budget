import { useState } from "react";
import { Check, TrendingDown, TrendingUp, X } from "lucide-react";
import { DEFAULT_ACCOUNTS, DEFAULT_CATEGORY_GROUPS, GROUPS, STATUS } from "../../constants/app";
import { C } from "../../constants/theme";
import { fmt } from "../../utils/format";

const inp = {width:"100%", border:`1.5px solid ${C.border}`, borderRadius:12, padding:"11px 14px", fontSize:14, outline:"none", boxSizing:"border-box", background:"#fff", color:C.text};
const lbl = {fontSize:12, fontWeight:600, color:C.textM, display:"block", marginBottom:6};
const sheetBodyStyle = {padding:"14px 14px calc(24px + env(safe-area-inset-bottom))", display:"flex", flexDirection:"column", gap:14};

const AddSheet = ({editTx, goals = [], accounts = DEFAULT_ACCOUNTS, categoryGroups = DEFAULT_CATEGORY_GROUPS, onSave, onClose}) => {
  const initialAccount = accounts.find(account=>account?.active !== false && account?.name)?.name || "";
  const initialGroup = categoryGroups.find(group=>group?.active !== false && group?.id)?.id || "";
  const [f, setF] = useState(editTx || {date:new Date().toISOString().slice(0,10), type:"expense", grp:initialGroup, cat:"", desc:"", amt:"", status:"estimasi", pay:"transfer", acc:initialAccount, goalId:null});
  const [err, setErr] = useState({});
  const [showCatSuggestions, setShowCatSuggestions] = useState(false);
  const s = (k,v) => setF(p=>({...p, [k]:v}));
  const statusOptions = Object.entries(STATUS).filter(([v])=>f.type==="income" ? ["estimasi","selesai","batal"].includes(v) : true);
  const accountOptions = accounts
    .filter(account=>account?.active !== false && account?.name)
    .map(account=>account.name);
  if(editTx?.acc && f.acc && !accountOptions.includes(f.acc)) accountOptions.push(f.acc);
  const groupOptions = categoryGroups
    .filter(group=>group?.active !== false && group?.id)
    .map(group=>({id:group.id, label:group.label || GROUPS[group.id]?.label || group.id}));
  if(editTx?.grp && f.grp && !groupOptions.some(group=>group.id === f.grp)) {
    groupOptions.push({id:f.grp, label:GROUPS[f.grp]?.label || f.grp});
  }
  const activeCategories = (categoryGroups.find(group=>group.id === f.grp)?.categories || [])
    .filter(category=>category?.active !== false && category?.name);
  const categorySuggestions = activeCategories
    .filter(category=>!f.cat || category.name.toLowerCase().includes(f.cat.toLowerCase()))
    .slice(0, 8);

  const save = () => {
    const e = {};
    if(!f.desc?.trim()) e.desc = "Wajib diisi";
    if(!f.amt || Number(f.amt)<=0) e.amt = "Nominal harus > 0";
    if(Object.keys(e).length) {setErr(e); return;}
    onSave({...f, amt:Number(f.amt), id:f.id||Date.now().toString(), goalId:f.goalId||null});
    onClose();
  };

  return (
    <div style={{position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:100, display:"flex", alignItems:"flex-end", justifyContent:"center"}}>
      <div style={{width:"100%", maxWidth:430, background:"#fff", borderTopLeftRadius:24, borderTopRightRadius:24, maxHeight:"90vh", overflowY:"auto", animation:"slideUp 0.3s"}}>
        <div style={{padding:"16px", borderBottom:`1px solid ${C.borderL}`, position:"sticky", top:0, background:"#fff", zIndex:2, display:"flex", alignItems:"center", justifyContent:"space-between"}}>
          <p style={{fontSize:16, fontWeight:700, color:C.text, margin:0}}>{editTx ? "Edit Transaksi" : "Tambah Transaksi"}</p>
          <button onClick={onClose} style={{background:C.borderL, border:"none", borderRadius:10, padding:8, cursor:"pointer", display:"flex"}}>
            <X size={16} color={C.textM}/>
          </button>
        </div>

        <div style={sheetBodyStyle}>
          <div>
            <label style={lbl}>Tipe Transaksi</label>
            <div style={{display:"flex", gap:8}}>
              {[["income","Pemasukan", TrendingUp, C.pri],["expense","Pengeluaran", TrendingDown, C.red]].map(([v,l,Ic,col])=>(
                <button key={v} onClick={()=>{s("type",v); s("status", v==="income"?"selesai":"estimasi"); if(v==="expense"&&!f.grp&&groupOptions[0]) s("grp", groupOptions[0].id);}}
                  style={{flex:1, padding:"12px", borderRadius:12, border:`1.5px solid ${f.type===v?col:C.border}`, background:f.type===v?col+"10":"#fff", color:f.type===v?col:C.textM, fontSize:13, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6}}>
                  <Ic size={15}/> {l}
                </button>
              ))}
            </div>
          </div>

          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10}}>
            <div>
              <label style={lbl}>Tanggal</label>
              <input type="date" style={inp} value={f.date} onChange={e=>s("date", e.target.value)}/>
            </div>
            {f.type==="expense" && (
              <div>
                <label style={lbl}>Grup</label>
                <select style={inp} value={f.grp} onChange={e=>{s("grp", e.target.value); setShowCatSuggestions(true);}}>
                  {groupOptions.map(group=><option key={group.id} value={group.id} style={{color:C.text, background:"#fff"}}>{group.label}</option>)}
                </select>
              </div>
            )}
          </div>

          <div>
            <label style={lbl}>Kategori</label>
            <input style={inp} placeholder="Sekolah, Belanja, Cicilan..." value={f.cat} onFocus={()=>setShowCatSuggestions(true)} onBlur={()=>setShowCatSuggestions(false)} onChange={e=>{s("cat", e.target.value); setShowCatSuggestions(true);}}/>
            {showCatSuggestions && categorySuggestions.length > 0 && (
              <div style={{marginTop:6, border:`1px solid ${C.borderL}`, borderRadius:12, background:"#fff", padding:6, display:"flex", flexWrap:"wrap", gap:6, maxHeight:96, overflowY:"auto"}}>
                {categorySuggestions.map(category=>(
                  <button key={category.id || category.name} type="button" onMouseDown={e=>{e.preventDefault(); s("cat", category.name); setShowCatSuggestions(false);}} style={{border:"none", borderRadius:999, background:C.priBg, color:C.priD, padding:"6px 10px", fontSize:11, fontWeight:800, cursor:"pointer"}}>
                    {category.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label style={lbl}>Deskripsi *</label>
            <input style={{...inp, borderColor:err.desc?C.red:C.border}} placeholder="Nama transaksi" value={f.desc} onChange={e=>s("desc", e.target.value)}/>
            {err.desc && <p style={{color:C.red, fontSize:11, margin:"4px 0 0"}}>{err.desc}</p>}
          </div>

          <div>
            <label style={lbl}>Nominal (Rp) *</label>
            <input type="number" style={{...inp, borderColor:err.amt?C.red:C.border, fontSize:16, fontWeight:700}} placeholder="0" value={f.amt} onChange={e=>s("amt", e.target.value)}/>
            {err.amt && <p style={{color:C.red, fontSize:11, margin:"4px 0 0"}}>{err.amt}</p>}
            {Number(f.amt)>0 && <p style={{color:C.pri, fontSize:12, margin:"4px 0 0", fontWeight:700}}>{fmt(Number(f.amt))}</p>}
          </div>

          <div>
            <label style={lbl}>Status</label>
            <div style={{display:"grid", gridTemplateColumns:f.type==="income"?"repeat(3, 1fr)":"1fr 1fr", gap:8}}>
              {statusOptions.map(([v,st])=>(
                <button key={v} onClick={()=>s("status",v)} style={{padding:"10px", borderRadius:10, border:`1.5px solid ${f.status===v?st.color:C.border}`, background:f.status===v?st.bg:"#fff", color:f.status===v?st.color:C.textM, fontSize:12, fontWeight:700, cursor:"pointer"}}>
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={lbl}>Hubungkan ke Goal</label>
            <select style={inp} value={f.goalId || ""} onChange={e=>s("goalId", e.target.value || null)}>
              <option value="" style={{color:C.text, background:"#fff"}}>Tidak terkait goal</option>
              {goals.map(g=>(
                <option key={g.id || g.name} value={g.id || g.name} style={{color:C.text, background:"#fff"}}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10}}>
            <div>
              <label style={lbl}>Metode</label>
              <select style={inp} value={f.pay} onChange={e=>s("pay", e.target.value)}>
                {["transfer","cash","qris","debit","lainnya"].map(m=><option key={m} value={m}>{m.toUpperCase()}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Rekening</label>
              <select style={inp} value={f.acc} onChange={e=>s("acc", e.target.value)}>
                {accountOptions.map(a=><option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>

          <button onClick={save} style={{background:C.pri, color:"#fff", border:"none", borderRadius:14, padding:"15px", fontSize:15, fontWeight:700, cursor:"pointer", marginTop:4, boxShadow:"0 6px 18px rgba(22,163,74,0.3)", display:"flex", alignItems:"center", justifyContent:"center", gap:8}}>
            <Check size={18}/> Simpan Transaksi
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddSheet;
