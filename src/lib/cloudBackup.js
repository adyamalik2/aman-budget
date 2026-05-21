import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";

export const CLOUD_BACKUP_VERSION = "1.1.0";

const cloudBackupRef = uid => {
  if(!isFirebaseConfigured || !db) throw new Error("Firebase belum terkonfigurasi.");
  return doc(db, "users", uid, "backups", "main");
};

export const backupToCloud = async (uid, payload) => {
  if(!uid) throw new Error("UID kosong.");
  const backup = {
    ...payload,
    updatedAt: new Date().toISOString(),
    appVersion: CLOUD_BACKUP_VERSION,
  };
  await setDoc(cloudBackupRef(uid), backup, {merge:true});
  return backup;
};

export const restoreFromCloud = async uid => {
  if(!uid) throw new Error("UID kosong.");
  const snap = await getDoc(cloudBackupRef(uid));
  if(!snap.exists()) return null;
  return snap.data();
};
