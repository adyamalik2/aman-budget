import { useState } from "react";
import { Check, Pencil, Plus, Trash2, Wallet, X } from "lucide-react";
import Header from "../components/layout/Header";
import Badge from "../components/ui/Badge";
import { C } from "../constants/theme";

const accountTypes = ["Bank", "Cash", "E-Wallet", "Lainnya"];
const card = {background:"#fff", borderRadius:16, padding:"14px 16px", border:`1px solid ${C.borderL}`, boxShadow:"0 1px 4px rgba(0,0,0,0.03)"};
const inp = {width:"100%", border:`1.5px solid ${C.border}`, borderRadius:12, padding:"11px 14px", fontSize:14, outline:"none", boxSizing:"border-box", background:"#fff", color:C.text};
const lbl = {fontSize:12, fontWeight:600, color:C.textM, display:"block", marginBottom:6};

const emptyForm = {name:"", type:"Bank", active:true};

const AccountsScreen = ({accounts = [], onAccountsChange, setSubPage}) => {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [err, setErr] = useState("");

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setErr("");
    setSheetOpen(true);
  };

  const openEdit = account => {
    setEditingId(account.id);
    setForm({name:account.name || "", type:account.type || "Bank", active:account.active !== false});
    setErr("");
    setSheetOpen(true);
  };

  const save = () => {
    const name = form.name.trim();
    if(!name) {
      setErr("Nama rekening wajib diisi.");
      return;
    }
    const nextAccount = {
      id: editingId || `acc-${Date.now()}`,
      name,
      type: form.type,
      active: form.active !== false,
    };
    const next = editingId
      ? accounts.map(account => account.id === editingId ? nextAccount : account)
      : [...accounts, nextAccount];
    onAccountsChange(next);
    setSheetOpen(false);
  };

  const removeAccount = account => {
    if(window.confirm(`Hapus rekening ${account.name}? Transaksi lama tetap menyimpan nama rekening lama.`)) {
      onAccountsChange(accounts.filter(item => item.id !== account.id));
    }
  };

  const toggleActive = account => {
    onAccountsChange(accounts.map(item => item.id === account.id ? {...item, active:item.active === false} : item));
  };

  return (
    <div style={{flex:1, overflowY:"auto", paddingBottom:92, background:C.bg}}>
      <Header
        title="Kelola Rekening"
        subtitle={`${accounts.length} rekening tersimpan`}
        onBack={()=>setSubPage(null)}
        right={(
          <button type="button" onClick={openAdd} aria-label="Tambah rekening" style={{width:36, height:36, borderRadius:12, border:"none", background:"rgba(255,255,255,0.18)", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer"}}>
            <Plus size={19}/>
          </button>
        )}
      />

      <div style={{padding:"14px", display:"flex", flexDirection:"column", gap:12}}>
        {accounts.length === 0 && (
          <div style={{...card, textAlign:"center", padding:"28px 16px"}}>
            <div style={{width:46, height:46, borderRadius:14, background:C.priL, color:C.pri, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 10px"}}>
              <Wallet size={22}/>
            </div>
            <p style={{fontSize:14, fontWeight:800, color:C.text, margin:"0 0 4px"}}>Belum ada rekening</p>
            <p style={{fontSize:11, color:C.textM, margin:0}}>Tambahkan rekening untuk dipakai di transaksi berikutnya.</p>
          </div>
        )}

        {accounts.map(account => (
          <div key={account.id} style={card}>
            <div style={{display:"flex", alignItems:"center", gap:12}}>
              <div style={{width:42, height:42, borderRadius:13, background:C.priL, color:C.pri, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>
                <Wallet size={20}/>
              </div>
              <div style={{flex:1, minWidth:0}}>
                <p style={{fontSize:14, fontWeight:800, color:C.text, margin:0, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{account.name}</p>
                <p style={{fontSize:11, color:C.textM, margin:"2px 0 0"}}>{account.type || "Lainnya"}</p>
              </div>
              <Badge bg={account.active === false ? C.borderL : C.priL} color={account.active === false ? C.textM : C.priD}>
                {account.active === false ? "NONAKTIF" : "AKTIF"}
              </Badge>
            </div>
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginTop:12}}>
              <button type="button" onClick={()=>openEdit(account)} style={{border:`1px solid ${C.border}`, borderRadius:10, background:"#fff", color:C.textM, padding:"9px", fontSize:11, fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center", gap:5, cursor:"pointer"}}>
                <Pencil size={13}/> Edit
              </button>
              <button type="button" onClick={()=>toggleActive(account)} style={{border:`1px solid ${account.active === false ? C.pri : C.gold}`, borderRadius:10, background:"#fff", color:account.active === false ? C.pri : C.gold, padding:"9px", fontSize:11, fontWeight:800, cursor:"pointer"}}>
                {account.active === false ? "Aktifkan" : "Nonaktifkan"}
              </button>
              <button type="button" onClick={()=>removeAccount(account)} style={{border:`1px solid ${C.redL}`, borderRadius:10, background:"#fff", color:C.red, padding:"9px", fontSize:11, fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center", gap:5, cursor:"pointer"}}>
                <Trash2 size={13}/> Hapus
              </button>
            </div>
          </div>
        ))}

        <button type="button" onClick={openAdd} style={{background:C.pri, color:"#fff", border:"none", borderRadius:14, padding:"14px", fontSize:14, fontWeight:800, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8, boxShadow:"0 6px 18px rgba(22,163,74,0.22)"}}>
          <Plus size={17}/> Tambah Rekening
        </button>
      </div>

      {sheetOpen && (
        <div style={{position:"fixed", inset:0, background:"rgba(15,23,42,0.45)", zIndex:100, display:"flex", alignItems:"flex-end", justifyContent:"center"}}>
          <div style={{width:"100%", maxWidth:430, background:"#fff", borderTopLeftRadius:24, borderTopRightRadius:24, maxHeight:"88vh", overflowY:"auto", animation:"slideUp 0.3s"}}>
            <div style={{padding:"16px", borderBottom:`1px solid ${C.borderL}`, display:"flex", alignItems:"center", justifyContent:"space-between"}}>
              <p style={{fontSize:16, fontWeight:800, color:C.text, margin:0}}>{editingId ? "Edit Rekening" : "Tambah Rekening"}</p>
              <button type="button" onClick={()=>setSheetOpen(false)} aria-label="Tutup form rekening" style={{background:C.borderL, border:"none", borderRadius:10, padding:8, cursor:"pointer", display:"flex"}}>
                <X size={16} color={C.textM}/>
              </button>
            </div>
            <div style={{padding:"14px 14px calc(24px + env(safe-area-inset-bottom))", display:"flex", flexDirection:"column", gap:14}}>
              <div>
                <label style={lbl}>Nama Rekening</label>
                <input style={{...inp, borderColor:err?C.red:C.border}} value={form.name} onChange={e=>{setForm(p=>({...p, name:e.target.value})); setErr("");}} placeholder="BSI, BCA, Cash, Dana"/>
                {err && <p style={{fontSize:11, color:C.red, margin:"4px 0 0"}}>{err}</p>}
              </div>
              <div>
                <label style={lbl}>Jenis Rekening</label>
                <select style={inp} value={form.type} onChange={e=>setForm(p=>({...p, type:e.target.value}))}>
                  {accountTypes.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
              <label style={{display:"flex", alignItems:"center", gap:10, padding:"12px 14px", border:`1px solid ${C.border}`, borderRadius:12, color:C.text, fontSize:13, fontWeight:700}}>
                <input type="checkbox" checked={form.active !== false} onChange={e=>setForm(p=>({...p, active:e.target.checked}))}/>
                Rekening aktif
              </label>
              <button type="button" onClick={save} style={{background:C.pri, color:"#fff", border:"none", borderRadius:14, padding:"15px", fontSize:15, fontWeight:800, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8}}>
                <Check size={18}/> Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountsScreen;
