import { useMemo, useState } from "react";
import { Check, Clock, Pencil, Plus, Trash2, Wallet, X } from "lucide-react";
import Header from "../components/layout/Header";
import Badge from "../components/ui/Badge";
import { C } from "../constants/theme";
import { fmt, fmtS } from "../utils/format";
import { formatShortDate } from "../utils/period";

const card = {background:"#fff", borderRadius:16, padding:"14px 16px", border:`1px solid ${C.borderL}`, boxShadow:"0 1px 4px rgba(0,0,0,0.03)"};
const inp = {width:"100%", border:`1.5px solid ${C.border}`, borderRadius:12, padding:"11px 14px", fontSize:14, outline:"none", boxSizing:"border-box", background:"#fff", color:C.text};
const lbl = {fontSize:12, fontWeight:600, color:C.textM, display:"block", marginBottom:6};

const emptyForm = () => ({
  date:new Date().toISOString().slice(0,10),
  fromAccountId:"",
  fromAccountName:"",
  toAccountId:"",
  toAccountName:"",
  amount:"",
  note:"",
  status:"rencana",
});

const statusMeta = {
  rencana: {label:"Rencana", bg:"#fef9c3", color:"#854d0e", icon:Clock},
  selesai: {label:"Selesai", bg:C.priL, color:C.priD, icon:Check},
};

