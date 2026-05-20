import { MONTHS } from "../../constants/app";
import { C } from "../../constants/theme";
import { normalizePeriod } from "../../utils/period";

const PeriodPicker = ({period, setPeriod, years, onCopyBudget, dark=false, style={}}) => {
  const p = normalizePeriod(period);
  const labelColor = dark ? "rgba(255,255,255,0.8)" : C.textM;
  const selectStyle = {
    border: dark ? "1px solid rgba(255,255,255,0.35)" : `1px solid ${C.border}`,
    background: dark ? "rgba(255,255,255,0.16)" : "#fff",
    color: dark ? "#fff" : C.text,
    borderRadius:10,
    padding:"8px 10px",
    fontSize:12,
    fontWeight:700,
    outline:"none",
    colorScheme:"light",
    width:"100%",
    minWidth:0,
    boxSizing:"border-box",
  };
  const optionStyle = {color:C.text, background:"#fff"};
  const periodSelectorStyle = {display:"flex", flexDirection:"column", gap:8, width:"100%", ...style};
  const periodHeaderStyle = {display:"flex", alignItems:"center", gap:8, flexWrap:"wrap"};
  const periodLabelStyle = {fontSize:11, fontWeight:700, color:labelColor, minWidth:60};
  const singleRowStyle = {display:"grid", gridTemplateColumns:"minmax(0, 1fr) 110px", gap:8, width:"100%"};
  const rangeWrapStyle = {display:"flex", flexDirection:"column", gap:6, width:"100%"};
  const rangeRowStyle = {display:"grid", gridTemplateColumns:"60px minmax(0, 1fr) 110px", gap:8, alignItems:"center", width:"100%"};
  const set = changes => setPeriod(prev=>normalizePeriod({...prev, ...changes}));
  const modeBtn = active => ({
    border:"none",
    borderRadius:9,
    padding:"8px 10px",
    fontSize:12,
    fontWeight:800,
    cursor:"pointer",
    background: active ? (dark ? "#fff" : C.pri) : (dark ? "rgba(255,255,255,0.14)" : C.borderL),
    color: active ? (dark ? C.priD : "#fff") : (dark ? "rgba(255,255,255,0.82)" : C.textM),
  });
  const copyBtnStyle = {
    border:dark?"1px solid rgba(255,255,255,0.35)":`1px solid ${C.pri}`,
    background:dark?"rgba(255,255,255,0.16)":"#fff",
    color:dark?"#fff":C.pri,
    borderRadius:10,
    padding:"8px 10px",
    fontSize:12,
    fontWeight:800,
    cursor:"pointer",
  };
  const monthSelect = (value, onChange, label) => (
    <select aria-label={label} style={selectStyle} value={value} onChange={onChange}>
      {MONTHS.map((m,i)=><option key={m} value={i+1} style={optionStyle}>{m}</option>)}
    </select>
  );
  const yearSelect = (value, onChange, label) => (
    <select aria-label={label} style={selectStyle} value={value} onChange={onChange}>
      {years.map(y=><option key={y} value={y} style={optionStyle}>{y}</option>)}
    </select>
  );
  return (
    <div style={periodSelectorStyle}>
      <div style={periodHeaderStyle}>
        <span style={{...periodLabelStyle, minWidth:"auto"}}>Periode</span>
        <div style={{display:"flex", gap:4, background:dark?"rgba(255,255,255,0.12)":C.borderL, borderRadius:11, padding:2}}>
          <button type="button" onClick={()=>set({mode:"month"})} style={modeBtn(p.mode==="month")}>Bulanan</button>
          <button type="button" onClick={()=>set({mode:"range"})} style={modeBtn(p.mode==="range")}>Range</button>
        </div>
        {p.mode==="month" && onCopyBudget && (
          <button type="button" onClick={onCopyBudget} style={copyBtnStyle}>Copy Bulan Lalu</button>
        )}
      </div>
      {p.mode === "range" ? (
        <div style={rangeWrapStyle}>
          <div style={rangeRowStyle}>
            <span style={periodLabelStyle}>Dari</span>
            {monthSelect(p.startMonth, e=>set({startMonth:Number(e.target.value)}), "Bulan mulai")}
            {yearSelect(p.startYear, e=>set({startYear:Number(e.target.value)}), "Tahun mulai")}
          </div>
          <div style={rangeRowStyle}>
            <span style={periodLabelStyle}>Sampai</span>
            {monthSelect(p.endMonth, e=>set({endMonth:Number(e.target.value)}), "Bulan selesai")}
            {yearSelect(p.endYear, e=>set({endYear:Number(e.target.value)}), "Tahun selesai")}
          </div>
        </div>
      ) : (
        <div style={singleRowStyle}>
          {monthSelect(p.month, e=>set({month:Number(e.target.value)}), "Bulan")}
          {yearSelect(p.year, e=>set({year:Number(e.target.value)}), "Tahun")}
        </div>
      )}
    </div>
  );
};

export default PeriodPicker;
