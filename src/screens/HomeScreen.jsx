import {
  ArrowRightLeft,
  Bell,
  Calculator,
  ChevronRight,
  Clock,
  Crown,
  FileDown,
  PiggyBank,
  Receipt,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import PeriodPicker from "../components/period/PeriodPicker";
import { GROUPS } from "../constants/app";
import { C } from "../constants/theme";
import { fmt, fmtS } from "../utils/format";
import { formatPeriodLabel, normalizePeriod } from "../utils/period";
import { calcGroups, calcSummary } from "../utils/summary";
import { getGoalDisplayedSaved } from "../utils/goals";

const card = {background:"#fff", borderRadius:16, padding:"14px 16px", border:`1px solid ${C.borderL}`, boxShadow:"0 1px 4px rgba(0,0,0,0.03)"};

const HomeScreen = ({txs, allTxs = [], goals = [], period, setPeriod, years, onCopyBudget, setTab, setSubPage, setEditTx, setAddOpen, openUpgrade, user}) => {
  const s = calcSummary(txs);
  const grps = calcGroups(txs);

  // Goal summary — pakai semua transaksi (allTxs) dan manual saved, konsisten dengan GoalsScreen
  const goalsWithSaved = goals.map(g => ({...g, _saved: getGoalDisplayedSaved(g, allTxs)}));
  const totalGoalSaved  = goalsWithSaved.reduce((sum, g) => sum + g._saved, 0);
  const totalGoalTarget = goalsWithSaved.reduce((sum, g) => sum + Number(g.target||0), 0);
  const goalPct = totalGoalTarget > 0 ? Math.min(Math.round(totalGoalSaved/totalGoalTarget*100), 100) : 0;
  const topGoal = goalsWithSaved.length > 0
    ? goalsWithSaved.reduce((best, g) => {
        const pG = Number(g.target||0) > 0 ? g._saved/Number(g.target) : 0;
        const pB = Number(best.target||0) > 0 ? best._saved/Number(best.target) : 0;
        return pG > pB ? g : best;
      })
    : null;
  const unpaidItems = txs.filter(x=>x.status==="belum_selesai").slice(0, 3);
  const recent = [...txs].sort((a,b)=>b.date.localeCompare(a.date)).slice(0, 4);
  const periodMode = normalizePeriod(period).mode;
  const periodLabel = formatPeriodLabel(period);

  return (
    <div style={{flex:1, overflowY:"auto", paddingBottom:92, background:C.bg}}>
      {/* Header with greeting */}
      <div style={{background:`linear-gradient(165deg, ${C.pri} 0%, ${C.priD} 100%)`, padding:"42px 16px 20px", color:"#fff", borderBottomLeftRadius:24, borderBottomRightRadius:24}}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16}}>
          <div>
            <p style={{fontSize:12, margin:0, opacity:0.85}}>Assalamu'alaikum,</p>
            <p style={{fontSize:18, fontWeight:700, margin:"2px 0 0"}}>{user.name} 👋</p>
          </div>
          <div style={{display:"flex", gap:8}}>
            <button onClick={openUpgrade} style={{background:`linear-gradient(135deg, ${C.gold}, #f59e0b)`, border:"none", borderRadius:20, padding:"6px 12px", cursor:"pointer", display:"flex", alignItems:"center", gap:5, color:"#fff", fontWeight:700, fontSize:11, boxShadow:"0 4px 12px rgba(217,119,6,0.4)"}}>
              <Crown size={13}/> Pro
            </button>
            <button style={{width:36, height:36, background:"rgba(255,255,255,0.15)", border:"none", borderRadius:10, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", position:"relative"}}>
              <Bell size={17}/>
              <span style={{position:"absolute", top:7, right:7, width:7, height:7, background:C.gold, borderRadius:"50%"}}/>
            </button>
          </div>
        </div>

        {/* Balance card */}
        <div>
          <p style={{fontSize:11, margin:"0 0 4px", opacity:0.85, fontWeight:500}}>SALDO AKTUAL · {periodLabel.toUpperCase()}</p>
          <p style={{fontSize:32, fontWeight:800, margin:0, letterSpacing:-1}}>{fmt(s.actBal)}</p>
          <div style={{display:"flex", gap:12, marginTop:12}}>
            <div style={{flex:1, background:"rgba(255,255,255,0.15)", borderRadius:12, padding:"10px 12px", backdropFilter:"blur(8px)"}}>
              <div style={{display:"flex", alignItems:"center", gap:6, marginBottom:2}}>
                <TrendingUp size={12}/>
                <span style={{fontSize:10, opacity:0.9, fontWeight:600}}>PEMASUKAN</span>
              </div>
              <p style={{fontSize:14, fontWeight:700, margin:0}}>{fmtS(s.totalIncome)}</p>
            </div>
            <div style={{flex:1, background:"rgba(255,255,255,0.15)", borderRadius:12, padding:"10px 12px"}}>
              <div style={{display:"flex", alignItems:"center", gap:6, marginBottom:2}}>
                <TrendingDown size={12}/>
                <span style={{fontSize:10, opacity:0.9, fontWeight:600}}>PENGELUARAN</span>
              </div>
              <p style={{fontSize:14, fontWeight:700, margin:0}}>{fmtS(s.paid)}</p>
            </div>
          </div>
          <PeriodPicker period={period} setPeriod={setPeriod} years={years} onCopyBudget={onCopyBudget} dark style={{marginTop:14}}/>
        </div>
      </div>

      <div style={{padding:"14px", display:"flex", flexDirection:"column", gap:12}}>

        {/* Quick actions */}
        <div style={{display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:8}}>
          {[
            {icon:ArrowRightLeft, label:"Transfer", color:C.blue, action:()=>setSubPage("transfer")},
            {icon:Calculator, label:"Zakat", color:C.pri, action:()=>setSubPage("zakat")},
            {icon:PiggyBank, label:"Goals", color:C.gold, action:()=>{setTab("goals-tab"); setSubPage(null);}},
            {icon:FileDown, label:"Export", color:"#8b5cf6", action:openUpgrade},
          ].map((q,i)=>(
            <button key={i} onClick={q.action} style={{background:"#fff", border:`1px solid ${C.borderL}`, borderRadius:14, padding:"10px 4px", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:4}}>
              <div style={{width:36, height:36, borderRadius:10, background:q.color+"15", display:"flex", alignItems:"center", justifyContent:"center"}}>
                <q.icon size={18} color={q.color}/>
              </div>
              <span style={{fontSize:10, fontWeight:600, color:C.textM}}>{q.label}</span>
            </button>
          ))}
        </div>

        {/* Goals summary card */}
        {goals.length > 0 && (
          <div style={card}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8}}>
              <p style={{fontSize:13, fontWeight:700, color:C.text, margin:0}}>Progress Goals</p>
              <button onClick={()=>{setTab("goals-tab"); setSubPage(null);}}
                style={{background:"none", border:"none", color:C.pri, fontSize:11, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:2}}>
                Lihat Goals <ChevronRight size={12}/>
              </button>
            </div>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:6}}>
              <div>
                <p style={{fontSize:11, color:C.textM, margin:0, fontWeight:600}}>TOTAL TERKUMPUL</p>
                <p style={{fontSize:18, fontWeight:800, color:C.priD, margin:"2px 0 0"}}>{fmtS(totalGoalSaved)}</p>
              </div>
              <p style={{fontSize:22, fontWeight:800, color:C.pri, margin:0}}>{goalPct}%</p>
            </div>
            <div style={{background:C.borderL, borderRadius:8, height:8, overflow:"hidden", marginBottom:6}}>
              <div style={{background:`linear-gradient(90deg, ${C.pri}, ${C.priD})`, height:"100%", width:`${goalPct}%`, borderRadius:8, transition:"width .5s"}}/>
            </div>
            <p style={{fontSize:11, color:C.textM, margin:"0 0 0"}}>
              dari target {fmtS(totalGoalTarget)} · {goals.length} goal
            </p>
            {topGoal && (
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:8, marginTop:8, borderTop:`1px solid ${C.borderL}`}}>
                <div style={{display:"flex", alignItems:"center", gap:6}}>
                  <div style={{width:8, height:8, borderRadius:"50%", background:topGoal.color||C.pri, flexShrink:0}}/>
                  <span style={{fontSize:11, color:C.textM}}>Tertinggi: <b style={{color:C.text}}>{topGoal.name}</b></span>
                </div>
                <span style={{fontSize:11, fontWeight:800, color:topGoal.color||C.pri}}>
                  {Number(topGoal.target||0)>0 ? Math.min(Math.round(topGoal._saved/Number(topGoal.target)*100),100) : 0}%
                </span>
              </div>
            )}
          </div>
        )}

        {/* Progress card */}
        <div style={{...card, background:`linear-gradient(135deg, #fff 0%, ${C.priBg} 100%)`}}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8}}>
            <div>
              <p style={{fontSize:11, color:C.textM, margin:0, fontWeight:600, letterSpacing:0.3}}>{periodMode==="range"?"PROGRESS PERIODE":"PROGRESS BULAN INI"}</p>
              <p style={{fontSize:22, fontWeight:800, color:C.priD, margin:"2px 0 0"}}>{s.prog}%</p>
            </div>
            <div style={{textAlign:"right"}}>
              <p style={{fontSize:11, color:C.textM, margin:0, fontWeight:600}}>SISA AMAN</p>
              <p style={{fontSize:16, fontWeight:800, color:s.safeBal<0?C.red:C.pri, margin:"2px 0 0"}}>{fmtS(s.safeBal)}</p>
            </div>
          </div>
          <div style={{background:"#fff", borderRadius:10, height:10, overflow:"hidden", border:`1px solid ${C.priL}`}}>
            <div style={{background:`linear-gradient(90deg, ${C.pri}, ${C.priD})`, borderRadius:10, height:"100%", width:`${Math.min(s.prog, 100)}%`, transition:"width .5s"}}/>
          </div>
          <p style={{fontSize:11, color:C.textM, margin:"8px 0 0", textAlign:"center"}}>
            {fmt(s.paid)} dari {fmt(s.estExp)} target
          </p>
        </div>

        {/* Unpaid alert */}
        {unpaidItems.length > 0 && (
          <div style={{...card, border:`1.5px solid ${C.redL}`, background:"#fffafa"}}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10}}>
              <div style={{display:"flex", alignItems:"center", gap:8}}>
                <div style={{width:32, height:32, background:C.redL, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center"}}>
                  <Clock size={16} color={C.red}/>
                </div>
                <div>
                  <p style={{fontSize:13, fontWeight:700, color:C.text, margin:0}}>Belum Dibayar</p>
                  <p style={{fontSize:11, color:C.textM, margin:0}}>{unpaidItems.length} tagihan menunggu</p>
                </div>
              </div>
              <span style={{fontSize:14, fontWeight:800, color:C.red}}>{fmtS(s.unpaid)}</span>
            </div>
            {unpaidItems.map(tx=>(
              <div key={tx.id} onClick={()=>{setEditTx(tx); setAddOpen(true);}} style={{display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderTop:`1px solid ${C.borderL}`, cursor:"pointer"}}>
                <div>
                  <p style={{fontSize:13, fontWeight:600, color:C.text, margin:0}}>{tx.desc}</p>
                  <p style={{fontSize:10, color:C.textL, margin:0}}>{GROUPS[tx.grp]?.label}</p>
                </div>
                <span style={{fontSize:13, fontWeight:700, color:C.red}}>{fmtS(tx.amt)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Group breakdown */}
        <div style={card}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12}}>
            <p style={{fontSize:13, fontWeight:700, color:C.text, margin:0}}>Rekap per Grup</p>
            <button onClick={()=>setSubPage("transfer")} style={{background:"none", border:"none", color:C.pri, fontSize:11, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:2}}>
              Detail <ChevronRight size={12}/>
            </button>
          </div>
          {Object.entries(grps).slice(0,5).map(([g,v])=>(
            <div key={g} style={{display:"flex", alignItems:"center", gap:10, marginBottom:10}}>
              <div style={{width:8, height:8, borderRadius:"50%", background:GROUPS[g]?.color}}/>
              <span style={{fontSize:12, color:C.text, fontWeight:600, flex:1}}>{GROUPS[g]?.label}</span>
              <div style={{width:64, background:C.borderL, borderRadius:6, height:5, overflow:"hidden"}}>
                <div style={{background:GROUPS[g]?.color, height:"100%", width:v.budget>0?`${Math.min(v.paid/v.budget*100,100)}%`:"0%"}}/>
              </div>
              <span style={{fontSize:11, fontWeight:700, color:C.text, minWidth:60, textAlign:"right"}}>{fmtS(v.budget)}</span>
            </div>
          ))}
        </div>

        {/* Recent transactions */}
        <div style={card}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8}}>
            <p style={{fontSize:13, fontWeight:700, color:C.text, margin:0}}>Transaksi Terbaru</p>
            <button onClick={()=>setSubPage("tx-list")} style={{background:"none", border:"none", color:C.pri, fontSize:11, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:2}}>
              Lihat semua <ChevronRight size={12}/>
            </button>
          </div>
          {recent.map(tx=>(
            <div key={tx.id} onClick={()=>{setEditTx(tx); setAddOpen(true);}} style={{display:"flex", alignItems:"center", gap:10, padding:"10px 0", borderTop:`1px solid ${C.borderL}`, cursor:"pointer"}}>
              <div style={{width:36, height:36, borderRadius:10, background: tx.type==="income"?C.priL:GROUPS[tx.grp]?.color+"15", display:"flex", alignItems:"center", justifyContent:"center"}}>
                {tx.type==="income" ? <TrendingUp size={16} color={C.pri}/> : <Receipt size={16} color={GROUPS[tx.grp]?.color}/>}
              </div>
              <div style={{flex:1, minWidth:0}}>
                <p style={{fontSize:13, fontWeight:600, color:C.text, margin:0, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{tx.desc}</p>
                <p style={{fontSize:10, color:C.textL, margin:0}}>{tx.date.slice(8,10)}/{tx.date.slice(5,7)} · {tx.type==="income"?"Pemasukan":GROUPS[tx.grp]?.label}</p>
              </div>
              <span style={{fontSize:13, fontWeight:700, color: tx.type==="income"?C.pri:C.text}}>{tx.type==="income"?"+":"−"}{fmtS(tx.amt)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
