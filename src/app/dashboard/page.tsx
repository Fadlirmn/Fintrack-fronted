"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Home as HomeIcon,
  BarChart2,
  CalendarDays,
  User as UserIcon,
  Plus,
  LogOut,
  TrendingUp,
  Wallet,
  CheckCircle,
  Copy,
  Brain,
  Award,
  ChevronRight,
  Sun,
  Moon,
  Trash2,
  AlertTriangle,
  Send,
  Zap,
} from "lucide-react";
import { api } from "@/services/api";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];
const IDR_FMT = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
const formatIDR = (v: number) => IDR_FMT.format(v);
const formatShortIDR = (v: number) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}jt` : v >= 1000 ? `${Math.round(v / 1000)}k` : v.toString();
const MONTH_ID = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

// ─────────────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"home"|"analysis"|"calendar"|"profile">("home");
  const [darkMode, setDarkMode] = useState(false);

  // Data
  const [user, setUser] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({ total_spending:0, telegram_spending:0, web_spending:0, categories_breakdown:{}, budget_progress:[] });
  const [fixedExpenses, setFixedExpenses] = useState<any[]>([]);

  // Profile settings
  const [wealthGoal, setWealthGoal] = useState(30);
  const [monthlyIncome, setMonthlyIncome] = useState(10000000);

  // UI state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addDate, setAddDate] = useState(""); // date pre-filled from calendar
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("makanan");
  const [customCategory, setCustomCategory] = useState("");
  const [loading, setLoading] = useState(false);

  // Telegram
  const [linkCode, setLinkCode] = useState("");
  const [linkExpiry, setLinkExpiry] = useState("");
  const [copied, setCopied] = useState(false);

  // Analysis sub-tab
  const [analysisMode, setAnalysisMode] = useState<"charts"|"list">("charts");

  // Calendar
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState<string|null>(null);

  // Fixed expense form
  const [newFeName, setNewFeName] = useState("");
  const [newFeAmount, setNewFeAmount] = useState("");

  // Profile section
  const [profileSection, setProfileSection] = useState<"settings"|"telegram"|"fixed">("settings");

  useEffect(() => {
    setMounted(true);
    const isDark = localStorage.getItem("theme") === "dark" ||
      (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setDarkMode(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  // ── Dark mode toggle ──────────────────────────────────────────────────────
  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  // ── Data loading ──────────────────────────────────────────────────────────
  const fetchAll = async () => {
    try {
      const [me, txs, summ, fes] = await Promise.all([
        api.me(),
        api.getTransactions(),
        api.getDashboardSummary(),
        api.getFixedExpenses(),
      ]);
      setUser(me);
      if (me.monthly_income) setMonthlyIncome(me.monthly_income);
      if (me.wealth_goal) setWealthGoal(me.wealth_goal);
      setTransactions(txs || []);
      setSummary(summ || { total_spending:0, telegram_spending:0, web_spending:0, categories_breakdown:{}, budget_progress:[] });
      setFixedExpenses(fes || []);
    } catch {
      router.push("/");
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // ── Derived calculations ──────────────────────────────────────────────────
  const spendPct = (100 - wealthGoal) / 100;
  const dailyBudget = Math.round((monthlyIncome * spendPct) / 30);
  const activeFixedTotal = fixedExpenses.filter(f => f.is_active).reduce((s: number, f: any) => s + f.amount, 0);

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const weekStartDate = new Date(today); weekStartDate.setDate(today.getDate() - today.getDay());
  const monthStartStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-01`;

  const todaySpend = transactions.filter((t:any) => t.created_at?.split("T")[0] === todayStr).reduce((s:number,t:any) => s+t.amount, 0);
  const weekSpend = transactions.filter((t:any) => t.created_at && new Date(t.created_at) >= weekStartDate).reduce((s:number,t:any) => s+t.amount, 0);
  const monthSpend = transactions.filter((t:any) => t.created_at?.substring(0,7) === todayStr.substring(0,7)).reduce((s:number,t:any) => s+t.amount, 0);

  const dailyDiscretionary = dailyBudget - activeFixedTotal;
  const spendableToday = Math.max(dailyDiscretionary - todaySpend, 0);
  const spendableWeek = Math.max((dailyBudget * 7) - (activeFixedTotal * (today.getDay()+1)) - weekSpend, 0);
  const monthlyBudget = Math.round(monthlyIncome * spendPct);
  const daysInMonth = new Date(today.getFullYear(), today.getMonth()+1, 0).getDate();
  const spendableMonth = Math.max(monthlyBudget - (activeFixedTotal * daysInMonth) - monthSpend, 0);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleLogout = async () => { try { await api.logout(); } catch {} router.push("/"); };

  const handleSaveProfile = async () => {
    setLoading(true);
    try { await api.updateProfile(monthlyIncome, wealthGoal); await fetchAll(); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const openAddModal = (date?: string) => {
    setAddDate(date || todayStr);
    setDesc(""); setAmount(""); setCategory("makanan"); setCustomCategory("");
    setShowAddModal(true);
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc || !amount) return;
    const numAmount = parseInt(amount);
    const catName = category === "other" ? customCategory : category;
    setLoading(true);
    try {
      const dateToSend = addDate !== todayStr ? addDate : undefined;
      await api.createTransaction(desc, numAmount, catName, dateToSend);
      setShowAddModal(false);
      await fetchAll();
    } catch {
      setShowAddModal(false);
    } finally { setLoading(false); }
  };

  const handleDeleteTransaction = async (id: string) => {
    try { await api.deleteTransaction(id); await fetchAll(); }
    catch { setTransactions(transactions.filter((t:any) => t.id !== id)); }
  };

  const handleGenerateCode = async () => {
    setLoading(true);
    try {
      const res = await api.generateLinkCode();
      setLinkCode(res.code);
      setLinkExpiry(new Date(res.expires_at).toLocaleTimeString());
    } catch { setLinkCode("ERR-GEN"); }
    finally { setLoading(false); }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(`/link ${linkCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Fixed expenses handlers
  const handleAddFE = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeName || !newFeAmount) return;
    try { await api.createFixedExpense(newFeName, parseInt(newFeAmount)); setNewFeName(""); setNewFeAmount(""); await fetchAll(); }
    catch (e) { console.error(e); }
  };

  const handleToggleFE = async (id: string, current: boolean) => {
    try { await api.updateFixedExpense(id, { is_active: !current }); await fetchAll(); }
    catch (e) { console.error(e); }
  };

  const handleDeleteFE = async (id: string) => {
    try { await api.deleteFixedExpense(id); await fetchAll(); }
    catch (e) { console.error(e); }
  };

  // ── Calendar helpers ──────────────────────────────────────────────────────
  const calSpendMap = transactions.reduce((map: any, tx: any) => {
    if (tx.created_at) { const d = tx.created_at.split("T")[0]; map[d] = (map[d]||0)+tx.amount; }
    return map;
  }, {});

  const calDays = () => {
    const total = new Date(calYear, calMonth+1, 0).getDate();
    const first = new Date(calYear, calMonth, 1).getDay();
    const days: (number|null)[] = Array(first).fill(null);
    for (let d = 1; d <= total; d++) days.push(d);
    return days;
  };

  // ── Charts data ───────────────────────────────────────────────────────────
  const pieData = Object.entries(summary.categories_breakdown).map(([k,v]:any) => ({ name: k.toUpperCase(), value: v }));

  const lineData = (() => {
    const now = new Date();
    const mm = String(now.getMonth()+1).padStart(2,"0");
    const yy = String(now.getFullYear());
    const map: any = {};
    for (let d=1; d<=now.getDate(); d++) map[`${yy}-${mm}-${String(d).padStart(2,"0")}`] = 0;
    transactions.forEach((tx:any) => {
      const s = tx.created_at?.split("T")[0];
      if (s?.startsWith(`${yy}-${mm}`)) map[s] = (map[s]||0)+tx.amount;
    });
    return Object.keys(map).sort().map(k => ({ name: `${k.split("-")[2]}`, pengeluaran: map[k] }));
  })();

  if (!mounted) return null;

  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="flex-1 flex flex-col pb-20 select-none bg-gray-50 dark:bg-brand-bgDark min-h-screen text-gray-900 dark:text-gray-100 transition-colors duration-300">

      {/* Top Header */}
      <header className="px-6 py-4 flex items-center justify-between bg-white dark:bg-brand-cardDark border-b border-gray-100 dark:border-brand-borderDark shadow-sm sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-brand-accentBlue to-brand-accentGreen flex items-center justify-center text-white font-bold">F</div>
          <span className="font-bold text-lg tracking-wide">FinTrack</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={toggleDark} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-brand-bgDark transition">
            {darkMode ? <Sun className="h-5 w-5 text-yellow-400" /> : <Moon className="h-5 w-5 text-slate-600" />}
          </button>
          <button onClick={handleLogout} className="p-2 rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Telegram banner — hanya jika belum terhubung */}
      {user && !user.telegram_linked && (
        <div
          className="mx-4 mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-2xl flex items-center gap-3 cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-950/50 transition"
          onClick={() => { setActiveTab("profile"); setProfileSection("telegram"); }}
        >
          <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-amber-700 dark:text-amber-400">Bot Telegram belum terhubung</p>
            <p className="text-[10px] text-amber-600/70 dark:text-amber-500/70">Tap untuk hubungkan dan catat via chat →</p>
          </div>
          <Send className="h-4 w-4 text-amber-500 flex-shrink-0" />
        </div>
      )}

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <main className="flex-1 p-4 overflow-y-auto no-scrollbar space-y-4">

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 1: HOME
        ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === "home" && (
          <div className="space-y-4 animate-fadeIn">

            {/* Balance Card */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-brand-cardDark to-slate-900 p-6 text-white shadow-xl border border-slate-800">
              <div className="absolute right-[-40px] top-[-40px] h-32 w-32 rounded-full bg-brand-accentGreen/15 blur-2xl" />
              <div className="absolute left-[-20px] bottom-[-20px] h-28 w-28 rounded-full bg-brand-accentBlue/10 blur-xl" />
              <div className="flex justify-between items-center opacity-85">
                <span className="text-sm font-semibold tracking-wide uppercase text-slate-300">Total Pengeluaran</span>
                <Wallet className="h-5 w-5 text-brand-accentGreen" />
              </div>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight">{formatIDR(summary.total_spending)}</h2>
              <div className="mt-4 grid grid-cols-2 gap-4 pt-4 border-t border-slate-800/80">
                <div>
                  <span className="text-xs text-slate-400 block">💻 Web Input</span>
                  <span className="text-sm font-bold mt-0.5 block">{formatIDR(summary.web_spending)}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">✈️ Telegram Bot</span>
                  <span className="text-sm font-bold mt-0.5 block text-emerald-400">{formatIDR(summary.telegram_spending)}</span>
                </div>
              </div>
            </div>

            {/* Spendable Balance Card */}
            <div className="bg-white dark:bg-brand-cardDark rounded-2xl p-5 border border-gray-100 dark:border-brand-borderDark shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="h-4 w-4 text-brand-accentGreen" />
                <h3 className="font-bold text-sm uppercase tracking-wider text-gray-900 dark:text-white">Saldo Spendable</h3>
                {activeFixedTotal > 0 && (
                  <span className="ml-auto text-[10px] text-gray-400 font-medium">wajib: {formatShortIDR(activeFixedTotal)}/hari</span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Hari Ini", value: spendableToday, sub: `dari ${formatShortIDR(dailyBudget)}`, color: spendableToday < dailyBudget*0.2 ? "text-red-500" : "text-brand-accentGreen" },
                  { label: "Minggu Ini", value: spendableWeek, sub: `sisa`, color: spendableWeek < dailyBudget*0.5 ? "text-amber-500" : "text-blue-500" },
                  { label: "Bulan Ini", value: spendableMonth, sub: `dari ${formatShortIDR(monthlyBudget)}`, color: spendableMonth < monthlyBudget*0.2 ? "text-red-500" : "text-brand-accentGreen" },
                ].map(({ label, value, sub, color }) => (
                  <div key={label} className="bg-gray-50 dark:bg-brand-bgDark rounded-xl p-3 text-center border border-gray-100 dark:border-brand-borderDark/50">
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">{label}</p>
                    <p className={`text-sm font-extrabold mt-1 leading-tight ${color}`}>{formatShortIDR(value)}</p>
                    <p className="text-[9px] text-gray-400 mt-0.5">{sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Budget Progress */}
            {summary.budget_progress.length > 0 && (
              <div className="bg-white dark:bg-brand-cardDark rounded-2xl p-5 border border-gray-100 dark:border-brand-borderDark shadow-sm">
                <h3 className="font-bold text-sm uppercase tracking-wider mb-4">Progres Limit Budget</h3>
                <div className="space-y-4">
                  {summary.budget_progress.map((bp: any, idx: number) => (
                    <div key={idx}>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="capitalize">{bp.category_name}</span>
                        <span className="text-gray-500">{formatIDR(bp.spent)} / {formatIDR(bp.limit)}</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-brand-bgDark h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${bp.percentage > 90 ? "bg-red-500" : bp.percentage > 70 ? "bg-yellow-500" : "bg-brand-accentGreen"}`}
                          style={{ width: `${Math.min(bp.percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Transactions */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <h3 className="font-bold text-sm uppercase tracking-wider">Transaksi Terakhir</h3>
                <span className="text-xs text-brand-accentGreen font-semibold">{transactions.length} total</span>
              </div>
              {transactions.length === 0 ? (
                <div className="bg-white dark:bg-brand-cardDark border border-dashed border-gray-200 dark:border-brand-borderDark rounded-2xl p-8 text-center text-sm text-gray-400">
                  Belum ada pengeluaran. Klik + untuk menambahkan.
                </div>
              ) : (
                transactions.slice(0, 15).map((tx: any) => (
                  <div key={tx.id} className="flex justify-between items-center p-4 bg-white dark:bg-brand-cardDark rounded-2xl border border-gray-100 dark:border-brand-borderDark shadow-sm hover:translate-x-1 transition">
                    <div>
                      <span className="font-bold text-sm block">{tx.description}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] bg-gray-100 dark:bg-brand-bgDark px-2 py-0.5 rounded-full capitalize font-semibold text-gray-600 dark:text-gray-400">{tx.category_name}</span>
                        <span className="text-[10px] text-gray-400">{tx.source === "telegram" ? "via Bot" : "via Web"}</span>
                        <span className="text-[10px] text-gray-300 dark:text-gray-600">{tx.created_at?.split("T")[0]}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-red-500">-{formatIDR(tx.amount)}</span>
                      <button onClick={() => handleDeleteTransaction(tx.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg transition">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 2: ANALYSIS
        ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === "analysis" && (
          <div className="space-y-4 animate-fadeIn">
            {/* Financial IQ */}
            <div className="bg-white dark:bg-brand-cardDark rounded-2xl p-5 border border-gray-100 dark:border-brand-borderDark shadow-sm text-center">
              <h3 className="font-bold text-sm uppercase tracking-wider mb-4">Financial IQ Score</h3>
              <div className="flex flex-col items-center relative py-4">
                <svg className="w-32 h-32">
                  <circle className="text-gray-100 dark:text-brand-bgDark" strokeWidth="10" stroke="currentColor" fill="transparent" r="50" cx="64" cy="64" />
                  <circle className="text-brand-accentGreen" strokeWidth="10" strokeDasharray="314.15" strokeDashoffset={314.15 - (314.15 * Math.min(spendableMonth / monthlyBudget, 1) * 100 / 100)} strokeLinecap="round" stroke="currentColor" fill="transparent" r="50" cx="64" cy="64" />
                </svg>
                <div className="absolute text-center">
                  <span className="text-3xl font-extrabold">{Math.round(Math.min(spendableMonth / Math.max(monthlyBudget,1), 1) * 100)}</span>
                  <span className="block text-[10px] text-gray-400 uppercase font-bold mt-0.5">Score</span>
                </div>
              </div>
              <div className="mt-2 bg-brand-accentGreen/10 p-3 rounded-xl border border-brand-accentGreen/20 flex gap-2.5 items-start text-left">
                <Brain className="h-5 w-5 text-brand-accentGreen flex-shrink-0 mt-0.5" />
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                  Pengeluaran bulan ini {formatIDR(monthSpend)} dari budget {formatIDR(monthlyBudget)}. {spendableMonth > 0 ? `Sisa ${formatIDR(spendableMonth)} — kamu on track! 🎉` : "Budget habis untuk bulan ini. Kurangi pengeluaran non-esensial."}
                </p>
              </div>
            </div>

            {/* Pie Chart */}
            <div className="bg-white dark:bg-brand-cardDark rounded-2xl p-5 border border-gray-100 dark:border-brand-borderDark shadow-sm">
              <h3 className="font-bold text-sm uppercase tracking-wider mb-4">Distribusi Pengeluaran</h3>
              {pieData.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">Belum ada data.</p>
              ) : (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={5} dataKey="value">
                        {pieData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatIDR(v)} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: "10px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Line Chart */}
            <div className="bg-white dark:bg-brand-cardDark rounded-2xl p-5 border border-gray-100 dark:border-brand-borderDark shadow-sm">
              <h3 className="font-bold text-sm uppercase tracking-wider mb-4">Tren Pengeluaran Harian</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineData} margin={{ left: -10, right: 10 }}>
                    <XAxis dataKey="name" stroke="#888" fontSize={9} tickLine={false} />
                    <YAxis stroke="#888" fontSize={9} tickLine={false} tickFormatter={(v:number) => `${v/1000}k`} />
                    <Tooltip formatter={(v:number) => formatIDR(v)} />
                    <Line type="monotone" dataKey="pengeluaran" stroke="#3B82F6" strokeWidth={2} name="Pengeluaran" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 3: KALENDER
        ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === "calendar" && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-white dark:bg-brand-cardDark rounded-3xl p-5 border border-gray-100 dark:border-brand-borderDark shadow-sm">
              {/* Calendar Header */}
              <div className="flex justify-between items-center mb-5 bg-gray-50 dark:bg-brand-bgDark p-3 rounded-2xl border border-gray-100 dark:border-brand-borderDark/40">
                <button onClick={() => { calMonth === 0 ? (setCalMonth(11), setCalYear(y => y-1)) : setCalMonth(m => m-1); setSelectedDate(null); }}
                  className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-brand-cardDark border border-transparent hover:border-gray-200 transition text-gray-500">
                  <ChevronRight className="h-5 w-5 rotate-180" />
                </button>
                <span className="font-extrabold text-sm uppercase tracking-wider">{MONTH_ID[calMonth]} {calYear}</span>
                <button onClick={() => { calMonth === 11 ? (setCalMonth(0), setCalYear(y => y+1)) : setCalMonth(m => m+1); setSelectedDate(null); }}
                  className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-brand-cardDark border border-transparent hover:border-gray-200 transition text-gray-500">
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {["Min","Sen","Sel","Rab","Kam","Jum","Sab"].map((d, i) => (
                  <span key={d} className={`text-[10px] font-extrabold uppercase tracking-wide ${i===0?"text-red-500":"text-gray-400"}`}>{d}</span>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1.5">
                {calDays().map((day, idx) => {
                  if (day === null) return <div key={`e-${idx}`} className="h-14" />;
                  const ds = `${calYear}-${String(calMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                  const spend = calSpendMap[ds] || 0;
                  const isSel = selectedDate === ds;
                  const isToday = ds === todayStr;
                  return (
                    <button key={ds} onClick={() => setSelectedDate(ds)}
                      className={`h-14 flex flex-col justify-between p-1.5 rounded-xl border text-left transition ${
                        isSel ? "bg-gradient-to-tr from-brand-accentGreen to-emerald-600 border-transparent text-white shadow-md scale-[1.02]"
                        : isToday ? "bg-brand-accentBlue/10 border-brand-accentBlue/30 font-extrabold"
                        : "bg-gray-50 dark:bg-brand-bgDark/40 border-gray-100 dark:border-brand-borderDark/40 hover:border-brand-accentGreen/30"
                      }`}>
                      <span className={`text-xs font-bold ${isSel?"text-white":isToday?"text-brand-accentBlue":idx%7===0?"text-red-500":"text-gray-500 dark:text-gray-400"}`}>{day}</span>
                      {spend > 0 && <span className={`text-[9px] font-black truncate w-full ${isSel?"text-white":"text-red-500"}`}>{formatShortIDR(spend)}</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected day detail */}
            {selectedDate && (
              <div className="bg-white dark:bg-brand-cardDark rounded-3xl p-5 border border-gray-100 dark:border-brand-borderDark shadow-sm space-y-3 animate-fadeIn">
                <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-brand-borderDark/50">
                  <div>
                    <p className="text-[10px] uppercase font-extrabold tracking-widest text-gray-400">Tanggal</p>
                    <p className="font-bold text-xs">
                      {selectedDate.split("-")[2]} {MONTH_ID[parseInt(selectedDate.split("-")[1])-1]} {selectedDate.split("-")[0]}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-extrabold tracking-widest text-gray-400">Total</p>
                    <p className="font-extrabold text-sm text-red-500">{formatIDR(calSpendMap[selectedDate]||0)}</p>
                  </div>
                </div>

                {/* Add button for selected date */}
                <button
                  onClick={() => openAddModal(selectedDate)}
                  className="w-full py-2.5 flex items-center justify-center gap-2 bg-brand-accentGreen/10 border border-brand-accentGreen/30 text-brand-accentGreen text-xs font-bold rounded-xl hover:bg-brand-accentGreen/20 transition"
                >
                  <Plus className="h-4 w-4" /> Tambah Pengeluaran di Tanggal Ini
                </button>

                {/* Transactions of selected day */}
                <div className="space-y-2">
                  {transactions.filter((t:any) => t.created_at?.split("T")[0] === selectedDate).length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-3">Tidak ada transaksi pada tanggal ini.</p>
                  ) : (
                    transactions.filter((t:any) => t.created_at?.split("T")[0] === selectedDate).map((tx:any) => (
                      <div key={tx.id} className="flex justify-between items-center p-3.5 bg-gray-50 dark:bg-brand-bgDark/30 border border-gray-100 dark:border-brand-borderDark/30 rounded-2xl">
                        <div className="flex-1 min-w-0">
                          <span className="font-bold text-xs block truncate">{tx.description}</span>
                          <span className="text-[9px] bg-gray-100 dark:bg-brand-bgDark px-2 py-0.5 rounded-full capitalize font-semibold text-gray-500 mt-1 inline-block">{tx.category_name}</span>
                        </div>
                        <div className="flex items-center gap-2 ml-3">
                          <span className="font-extrabold text-xs text-red-500">-{formatIDR(tx.amount)}</span>
                          <button onClick={() => handleDeleteTransaction(tx.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg transition">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 4: PROFILE
        ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === "profile" && (
          <div className="space-y-4 animate-fadeIn">
            {/* User header */}
            <div className="bg-white dark:bg-brand-cardDark rounded-2xl p-5 border border-gray-100 dark:border-brand-borderDark shadow-sm flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-brand-accentBlue to-brand-accentGreen flex items-center justify-center text-white text-2xl font-black flex-shrink-0">
                {user?.email?.charAt(0).toUpperCase() || "S"}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-extrabold text-base truncate">{user?.email || "User FinTrack"}</h3>
                <div className="flex items-center gap-2 mt-1">
                  {user?.telegram_linked ? (
                    <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" /> Telegram Terhubung
                    </span>
                  ) : (
                    <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Telegram Belum Terhubung
                    </span>
                  )}
                  <span className="text-[10px] bg-brand-accentGreen/10 border border-brand-accentGreen/20 text-brand-accentGreen font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Award className="h-3 w-3" /> Gold Hoarder
                  </span>
                </div>
              </div>
            </div>

            {/* Section tabs */}
            <div className="flex bg-white dark:bg-brand-cardDark p-1 rounded-2xl border border-gray-100 dark:border-brand-borderDark shadow-sm gap-1">
              {([["settings","⚙️ Keuangan"],["telegram","✈️ Telegram"],["fixed","🔒 Wajib"]] as const).map(([s, label]) => (
                <button key={s} onClick={() => setProfileSection(s)}
                  className={`flex-1 py-2 text-[11px] font-bold rounded-xl transition ${profileSection===s?"bg-gradient-to-r from-brand-accentGreen to-emerald-600 text-white shadow":"text-gray-500 hover:bg-gray-50 dark:hover:bg-brand-bgDark"}`}>
                  {label}
                </button>
              ))}
            </div>

            {/* ── Financial Settings ── */}
            {profileSection === "settings" && (
              <div className="bg-white dark:bg-brand-cardDark rounded-2xl p-5 border border-gray-100 dark:border-brand-borderDark shadow-sm space-y-4">
                <h3 className="font-bold text-sm uppercase tracking-wider">Pengaturan Keuangan</h3>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Pendapatan Bulanan Bersih (Rp)</label>
                  <input type="number" value={monthlyIncome} onChange={e => setMonthlyIncome(parseInt(e.target.value)||0)}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-brand-borderDark rounded-xl bg-gray-50 dark:bg-brand-bgDark text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-accentGreen/50" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-gray-500">Target Tabungan</label>
                    <span className="text-brand-accentGreen font-extrabold text-xs">{wealthGoal}% ({formatIDR(wealthGoal/100*monthlyIncome)})</span>
                  </div>
                  <input type="range" min="10" max="80" value={wealthGoal} onChange={e => setWealthGoal(parseInt(e.target.value))}
                    className="w-full accent-brand-accentGreen h-1.5 bg-gray-100 dark:bg-brand-bgDark rounded-lg appearance-none cursor-pointer" />
                </div>
                <div className="pt-3 border-t border-gray-100 dark:border-brand-borderDark text-xs text-gray-500 space-y-2">
                  <div className="flex justify-between">
                    <span>Budget pengeluaran ({100-wealthGoal}%):</span>
                    <span className="font-bold text-gray-700 dark:text-slate-200">{formatIDR((100-wealthGoal)/100*monthlyIncome)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Budget harian:</span>
                    <span className="font-bold text-brand-accentGreen">{formatIDR(dailyBudget)}</span>
                  </div>
                </div>
                <button onClick={handleSaveProfile} disabled={loading}
                  className="w-full py-2.5 bg-gradient-to-r from-brand-accentGreen to-emerald-600 text-white text-xs font-bold rounded-xl shadow-md hover:brightness-105 transition disabled:opacity-50">
                  {loading ? "Menyimpan..." : "Simpan Pengaturan"}
                </button>
              </div>
            )}

            {/* ── Telegram Section ── */}
            {profileSection === "telegram" && (
              <div className="space-y-4">
                <div className="bg-white dark:bg-brand-cardDark rounded-2xl p-5 border border-gray-100 dark:border-brand-borderDark shadow-sm text-center">
                  <h3 className="font-bold text-sm uppercase tracking-wider mb-2">Tautkan Bot Telegram</h3>
                  <p className="text-xs text-gray-500 mb-5 leading-relaxed">Catat pengeluaran langsung via chat Telegram — cepat, tanpa buka browser.</p>

                  {user?.telegram_linked ? (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 rounded-xl flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-4">
                      <CheckCircle className="h-4 w-4" /> Terhubung — Chat ID: {user.telegram_chat_id}
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900 rounded-xl flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-semibold mb-4">
                      <AlertTriangle className="h-4 w-4" /> Belum terhubung
                    </div>
                  )}

                  {linkCode ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-gray-50 dark:bg-brand-bgDark border border-gray-100 dark:border-brand-borderDark rounded-xl inline-flex flex-col items-center">
                        <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Kode Verifikasi</span>
                        <span className="text-3xl font-extrabold tracking-widest text-brand-accentGreen mt-1 select-all">{linkCode}</span>
                        <span className="text-[10px] text-red-500 font-semibold mt-2">Kedaluwarsa pukul {linkExpiry}</span>
                      </div>
                      <div className="flex gap-2 justify-center">
                        <button onClick={copyCode} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-accentGreen to-emerald-600 text-white text-xs font-bold rounded-xl shadow-md hover:brightness-105 transition">
                          <Copy className="h-4 w-4" /> {copied ? "Tersalin!" : "Salin Perintah Bot"}
                        </button>
                        <button onClick={() => setLinkCode("")} className="px-4 py-2 border border-gray-200 dark:border-brand-borderDark text-xs font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-brand-bgDark transition">
                          Kembali
                        </button>
                      </div>
                      {copied && <p className="text-[10px] text-brand-accentGreen font-semibold animate-pulse">Buka bot Telegram dan paste: /link {linkCode}</p>}
                    </div>
                  ) : (
                    <button onClick={handleGenerateCode} disabled={loading}
                      className="w-full py-2.5 bg-gradient-to-r from-brand-accentGreen to-emerald-600 text-white text-xs font-bold rounded-xl shadow-md hover:brightness-105 transition">
                      {loading ? "Membuat kode..." : "Generate Kode Tautan Baru"}
                    </button>
                  )}
                </div>

                {/* Panduan Bot */}
                <div className="bg-white dark:bg-brand-cardDark rounded-2xl p-5 border border-gray-100 dark:border-brand-borderDark shadow-sm">
                  <h3 className="font-bold text-sm uppercase tracking-wider mb-4">Panduan Perintah Bot</h3>
                  <div className="space-y-3 text-xs">
                    {[
                      { cmd: "Beli kopi 25000 #makanan", desc: "Catat pengeluaran dengan kategori" },
                      { cmd: "Isi bensin 30000", desc: "Tanpa kategori (auto: uncategorized)" },
                      { cmd: "/saldo", desc: "Lihat saldo spendable hari/minggu/bulan" },
                      { cmd: "/summary", desc: "Rekap pengeluaran bulan ini" },
                      { cmd: "/menu", desc: "Tampilkan semua perintah" },
                    ].map(({ cmd, desc }) => (
                      <div key={cmd} className="flex flex-col gap-1 p-3 bg-gray-50 dark:bg-brand-bgDark border border-gray-100 dark:border-brand-borderDark rounded-xl">
                        <code className="text-brand-accentGreen font-bold bg-gray-100 dark:bg-slate-900 px-2 py-1 rounded w-fit">{cmd}</code>
                        <span className="text-gray-500 text-[11px]">{desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Fixed Expenses ── */}
            {profileSection === "fixed" && (
              <div className="space-y-4">
                <div className="bg-white dark:bg-brand-cardDark rounded-2xl p-5 border border-gray-100 dark:border-brand-borderDark shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-sm uppercase tracking-wider">Pengeluaran Wajib Harian</h3>
                    <span className="text-xs font-bold text-brand-accentGreen">Total aktif: {formatShortIDR(activeFixedTotal)}/hari</span>
                  </div>
                  <p className="text-[11px] text-gray-400 mb-4">Toggle 🔴 untuk nonaktifkan sementara (libur/WFH). Ini digunakan untuk kalkulasi saldo spendable.</p>

                  {/* Add form */}
                  <form onSubmit={handleAddFE} className="flex gap-2 mb-4">
                    <input type="text" placeholder="Nama (bensin)" value={newFeName} onChange={e => setNewFeName(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-200 dark:border-brand-borderDark rounded-xl bg-gray-50 dark:bg-brand-bgDark text-xs focus:outline-none focus:ring-2 focus:ring-brand-accentGreen/50" />
                    <input type="number" placeholder="Nominal" value={newFeAmount} onChange={e => setNewFeAmount(e.target.value)}
                      className="w-28 px-3 py-2 border border-gray-200 dark:border-brand-borderDark rounded-xl bg-gray-50 dark:bg-brand-bgDark text-xs focus:outline-none focus:ring-2 focus:ring-brand-accentGreen/50" />
                    <button type="submit" className="px-3 py-2 bg-brand-accentGreen text-white text-xs font-bold rounded-xl hover:brightness-105 transition">
                      <Plus className="h-4 w-4" />
                    </button>
                  </form>

                  {/* List */}
                  <div className="space-y-2">
                    {fixedExpenses.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-3">Belum ada pengeluaran wajib. Tambahkan di atas.</p>
                    ) : (
                      fixedExpenses.map((fe: any) => (
                        <div key={fe.id} className={`flex items-center gap-3 p-3 rounded-xl border transition ${fe.is_active ? "bg-gray-50 dark:bg-brand-bgDark border-gray-100 dark:border-brand-borderDark/50" : "bg-gray-50/50 dark:bg-brand-bgDark/30 border-dashed border-gray-200 dark:border-brand-borderDark/30 opacity-60"}`}>
                          <div className="flex-1 min-w-0">
                            <span className={`text-xs font-bold block ${!fe.is_active ? "line-through text-gray-400" : ""}`}>{fe.name}</span>
                            <span className="text-[10px] text-gray-400">{formatIDR(fe.amount)}/hari</span>
                          </div>
                          <button onClick={() => handleToggleFE(fe.id, fe.is_active)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition ${fe.is_active ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 border-emerald-200 dark:border-emerald-800 hover:bg-red-50 hover:text-red-500 hover:border-red-200" : "bg-gray-100 dark:bg-brand-bgDark text-gray-400 border-gray-200 dark:border-brand-borderDark hover:bg-emerald-50 hover:text-emerald-600"}`}>
                            {fe.is_active ? "Aktif" : "OFF"}
                          </button>
                          <button onClick={() => handleDeleteFE(fe.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg transition">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Gamification */}
                <div className="bg-white dark:bg-brand-cardDark rounded-2xl p-5 border border-gray-100 dark:border-brand-borderDark shadow-sm">
                  <h3 className="font-bold text-sm uppercase tracking-wider mb-4">Financial Skill Tree</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: TrendingUp, label: "Budgeting", lvl: "LVL 4", color: "bg-indigo-500/10 text-indigo-500" },
                      { icon: Award, label: "Hoarding", lvl: "LVL 7 Master", color: "bg-amber-500/10 text-amber-500" },
                      { icon: Brain, label: "AI Advisor", lvl: "LVL 1 Unlocked", color: "bg-emerald-500/10 text-emerald-500" },
                      { icon: Zap, label: "Wealth Builder", lvl: "Locked", color: "bg-gray-500/10 text-gray-400", locked: true },
                    ].map(({ icon: Icon, label, lvl, color, locked }) => (
                      <div key={label} className={`p-3 bg-gray-50 dark:bg-brand-bgDark border border-gray-100 dark:border-brand-borderDark rounded-xl flex items-center gap-2.5 ${locked?"opacity-40":""}`}>
                        <div className={`h-8 w-8 rounded-lg ${color} flex items-center justify-center flex-shrink-0`}><Icon className="h-4 w-4" /></div>
                        <div>
                          <span className="text-[10px] font-bold block">{label}</span>
                          <span className="text-[9px] text-gray-400">{lvl}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── FAB Add (Home & Calendar) ─────────────────────────────────────── */}
      {(activeTab === "home" || activeTab === "calendar") && (
        <button
          onClick={() => openAddModal(activeTab === "calendar" && selectedDate ? selectedDate : todayStr)}
          className="fixed bottom-24 right-1/2 translate-x-[200px] h-12 w-12 rounded-full bg-gradient-to-tr from-brand-accentGreen to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-brand-accentGreen/20 hover:scale-105 active:scale-95 transition-all z-40 border border-emerald-500/30"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}

      {/* ── Bottom Nav ───────────────────────────────────────────────────── */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] h-16 bg-white/95 dark:bg-brand-cardDark/95 backdrop-blur-md border-t border-gray-100 dark:border-brand-borderDark flex justify-around items-center z-40 transition-colors">
        {([
          ["home", HomeIcon, "Home"],
          ["analysis", BarChart2, "Analisis"],
          ["calendar", CalendarDays, "Kalender"],
          ["profile", UserIcon, "Profil"],
        ] as const).map(([tab, Icon, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab as any)}
            className={`flex flex-col items-center gap-1 relative ${activeTab===tab?"text-brand-accentGreen":"text-gray-400"}`}>
            <Icon className="h-5 w-5" />
            <span className="text-[9px] font-bold tracking-wide">{label}</span>
            {tab === "profile" && user && !user.telegram_linked && (
              <span className="absolute -top-1 -right-1 h-2 w-2 bg-amber-500 rounded-full animate-pulse" />
            )}
          </button>
        ))}
      </nav>

      {/* ── Add Expense Modal ─────────────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50 animate-fadeIn">
          <div className="absolute inset-0" onClick={() => setShowAddModal(false)} />
          <div className="relative w-full max-w-[480px] bg-white dark:bg-brand-cardDark border-t border-gray-100 dark:border-brand-borderDark/80 rounded-t-3xl p-6 shadow-2xl z-10">
            <div className="w-12 h-1 bg-gray-200 dark:bg-brand-borderDark rounded-full mx-auto mb-5" />
            <div className="flex justify-between items-center mb-5">
              <div>
                <h3 className="font-extrabold text-base">Tambah Pengeluaran</h3>
                {addDate !== todayStr && (
                  <p className="text-[11px] text-brand-accentGreen font-semibold mt-0.5">
                    📅 Tanggal: {addDate.split("-")[2]} {MONTH_ID[parseInt(addDate.split("-")[1])-1]} {addDate.split("-")[0]}
                  </p>
                )}
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-xs font-semibold text-gray-400 hover:text-gray-600">Batal</button>
            </div>

            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Deskripsi</label>
                <input type="text" required placeholder="Beli kopi starbucks" value={desc} onChange={e => setDesc(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-brand-borderDark rounded-xl bg-gray-50 dark:bg-brand-bgDark text-sm focus:outline-none focus:ring-2 focus:ring-brand-accentGreen/50 transition" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Nominal (Rp)</label>
                <input type="number" required placeholder="45000" value={amount} onChange={e => setAmount(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-brand-borderDark rounded-xl bg-gray-50 dark:bg-brand-bgDark text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-accentGreen/50 transition" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Kategori</label>
                <div className="grid grid-cols-3 gap-2">
                  {["makanan","transportasi","hiburan","belanja","tagihan"].map(cat => (
                    <button key={cat} type="button" onClick={() => setCategory(cat)}
                      className={`py-2 px-1 border rounded-xl text-xs font-semibold capitalize transition ${category===cat?"border-brand-accentGreen bg-brand-accentGreen/10 text-brand-accentGreen":"border-gray-200 dark:border-brand-borderDark bg-gray-50 dark:bg-brand-bgDark text-gray-600 dark:text-gray-400"}`}>
                      {cat}
                    </button>
                  ))}
                  <button type="button" onClick={() => setCategory("other")}
                    className={`py-2 px-1 border rounded-xl text-xs font-semibold capitalize transition ${category==="other"?"border-brand-accentGreen bg-brand-accentGreen/10 text-brand-accentGreen":"border-gray-200 dark:border-brand-borderDark bg-gray-50 dark:bg-brand-bgDark text-gray-600 dark:text-gray-400"}`}>
                    Lainnya
                  </button>
                </div>
              </div>
              {category === "other" && (
                <input type="text" required placeholder="Nama kategori kustom" value={customCategory} onChange={e => setCustomCategory(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-brand-borderDark rounded-xl bg-gray-50 dark:bg-brand-bgDark text-sm focus:outline-none focus:ring-2 focus:ring-brand-accentGreen/50 transition" />
              )}
              <button type="submit" disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-brand-accentGreen to-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-brand-accentGreen/20 hover:brightness-105 transition mt-2 disabled:opacity-50">
                {loading ? "Menyimpan..." : "Simpan Transaksi"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
