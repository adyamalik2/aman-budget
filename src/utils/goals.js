const norm = value => String(value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
const DONE_STATUSES = new Set(["selesai", "done", "lunas"]);

export const isGoalCompletedTx = tx => DONE_STATUSES.has(norm(tx?.status));

export const isTxMatchGoal = (tx, goal) => {
  const goalName = norm(goal?.name);
  if(!goalName) return false;

  const category = norm(tx?.cat ?? tx?.category);
  if(category === goalName) return true;

  return [tx?.title, tx?.name, tx?.desc, tx?.description].some(value => norm(value).includes(goalName));
};

export const calcGoalTransactionSaved = (txs, goal) => (txs || []).reduce((sum, tx) => {
  if(!isGoalCompletedTx(tx) || !isTxMatchGoal(tx, goal)) return sum;
  const amount = Number(tx?.amt);
  return Number.isFinite(amount) && amount > 0 ? sum + amount : sum;
}, 0);

export const getGoalDisplayedSaved = (goal, txs) => Number(goal?.saved || 0) + calcGoalTransactionSaved(txs, goal);
