const isRecord = value => value !== null && typeof value === "object" && !Array.isArray(value);

export const formatBackupDate = date => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export const isJsonFile = file => Boolean(file?.name?.toLowerCase().endsWith(".json"));

const isValidBackupTx = tx => (
  isRecord(tx) &&
  typeof tx.id === "string" &&
  typeof tx.date === "string" &&
  (tx.type === "income" || tx.type === "expense") &&
  Number.isFinite(Number(tx.amt))
);

const knownBackupFields = ["transactions", "goals", "accounts", "categoryGroups", "transfers", "quickShortcuts", "periodSetting", "period"];

export const isValidBackupData = data => {
  if(!isRecord(data)) return false;
  if(!knownBackupFields.some(field=>Object.prototype.hasOwnProperty.call(data, field))) return false;
  if(data.transactions !== undefined && (!Array.isArray(data.transactions)||!data.transactions.every(isValidBackupTx))) return false;
  if(data.goals !== undefined && (!Array.isArray(data.goals)||!data.goals.every(isRecord))) return false;
  if(data.accounts !== undefined && (!Array.isArray(data.accounts)||!data.accounts.every(isRecord))) return false;
  if(data.categoryGroups !== undefined && (!Array.isArray(data.categoryGroups)||!data.categoryGroups.every(isRecord))) return false;
  if(data.transfers !== undefined && (!Array.isArray(data.transfers)||!data.transfers.every(isRecord))) return false;
  if(data.quickShortcuts !== undefined && (!Array.isArray(data.quickShortcuts)||!data.quickShortcuts.every(isRecord))) return false;
  if(data.user !== undefined && data.user !== null && !isRecord(data.user)) return false;
  if(data.period !== undefined && !isRecord(data.period)) return false;
  if(data.periodSetting !== undefined && !isRecord(data.periodSetting)) return false;
  return true;
};
