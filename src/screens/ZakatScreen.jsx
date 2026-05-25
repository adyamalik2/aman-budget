import { useEffect, useState } from "react";
import { CheckCircle2, Plus } from "lucide-react";
import Header from "../components/layout/Header";
import Btn from "../components/ui/Button";
import { C } from "../constants/theme";
import { fmt } from "../utils/format";
import { loadStored, saveStored } from "../utils/storage";

const card = {background:"#fff", borderRadius:16, padding:"14px 16px", border:`1px solid ${C.borderL}`, boxShadow:"0 1px 4px rgba(0,0,0,0.03)"};
const inp = {width:"100%", border:`1.5px solid ${C.border}`, borderRadius:12, padding:"11px 14px", fontSize:14, outline:"none", boxSizing:"border-box", background:"#fff", color:C.text};
const lbl = {fontSize:12, fontWeight:600, color:C.textM, display:"block", marginBottom:6};
const ZAKAT_INCOME_KEY = "amanBudget.zakatIncome";

const ZakatScreen = ({setSubPage, onAddZakatBudget}) => {
  const [income, setIncome] = useState(() => loadStored(ZAKAT_INCOME_KEY, "", value=>typeof value === "string" || typeof value === "number"));
  const num = Number(income) || 0;
  const zakat = num * 0.025;
  const nisab = 7500000; // approx
  const wajib = num >= nisab;

  useEffect(()=>{ saveStored(ZAKAT_INCOME_KEY, String(income)); }, [income]);

  return (
    <div style={{flex:1, overflowY:"auto", paddingBottom:92, background:C.bg}}>
      <Header title="Kalkulator Zakat" subtitle="Zakat penghasilan 2.5%" onBack={()=>setSubPage(null)}/>

      <div style={{padding:"14px", display:"flex", flexDirection:"column", gap:14}}>
        <div style={card}>
          <label style={lbl}>Penghasilan Bulanan (Rp)</label>
          <input type="number" style={{...inp, fontSize:18, fontWeight:700, color:C.pri}} value={income} onChange={e=>setIncome(e.target.value)}/>
          <p style={{fontSize:11, color:C.textM, margin:"6px 0 0"}}>Gaji pokok + tunjangan + bonus + pemasukan lain</p>
        </div>

        <div style={{background:`linear-gradient(135deg, ${C.pri}, ${C.priD})`, borderRadius:18, padding:"20px 16px", color:"#fff", textAlign:"center"}}>
          <p style={{fontSize:11, margin:0, opacity:0.85, fontWeight:600, letterSpacing:0.3}}>ZAKAT YANG WAJIB DIKELUARKAN</p>
          <p style={{fontSize:32, fontWeight:800, margin:"6px 0", letterSpacing:-0.8}}>{fmt(zakat)}</p>
          {wajib ? (
            <div style={{display:"inline-flex", alignItems:"center", gap:6, background:"rgba(255,255,255,0.2)", borderRadius:20, padding:"4px 12px", fontSize:11, fontWeight:700}}>
              <CheckCircle2 size={13}/> Sudah mencapai nisab
            </div>
          ) : (
            <div style={{display:"inline-flex", alignItems:"center", gap:6, background:"rgba(255,255,255,0.2)", borderRadius:20, padding:"4px 12px", fontSize:11, fontWeight:700}}>
              Di bawah nisab
            </div>
          )}
        </div>

        <div style={card}>
          <p style={{fontSize:13, fontWeight:700, color:C.text, margin:"0 0 10px"}}>Detail Perhitungan</p>
          {[
            ["Penghasilan", fmt(num)],
            ["Nisab (setara 85gr emas)", fmt(nisab)],
            ["Tarif zakat", "2.5%"],
            ["Total zakat per bulan", fmt(zakat), C.pri, true],
            ["Total zakat per tahun", fmt(zakat*12), C.gold, true],
          ].map(([k,v,c,b],i)=>(
            <div key={i} style={{display:"flex", justifyContent:"space-between", padding:"8px 0", borderTop: i>0?`1px solid ${C.borderL}`:"none"}}>
              <span style={{fontSize:12, color:C.textM}}>{k}</span>
              <span style={{fontSize:13, fontWeight:b?800:600, color:c||C.text}}>{v}</span>
            </div>
          ))}
        </div>

        <Btn primary onClick={()=>onAddZakatBudget?.(zakat)} disabled={zakat <= 0}>
          <span style={{display:"flex", alignItems:"center", justifyContent:"center", gap:6}}>
            <Plus size={16}/> Tambahkan ke Budget Bulan Ini
          </span>
        </Btn>
      </div>
    </div>
  );
};

export default ZakatScreen;
