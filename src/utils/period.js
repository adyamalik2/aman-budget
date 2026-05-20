import { MONTHS, MONTH_SHORT } from "../constants/app";

export const getDefaultPeriod = () => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  return {mode:"month", month, year, startMonth:month, startYear:year, endMonth:month, endYear:year};
};

export const validMonth = value => Number.isInteger(value) && value >= 1 && value <= 12;
export const validYear = value => Number.isInteger(value) && value > 1900 && value < 3000;

export const monthKey = (year, month) => year * 12 + month;

export const normalizePeriod = period => {
  const fallback = getDefaultPeriod();
  const month = validMonth(Number(period?.month)) ? Number(period.month) : fallback.month;
  const year = validYear(Number(period?.year)) ? Number(period.year) : fallback.year;
  const startMonth = validMonth(Number(period?.startMonth)) ? Number(period.startMonth) : month;
  const startYear = validYear(Number(period?.startYear)) ? Number(period.startYear) : year;
  let endMonth = validMonth(Number(period?.endMonth)) ? Number(period.endMonth) : startMonth;
  let endYear = validYear(Number(period?.endYear)) ? Number(period.endYear) : startYear;
  if(monthKey(endYear, endMonth) < monthKey(startYear, startMonth)) {
    endMonth = startMonth;
    endYear = startYear;
  }
  return {
    mode: period?.mode === "range" ? "range" : "month",
    month,
    year,
    startMonth,
    startYear,
    endMonth,
    endYear,
  };
};

export const formatMonthYear = (month, year) => `${MONTHS[month - 1]} ${year}`;

export const formatPeriodLabel = period => {
  const p = normalizePeriod(period);
  if(p.mode === "range") return `${formatMonthYear(p.startMonth, p.startYear)} - ${formatMonthYear(p.endMonth, p.endYear)}`;
  return formatMonthYear(p.month, p.year);
};

export const isTxInPeriod = (tx, period) => {
  const [year, month] = (tx.date || "").split("-").map(Number);
  if(!validYear(year)||!validMonth(month)) return false;
  const p = normalizePeriod(period);
  if(p.mode === "range") {
    const txKey = monthKey(year, month);
    return txKey >= monthKey(p.startYear, p.startMonth) && txKey <= monthKey(p.endYear, p.endMonth);
  }
  return year === p.year && month === p.month;
};

export const getPeriodYears = (txs, period) => {
  const p = normalizePeriod(period);
  const currentYear = new Date().getFullYear();
  const years = new Set([currentYear, currentYear + 1, p.year, p.startYear, p.endYear]);
  txs.forEach(tx=>{
    const year = Number((tx.date || "").slice(0, 4));
    if(validYear(year)) years.add(year);
  });
  return [...years].sort((a,b)=>a-b);
};

export const getPrevMonthYear = (month, year) => month === 1 ? {month:12, year:year - 1} : {month:month - 1, year};

export const getLastDayOfMonth = (month, year) => new Date(year, month, 0).getDate();

export const shiftDateToTargetMonth = (date, targetMonth, targetYear) => {
  const day = Number((date || "").slice(8, 10)) || 1;
  const safeDay = Math.min(day, getLastDayOfMonth(targetMonth, targetYear));
  return `${targetYear}-${String(targetMonth).padStart(2, "0")}-${String(safeDay).padStart(2, "0")}`;
};

export const copyBudgetFromPreviousMonth = (txs, period) => {
  const p = normalizePeriod(period);
  const prev = getPrevMonthYear(p.month, p.year);
  const txKey = tx => [tx.type, tx.grp || "", tx.cat || "", tx.desc || "", Number(tx.amt) || 0].join("|");
  const source = txs.filter(tx=>tx.status!=="batal"&&isTxInPeriod(tx, {mode:"month", month:prev.month, year:prev.year}));
  const targetKeys = new Set(txs.filter(tx=>isTxInPeriod(tx, {mode:"month", month:p.month, year:p.year})).map(txKey));
  const items = source
    .filter(tx=>!targetKeys.has(txKey(tx)))
    .map((tx,i)=>({
      ...tx,
      id:`copy-${Date.now()}-${i}`,
      date:shiftDateToTargetMonth(tx.date, p.month, p.year),
      status:"estimasi",
    }));
  return {items, sourceCount:source.length, prev};
};

export const getTransactionsByPeriod = (txs, month, year) => txs.filter(tx=>isTxInPeriod(tx, {mode:"month", month, year}));

export const getTransactionsByRange = (txs, period) => txs.filter(tx=>isTxInPeriod(tx, {...normalizePeriod(period), mode:"range"}));

export const getDeletePeriodLabel = period => formatPeriodLabel(period);

export const deleteTransactionsByPeriod = (txs, period) => {
  const p = normalizePeriod(period);
  const deleted = p.mode==="range" ? getTransactionsByRange(txs, p) : getTransactionsByPeriod(txs, p.month, p.year);
  const ids = new Set(deleted.map(tx=>tx.id));
  return {deleted, next:txs.filter(tx=>!ids.has(tx.id))};
};

export const formatShortDate = date => {
  const month = Number((date || "").slice(5, 7));
  const day = Number((date || "").slice(8, 10));
  if(!validMonth(month)||!day) return date || "-";
  return `${day} ${MONTH_SHORT[month - 1]}`;
};
