import { useMemo, useState } from "react";
import { Trash2, X } from "lucide-react";
import PeriodPicker from "../../components/period/PeriodPicker";
import { C } from "../../constants/theme";
import {
  deleteTransactionsByPeriod,
  getDeletePeriodLabel,
  getPeriodYears,
  normalizePeriod,
} from "../../utils/period";

const card = {background:"#fff", borderRadius:16, padding:"14px 16px", border:`1px solid ${C.borderL}`, boxShadow:"0 1px 4px rgba(0,0,0,0.03)"};
const sheetBodyStyle = {padding:"14px 14px calc(24px + env(safe-area-inset-bottom))", display:"flex", flexDirection:"column", gap:12};

const DeletePeriodSheet = ({txs, initialPeriod, onDelete, onClose}) => {
  const [deletePeriod, setDeletePeriod] = useState(() => normalizePeriod(initialPeriod));
  const years = useMemo(()=>getPeriodYears(txs, deletePeriod), [txs, deletePeriod]);
  const result = useMemo(()=>deleteTransactionsByPeriod(txs, deletePeriod), [txs, deletePeriod]);
  const count = result.deleted.length;
  const label = getDeletePeriodLabel(deletePeriod);

  const handleDelete = () => {
    if(count===0) {
      alert(`Tidak ada transaksi pada ${label}.`);
      return;
    }
    if(window.confirm(`Hapus ${count} transaksi pada ${label}?`)) {
      onDelete(deletePeriod);
      onClose();
    }
  };

  return (
    <div style={{position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:100, display:"flex", alignItems:"flex-end", justifyContent:"center"}}>
      <div style={{width:"100%", maxWidth:430, background:"#fff", borderTopLeftRadius:24, borderTopRightRadius:24, maxHeight:"90vh", overflowY:"auto", animation:"slideUp 0.3s"}}>
        <div style={{padding:"16px", borderBottom:`1px solid ${C.borderL}`, position:"sticky", top:0, background:"#fff", zIndex:2, display:"flex", alignItems:"center", justifyContent:"space-between"}}>
          <p style={{fontSize:16, fontWeight:800, color:C.text, margin:0}}>Hapus Transaksi Periode</p>
          <button onClick={onClose} style={{background:C.borderL, border:"none", borderRadius:10, padding:8, cursor:"pointer", display:"flex"}}>
            <X size={16} color={C.textM}/>
          </button>
        </div>

        <div style={sheetBodyStyle}>
          <div style={card}>
            <PeriodPicker period={deletePeriod} setPeriod={setDeletePeriod} years={years}/>
          </div>

          <div style={{background:"#fef2f2", border:`1px solid ${C.redL}`, borderRadius:12, padding:"12px 14px"}}>
            <p style={{fontSize:12, color:C.textM, margin:"0 0 4px", fontWeight:700}}>Akan dihapus</p>
            <p style={{fontSize:16, color:C.red, margin:0, fontWeight:800}}>{count} transaksi</p>
            <p style={{fontSize:11, color:C.textM, margin:"4px 0 0", lineHeight:1.4}}>{label}</p>
          </div>

          <div style={{display:"flex", gap:8}}>
            <button onClick={onClose} style={{flex:1, padding:"13px", borderRadius:12, border:`1px solid ${C.border}`, background:"#fff", color:C.textM, fontSize:13, fontWeight:800, cursor:"pointer"}}>
              Batal
            </button>
            <button onClick={handleDelete} style={{flex:1, padding:"13px", borderRadius:12, border:"none", background:C.red, color:"#fff", fontSize:13, fontWeight:800, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6}}>
              <Trash2 size={15}/> Hapus
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeletePeriodSheet;
