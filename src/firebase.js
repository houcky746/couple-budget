import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

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

// Firestore에서 데이터 불러오기
export async function loadData() {
  try {
    const snap = await getDoc(DOC_REF);
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (e) {
    console.error("데이터 로드 실패:", e);
    return null;
  }
}

// Firestore에 데이터 저장하기
export async function saveData(data) {
  try {
    await setDoc(DOC_REF, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error("데이터 저장 실패:", e);
  }
}