const TransferScreen = ({accounts = [], transfers = [], onSaveTransfer, onDeleteTransfer, setSubPage}) => {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(() => emptyForm());
  const [err, setErr] = useState({});

  const sortedTransfers = useMemo(() => [...transfers].sort((a,b)=>(b.date || "").localeCompare(a.date || "")), [transfers]);
  const accountById = useMemo(() => new Map(accounts.map(account=>[account.id, account])), [accounts]);
  const currentAccountIds = new Set([form.fromAccountId, form.toAccountId].filter(Boolean));
  const accountOptions = accounts.filter(account=>account.active !== false || currentAccountIds.has(account.id));
  const totalPlanned = transfers.filter(item=>item.status !== "selesai").reduce((sum,item)=>sum + Number(item.amount || 0), 0);
  const totalDone = transfers.filter(item=>item.status === "selesai").reduce((sum,item)=>sum + Number(item.amount || 0), 0);

  const setField = (key, value) => setForm(prev=>({...prev, [key]:value}));
  const getAccountName = (id, fallback) => accountById.get(id)?.name || fallback || "-";

  const openAdd = () => {
    const active = accounts.filter(account=>account.active !== false);
    setEditingId(null);
    setForm({
      ...emptyForm(),
      fromAccountId:active[0]?.id || "",
      fromAccountName:active[0]?.name || "",
      toAccountId:active[1]?.id || "",
      toAccountName:active[1]?.name || "",
    });
    setErr({});
    setSheetOpen(true);
  };

  const openEdit = transfer => {
    setEditingId(transfer.id);
    setForm({
      date:transfer.date || new Date().toISOString().slice(0,10),
      fromAccountId:transfer.fromAccountId || "",
      fromAccountName:transfer.fromAccountName || "",
      toAccountId:transfer.toAccountId || "",
      toAccountName:transfer.toAccountName || "",
      amount:String(transfer.amount || ""),
      note:transfer.note || "",
      status:transfer.status === "selesai" ? "selesai" : "rencana",
    });
    setErr({});
    setSheetOpen(true);
  };

  const closeSheet = () => {
    setSheetOpen(false);
    setEditingId(null);
    setForm(emptyForm());
    setErr({});
  };

  const save = () => {
    const errors = {};
    const amount = Number(form.amount);
    const fromAccount = accountById.get(form.fromAccountId);
    const toAccount = accountById.get(form.toAccountId);
    if(!form.date) errors.date = "Tanggal wajib diisi.";
    if(!form.fromAccountId) errors.from = "Rekening asal wajib dipilih.";
    if(!form.toAccountId) errors.to = "Rekening tujuan wajib dipilih.";
    if(form.fromAccountId && form.toAccountId && form.fromAccountId === form.toAccountId) errors.to = "Rekening tujuan harus berbeda.";
    if(!Number.isFinite(amount) || amount <= 0) errors.amount = "Nominal harus lebih dari 0.";
    if(Object.keys(errors).length) {
      setErr(errors);
      return;
    }
    const now = new Date().toISOString();
    onSaveTransfer({
      id:editingId || `transfer-${Date.now()}`,
      date:form.date,
      fromAccountId:form.fromAccountId,
      fromAccountName:fromAccount?.name || form.fromAccountName,
      toAccountId:form.toAccountId,
      toAccountName:toAccount?.name || form.toAccountName,
      amount,
      note:form.note.trim(),
      status:form.status,
      createdAt:editingId ? transfers.find(item=>item.id === editingId)?.createdAt || now : now,
      updatedAt:now,
    });
    closeSheet();
  };

  const removeTransfer = transfer => {
    if(window.confirm("Hapus transfer ini? Data transaksi lama tidak akan berubah.")) {
      onDeleteTransfer(transfer.id);
    }
  };

  return (
    <div style={{flex:1, overflowY:"auto", paddingBottom:92, background:C.bg}}>
      <Header
        title="Transfer Planner"
        subtitle="Perpindahan antar rekening"
        onBack={()=>setSubPage(null)}
        right={(
          <button type="button" onClick={openAdd} aria-label="Tambah transfer" style={{width:36, height:36, borderRadius:12, border:"none", background:"rgba(255,255,255,0.18)", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer"}}>
            <Plus size={19}/>
          </button>
        )}
      />

      <div style={{padding:"14px", display:"flex", flexDirection:"column", gap:12}}>
        <div style={{background:`linear-gradient(135deg, ${C.blue}, #1d4ed8)`, borderRadius:18, padding:"16px", color:"#fff"}}>
          <p style={{fontSize:11, margin:0, opacity:0.85, fontWeight:700, letterSpacing:0.3}}>TOTAL TRANSFER</p>
          <p style={{fontSize:26, fontWeight:800, margin:"4px 0 4px", letterSpacing:-0.5}}>{fmt(totalPlanned + totalDone)}</p>
          <div style={{display:"flex", gap:14, fontSize:11, opacity:0.92, marginTop:8, flexWrap:"wrap"}}>
            <span><Check size={11} style={{display:"inline", verticalAlign:-1}}/> Selesai: <b>{fmtS(totalDone)}</b></span>
            <span><Clock size={11} style={{display:"inline", verticalAlign:-1}}/> Rencana: <b>{fmtS(totalPlanned)}</b></span>
          </div>
        </div>

        <div style={{...card, background:C.priBg}}>
          <p style={{fontSize:11, color:C.priD, margin:0, lineHeight:1.45}}>Transfer selesai adalah perpindahan antar rekening dan tidak dihitung sebagai pemasukan atau pengeluaran.</p>
        </div>

        {accounts.filter(account=>account.active !== false).length < 2 && (
          <div style={{...card, background:"#fffbeb"}}>
            <p style={{fontSize:11, color:C.goldD, margin:0, lineHeight:1.45}}>Butuh minimal 2 rekening aktif untuk membuat transfer baru.</p>
          </div>
        )}

        {sortedTransfers.length === 0 && (
          <div style={{...card, textAlign:"center", padding:"28px 16px"}}>
            <div style={{width:46, height:46, borderRadius:14, background:C.blueL, color:C.blue, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 10px"}}>
              <Wallet size={22}/>
            </div>
            <p style={{fontSize:14, fontWeight:800, color:C.text, margin:"0 0 4px"}}>Belum ada transfer</p>
            <p style={{fontSize:11, color:C.textM, margin:0}}>Catat rencana pindah dana antar rekening di sini.</p>
          </div>
        )}

        {sortedTransfers.map(transfer => {
          const meta = statusMeta[transfer.status] || statusMeta.rencana;
          return (
            <div key={transfer.id} style={card}>
              <div style={{display:"grid", gridTemplateColumns:"48px minmax(0, 1fr) auto", gap:10, alignItems:"center"}}>
                <div style={{fontSize:11, color:C.textM, fontWeight:800, textAlign:"center", lineHeight:1.2}}>{formatShortDate(transfer.date)}</div>
                <div style={{minWidth:0}}>
                  <p style={{fontSize:13, fontWeight:800, color:C.text, margin:0, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>
                    {getAccountName(transfer.fromAccountId, transfer.fromAccountName)}{" -> "}{getAccountName(transfer.toAccountId, transfer.toAccountName)}
                  </p>
                  {transfer.note && <p style={{fontSize:11, color:C.textM, margin:"2px 0 0", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{transfer.note}</p>}
                </div>
                <div style={{textAlign:"right"}}>
                  <p style={{fontSize:13, fontWeight:800, color:C.blue, margin:"0 0 4px", whiteSpace:"nowrap"}}>{fmtS(Number(transfer.amount || 0))}</p>
                  <Badge bg={meta.bg} color={meta.color}>{meta.label}</Badge>
                </div>
              </div>
              <div style={{display:"flex", justifyContent:"flex-end", gap:6, marginTop:12}}>
                <button type="button" onClick={()=>openEdit(transfer)} style={{border:`1px solid ${C.border}`, borderRadius:10, background:"#fff", color:C.textM, padding:"8px 10px", fontSize:11, fontWeight:800, cursor:"pointer", display:"flex", alignItems:"center", gap:5}}>
                  <Pencil size={13}/> Edit
                </button>
                <button type="button" onClick={()=>removeTransfer(transfer)} style={{border:`1px solid ${C.redL}`, borderRadius:10, background:"#fff", color:C.red, padding:"8px 10px", fontSize:11, fontWeight:800, cursor:"pointer", display:"flex", alignItems:"center", gap:5}}>
                  <Trash2 size={13}/> Hapus
                </button>
              </div>
            </div>
          );
        })}

        <button type="button" onClick={openAdd} style={{background:C.pri, color:"#fff", border:"none", borderRadius:14, padding:"14px", fontSize:14, fontWeight:800, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8, boxShadow:"0 6px 18px rgba(22,163,74,0.22)"}}>
          <Plus size={17}/> Tambah Transfer
        </button>
      </div>

      {sheetOpen && (
        <div style={{position:"fixed", inset:0, background:"rgba(15,23,42,0.45)", zIndex:100, display:"flex", alignItems:"flex-end", justifyContent:"center"}}>
          <div style={{width:"100%", maxWidth:430, background:"#fff", borderTopLeftRadius:24, borderTopRightRadius:24, maxHeight:"90vh", overflowY:"auto", animation:"slideUp 0.3s"}}>
            <div style={{padding:"16px", borderBottom:`1px solid ${C.borderL}`, position:"sticky", top:0, background:"#fff", zIndex:2, display:"flex", alignItems:"center", justifyContent:"space-between"}}>
              <p style={{fontSize:16, fontWeight:800, color:C.text, margin:0}}>{editingId ? "Edit Transfer" : "Tambah Transfer"}</p>
              <button type="button" onClick={closeSheet} aria-label="Tutup form transfer" style={{background:C.borderL, border:"none", borderRadius:10, padding:8, cursor:"pointer", display:"flex"}}>
                <X size={16} color={C.textM}/>
              </button>
            </div>
            <div style={{padding:"14px 14px calc(32px + env(safe-area-inset-bottom))", display:"flex", flexDirection:"column", gap:14}}>
              <div>
                <label style={lbl}>Tanggal Transfer</label>
                <input type="date" style={{...inp, borderColor:err.date?C.red:C.border}} value={form.date} onChange={e=>setField("date", e.target.value)}/>
                {err.date && <p style={{color:C.red, fontSize:11, margin:"4px 0 0"}}>{err.date}</p>}
              </div>
              <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10}}>
                <div>
                  <label style={lbl}>Dari Rekening</label>
                  <select style={{...inp, borderColor:err.from?C.red:C.border}} value={form.fromAccountId} onChange={e=>{
                    const account = accountById.get(e.target.value);
                    setForm(prev=>({...prev, fromAccountId:e.target.value, fromAccountName:account?.name || ""}));
                  }}>
                    <option value="">Pilih</option>
                    {accountOptions.map(account=><option key={account.id} value={account.id}>{account.name}{account.active === false ? " (Nonaktif)" : ""}</option>)}
                  </select>
                  {err.from && <p style={{color:C.red, fontSize:11, margin:"4px 0 0"}}>{err.from}</p>}
                </div>
                <div>
                  <label style={lbl}>Ke Rekening</label>
                  <select style={{...inp, borderColor:err.to?C.red:C.border}} value={form.toAccountId} onChange={e=>{
                    const account = accountById.get(e.target.value);
                    setForm(prev=>({...prev, toAccountId:e.target.value, toAccountName:account?.name || ""}));
                  }}>
                    <option value="">Pilih</option>
                    {accountOptions.map(account=><option key={account.id} value={account.id}>{account.name}{account.active === false ? " (Nonaktif)" : ""}</option>)}
                  </select>
                  {err.to && <p style={{color:C.red, fontSize:11, margin:"4px 0 0"}}>{err.to}</p>}
                </div>
              </div>
              <div>
                <label style={lbl}>Nominal (Rp)</label>
                <input type="number" style={{...inp, borderColor:err.amount?C.red:C.border, fontSize:16, fontWeight:800}} placeholder="0" value={form.amount} onChange={e=>setField("amount", e.target.value)}/>
                {err.amount && <p style={{color:C.red, fontSize:11, margin:"4px 0 0"}}>{err.amount}</p>}
                {Number(form.amount)>0 && <p style={{color:C.blue, fontSize:12, margin:"4px 0 0", fontWeight:800}}>{fmt(Number(form.amount))}</p>}
              </div>
              <div>
                <label style={lbl}>Status</label>
                <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8}}>
                  {Object.entries(statusMeta).map(([value, meta]) => {
                    const Icon = meta.icon;
                    return (
                      <button key={value} type="button" onClick={()=>setField("status", value)} style={{padding:"11px", borderRadius:12, border:`1.5px solid ${form.status===value?meta.color:C.border}`, background:form.status===value?meta.bg:"#fff", color:form.status===value?meta.color:C.textM, fontSize:12, fontWeight:800, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6}}>
                        <Icon size={14}/> {meta.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label style={lbl}>Catatan</label>
                <input style={inp} placeholder="Contoh: pindah dana operasional" value={form.note} onChange={e=>setField("note", e.target.value)}/>
              </div>
              <button type="button" onClick={save} style={{background:C.pri, color:"#fff", border:"none", borderRadius:14, padding:"15px", fontSize:15, fontWeight:800, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8}}>
                <Check size={18}/> Simpan Transfer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransferScreen;
