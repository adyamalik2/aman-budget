import { ChevronRight, Sparkles, TrendingUp } from "lucide-react";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import Header from "../components/layout/Header";
import PeriodPicker from "../components/period/PeriodPicker";
import Badge from "../components/ui/Badge";
import { GROUPS } from "../constants/app";
import { C } from "../constants/theme";
import { fmtS } from "../utils/format";
import { formatPeriodLabel, normalizePeriod } from "../utils/period";
import { calcCashflowChartData, calcGroups, calcSummary } from "../utils/summary";

const card = {background:"#fff", borderRadius:16, padding:"14px 16px", border:`1px solid ${C.borderL}`, boxShadow:"0 1px 4px rgba(0,0,0,0.03)"};

const ReportsScreen = ({txs, period, setPeriod, years, openUpgrade}) => {
  const s = calcSummary(txs);
  const grps = calcGroups(txs);
  const pieData = Object.entries(grps).map(([k,v])=>({name:GROUPS[k]?.label, value:v.budget, color:GROUPS[k]?.color}));
  const chartData = calcCashflowChartData(txs, period);
  const chartTitle = normalizePeriod(period).mode === "range" ? "Arus Kas Bulanan" : "Arus Kas Mingguan";
  const periodLabel = formatPeriodLabel(period);

  const top5 = txs.filter(x=>x.type==="expense"&&x.status!=="batal").sort((a,b)=>b.amt-a.amt).slice(0,5);

  return (
    <div style={{flex:1, overflowY:"auto", paddingBottom:92, background:C.bg}}>
      <Header title="Laporan" subtitle={periodLabel}/>

      <div style={{padding:"14px", display:"flex", flexDirection:"column", gap:12}}>
        <div style={card}>
          <PeriodPicker period={period} setPeriod={setPeriod} years={years}/>
        </div>

        {/* Stats summary */}
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10}}>
          <div style={{...card, background:`linear-gradient(135deg, ${C.priBg}, #fff)`}}>
            <p style={{fontSize:10, color:C.textM, margin:0, fontWeight:600, letterSpacing:0.3}}>PEMASUKAN</p>
            <p style={{fontSize:17, fontWeight:800, color:C.pri, margin:"4px 0"}}>{fmtS(s.totalIncome)}</p>
            <div style={{display:"flex", alignItems:"center", gap:3, fontSize:10, color:C.pri, fontWeight:600}}>
              <TrendingUp size={11}/> +12% vs bulan lalu
            </div>
          </div>
          <div style={{...card, background:`linear-gradient(135deg, #fef2f2, #fff)`}}>
            <p style={{fontSize:10, color:C.textM, margin:0, fontWeight:600, letterSpacing:0.3}}>PENGELUARAN</p>
            <p style={{fontSize:17, fontWeight:800, color:C.red, margin:"4px 0"}}>{fmtS(s.paid)}</p>
            <div style={{display:"flex", alignItems:"center", gap:3, fontSize:10, color:C.red, fontWeight:600}}>
              <TrendingUp size={11}/> +5% vs bulan lalu
            </div>
          </div>
        </div>

        {/* Pie chart */}
        <div style={card}>
          <p style={{fontSize:13, fontWeight:700, color:C.text, margin:"0 0 10px"}}>Distribusi Pengeluaran</p>
          <div style={{display:"flex", alignItems:"center", gap:10}}>
            <div style={{width:130, height:130}}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={pieData} dataKey="value" innerRadius={38} outerRadius={62} paddingAngle={2}>
                    {pieData.map((d,i)=><Cell key={i} fill={d.color}/>)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{flex:1, display:"flex", flexDirection:"column", gap:6}}>
              {pieData.slice(0,5).map((d,i)=>(
                <div key={i} style={{display:"flex", alignItems:"center", gap:6, fontSize:11}}>
                  <div style={{width:8, height:8, borderRadius:"50%", background:d.color}}/>
                  <span style={{flex:1, color:C.textM, fontWeight:600}}>{d.name}</span>
                  <span style={{color:C.text, fontWeight:700}}>{Math.round(d.value/s.estExp*100)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bar chart */}
        <div style={card}>
          <p style={{fontSize:13, fontWeight:700, color:C.text, margin:"0 0 10px"}}>{chartTitle}</p>
          <div style={{height:160}}>
            <ResponsiveContainer>
              <BarChart data={chartData} barGap={2}>
                <XAxis dataKey="w" tick={{fontSize:11, fill:C.textM}} axisLine={false} tickLine={false}/>
                <YAxis hide/>
                <Tooltip formatter={v=>fmtS(v)} contentStyle={{borderRadius:10, border:"none", boxShadow:"0 4px 16px rgba(0,0,0,0.1)", fontSize:12}}/>
                <Bar dataKey="in" fill={C.pri} radius={[6,6,0,0]} name="Masuk"/>
                <Bar dataKey="out" fill={C.red} radius={[6,6,0,0]} name="Keluar"/>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{display:"flex", gap:14, justifyContent:"center", marginTop:8}}>
            <div style={{display:"flex", alignItems:"center", gap:5, fontSize:11, color:C.textM}}>
              <div style={{width:10, height:10, background:C.pri, borderRadius:3}}/> Masuk
            </div>
            <div style={{display:"flex", alignItems:"center", gap:5, fontSize:11, color:C.textM}}>
              <div style={{width:10, height:10, background:C.red, borderRadius:3}}/> Keluar
            </div>
          </div>
        </div>

        {/* AI Insight - Pro feature teaser */}
        <div style={{...card, background:`linear-gradient(135deg, ${C.goldL} 0%, #fff 100%)`, border:`1px solid ${C.gold}33`}}>
          <div style={{display:"flex", alignItems:"flex-start", gap:10}}>
            <div style={{width:36, height:36, background:`linear-gradient(135deg, ${C.gold}, #f59e0b)`, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>
              <Sparkles size={18} color="#fff"/>
            </div>
            <div style={{flex:1}}>
              <div style={{display:"flex", alignItems:"center", gap:6, marginBottom:4}}>
                <p style={{fontSize:13, fontWeight:700, color:C.text, margin:0}}>AI Insight</p>
                <Badge bg={C.gold} color="#fff">PRO</Badge>
              </div>
              <p style={{fontSize:12, color:C.textM, margin:"0 0 8px", lineHeight:1.5}}>
                Pengeluaran kategori <b>Belanja</b> naik 23% bulan ini. Pertimbangkan untuk mengurangi pembelian impulsif di minggu ke-2.
              </p>
              <button onClick={openUpgrade} style={{background:"none", border:"none", color:C.goldD, fontSize:11, fontWeight:700, padding:0, cursor:"pointer", display:"flex", alignItems:"center", gap:4}}>
                Aktifkan Pro <ChevronRight size={12}/>
              </button>
            </div>
          </div>
        </div>

        {/* Top spending */}
        <div style={card}>
          <p style={{fontSize:13, fontWeight:700, color:C.text, margin:"0 0 10px"}}>Pengeluaran Terbesar</p>
          {top5.map((tx,i)=>(
            <div key={tx.id} style={{display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderTop:i>0?`1px solid ${C.borderL}`:"none"}}>
              <div style={{width:24, height:24, borderRadius:8, background:C.priL, color:C.priD, fontSize:11, fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center"}}>{i+1}</div>
              <div style={{flex:1, minWidth:0}}>
                <p style={{fontSize:12, fontWeight:600, color:C.text, margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{tx.desc}</p>
                <p style={{fontSize:10, color:C.textL, margin:0}}>{GROUPS[tx.grp]?.label}</p>
              </div>
              <span style={{fontSize:13, fontWeight:700, color:C.text}}>{fmtS(tx.amt)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReportsScreen;
