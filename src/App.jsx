import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { loadData, saveData } from "./firebase.js";

// ─── PIN Auth Screen ────────────────────────────────────────
function PinScreen({ onSuccess }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const correctPin = import.meta.env.VITE_ACCESS_PIN || "1234";

  const handleKey = (num) => {
    if (pin.length < 6) {
      const newPin = pin + num;
      setPin(newPin);
      setError(false);
      if (newPin.length === correctPin.length) {
        setTimeout(() => {
          if (newPin === correctPin) {
            sessionStorage.setItem("budget_auth", "true");
            onSuccess();
          } else {
            setError(true);
            setShake(true);
            setTimeout(() => setShake(false), 500);
            setPin("");
          }
        }, 150);
      }
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #6366f1 0%, #818cf8 50%, #a78bfa 100%)",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      padding: "20px",
    }}>
      <div style={{ fontSize: "40px", marginBottom: "8px" }}>💜</div>
      <div style={{ color: "#fff", fontSize: "20px", fontWeight: 800, marginBottom: "6px" }}>머니로그</div>
      <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px", marginBottom: "30px" }}>인증번호를 입력하세요</div>

      <div style={{
        display: "flex", gap: "14px", marginBottom: "20px",
        animation: shake ? "shake 0.5s ease-in-out" : "none",
      }}>
        {Array.from({ length: correctPin.length }).map((_, i) => (
          <div key={i} style={{
            width: "14px", height: "14px", borderRadius: "50%",
            background: i < pin.length ? "#fff" : "rgba(255,255,255,0.3)",
            transition: "background 0.15s",
          }} />
        ))}
      </div>

      {error && <div style={{ color: "#fca5a5", fontSize: "13px", marginBottom: "12px", fontWeight: 600 }}>인증번호가 올바르지 않습니다</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", maxWidth: "260px" }}>
        {[1,2,3,4,5,6,7,8,9,null,0,"⌫"].map((num, i) => (
          num === null ? <div key={i} /> :
          <button key={i} onClick={() => {
            if (num === "⌫") { setPin(p => p.slice(0, -1)); setError(false); }
            else handleKey(String(num));
          }} style={{
            width: "72px", height: "72px", borderRadius: "50%",
            border: "none", fontSize: num === "⌫" ? "20px" : "24px", fontWeight: 600,
            background: "rgba(255,255,255,0.15)", color: "#fff",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          }}>{num}</button>
        ))}
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-10px); }
          40% { transform: translateX(10px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}

// ─── Loading Screen ─────────────────────────────────────────
function LoadingScreen() {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #6366f1 0%, #818cf8 50%, #a78bfa 100%)",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      <div style={{ fontSize: "40px", marginBottom: "12px" }}>💜</div>
      <div style={{ color: "#fff", fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>머니로그</div>
      <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px" }}>데이터를 불러오는 중...</div>
      <div style={{ marginTop: "20px", width: "40px", height: "40px", border: "3px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Constants ──────────────────────────────────────────────
const EXPENSE_CATEGORIES = ["식비", "카페", "교통", "주거", "생활", "쇼핑", "문화", "의료", "용돈", "카드값", "기타"];
const INCOME_CATEGORIES = ["급여", "부수입", "용돈", "기타"];
const COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#a78bfa", "#6b7280", "#a855f7"];
const fmt = (n) => Number(n).toLocaleString("ko-KR") + "원";
const catEmoji = (c) => ({ 식비: "🍚", 카페: "☕", 교통: "🚗", 주거: "🏠", 생활: "🛒", 쇼핑: "🛍", 문화: "🎬", 의료: "💊", 용돈: "💸", 카드값: "💳", 급여: "💰", 부수입: "💵", 기타: "📌" })[c] || "📌";

const T = {
  bg: "#f8fafc", card: "#ffffff", primary: "#6366f1", primaryLight: "#eef2ff",
  text: "#1e293b", sub: "#64748b", border: "#e2e8f0",
  inc: "#10b981", exp: "#ef4444", shared: "#8b5cf6",
  warn: "#f59e0b", loan: "#0ea5e9", invest: "#8b5cf6",
  radius: "16px", shadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
};

const I = {
  home: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 12l9-9 9 9"/><path d="M9 21V12h6v9"/></svg>,
  plus: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  list: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  chart: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>,
  wallet: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="18" rx="3"/><path d="M2 9h20M8 15h2M14 15h2"/></svg>,
  settings: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  trash: <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>,
  edit: <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  chk: <svg width="13" height="13" fill="none" stroke="#fff" strokeWidth="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>,
  aL: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>,
  aR: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="9 6 15 12 9 18"/></svg>,
  shared: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  down: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>,
  up: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="18 15 12 9 6 15"/></svg>,
};

// ─── Reusable ───────────────────────────────────────────────
const Card = ({ children, style, className }) => <div className={className} style={{ background: T.card, borderRadius: T.radius, boxShadow: T.shadow, padding: "18px", marginBottom: "14px", ...style }}>{children}</div>;
const Chip = ({ sel, onClick, children }) => <button onClick={onClick} style={{ padding: "7px 15px", borderRadius: "20px", border: `1.5px solid ${sel ? T.primary : T.border}`, background: sel ? T.primaryLight : "transparent", color: sel ? T.primary : T.text, fontWeight: 600, fontSize: "13px", cursor: "pointer", whiteSpace: "nowrap" }}>{children}</button>;
const Tog = ({ on, onChange, label, color }) => (
  <button onClick={onChange} style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "13px 16px", borderRadius: "12px", border: `2px solid ${on ? (color || T.shared) : T.border}`, background: on ? (color === T.inc ? "#ecfdf5" : color === T.warn ? "#fffbeb" : "#f3e8ff") : "transparent", cursor: "pointer", marginBottom: "12px" }}>
    <div style={{ width: "22px", height: "22px", borderRadius: "6px", border: `2px solid ${on ? (color || T.shared) : "#cbd5e1"}`, background: on ? (color || T.shared) : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>{on && I.chk}</div>
    <span style={{ fontWeight: 600, fontSize: "14px", color: on ? (color || T.shared) : T.text }}>{label}</span>
  </button>
);
const Inp = ({ label, ...p }) => (
  <div style={{ marginBottom: "14px" }}>
    {label && <label style={{ fontSize: "13px", color: T.sub, fontWeight: 600, display: "block", marginBottom: "5px" }}>{label}</label>}
    <input {...p} style={{ width: "100%", padding: "11px 14px", border: `2px solid ${T.border}`, borderRadius: "12px", fontSize: "16px", outline: "none", boxSizing: "border-box", ...p.style }} />
  </div>
);
const Btn = ({ children, onClick, color, outline, style: s }) => (
  <button onClick={onClick} style={{ width: "100%", padding: "13px", borderRadius: "14px", border: outline ? `2px solid ${color || T.primary}` : "none", background: outline ? "transparent" : `linear-gradient(135deg, ${color || T.primary}, ${color ? color + "cc" : "#818cf8"})`, color: outline ? (color || T.primary) : "#fff", fontSize: "15px", fontWeight: 700, cursor: "pointer", ...s }}>{children}</button>
);

// ─── Default Data ───────────────────────────────────────────
const DEFAULT_DATA = {
  tx: [],
  fixed: [],
  loans: [],
  investments: [],
  names: { p1: "엘리", p2: "파트너" },
  nid: 100,
};

// ─── Responsive Styles ──────────────────────────────────────
const ResponsiveStyles = () => (
  <style>{`
    .ml-app { max-width: 420px; }
    .ml-nav { max-width: 420px; }
    .ml-header-sub { font-size: 10px; }
    .ml-header-title { font-size: 17px; }
    .ml-summary-grid { display: flex; gap: 10px; margin-bottom: 14px; }
    .ml-home-grid { display: block; }

    @media (min-width: 768px) {
      body { background: linear-gradient(135deg, #e0e7ff 0%, #f0f4ff 50%, #ede9fe 100%); }
      .ml-app { max-width: 680px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); border-radius: 0 0 24px 24px; }
      .ml-nav { max-width: 680px; border-radius: 0 0 20px 20px; }
      .ml-header-sub { font-size: 11px; }
      .ml-header-title { font-size: 19px; }
      .ml-home-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
      .ml-home-grid > * { margin-bottom: 0 !important; }
      .ml-home-full { grid-column: 1 / -1; }
    }

    @media (min-width: 1024px) {
      .ml-app { max-width: 800px; }
      .ml-nav { max-width: 800px; }
      .ml-header-title { font-size: 20px; }
    }

    input, textarea, select {
      font-size: 16px !important;
    }

    /* Mobile safe area for bottom nav (iPhone notch etc) */
    .ml-nav {
      padding-bottom: max(8px, env(safe-area-inset-bottom)) !important;
    }

    /* Ensure touch targets are at least 44px */
    .ml-nav button {
      min-height: 44px;
    }
  `}</style>
);

// ═══════════════════════════════════════════════════════════════
function MoneyLogApp({ initialData, onDataChange }) {
  const [tab, setTab] = useState("home");
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [names, setNames] = useState(initialData.names || DEFAULT_DATA.names);
  const [showSettings, setShowSettings] = useState(false);
  const [editNames, setEditNames] = useState({ ...names });

  const [transactions, setTransactions] = useState(initialData.tx || []);
  const [fixedList, setFixedList] = useState(initialData.fixed || []);
  const [loans, setLoans] = useState(initialData.loans || []);
  const [investments, setInvestments] = useState(initialData.investments || []);
  const [nid, setNid] = useState(initialData.nid || 100);

  const [filterPerson, setFilterPerson] = useState("all");
  const [expandedCard, setExpandedCard] = useState(null);
  const [showFixedSetup, setShowFixedSetup] = useState(false);
  const [showInstallment, setShowInstallment] = useState(false);

  const mkForm = () => ({ type: "expense", amount: "", category: "식비", memo: "", person: "p1", date: `${year}-${String(month).padStart(2,"0")}-15`, isCard: false, cardDetails: [], installment: null });
  const [form, setForm] = useState(mkForm());
  const [cdForm, setCdForm] = useState({ name: "", amount: "" });
  const [instForm, setInstForm] = useState({ totalAmount: "", totalMonths: "", monthlyAmount: "", payDay: "15" });
  const [fixForm, setFixForm] = useState({ name: "", amount: "", person: "p1", category: "주거" });

  const [walletTab, setWalletTab] = useState("loan");
  const [showAddLoan, setShowAddLoan] = useState(false);
  const [showAddInvest, setShowAddInvest] = useState(false);
  const [loanForm, setLoanForm] = useState({ name: "", person: "p1", totalAmount: "" });
  const [investForm, setInvestForm] = useState({ name: "", person: "p1" });
  const [paymentForm, setPaymentForm] = useState({ amount: "", date: "", memo: "" });
  const [investRecForm, setInvestRecForm] = useState({ amount: "", date: "", memo: "" });
  const [expandedLoan, setExpandedLoan] = useState(null);
  const [expandedInvest, setExpandedInvest] = useState(null);

  // ─── Edit Transaction State ─────────────────────────────
  const [editingTx, setEditingTx] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [editCdForm, setEditCdForm] = useState({ name: "", amount: "" });

  // Auto-save: debounced
  const saveTimer = useRef(null);
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      onDataChange({ tx: transactions, fixed: fixedList, loans, investments, names, nid });
    }, 1500);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [transactions, fixedList, loans, investments, names, nid]);

  const gn = (k) => k === "shared" ? "공동" : (names[k] || k);
  const mk = `${year}-${String(month).padStart(2, "0")}`;
  const id = () => { const v = nid; setNid(n => n + 1); return v; };

  const prevM = () => { if (month === 1) { setYear(y => y - 1); setMonth(12); } else setMonth(m => m - 1); };
  const nextM = () => { if (month === 12) { setYear(y => y + 1); setMonth(1); } else setMonth(m => m + 1); };

  const monthTx = useMemo(() => transactions.filter(t => t.date.startsWith(mk)), [transactions, mk]);

  const fixedAsTx = useMemo(() => fixedList.map(f => ({
    id: `fixed-${f.id}`, type: "expense", amount: f.amount, category: f.category,
    memo: f.name, person: f.person, date: `${mk}-01`,
    isCard: false, cardDetails: [], installment: null, isFixed: true,
  })), [fixedList, mk]);

  const stats = useMemo(() => {
    const allExpenses = [...monthTx, ...fixedAsTx];
    const f = filterPerson === "all" ? allExpenses : allExpenses.filter(t => t.person === filterPerson || t.person === "shared");
    const incOnly = filterPerson === "all" ? monthTx : monthTx.filter(t => t.person === filterPerson);
    const totalInc = incOnly.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const totalExp = f.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const sharedExp = allExpenses.filter(t => t.type === "expense" && t.person === "shared").reduce((s, t) => s + t.amount, 0);
    const byCat = {};
    allExpenses.filter(t => t.type === "expense" && t.person !== "shared").forEach(t => { byCat[t.category] = (byCat[t.category] || 0) + t.amount; });
    const pieData = Object.entries(byCat).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    const fixedTotal = fixedList.reduce((s, f) => s + f.amount, 0);
    return { totalInc, totalExp, sharedExp, pieData, fixedTotal, balance: totalInc - totalExp };
  }, [monthTx, fixedAsTx, filterPerson, fixedList]);

  // ─── CRUD ──────────────────────────────────────────────
  const addTx = () => {
    if (!form.amount || Number(form.amount) <= 0) return;
    const tx = { ...form, id: id(), amount: Number(form.amount),
      installment: showInstallment ? { totalMonths: Number(instForm.totalMonths), currentMonth: 1, totalAmount: Number(instForm.totalAmount), monthlyAmount: Number(instForm.monthlyAmount || form.amount), startDate: mk, payDay: Number(instForm.payDay) } : null,
    };
    setTransactions(p => [tx, ...p]);
    setForm(mkForm()); setCdForm({ name: "", amount: "" }); setInstForm({ totalAmount: "", totalMonths: "", monthlyAmount: "", payDay: "15" }); setShowInstallment(false);
    setTab("list");
  };
  const delTx = (tid) => setTransactions(p => p.filter(t => t.id !== tid));
  const addCd = () => { if (!cdForm.name || !cdForm.amount) return; setForm(f => ({ ...f, cardDetails: [...f.cardDetails, { name: cdForm.name, amount: Number(cdForm.amount) }] })); setCdForm({ name: "", amount: "" }); };
  const rmCd = (i) => setForm(f => ({ ...f, cardDetails: f.cardDetails.filter((_, j) => j !== i) }));

  // ─── Edit Transaction ─────────────────────────────────
  const openEditTx = (tx) => {
    setEditForm({
      type: tx.type,
      amount: String(tx.amount),
      category: tx.category,
      memo: tx.memo || "",
      person: tx.person,
      date: tx.date,
      isCard: tx.isCard || false,
      cardDetails: tx.cardDetails ? [...tx.cardDetails] : [],
      installment: tx.installment ? { ...tx.installment } : null,
    });
    setEditCdForm({ name: "", amount: "" });
    setEditingTx(tx);
  };

  const saveEditTx = () => {
    if (!editForm.amount || Number(editForm.amount) <= 0) return;
    setTransactions(p => p.map(t =>
      t.id === editingTx.id ? {
        ...t,
        type: editForm.type,
        amount: Number(editForm.amount),
        category: editForm.category,
        memo: editForm.memo,
        person: editForm.person,
        date: editForm.date,
        isCard: editForm.isCard,
        cardDetails: editForm.cardDetails,
        installment: editForm.installment,
      } : t
    ));
    setEditingTx(null);
    setEditForm(null);
  };

  const addEditCd = () => {
    if (!editCdForm.name || !editCdForm.amount) return;
    setEditForm(f => ({ ...f, cardDetails: [...f.cardDetails, { name: editCdForm.name, amount: Number(editCdForm.amount) }] }));
    setEditCdForm({ name: "", amount: "" });
  };
  const rmEditCd = (i) => setEditForm(f => ({ ...f, cardDetails: f.cardDetails.filter((_, j) => j !== i) }));

  const addFixed = () => { if (!fixForm.name || !fixForm.amount) return; setFixedList(p => [...p, { id: id(), name: fixForm.name, amount: Number(fixForm.amount), person: fixForm.person, category: fixForm.category, deposited: false }]); setFixForm({ name: "", amount: "", person: "p1", category: "주거" }); };
  const rmFixed = (fid) => setFixedList(p => p.filter(f => f.id !== fid));
  const toggleDeposited = (fid) => setFixedList(p => p.map(f => f.id === fid ? { ...f, deposited: !f.deposited } : f));

  const addLoan = () => { if (!loanForm.name || !loanForm.totalAmount) return; setLoans(p => [...p, { id: id(), name: loanForm.name, person: loanForm.person, totalAmount: Number(loanForm.totalAmount), payments: [] }]); setLoanForm({ name: "", person: "p1", totalAmount: "" }); setShowAddLoan(false); };
  const delLoan = (lid) => setLoans(p => p.filter(l => l.id !== lid));
  const addPayment = (lid) => { if (!paymentForm.amount || !paymentForm.date) return; setLoans(p => p.map(l => l.id === lid ? { ...l, payments: [...l.payments, { id: id(), amount: Number(paymentForm.amount), date: paymentForm.date, memo: paymentForm.memo }] } : l)); setPaymentForm({ amount: "", date: "", memo: "" }); };
  const delPayment = (lid, pid) => setLoans(p => p.map(l => l.id === lid ? { ...l, payments: l.payments.filter(pp => pp.id !== pid) } : l));

  const addInvest = () => { if (!investForm.name) return; setInvestments(p => [...p, { id: id(), name: investForm.name, person: investForm.person, records: [] }]); setInvestForm({ name: "", person: "p1" }); setShowAddInvest(false); };
  const delInvest = (iid) => setInvestments(p => p.filter(i => i.id !== iid));
  const addInvestRec = (iid) => { if (!investRecForm.amount || !investRecForm.date) return; setInvestments(p => p.map(i => i.id === iid ? { ...i, records: [...i.records, { id: id(), amount: Number(investRecForm.amount), date: investRecForm.date, memo: investRecForm.memo }] } : i)); setInvestRecForm({ amount: "", date: "", memo: "" }); };
  const delInvestRec = (iid, rid) => setInvestments(p => p.map(i => i.id === iid ? { ...i, records: i.records.filter(r => r.id !== rid) } : i));

  const saveNames = () => { setNames({ ...editNames }); setShowSettings(false); };

  // ─── Render helpers (called as functions, NOT as <Components />) ────
  const renderMonthSel = () => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", marginBottom: "18px" }}>
      <button onClick={prevM} style={{ background: "none", border: "none", cursor: "pointer", padding: "8px", color: T.sub, minWidth: "44px", minHeight: "44px", display: "flex", alignItems: "center", justifyContent: "center" }}>{I.aL}</button>
      <div style={{ fontSize: "16px", fontWeight: 700, minWidth: "110px", textAlign: "center" }}>{year}년 {month}월</div>
      <button onClick={nextM} style={{ background: "none", border: "none", cursor: "pointer", padding: "8px", color: T.sub, minWidth: "44px", minHeight: "44px", display: "flex", alignItems: "center", justifyContent: "center" }}>{I.aR}</button>
    </div>
  );

  const renderTxRow = (t, compact) => {
    const exp = expandedCard === t.id;
    return (
      <div key={t.id}>
        <div style={{ display: "flex", alignItems: "center", gap: "9px", padding: compact ? "9px 0" : "11px 0", borderBottom: `1px solid ${T.border}` }}>
          <div style={{ width: "34px", height: "34px", borderRadius: "10px", background: t.type === "income" ? "#ecfdf5" : "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", flexShrink: 0 }}>
            {t.type === "income" ? "💰" : catEmoji(t.category)}
          </div>
          <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={() => {
            if (t.isFixed) return;
            if (t.isCard || t.installment) { setExpandedCard(exp ? null : t.id); }
            else { openEditTx(t); }
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "13px", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.memo || t.category}</span>
              {t.person === "shared" && <span style={{ fontSize: "9px", background: "#f3e8ff", color: T.shared, padding: "1px 5px", borderRadius: "5px", fontWeight: 600 }}>공동</span>}
              {t.isFixed && <span style={{ fontSize: "9px", background: "#e0f2fe", color: "#0369a1", padding: "1px 5px", borderRadius: "5px", fontWeight: 600 }}>고정</span>}
              {t.isCard && <span style={{ fontSize: "9px", background: "#dbeafe", color: "#2563eb", padding: "1px 5px", borderRadius: "5px", fontWeight: 600 }}>💳</span>}
              {t.installment && <span style={{ fontSize: "9px", background: "#fef3c7", color: "#92400e", padding: "1px 5px", borderRadius: "5px", fontWeight: 600 }}>{t.installment.currentMonth}/{t.installment.totalMonths}회</span>}
              {(t.isCard || t.installment) && <span style={{ cursor: "pointer" }}>{exp ? I.up : I.down}</span>}
            </div>
            <div style={{ fontSize: "11px", color: T.sub, marginTop: "1px" }}>{t.category} · {gn(t.person)}{!t.isFixed ? ` · ${t.date.slice(5)}` : ""}</div>
          </div>
          <div style={{ fontSize: "13px", fontWeight: 700, color: t.type === "income" ? T.inc : T.exp, flexShrink: 0 }}>{t.type === "income" ? "+" : "-"}{fmt(t.amount)}</div>
          {!compact && !t.isFixed && (
            <div style={{ display: "flex", gap: "2px", flexShrink: 0 }}>
              <button onClick={() => openEditTx(t)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: "4px", minWidth: "32px", minHeight: "32px", display: "flex", alignItems: "center", justifyContent: "center" }}>{I.edit}</button>
              <button onClick={() => delTx(t.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#cbd5e1", padding: "4px", minWidth: "32px", minHeight: "32px", display: "flex", alignItems: "center", justifyContent: "center" }}>{I.trash}</button>
            </div>
          )}
        </div>
        {exp && t.isCard && t.cardDetails.length > 0 && (
          <div style={{ background: "#f8fafc", borderRadius: "10px", padding: "8px 12px", margin: "3px 0 6px 43px", border: `1px solid ${T.border}` }}>
            <div style={{ fontSize: "10px", fontWeight: 700, color: T.sub, marginBottom: "4px" }}>카드값 세부내역</div>
            {t.cardDetails.map((d, i) => <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: "12px" }}><span style={{ color: T.sub }}>{d.name}</span><span style={{ fontWeight: 600 }}>{fmt(d.amount)}</span></div>)}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0 0", marginTop: "3px", borderTop: `1px solid ${T.border}`, fontSize: "12px", fontWeight: 700 }}><span>합계</span><span style={{ color: T.exp }}>{fmt(t.cardDetails.reduce((s, d) => s + d.amount, 0))}</span></div>
          </div>
        )}
        {exp && t.installment && (
          <div style={{ background: "#fffbeb", borderRadius: "10px", padding: "8px 12px", margin: "3px 0 6px 43px", border: `1px solid #fde68a` }}>
            <div style={{ fontSize: "10px", fontWeight: 700, color: "#92400e", marginBottom: "3px" }}>할부 정보</div>
            <div style={{ fontSize: "12px", color: T.sub }}>총 {fmt(t.installment.totalAmount)} · {t.installment.currentMonth}/{t.installment.totalMonths}회차 · 매월 {t.installment.payDay}일</div>
          </div>
        )}
      </div>
    );
  };

  // ─── HOME ──────────────────────────────────────────────
  const renderHome = () => (
    <div>
      {renderMonthSel()}
      <div style={{ textAlign: "center", marginBottom: "18px" }}>
        <div style={{ fontSize: "26px", fontWeight: 800, color: stats.balance >= 0 ? T.inc : T.exp }}>{stats.balance >= 0 ? "+" : ""}{fmt(stats.balance)}</div>
        <div style={{ fontSize: "12px", color: T.sub, marginTop: "2px" }}>이번 달 잔액</div>
      </div>
      <div className="ml-summary-grid">
        <Card style={{ flex: 1, textAlign: "center", padding: "12px" }}><div style={{ fontSize: "11px", color: T.sub, marginBottom: "3px" }}>수입</div><div style={{ fontSize: "16px", fontWeight: 700, color: T.inc }}>{fmt(stats.totalInc)}</div></Card>
        <Card style={{ flex: 1, textAlign: "center", padding: "12px" }}><div style={{ fontSize: "11px", color: T.sub, marginBottom: "3px" }}>지출</div><div style={{ fontSize: "16px", fontWeight: 700, color: T.exp }}>{fmt(stats.totalExp)}</div></Card>
      </div>

      <div className="ml-home-grid">
        <Card style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px" }} className="ml-home-full">
          <div style={{ width: "34px", height: "34px", borderRadius: "10px", background: "#f3e8ff", display: "flex", alignItems: "center", justifyContent: "center", color: T.shared }}>{I.shared}</div>
          <div style={{ flex: 1 }}><div style={{ fontSize: "11px", color: T.sub }}>공동 지출</div><div style={{ fontSize: "15px", fontWeight: 700, color: T.shared }}>{fmt(stats.sharedExp)}</div></div>
          <div style={{ fontSize: "11px", color: T.sub, textAlign: "right" }}>1인당<br/><span style={{ fontWeight: 600, color: T.text }}>{fmt(Math.round(stats.sharedExp / 2))}</span></div>
        </Card>

        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <div style={{ fontSize: "14px", fontWeight: 700 }}>고정 지출</div>
            <button onClick={() => setShowFixedSetup(true)} style={{ background: "none", border: "none", color: T.primary, fontSize: "12px", cursor: "pointer", fontWeight: 600, padding: "4px 8px", minHeight: "32px" }}>편집 →</button>
          </div>
          {fixedList.map((f, i) => (
            <div key={f.id} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 0", borderBottom: i < fixedList.length - 1 ? `1px solid ${T.border}` : "none" }}>
              <span style={{ fontSize: "14px", flexShrink: 0 }}>{catEmoji(f.category)}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "13px", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</div>
                <div style={{ fontSize: "10px", color: T.sub }}>{f.category}</div>
              </div>
              <span style={{ fontSize: "10px", color: f.person === "shared" ? T.shared : T.sub, background: f.person === "shared" ? "#f3e8ff" : "#f1f5f9", padding: "2px 6px", borderRadius: "4px", fontWeight: 600, flexShrink: 0 }}>{gn(f.person)}</span>
              <span style={{ fontSize: "13px", fontWeight: 700, minWidth: "70px", textAlign: "right", flexShrink: 0 }}>{fmt(f.amount)}</span>
              <button onClick={() => toggleDeposited(f.id)} style={{ width: "30px", height: "30px", borderRadius: "7px", border: `2px solid ${f.deposited ? T.inc : "#cbd5e1"}`, background: f.deposited ? T.inc : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }} title={f.deposited ? "입금완료" : "미입금"}>
                {f.deposited && I.chk}
              </button>
            </div>
          ))}
          {fixedList.length === 0 && <div style={{ textAlign: "center", color: T.sub, padding: "14px", fontSize: "13px" }}>고정 지출을 추가해보세요</div>}
        </Card>

        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <div style={{ fontSize: "14px", fontWeight: 700 }}>최근 내역</div>
            <button onClick={() => setTab("list")} style={{ background: "none", border: "none", color: T.primary, fontSize: "12px", cursor: "pointer", fontWeight: 600, padding: "4px 8px", minHeight: "32px" }}>전체보기 →</button>
          </div>
          {monthTx.slice(0, 4).map(t => renderTxRow(t, true))}
          {monthTx.length === 0 && <div style={{ textAlign: "center", color: T.sub, padding: "14px", fontSize: "13px" }}>내역 없음</div>}
        </Card>
      </div>
    </div>
  );

  // ─── ADD ───────────────────────────────────────────────
  const renderAdd = () => {
    const cats = form.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    return (
      <div><Card>
        <div style={{ fontSize: "15px", fontWeight: 700, marginBottom: "14px" }}>새 내역 추가</div>
        <div style={{ display: "flex", background: "#f1f5f9", borderRadius: "12px", padding: "4px", marginBottom: "18px" }}>
          {[{ k: "expense", l: "지출" }, { k: "income", l: "수입" }].map(({ k, l }) => (
            <button key={k} onClick={() => setForm(f => ({ ...f, type: k, category: k === "income" ? "급여" : "식비", isCard: false, cardDetails: [] }))}
              style={{ flex: 1, padding: "9px", borderRadius: "10px", border: "none", cursor: "pointer", background: form.type === k ? (k === "expense" ? T.exp : T.inc) : "transparent", color: form.type === k ? "#fff" : T.sub, fontWeight: 600, fontSize: "14px" }}>{l}</button>
          ))}
        </div>
        <div style={{ marginBottom: "14px" }}>
          <label style={{ fontSize: "13px", color: T.sub, fontWeight: 600, display: "block", marginBottom: "5px" }}>금액</label>
          <div style={{ position: "relative" }}>
            <input type="number" inputMode="numeric" placeholder="0" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} style={{ width: "100%", padding: "13px 48px 13px 14px", border: `2px solid ${T.border}`, borderRadius: "12px", fontSize: "18px", fontWeight: 700, outline: "none", boxSizing: "border-box" }} />
            <span style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", color: T.sub, fontWeight: 600 }}>원</span>
          </div>
        </div>
        <label style={{ fontSize: "13px", color: T.sub, fontWeight: 600, display: "block", marginBottom: "7px" }}>카테고리</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "7px", marginBottom: "14px" }}>
          {cats.map(c => <Chip key={c} sel={form.category === c} onClick={() => setForm(f => ({ ...f, category: c, isCard: c === "카드값" }))}>{catEmoji(c)} {c}</Chip>)}
        </div>
        {form.isCard && (
          <Card style={{ background: "#f0f9ff", border: `1.5px solid #bae6fd`, padding: "14px", marginBottom: "14px" }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#0369a1", marginBottom: "10px" }}>💳 카드값 세부내역</div>
            {form.cardDetails.map((d, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: `1px solid #e0f2fe` }}>
                <span style={{ fontSize: "13px" }}>{d.name}</span>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><span style={{ fontSize: "13px", fontWeight: 600 }}>{fmt(d.amount)}</span><button onClick={() => rmCd(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: "12px", padding: "4px", minWidth: "32px", minHeight: "32px" }}>✕</button></div>
              </div>
            ))}
            {form.cardDetails.length > 0 && <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0 2px", fontWeight: 700, fontSize: "13px", borderTop: `1.5px solid #7dd3fc`, marginTop: "3px" }}><span>소계</span><span style={{ color: T.exp }}>{fmt(form.cardDetails.reduce((s, d) => s + d.amount, 0))}</span></div>}
            <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
              <input placeholder="항목명" value={cdForm.name} onChange={e => setCdForm(f => ({ ...f, name: e.target.value }))} style={{ flex: 1, padding: "8px 10px", border: `1.5px solid #bae6fd`, borderRadius: "8px", fontSize: "16px", outline: "none", boxSizing: "border-box" }} />
              <input type="number" inputMode="numeric" placeholder="금액" value={cdForm.amount} onChange={e => setCdForm(f => ({ ...f, amount: e.target.value }))} style={{ width: "90px", padding: "8px 10px", border: `1.5px solid #bae6fd`, borderRadius: "8px", fontSize: "16px", outline: "none", boxSizing: "border-box" }} />
              <button onClick={addCd} style={{ padding: "8px 14px", borderRadius: "8px", border: "none", background: "#0284c7", color: "#fff", fontWeight: 700, fontSize: "13px", cursor: "pointer", minHeight: "40px" }}>추가</button>
            </div>
          </Card>
        )}
        <Inp label="메모" placeholder="간단한 메모" value={form.memo} onChange={e => setForm(f => ({ ...f, memo: e.target.value }))} />
        <label style={{ fontSize: "13px", color: T.sub, fontWeight: 600, display: "block", marginBottom: "7px" }}>누가?</label>
        <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
          {[{ k: "p1", emoji: "🙋" }, { k: "p2", emoji: "💑" }, { k: "shared", emoji: "👫" }].map(({ k, emoji }) => (
            <button key={k} onClick={() => setForm(f => ({ ...f, person: k }))} style={{ flex: 1, padding: "11px 4px", borderRadius: "12px", border: `2px solid ${form.person === k ? (k === "shared" ? T.shared : T.primary) : T.border}`, background: form.person === k ? (k === "shared" ? "#f3e8ff" : T.primaryLight) : "transparent", color: form.person === k ? (k === "shared" ? T.shared : T.primary) : T.text, fontWeight: 600, fontSize: "13px", cursor: "pointer", minHeight: "44px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{emoji} {gn(k)}</button>
          ))}
        </div>
        {form.type === "expense" && !form.isCard && <Tog on={showInstallment} onChange={() => setShowInstallment(!showInstallment)} label="할부 결제" color={T.warn} />}
        {showInstallment && (
          <Card style={{ background: "#fffbeb", border: `1.5px solid #fde68a`, padding: "12px", marginBottom: "10px" }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#92400e", marginBottom: "8px" }}>할부 정보</div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "6px" }}>
              <Inp label="총 금액" type="number" inputMode="numeric" placeholder="0" value={instForm.totalAmount} onChange={e => setInstForm(f => ({ ...f, totalAmount: e.target.value }))} style={{ marginBottom: 0 }} />
              <Inp label="할부 개월" type="number" inputMode="numeric" placeholder="12" value={instForm.totalMonths} onChange={e => setInstForm(f => ({ ...f, totalMonths: e.target.value }))} style={{ marginBottom: 0 }} />
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <Inp label="월 납입액" type="number" inputMode="numeric" placeholder="자동계산" value={instForm.monthlyAmount || (instForm.totalAmount && instForm.totalMonths ? Math.round(Number(instForm.totalAmount) / Number(instForm.totalMonths)) : "")} onChange={e => setInstForm(f => ({ ...f, monthlyAmount: e.target.value }))} style={{ marginBottom: 0 }} />
              <Inp label="결제일" type="number" inputMode="numeric" placeholder="15" value={instForm.payDay} onChange={e => setInstForm(f => ({ ...f, payDay: e.target.value }))} style={{ marginBottom: 0 }} />
            </div>
          </Card>
        )}
        <Inp label="날짜" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
        <Btn onClick={addTx}>{form.type === "income" ? "수입" : "지출"} 추가하기</Btn>
      </Card></div>
    );
  };

  // ─── LIST ──────────────────────────────────────────────
  const renderList = () => {
    const allItems = [...monthTx, ...fixedAsTx];
    const filtered = filterPerson === "all" ? allItems : allItems.filter(t => t.person === filterPerson || t.person === "shared");
    const sorted = [...filtered].sort((a, b) => {
      if (a.isFixed && !b.isFixed) return 1;
      if (!a.isFixed && b.isFixed) return -1;
      return b.date.localeCompare(a.date);
    });
    return (
      <div>
        {renderMonthSel()}
        <div style={{ display: "flex", gap: "7px", marginBottom: "14px", flexWrap: "wrap" }}>
          <Chip sel={filterPerson === "all"} onClick={() => setFilterPerson("all")}>전체</Chip>
          <Chip sel={filterPerson === "p1"} onClick={() => setFilterPerson("p1")}>{gn("p1")}</Chip>
          <Chip sel={filterPerson === "p2"} onClick={() => setFilterPerson("p2")}>{gn("p2")}</Chip>
          <Chip sel={filterPerson === "shared"} onClick={() => setFilterPerson("shared")}>공동</Chip>
        </div>
        <Card style={{ padding: "6px 14px" }}>
          {sorted.length === 0 ? <div style={{ textAlign: "center", padding: "36px 0", color: T.sub, fontSize: "13px" }}>내역 없음</div>
            : sorted.map(t => renderTxRow(t, false))}
        </Card>
      </div>
    );
  };

  // ─── STATS ─────────────────────────────────────────────
  const renderStats = () => {
    const allExpenses = [...monthTx, ...fixedAsTx];
    const totalInc = monthTx.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const totalExp = allExpenses.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const sharedExp = allExpenses.filter(t => t.type === "expense" && t.person === "shared").reduce((s, t) => s + t.amount, 0);
    const balance = totalInc - totalExp;
    const byCat = {};
    allExpenses.filter(t => t.type === "expense" && t.person !== "shared").forEach(t => { byCat[t.category] = (byCat[t.category] || 0) + t.amount; });
    const pieData = Object.entries(byCat).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

    return (
      <div>
        {renderMonthSel()}
        <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
          <Card style={{ flex: 1, textAlign: "center", padding: "14px" }}><div style={{ fontSize: "11px", color: T.sub, marginBottom: "3px" }}>수입</div><div style={{ fontSize: "17px", fontWeight: 700, color: T.inc }}>{fmt(totalInc)}</div></Card>
          <Card style={{ flex: 1, textAlign: "center", padding: "14px" }}><div style={{ fontSize: "11px", color: T.sub, marginBottom: "3px" }}>지출</div><div style={{ fontSize: "17px", fontWeight: 700, color: T.exp }}>{fmt(totalExp)}</div></Card>
          <Card style={{ flex: 1, textAlign: "center", padding: "14px" }}><div style={{ fontSize: "11px", color: T.sub, marginBottom: "3px" }}>남은 금액</div><div style={{ fontSize: "17px", fontWeight: 700, color: balance >= 0 ? T.inc : T.exp }}>{fmt(balance)}</div></Card>
        </div>

        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div style={{ fontSize: "14px", fontWeight: 700 }}>항목별 지출</div>
            <span style={{ fontSize: "11px", color: T.sub }}>공동 지출 제외</span>
          </div>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={190}>
                <PieChart><Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={42} outerRadius={75} paddingAngle={3}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>{pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie>
                  <Tooltip formatter={v => fmt(v)} /></PieChart>
              </ResponsiveContainer>
              <div style={{ marginTop: "10px" }}>
                {pieData.map((d, i) => {
                  const total = pieData.reduce((s, e) => s + e.value, 0);
                  return (
                    <div key={d.name} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "5px 0", borderBottom: i < pieData.length - 1 ? `1px solid ${T.border}` : "none" }}>
                      <div style={{ width: "10px", height: "10px", borderRadius: "3px", background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: "13px" }}>{catEmoji(d.name)} {d.name}</span>
                      <span style={{ fontSize: "12px", color: T.sub }}>{((d.value / total) * 100).toFixed(1)}%</span>
                      <span style={{ fontSize: "13px", fontWeight: 700, marginLeft: "4px" }}>{fmt(d.value)}</span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : <div style={{ textAlign: "center", color: T.sub, padding: "20px", fontSize: "13px" }}>데이터 없음</div>}
        </Card>

        <Card style={{ background: "linear-gradient(135deg, #f3e8ff, #ede9fe)", border: `1px solid #ddd6fe`, textAlign: "center", padding: "20px" }}>
          <div style={{ fontSize: "13px", fontWeight: 700, color: T.shared, marginBottom: "6px" }}>💜 공동 지출</div>
          <div style={{ fontSize: "24px", fontWeight: 800 }}>{fmt(sharedExp)}</div>
          <div style={{ fontSize: "12px", color: T.sub, marginTop: "4px" }}>1인당 {fmt(Math.round(sharedExp / 2))}</div>
        </Card>
      </div>
    );
  };

  // ─── WALLET ────────────────────────────────────────────
  const renderWallet = () => (
    <div>
      <div style={{ display: "flex", background: "#f1f5f9", borderRadius: "12px", padding: "4px", marginBottom: "18px" }}>
        {[{ k: "loan", l: "대출" }, { k: "invest", l: "투자" }].map(({ k, l }) => (
          <button key={k} onClick={() => setWalletTab(k)} style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none", cursor: "pointer", background: walletTab === k ? (k === "loan" ? T.loan : T.invest) : "transparent", color: walletTab === k ? "#fff" : T.sub, fontWeight: 600, fontSize: "14px" }}>{l}</button>
        ))}
      </div>
      {walletTab === "loan" && renderLoans()}
      {walletTab === "invest" && renderInvest()}
    </div>
  );

  const renderLoans = () => {
    const totalDebt = loans.reduce((s, l) => s + l.totalAmount, 0);
    const totalPaid = loans.reduce((s, l) => s + l.payments.reduce((ss, p) => ss + p.amount, 0), 0);
    return (
      <div>
        <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
          <Card style={{ flex: 1, textAlign: "center", padding: "12px" }}><div style={{ fontSize: "11px", color: T.sub, marginBottom: "2px" }}>총 대출</div><div style={{ fontSize: "15px", fontWeight: 700, color: T.exp }}>{fmt(totalDebt)}</div></Card>
          <Card style={{ flex: 1, textAlign: "center", padding: "12px" }}><div style={{ fontSize: "11px", color: T.sub, marginBottom: "2px" }}>상환 완료</div><div style={{ fontSize: "15px", fontWeight: 700, color: T.inc }}>{fmt(totalPaid)}</div></Card>
          <Card style={{ flex: 1, textAlign: "center", padding: "12px" }}><div style={{ fontSize: "11px", color: T.sub, marginBottom: "2px" }}>남은 금액</div><div style={{ fontSize: "15px", fontWeight: 700, color: T.loan }}>{fmt(totalDebt - totalPaid)}</div></Card>
        </div>
        {loans.map(l => {
          const paid = l.payments.reduce((s, p) => s + p.amount, 0);
          const pct = l.totalAmount > 0 ? (paid / l.totalAmount) * 100 : 0;
          const isExp = expandedLoan === l.id;
          return (
            <Card key={l.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                <div onClick={() => setExpandedLoan(isExp ? null : l.id)} style={{ cursor: "pointer", flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "15px", fontWeight: 700 }}>{l.name}</span>
                    <span style={{ fontSize: "10px", color: T.sub, background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px" }}>{gn(l.person)}</span>
                    {isExp ? I.up : I.down}
                  </div>
                  <div style={{ fontSize: "12px", color: T.sub, marginTop: "2px" }}>총 {fmt(l.totalAmount)}</div>
                </div>
                <button onClick={() => delLoan(l.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#cbd5e1", padding: "4px", minWidth: "32px", minHeight: "32px" }}>{I.trash}</button>
              </div>
              <div style={{ background: "#e2e8f0", borderRadius: "8px", height: "8px", marginBottom: "6px", overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: `linear-gradient(90deg, ${T.loan}, #38bdf8)`, borderRadius: "8px" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: T.sub }}>
                <span>상환 {pct.toFixed(1)}%</span><span>{fmt(paid)} / {fmt(l.totalAmount)}</span>
              </div>
              {isExp && (
                <div style={{ marginTop: "12px", borderTop: `1px solid ${T.border}`, paddingTop: "12px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: T.sub, marginBottom: "8px" }}>상환 내역</div>
                  {l.payments.length === 0 && <div style={{ fontSize: "12px", color: T.sub, padding: "8px 0" }}>아직 상환 내역이 없어요</div>}
                  {[...l.payments].sort((a, b) => b.date.localeCompare(a.date)).map(p => (
                    <div key={p.id} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>
                      <span style={{ fontSize: "12px", color: T.sub, minWidth: "70px" }}>{p.date}</span>
                      <span style={{ fontSize: "12px", flex: 1, color: T.sub }}>{p.memo}</span>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: T.loan }}>{fmt(p.amount)}</span>
                      <button onClick={() => delPayment(l.id, p.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#cbd5e1", padding: "4px", minWidth: "32px", minHeight: "32px" }}>{I.trash}</button>
                    </div>
                  ))}
                  <div style={{ marginTop: "10px", padding: "12px", background: "#f0f9ff", borderRadius: "10px" }}>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: T.sub, marginBottom: "6px" }}>상환 추가</div>
                    <div style={{ display: "flex", gap: "6px", marginBottom: "6px" }}>
                      <input type="number" inputMode="numeric" placeholder="금액" value={paymentForm.amount} onChange={e => setPaymentForm(f => ({ ...f, amount: e.target.value }))} style={{ flex: 1, padding: "8px 10px", border: `1.5px solid #bae6fd`, borderRadius: "8px", fontSize: "16px", outline: "none", boxSizing: "border-box" }} />
                      <input type="date" value={paymentForm.date} onChange={e => setPaymentForm(f => ({ ...f, date: e.target.value }))} style={{ padding: "8px 10px", border: `1.5px solid #bae6fd`, borderRadius: "8px", fontSize: "16px", outline: "none", boxSizing: "border-box" }} />
                    </div>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <input placeholder="메모" value={paymentForm.memo} onChange={e => setPaymentForm(f => ({ ...f, memo: e.target.value }))} style={{ flex: 1, padding: "8px 10px", border: `1.5px solid #bae6fd`, borderRadius: "8px", fontSize: "16px", outline: "none", boxSizing: "border-box" }} />
                      <button onClick={() => addPayment(l.id)} style={{ padding: "8px 14px", borderRadius: "8px", border: "none", background: T.loan, color: "#fff", fontWeight: 700, fontSize: "13px", cursor: "pointer", minHeight: "40px" }}>추가</button>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
        {!showAddLoan ? <Btn onClick={() => setShowAddLoan(true)} color={T.loan}>+ 대출 추가</Btn> : (
          <Card>
            <div style={{ fontSize: "15px", fontWeight: 700, marginBottom: "14px" }}>새 대출</div>
            <Inp label="대출명" placeholder="전세자금 대출" value={loanForm.name} onChange={e => setLoanForm(f => ({ ...f, name: e.target.value }))} />
            <label style={{ fontSize: "13px", color: T.sub, fontWeight: 600, display: "block", marginBottom: "7px" }}>누구?</label>
            <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
              {["p1", "p2"].map(p => <button key={p} onClick={() => setLoanForm(f => ({ ...f, person: p }))} style={{ flex: 1, padding: "10px", borderRadius: "12px", border: `2px solid ${loanForm.person === p ? T.loan : T.border}`, background: loanForm.person === p ? "#e0f2fe" : "transparent", color: loanForm.person === p ? T.loan : T.text, fontWeight: 600, cursor: "pointer", minHeight: "44px" }}>{gn(p)}</button>)}
            </div>
            <Inp label="대출 총액" type="number" inputMode="numeric" placeholder="100,000,000" value={loanForm.totalAmount} onChange={e => setLoanForm(f => ({ ...f, totalAmount: e.target.value }))} />
            <div style={{ display: "flex", gap: "8px" }}>
              <Btn outline onClick={() => setShowAddLoan(false)} style={{ flex: 1 }}>취소</Btn>
              <Btn onClick={addLoan} color={T.loan} style={{ flex: 1 }}>등록</Btn>
            </div>
          </Card>
        )}
      </div>
    );
  };

  const renderInvest = () => {
    const byPerson = { p1: 0, p2: 0 };
    investments.forEach(inv => { const total = inv.records.reduce((s, r) => s + r.amount, 0); byPerson[inv.person] = (byPerson[inv.person] || 0) + total; });
    const totalInvest = byPerson.p1 + byPerson.p2;
    return (
      <div>
        <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
          <Card style={{ flex: 1, textAlign: "center", padding: "12px" }}><div style={{ fontSize: "11px", color: T.sub, marginBottom: "2px" }}>총 투자</div><div style={{ fontSize: "15px", fontWeight: 700, color: T.invest }}>{fmt(totalInvest)}</div></Card>
          <Card style={{ flex: 1, textAlign: "center", padding: "12px" }}><div style={{ fontSize: "11px", color: T.sub, marginBottom: "2px" }}>{gn("p1")}</div><div style={{ fontSize: "15px", fontWeight: 700, color: T.primary }}>{fmt(byPerson.p1)}</div></Card>
          <Card style={{ flex: 1, textAlign: "center", padding: "12px" }}><div style={{ fontSize: "11px", color: T.sub, marginBottom: "2px" }}>{gn("p2")}</div><div style={{ fontSize: "15px", fontWeight: 700, color: "#ec4899" }}>{fmt(byPerson.p2)}</div></Card>
        </div>
        {investments.map(inv => {
          const total = inv.records.reduce((s, r) => s + r.amount, 0);
          const isExp = expandedInvest === inv.id;
          return (
            <Card key={inv.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <div onClick={() => setExpandedInvest(isExp ? null : inv.id)} style={{ cursor: "pointer", flex: 1, display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "15px", fontWeight: 700 }}>{inv.name}</span>
                  <span style={{ fontSize: "10px", color: T.sub, background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px" }}>{gn(inv.person)}</span>
                  {isExp ? I.up : I.down}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "15px", fontWeight: 700, color: T.invest }}>{fmt(total)}</span>
                  <button onClick={() => delInvest(inv.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#cbd5e1", padding: "4px", minWidth: "32px", minHeight: "32px" }}>{I.trash}</button>
                </div>
              </div>
              <div style={{ fontSize: "12px", color: T.sub }}>{inv.records.length}건 투자</div>
              {isExp && (
                <div style={{ marginTop: "10px", borderTop: `1px solid ${T.border}`, paddingTop: "10px" }}>
                  {inv.records.length === 0 && <div style={{ fontSize: "12px", color: T.sub, padding: "8px 0" }}>투자 내역이 없어요</div>}
                  {[...inv.records].sort((a, b) => b.date.localeCompare(a.date)).map(r => (
                    <div key={r.id} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "5px 0", borderBottom: `1px solid ${T.border}` }}>
                      <span style={{ fontSize: "12px", color: T.sub, minWidth: "70px" }}>{r.date}</span>
                      <span style={{ fontSize: "12px", flex: 1, color: T.sub }}>{r.memo}</span>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: T.invest }}>{fmt(r.amount)}</span>
                      <button onClick={() => delInvestRec(inv.id, r.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#cbd5e1", padding: "4px", minWidth: "32px", minHeight: "32px" }}>{I.trash}</button>
                    </div>
                  ))}
                  <div style={{ marginTop: "8px", padding: "12px", background: "#f5f3ff", borderRadius: "10px" }}>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: T.sub, marginBottom: "6px" }}>투자 추가</div>
                    <div style={{ display: "flex", gap: "6px", marginBottom: "6px" }}>
                      <input type="number" inputMode="numeric" placeholder="금액" value={investRecForm.amount} onChange={e => setInvestRecForm(f => ({ ...f, amount: e.target.value }))} style={{ flex: 1, padding: "8px 10px", border: `1.5px solid #c4b5fd`, borderRadius: "8px", fontSize: "16px", outline: "none", boxSizing: "border-box" }} />
                      <input type="date" value={investRecForm.date} onChange={e => setInvestRecForm(f => ({ ...f, date: e.target.value }))} style={{ padding: "8px 10px", border: `1.5px solid #c4b5fd`, borderRadius: "8px", fontSize: "16px", outline: "none", boxSizing: "border-box" }} />
                    </div>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <input placeholder="메모" value={investRecForm.memo} onChange={e => setInvestRecForm(f => ({ ...f, memo: e.target.value }))} style={{ flex: 1, padding: "8px 10px", border: `1.5px solid #c4b5fd`, borderRadius: "8px", fontSize: "16px", outline: "none", boxSizing: "border-box" }} />
                      <button onClick={() => addInvestRec(inv.id)} style={{ padding: "8px 14px", borderRadius: "8px", border: "none", background: T.invest, color: "#fff", fontWeight: 700, fontSize: "13px", cursor: "pointer", minHeight: "40px" }}>추가</button>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
        {!showAddInvest ? <Btn onClick={() => setShowAddInvest(true)} color={T.invest}>+ 투자 항목 추가</Btn> : (
          <Card>
            <div style={{ fontSize: "15px", fontWeight: 700, marginBottom: "14px" }}>새 투자 항목</div>
            <Inp label="투자명" placeholder="주식, 적금, 코인 등" value={investForm.name} onChange={e => setInvestForm(f => ({ ...f, name: e.target.value }))} />
            <label style={{ fontSize: "13px", color: T.sub, fontWeight: 600, display: "block", marginBottom: "7px" }}>누구?</label>
            <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
              {["p1", "p2"].map(p => <button key={p} onClick={() => setInvestForm(f => ({ ...f, person: p }))} style={{ flex: 1, padding: "10px", borderRadius: "12px", border: `2px solid ${investForm.person === p ? T.invest : T.border}`, background: investForm.person === p ? "#f5f3ff" : "transparent", color: investForm.person === p ? T.invest : T.text, fontWeight: 600, cursor: "pointer", minHeight: "44px" }}>{gn(p)}</button>)}
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <Btn outline onClick={() => setShowAddInvest(false)} style={{ flex: 1 }}>취소</Btn>
              <Btn onClick={addInvest} color={T.invest} style={{ flex: 1 }}>등록</Btn>
            </div>
          </Card>
        )}
      </div>
    );
  };

  // ─── Edit Transaction Modal ─────────────────────────────
  const renderEditModal = () => {
    if (!editingTx || !editForm) return null;
    const cats = editForm.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={(e) => { if (e.target === e.currentTarget) { setEditingTx(null); setEditForm(null); } }}>
        <div style={{ width: "100%", maxWidth: "680px", background: T.card, borderRadius: "20px 20px 0 0", padding: "22px 18px", maxHeight: "85vh", overflowY: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div style={{ fontSize: "16px", fontWeight: 700 }}>내역 수정</div>
            <button onClick={() => { setEditingTx(null); setEditForm(null); }} style={{ background: "none", border: "none", fontSize: "20px", color: T.sub, cursor: "pointer", padding: "4px 8px", minWidth: "32px", minHeight: "32px" }}>✕</button>
          </div>

          {/* Type toggle */}
          <div style={{ display: "flex", background: "#f1f5f9", borderRadius: "12px", padding: "4px", marginBottom: "18px" }}>
            {[{ k: "expense", l: "지출" }, { k: "income", l: "수입" }].map(({ k, l }) => (
              <button key={k} onClick={() => setEditForm(f => ({ ...f, type: k, category: k === "income" ? "급여" : "식비", isCard: false, cardDetails: [] }))}
                style={{ flex: 1, padding: "9px", borderRadius: "10px", border: "none", cursor: "pointer", background: editForm.type === k ? (k === "expense" ? T.exp : T.inc) : "transparent", color: editForm.type === k ? "#fff" : T.sub, fontWeight: 600, fontSize: "14px" }}>{l}</button>
            ))}
          </div>

          {/* Amount */}
          <div style={{ marginBottom: "14px" }}>
            <label style={{ fontSize: "13px", color: T.sub, fontWeight: 600, display: "block", marginBottom: "5px" }}>금액</label>
            <div style={{ position: "relative" }}>
              <input type="number" inputMode="numeric" placeholder="0" value={editForm.amount} onChange={e => setEditForm(f => ({ ...f, amount: e.target.value }))} style={{ width: "100%", padding: "13px 48px 13px 14px", border: `2px solid ${T.border}`, borderRadius: "12px", fontSize: "18px", fontWeight: 700, outline: "none", boxSizing: "border-box" }} />
              <span style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", color: T.sub, fontWeight: 600 }}>원</span>
            </div>
          </div>

          {/* Category */}
          <label style={{ fontSize: "13px", color: T.sub, fontWeight: 600, display: "block", marginBottom: "7px" }}>카테고리</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "7px", marginBottom: "14px" }}>
            {cats.map(c => <Chip key={c} sel={editForm.category === c} onClick={() => setEditForm(f => ({ ...f, category: c, isCard: c === "카드값" }))}>{catEmoji(c)} {c}</Chip>)}
          </div>

          {/* Card details (if card category) */}
          {editForm.isCard && (
            <Card style={{ background: "#f0f9ff", border: `1.5px solid #bae6fd`, padding: "14px", marginBottom: "14px" }}>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#0369a1", marginBottom: "10px" }}>💳 카드값 세부내역</div>
              {editForm.cardDetails.map((d, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: `1px solid #e0f2fe` }}>
                  <span style={{ fontSize: "13px" }}>{d.name}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 600 }}>{fmt(d.amount)}</span>
                    <button onClick={() => rmEditCd(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: "12px", padding: "4px", minWidth: "32px", minHeight: "32px" }}>✕</button>
                  </div>
                </div>
              ))}
              {editForm.cardDetails.length > 0 && <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0 2px", fontWeight: 700, fontSize: "13px", borderTop: `1.5px solid #7dd3fc`, marginTop: "3px" }}><span>소계</span><span style={{ color: T.exp }}>{fmt(editForm.cardDetails.reduce((s, d) => s + d.amount, 0))}</span></div>}
              <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
                <input placeholder="항목명" value={editCdForm.name} onChange={e => setEditCdForm(f => ({ ...f, name: e.target.value }))} style={{ flex: 1, padding: "8px 10px", border: `1.5px solid #bae6fd`, borderRadius: "8px", fontSize: "16px", outline: "none", boxSizing: "border-box" }} />
                <input type="number" inputMode="numeric" placeholder="금액" value={editCdForm.amount} onChange={e => setEditCdForm(f => ({ ...f, amount: e.target.value }))} style={{ width: "90px", padding: "8px 10px", border: `1.5px solid #bae6fd`, borderRadius: "8px", fontSize: "16px", outline: "none", boxSizing: "border-box" }} />
                <button onClick={addEditCd} style={{ padding: "8px 14px", borderRadius: "8px", border: "none", background: "#0284c7", color: "#fff", fontWeight: 700, fontSize: "13px", cursor: "pointer", minHeight: "40px" }}>추가</button>
              </div>
            </Card>
          )}

          {/* Memo */}
          <Inp label="메모" placeholder="간단한 메모" value={editForm.memo} onChange={e => setEditForm(f => ({ ...f, memo: e.target.value }))} />

          {/* Person */}
          <label style={{ fontSize: "13px", color: T.sub, fontWeight: 600, display: "block", marginBottom: "7px" }}>누가?</label>
          <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
            {[{ k: "p1", emoji: "🙋" }, { k: "p2", emoji: "💑" }, { k: "shared", emoji: "👫" }].map(({ k, emoji }) => (
              <button key={k} onClick={() => setEditForm(f => ({ ...f, person: k }))} style={{ flex: 1, padding: "11px 4px", borderRadius: "12px", border: `2px solid ${editForm.person === k ? (k === "shared" ? T.shared : T.primary) : T.border}`, background: editForm.person === k ? (k === "shared" ? "#f3e8ff" : T.primaryLight) : "transparent", color: editForm.person === k ? (k === "shared" ? T.shared : T.primary) : T.text, fontWeight: 600, fontSize: "13px", cursor: "pointer", minHeight: "44px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{emoji} {gn(k)}</button>
            ))}
          </div>

          {/* Date */}
          <Inp label="날짜" type="date" value={editForm.date} onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))} />

          {/* Buttons */}
          <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
            <Btn outline onClick={() => { setEditingTx(null); setEditForm(null); }} style={{ flex: 1 }}>취소</Btn>
            <Btn onClick={saveEditTx} style={{ flex: 1 }}>수정 완료</Btn>
          </div>
        </div>
      </div>
    );
  };

  // ─── Modals ────────────────────────────────────────────
  const renderFixedModal = () => {
    if (!showFixedSetup) return null;
    const total = fixedList.reduce((s, f) => s + f.amount, 0);
    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: "680px", background: T.card, borderRadius: "20px 20px 0 0", padding: "22px 18px", maxHeight: "80vh", overflowY: "auto" }}>
          <div style={{ fontSize: "15px", fontWeight: 700, marginBottom: "14px" }}>고정 지출 편집</div>
          {fixedList.map((f, i) => (
            <div key={f.id} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "9px 0", borderBottom: i < fixedList.length - 1 ? `1px solid ${T.border}` : "none" }}>
              <span style={{ fontSize: "14px" }}>{catEmoji(f.category)}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: "13px", fontWeight: 600 }}>{f.name}</span>
                <div style={{ fontSize: "10px", color: T.sub }}>{f.category}</div>
              </div>
              <span style={{ fontSize: "10px", color: f.person === "shared" ? T.shared : T.sub, background: f.person === "shared" ? "#f3e8ff" : "#f1f5f9", padding: "2px 6px", borderRadius: "4px", fontWeight: 600 }}>{gn(f.person)}</span>
              <span style={{ fontSize: "13px", fontWeight: 700 }}>{fmt(f.amount)}</span>
              <button onClick={() => rmFixed(f.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#cbd5e1", padding: "4px", minWidth: "32px", minHeight: "32px" }}>{I.trash}</button>
            </div>
          ))}
          {fixedList.length > 0 && <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", fontWeight: 700, borderTop: `2px solid ${T.border}`, marginTop: "4px" }}><span>합계</span><span style={{ color: T.exp }}>{fmt(total)}</span></div>}

          <div style={{ marginTop: "14px", padding: "14px", background: "#f8fafc", borderRadius: "12px" }}>
            <div style={{ fontSize: "12px", fontWeight: 600, color: T.sub, marginBottom: "8px" }}>항목 추가</div>
            <div style={{ display: "flex", gap: "6px", marginBottom: "8px" }}>
              <input placeholder="항목명" value={fixForm.name} onChange={e => setFixForm(f => ({ ...f, name: e.target.value }))} style={{ flex: 1, padding: "9px 10px", border: `1.5px solid ${T.border}`, borderRadius: "9px", fontSize: "16px", outline: "none", boxSizing: "border-box" }} />
              <input type="number" inputMode="numeric" placeholder="금액" value={fixForm.amount} onChange={e => setFixForm(f => ({ ...f, amount: e.target.value }))} style={{ width: "100px", padding: "9px 10px", border: `1.5px solid ${T.border}`, borderRadius: "9px", fontSize: "16px", outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ marginBottom: "8px" }}>
              <div style={{ fontSize: "11px", color: T.sub, marginBottom: "4px" }}>카테고리</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                {EXPENSE_CATEGORIES.filter(c => c !== "카드값").map(c => (
                  <Chip key={c} sel={fixForm.category === c} onClick={() => setFixForm(f => ({ ...f, category: c }))}>{catEmoji(c)} {c}</Chip>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: "8px" }}>
              <div style={{ fontSize: "11px", color: T.sub, marginBottom: "4px" }}>누가?</div>
              <div style={{ display: "flex", gap: "6px" }}>
                {[{ k: "p1", l: gn("p1") }, { k: "p2", l: gn("p2") }, { k: "shared", l: "공동" }].map(({ k, l }) => (
                  <Chip key={k} sel={fixForm.person === k} onClick={() => setFixForm(f => ({ ...f, person: k }))}>{l}</Chip>
                ))}
              </div>
            </div>
            <button onClick={addFixed} style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "none", background: T.primary, color: "#fff", fontWeight: 700, fontSize: "13px", cursor: "pointer", minHeight: "44px" }}>추가</button>
          </div>
          <div style={{ marginTop: "14px" }}><Btn onClick={() => setShowFixedSetup(false)}>완료</Btn></div>
        </div>
      </div>
    );
  };

  const renderSettingsModal = () => {
    if (!showSettings) return null;
    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <Card style={{ width: "100%", maxWidth: "360px", margin: 0 }}>
          <div style={{ fontSize: "15px", fontWeight: 700, marginBottom: "18px" }}>이름 설정</div>
          <Inp label="나의 이름" value={editNames.p1} onChange={e => setEditNames(n => ({ ...n, p1: e.target.value }))} placeholder="이름" />
          <Inp label="파트너 이름" value={editNames.p2} onChange={e => setEditNames(n => ({ ...n, p2: e.target.value }))} placeholder="이름" />
          <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
            <Btn outline onClick={() => setShowSettings(false)} style={{ flex: 1 }}>취소</Btn>
            <Btn onClick={saveNames} style={{ flex: 1 }}>저장</Btn>
          </div>
        </Card>
      </div>
    );
  };

  const tabTitle = { home: `${gn("p1")} & ${gn("p2")}의 머니로그 💜`, add: "새 내역 추가", list: "전체 내역", stats: "지출 통계", wallet: "대출 / 투자" };

  return (
    <div className="ml-app" style={{ margin: "0 auto", minHeight: "100vh", background: T.bg, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: T.text, display: "flex", flexDirection: "column" }}>
      <ResponsiveStyles />
      <div style={{ padding: "13px 18px 9px", background: "linear-gradient(135deg, #6366f1, #818cf8)", color: "#fff", position: "sticky", top: 0, zIndex: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div className="ml-header-sub" style={{ opacity: 0.8, letterSpacing: "1px", textTransform: "uppercase", fontWeight: 600 }}>moneylog</div>
          <div className="ml-header-title" style={{ fontWeight: 800, marginTop: "1px" }}>{tabTitle[tab]}</div>
        </div>
        <button onClick={() => { setEditNames({ ...names }); setShowSettings(true); }} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "10px", padding: "8px", cursor: "pointer", color: "#fff", minWidth: "36px", minHeight: "36px", display: "flex", alignItems: "center", justifyContent: "center" }}>{I.settings}</button>
      </div>
      <div style={{ flex: 1, padding: "14px 14px 88px", overflowY: "auto" }}>
        {tab === "home" && renderHome()}
        {tab === "add" && renderAdd()}
        {tab === "list" && renderList()}
        {tab === "stats" && renderStats()}
        {tab === "wallet" && renderWallet()}
      </div>
      <div className="ml-nav" style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", background: "rgba(255,255,255,0.95)", backdropFilter: "blur(10px)", borderTop: `1px solid ${T.border}`, display: "flex", padding: "4px 4px 8px", zIndex: 10 }}>
        {[{ id: "home", icon: I.home, l: "홈" }, { id: "add", icon: I.plus, l: "추가" }, { id: "list", icon: I.list, l: "내역" }, { id: "stats", icon: I.chart, l: "통계" }, { id: "wallet", icon: I.wallet, l: "대출/투자" }].map(({ id: tid, icon, l }) => (
          <button key={tid} onClick={() => setTab(tid)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", padding: "6px 0", background: "none", border: "none", cursor: "pointer", color: tab === tid ? T.primary : T.sub, fontWeight: tab === tid ? 700 : 400, fontSize: "10px" }}>{icon}{l}</button>
        ))}
      </div>
      {renderSettingsModal()}
      {renderFixedModal()}
      {renderEditModal()}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
export default function App() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem("budget_auth") === "true");
  const [loading, setLoading] = useState(true);
  const [initialData, setInitialData] = useState(null);

  useEffect(() => {
    if (!authed) { setLoading(false); return; }
    loadData().then(data => { setInitialData(data || DEFAULT_DATA); setLoading(false); });
  }, [authed]);

  const handleDataChange = useCallback((data) => { saveData(data); }, []);

  if (!authed) return <PinScreen onSuccess={() => { setAuthed(true); setLoading(true); loadData().then(data => { setInitialData(data || DEFAULT_DATA); setLoading(false); }); }} />;
  if (loading || !initialData) return <LoadingScreen />;
  return <MoneyLogApp initialData={initialData} onDataChange={handleDataChange} />;
}
