const norm = value => String(value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
const DONE_STATUSES = new Set(["selesai", "done", "lunas"]);
const goalKey = goal => norm(goal?.id || goal?.name);

export const isGoalCompletedTx = tx => DONE_STATUSES.has(norm(tx?.status));

// Hanya hitung transaksi yang SECARA EKSPLISIT terhubung ke goal lewat goalId
// (pilihan "Hubungkan ke Goal" saat input). Pencocokan nama/kategori/deskripsi
// dihapus karena bisa salah hitung transaksi yang tidak terkait.
export const isTxMatchGoal = (tx, goal) => {
  const linkedGoalId = norm(tx?.goalId);
  if(!linkedGoalId) return false;
  return linkedGoalId === goalKey(goal);
};

export const calcGoalTransactionSaved = (txs, goal) => (txs || []).reduce((sum, tx) => {
  if(tx?.deletedAt || !isGoalCompletedTx(tx) || !isTxMatchGoal(tx, goal)) return sum;
  const amount = Number(tx?.amt);
  return Number.isFinite(amount) && amount > 0 ? sum + amount : sum;
}, 0);

export const getGoalDisplayedSaved = (goal, txs) => Number(goal?.saved || 0) + calcGoalTransactionSaved(txs, goal);
