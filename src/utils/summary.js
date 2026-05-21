import { CHART_MONTH_SHORT } from "../constants/app";
import { monthKey, normalizePeriod, validMonth, validYear } from "./period";

export const calcSummary = txs => {
  const active = txs.filter(x=>!x.deletedAt);
  const incomePlan = active.filter(x=>x.type==="income"&&x.status!=="batal").reduce((s,x)=>s+x.amt,0);
  const totalIncome = active.filter(x=>x.type==="income"&&x.status==="selesai").reduce((s,x)=>s+x.amt,0);
  const estExp = active.filter(x=>x.type==="expense"&&x.status!=="batal").reduce((s,x)=>s+x.amt,0);
  const paid = active.filter(x=>x.type==="expense"&&x.status==="selesai").reduce((s,x)=>s+x.amt,0);
  const unpaid = active.filter(x=>x.type==="expense"&&x.status==="belum_selesai").reduce((s,x)=>s+x.amt,0);
  return {
    totalIncome, incomePlan, estExp, paid, unpaid,
    actBal: totalIncome - paid,
    safeBal: incomePlan - estExp,
    prog: estExp>0 ? Math.round(paid/estExp*100) : 0,
  };
};

export const calcGroups = txs => {
  const r = {};
  txs.filter(x=>!x.deletedAt&&x.type==="expense"&&x.status!=="batal").forEach(x=>{
    const k = x.grp || "lain_lain";
    if(!r[k]) r[k] = {budget:0, paid:0, unpaid:0};
    r[k].budget += x.amt;
    if(x.status==="selesai") r[k].paid += x.amt;
    if(x.status==="belum_selesai") r[k].unpaid += x.amt;
  });
  return r;
};

const calcWeekData = txs => {
  const weeks = Array.from({length:5}, (_,i)=>({w:`M${i+1}`, in:0, out:0}));
  txs.filter(tx=>!tx.deletedAt).forEach(tx=>{
    const day = Number((tx.date || "").slice(8, 10));
    if(!day) return;
    const idx = Math.min(Math.floor((day - 1) / 7), 4);
    if(tx.type==="income"&&tx.status==="selesai") weeks[idx].in += tx.amt;
    if(tx.type==="expense"&&tx.status==="selesai") weeks[idx].out += tx.amt;
  });
  return weeks;
};

export const calcCashflowChartData = (txs, period) => {
  const p = normalizePeriod(period);
  if(p.mode !== "range") return calcWeekData(txs);

  const startKey = monthKey(p.startYear, p.startMonth);
  const endKey = monthKey(p.endYear, p.endMonth);
  const months = [];
  for(let key = startKey; key <= endKey; key += 1) {
    const year = Math.floor((key - 1) / 12);
    const month = ((key - 1) % 12) + 1;
    months.push({key, w:`${CHART_MONTH_SHORT[month - 1]} ${String(year).slice(-2)}`, in:0, out:0});
  }

  const byMonth = new Map(months.map(month=>[month.key, month]));
  txs.filter(tx=>!tx.deletedAt).forEach(tx=>{
    const [year, month] = (tx.date || "").split("-").map(Number);
    if(!validYear(year)||!validMonth(month)) return;
    const bucket = byMonth.get(monthKey(year, month));
    if(!bucket) return;
    if(tx.type==="income"&&tx.status==="selesai") bucket.in += tx.amt;
    if(tx.type==="expense"&&tx.status==="selesai") bucket.out += tx.amt;
  });
  return months;
};
