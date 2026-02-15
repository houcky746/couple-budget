import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import CryptoJS from "crypto-js";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const DOC_REF = doc(db, "budgets", "main");

// 암호화 키 (PIN 기반)
let encryptionKey = null;

export function setEncryptionKey(pin) {
  // PIN에서 안전한 키 파생 (SHA-256 해시)
  encryptionKey = CryptoJS.SHA256(pin + "_moneylog_secret").toString();
}

// 데이터 암호화
function encrypt(data) {
  if (!encryptionKey) throw new Error("암호화 키가 설정되지 않았습니다");
  const jsonStr = JSON.stringify(data);
  return CryptoJS.AES.encrypt(jsonStr, encryptionKey).toString();
}

// 데이터 복호화
function decrypt(cipherText) {
  if (!encryptionKey) throw new Error("암호화 키가 설정되지 않았습니다");
  const bytes = CryptoJS.AES.decrypt(cipherText, encryptionKey);
  const decrypted = bytes.toString(CryptoJS.enc.Utf8);
  if (!decrypted) throw new Error("복호화 실패 - 키가 올바르지 않습니다");
  return JSON.parse(decrypted);
}

// Firestore에서 데이터 불러오기
export async function loadData() {
  try {
    const snap = await getDoc(DOC_REF);
    if (snap.exists()) {
      const raw = snap.data();

      // 암호화된 데이터인 경우
      if (raw.encrypted && raw.payload) {
        const decrypted = decrypt(raw.payload);
        return decrypted;
      }

      // 기존 비암호화 데이터 → 암호화하여 재저장 (마이그레이션)
      if (!raw.encrypted) {
        console.log("비암호화 데이터 발견 → 암호화 마이그레이션 진행");
        const { updatedAt, ...dataOnly } = raw;
        await saveData(dataOnly);
        return dataOnly;
      }

      return raw;
    }
    return null;
  } catch (e) {
    console.error("데이터 로드 실패:", e);
    return null;
  }
}

// Firestore에 데이터 저장하기 (암호화)
export async function saveData(data) {
  try {
    const encryptedPayload = encrypt(data);
    await setDoc(DOC_REF, {
      encrypted: true,
      payload: encryptedPayload,
      updatedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error("데이터 저장 실패:", e);
  }
}
