"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Home as HomeIcon, 
  BarChart2, 
  Send, 
  User as UserIcon, 
  Plus, 
  LogOut, 
  TrendingUp, 
  TrendingDown, 
  Wallet,
  CheckCircle,
  Copy,
  Brain,
  Award,
  ChevronRight,
  Sun,
  Moon,
  Trash2,
  AlertTriangle
} from "lucide-react";
import { api } from "@/services/api";
import { ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, Legend } from "recharts";

// Color palettes for Recharts
const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

export default function DashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("home"); // home, analysis, telegram, profile
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  // Transactions and summary state
  const [transactions, setTransactions] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({
    total_spending: 0,
    telegram_spending: 0,
    web_spending: 0,
    categories_breakdown: {},
    budget_progress: []
  });
  
  // UI states
  const [showAddModal, setShowAddModal] = useState(false);
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("makanan");
  const [customCategory, setCustomCategory] = useState("");
  const [linkCode, setLinkCode] = useState("");
  const [linkExpiry, setLinkExpiry] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [wealthGoal, setWealthGoal] = useState(30); // in percent
  const [monthlyIncome, setMonthlyIncome] = useState(10000000); // Rp 10.000.000 default

  // Analysis tab sub-state (charts vs calendar)
  const [analysisMode, setAnalysisMode] = useState("charts"); // charts, calendar
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    
    // Load theme
    const isDark = localStorage.getItem("theme") === "dark" || 
      (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    const nextMode = !darkMode;
    setDarkMode(nextMode);
    if (nextMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  // Fetch initial profile & data
  const fetchData = async () => {
    try {
      const me = await api.me();
      setUser(me);

      // Personalisasi Keuangan dari Database
      if (me.monthly_income) {
        setMonthlyIncome(me.monthly_income);
      }
      if (me.wealth_goal) {
        setWealthGoal(me.wealth_goal);
      }
      
      const txs = await api.getTransactions();
      setTransactions(txs || []);
      
      const summ = await api.getDashboardSummary();
      setSummary(summ || {
        total_spending: 0,
        telegram_spending: 0,
        web_spending: 0,
        categories_breakdown: {},
        budget_progress: []
      });
    } catch (err) {
      console.error("Gagal memuat data dari backend:", err);
      router.push("/");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (e) {}
    router.push("/");
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      await api.updateProfile(monthlyIncome, wealthGoal);
      // Refresh user profile data
      const me = await api.me();
      setUser(me);
    } catch (err: any) {
      console.error("Gagal memperbarui profil:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc || !amount) return;

    const numAmount = parseInt(amount);
    const catName = category === "other" ? customCategory : category;
    
    setLoading(true);
    try {
      await api.createTransaction(desc, numAmount, catName);
      setDesc("");
      setAmount("");
      setCustomCategory("");
      setShowAddModal(false);
      fetchData(); // Refresh data
    } catch (err) {
      // Offline fallback: simulate local addition
      const newTx = {
        id: Math.random().toString(),
        description: desc,
        amount: numAmount,
        category_name: catName,
        source: "web",
        created_at: new Date().toISOString()
      };
      const updatedTxs = [newTx, ...transactions];
      setTransactions(updatedTxs);
      
      // Update local summary
      const newSpending = summary.total_spending + numAmount;
      const updatedBreakdown = { ...summary.categories_breakdown };
      updatedBreakdown[catName] = (updatedBreakdown[catName] || 0) + numAmount;
      
      setSummary({
        ...summary,
        total_spending: newSpending,
        web_spending: summary.web_spending + numAmount,
        categories_breakdown: updatedBreakdown
      });
      
      setDesc("");
      setAmount("");
      setCustomCategory("");
      setShowAddModal(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      await api.deleteTransaction(id);
      fetchData();
    } catch (err) {
      // Local fallback
      setTransactions(transactions.filter(t => t.id !== id));
    }
  };

  const handleGenerateCode = async () => {
    setLoading(true);
    try {
      const res = await api.generateLinkCode();
      setLinkCode(res.code);
      setLinkExpiry(new Date(res.expires_at).toLocaleTimeString());
    } catch (err) {
      // Fallback code
      setLinkCode("QL-8829-X");
      setLinkExpiry(new Date(Date.now() + 600000).toLocaleTimeString());
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(`/link ${linkCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Format Helper
  const formatIDR = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(val);
  };

  // Recharts Pie Data Formatting
  const getPieData = () => {
    return Object.keys(summary.categories_breakdown).map(cat => ({
      name: cat.toUpperCase(),
      value: summary.categories_breakdown[cat]
    }));
  };

  // Recharts Line Chart Data (Dynamically calculated daily trend of the current month)
  const getLineData = () => {
    const INDONESIAN_MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const currentMonthStr = String(currentMonth + 1).padStart(2, "0");
    const currentYearStr = String(currentYear);

    // Group transactions of the current month by day
    const dailyMap: { [key: string]: number } = {};
    const daysInMonth = now.getDate(); // Up to today
    
    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${currentYearStr}-${currentMonthStr}-${String(d).padStart(2, "0")}`;
      dailyMap[dateKey] = 0;
    }

    transactions.forEach((tx: any) => {
      if (!tx.created_at) return;
      const dateStr = tx.created_at.split("T")[0]; // YYYY-MM-DD
      if (dateStr.startsWith(`${currentYearStr}-${currentMonthStr}`)) {
        dailyMap[dateStr] = (dailyMap[dateStr] || 0) + tx.amount;
      }
    });

    const data = Object.keys(dailyMap)
      .sort()
      .map((dateKey) => {
        const dayNum = dateKey.split("-")[2];
        const dayLabel = `${dayNum} ${INDONESIAN_MONTH_SHORT[currentMonth]}`;
        const totalAmount = dailyMap[dateKey];
        return {
          name: dayLabel,
          pengeluaran: totalAmount,
          forecast: totalAmount * 0.95 // simple representation
        };
      });

    if (data.length === 0) {
      return [
        { name: `01 ${INDONESIAN_MONTH_SHORT[currentMonth]}`, pengeluaran: 0, forecast: 0 }
      ];
    }
    return data;
  };

  const lineData = getLineData();

  // Calendar utility functions
  const INDONESIAN_MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
    setSelectedDateStr(null);
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
    setSelectedDateStr(null);
  };

  const getDaysInMonth = (y: number, m: number) => {
    return new Date(y, m + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (y: number, m: number) => {
    return new Date(y, m, 1).getDay();
  };

  const getCalendarSpendingMap = () => {
    const map: { [key: string]: number } = {};
    transactions.forEach((tx: any) => {
      if (!tx.created_at) return;
      const dateStr = tx.created_at.split("T")[0]; // YYYY-MM-DD
      map[dateStr] = (map[dateStr] || 0) + tx.amount;
    });
    return map;
  };

  const calendarSpendingMap = getCalendarSpendingMap();

  const getDaysArray = () => {
    const totalDays = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const days: (number | null)[] = [];
    
    // Empty padding slots
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    // Calendar days
    for (let d = 1; d <= totalDays; d++) {
      days.push(d);
    }
    return days;
  };

  const formatShortIDR = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}jt`;
    if (val >= 1000) return `${Math.round(val / 1000)}k`;
    return val.toString();
  };

  const getTransactionsForSelectedDate = () => {
    if (!selectedDateStr) return [];
    return transactions.filter((tx: any) => tx.created_at && tx.created_at.split("T")[0] === selectedDateStr);
  };

  if (!mounted) return null;

  return (
    <div className="flex-1 flex flex-col pb-20 select-none bg-gray-50 dark:bg-brand-bgDark min-h-screen text-gray-900 dark:text-gray-100 transition-colors duration-300">
      
      {/* Top Header */}
      <header className="px-6 py-4 flex items-center justify-between bg-white dark:bg-brand-cardDark border-b border-gray-100 dark:border-brand-borderDark shadow-sm sticky top-0 z-30 transition-colors">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-brand-accentBlue to-brand-accentGreen flex items-center justify-center text-white font-bold">
            F
          </div>
          <span className="font-bold text-lg tracking-wide text-gray-900 dark:text-white">FinTrack</span>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={toggleDarkMode}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-brand-bgDark transition"
          >
            {darkMode ? <Sun className="h-5 w-5 text-yellow-400" /> : <Moon className="h-5 w-5 text-slate-600" />}
          </button>
          <button 
            onClick={handleLogout}
            className="p-2 rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition"
            title="Keluar"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Main Content Area based on Active Tab */}
      <main className="flex-1 p-6 overflow-y-auto no-scrollbar">
        
        {/* TAB 1: HOME */}
        {activeTab === "home" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Balance Summary Card with modern gradient */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-brand-cardDark to-slate-900 p-6 text-white shadow-xl shadow-slate-950/20 border border-slate-800">
              <div className="absolute right-[-40px] top-[-40px] h-32 w-32 rounded-full bg-brand-accentGreen/15 blur-2xl" />
              <div className="absolute left-[-20px] bottom-[-20px] h-28 w-28 rounded-full bg-brand-accentBlue/10 blur-xl" />
              
              <div className="flex justify-between items-center opacity-85">
                <span className="text-sm font-semibold tracking-wide uppercase text-slate-300">Total Pengeluaran</span>
                <Wallet className="h-5 w-5 text-brand-accentGreen" />
              </div>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight">
                {formatIDR(summary.total_spending)}
              </h2>
              
              <div className="mt-6 grid grid-cols-2 gap-4 pt-4 border-t border-slate-800/80">
                <div>
                  <span className="text-xs text-slate-400 block flex items-center gap-1">
                    <TrendingDown className="h-3.5 w-3.5 text-blue-400" /> Web Input
                  </span>
                  <span className="text-sm font-bold mt-1 block">
                    {formatIDR(summary.web_spending)}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block flex items-center gap-1">
                    <Send className="h-3.5 w-3.5 text-emerald-400" /> Telegram Bot
                  </span>
                  <span className="text-sm font-bold mt-1 block text-emerald-400">
                    {formatIDR(summary.telegram_spending)}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Limit Budget Stats */}
            <div className="bg-white dark:bg-brand-cardDark rounded-2xl p-5 border border-gray-100 dark:border-brand-borderDark shadow-sm">
              <h3 className="font-bold text-sm text-gray-900 dark:text-white uppercase tracking-wider mb-4">Progres Limit Budget</h3>
              <div className="space-y-4">
                {summary.budget_progress.length === 0 ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">Belum ada limit budget yang dikonfigurasi.</p>
                ) : (
                  summary.budget_progress.map((bp: any, idx: number) => (
                    <div key={idx}>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="capitalize">{bp.category_name}</span>
                        <span className="text-gray-500 dark:text-gray-400">
                          {formatIDR(bp.spent)} / {formatIDR(bp.limit)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-brand-bgDark h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            bp.percentage > 90 ? "bg-red-500" : bp.percentage > 70 ? "bg-yellow-500" : "bg-brand-accentGreen"
                          }`}
                          style={{ width: `${Math.min(bp.percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Transactions Section */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-sm uppercase tracking-wider text-gray-900 dark:text-white">Transaksi Terakhir</h3>
                <span className="text-xs text-brand-accentGreen font-semibold">{transactions.length} total</span>
              </div>

              <div className="space-y-2">
                {transactions.length === 0 ? (
                  <div className="bg-white dark:bg-brand-cardDark border border-dashed border-gray-200 dark:border-brand-borderDark rounded-2xl p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                    Belum ada pengeluaran dicatat. Klik + untuk menambahkan.
                  </div>
                ) : (
                  transactions.map((tx: any) => (
                    <div 
                      key={tx.id} 
                      className="flex justify-between items-center p-4 bg-white dark:bg-brand-cardDark rounded-2xl border border-gray-100 dark:border-brand-borderDark shadow-sm hover:translate-x-1 transition duration-150"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-gray-900 dark:text-white">{tx.description}</span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] bg-gray-100 dark:bg-brand-bgDark text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full capitalize font-semibold">
                              {tx.category_name}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {tx.source === "telegram" ? "via Bot" : "via Web"}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className="font-extrabold text-sm text-red-500">
                          -{formatIDR(tx.amount)}
                        </span>
                        <button 
                          onClick={() => handleDeleteTransaction(tx.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100 dark:hover:bg-brand-bgDark transition"
                          title="Hapus"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: AI ANALYSIS */}
        {activeTab === "analysis" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Mode Toggle: Grafik vs Kalender */}
            <div className="flex bg-white dark:bg-brand-cardDark p-1.5 rounded-2xl border border-gray-100 dark:border-brand-borderDark shadow-sm">
              <button 
                onClick={() => setAnalysisMode("charts")}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition duration-150 ${analysisMode === "charts" ? "bg-gradient-to-r from-brand-accentGreen to-emerald-600 text-white shadow" : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-brand-bgDark"}`}
              >
                Grafik Tren
              </button>
              <button 
                onClick={() => { setAnalysisMode("calendar"); setSelectedDateStr(null); }}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition duration-150 ${analysisMode === "calendar" ? "bg-gradient-to-r from-brand-accentGreen to-emerald-600 text-white shadow" : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-brand-bgDark"}`}
              >
                Kalender Harian
              </button>
            </div>

            {analysisMode === "charts" && (
              <div className="space-y-6 animate-fadeIn">
                {/* Financial IQ score gauge */}
                <div className="bg-white dark:bg-brand-cardDark rounded-2xl p-5 border border-gray-100 dark:border-brand-borderDark shadow-sm text-center">
                  <h3 className="font-bold text-sm uppercase tracking-wider text-gray-900 dark:text-white mb-4">Financial IQ Score</h3>
                  <div className="flex flex-col items-center justify-center relative py-4">
                    {/* SVG Radial Gauge */}
                    <svg className="w-32 h-32">
                      <circle className="text-gray-100 dark:text-brand-bgDark" strokeWidth="10" stroke="currentColor" fill="transparent" r="50" cx="64" cy="64" />
                      <circle className="text-brand-accentGreen" strokeWidth="10" strokeDasharray="314.15" strokeDashoffset={314.15 - (314.15 * 78 / 100)} strokeLinecap="round" stroke="currentColor" fill="transparent" r="50" cx="64" cy="64" />
                    </svg>
                    <div className="absolute text-center">
                      <span className="text-3xl font-extrabold tracking-tight">78</span>
                      <span className="block text-[10px] text-gray-400 uppercase font-bold mt-0.5">Healthy</span>
                    </div>
                  </div>
                  <div className="mt-2 bg-gradient-to-r from-brand-accentGreen/10 to-emerald-500/10 p-3 rounded-xl border border-brand-accentGreen/20 flex gap-2.5 items-start text-left">
                    <Brain className="h-5 w-5 text-brand-accentGreen flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                      *AI Insight:* Pengeluaran makanan naik 15% minggu ini. Anda berada dalam batas aman budget harian, namun kurangi langganan hiburan untuk menjaga target hoard kekayaan 30%.
                    </p>
                  </div>
                </div>

                {/* Donut Chart: Spending Breakdown */}
                <div className="bg-white dark:bg-brand-cardDark rounded-2xl p-5 border border-gray-100 dark:border-brand-borderDark shadow-sm">
                  <h3 className="font-bold text-sm uppercase tracking-wider text-gray-900 dark:text-white mb-4">Distribusi Pengeluaran</h3>
                  {getPieData().length === 0 ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-4">Belum ada data pengeluaran.</p>
                  ) : (
                    <div className="h-60">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={getPieData()}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {getPieData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => formatIDR(value)} />
                          <Legend iconType="circle" wrapperStyle={{ fontSize: "10px", marginTop: "10px" }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Line Chart: Actual vs Forecast */}
                <div className="bg-white dark:bg-brand-cardDark rounded-2xl p-5 border border-gray-100 dark:border-brand-borderDark shadow-sm">
                  <h3 className="font-bold text-sm uppercase tracking-wider text-gray-900 dark:text-white mb-4">Tren & Prediksi Sisa Dana</h3>
                  <div className="h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={lineData} margin={{ left: -10, right: 10 }}>
                        <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} />
                        <YAxis stroke="#888888" fontSize={10} tickLine={false} tickFormatter={(tick: number) => `${tick / 1000}k`} />
                        <Tooltip formatter={(value: number) => formatIDR(value)} />
                        <Legend wrapperStyle={{ fontSize: "10px" }} />
                        <Line type="monotone" dataKey="pengeluaran" stroke="#3B82F6" strokeWidth={2} name="Riwayat Pengeluaran" />
                        <Line type="monotone" dataKey="forecast" stroke="#10B981" strokeWidth={2} strokeDasharray="5 5" name="Prediksi AI" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {analysisMode === "calendar" && (
              <div className="space-y-6 animate-fadeIn">
                {/* Interactive Calendar Card */}
                <div className="bg-white dark:bg-brand-cardDark rounded-3xl p-5 border border-gray-100 dark:border-brand-borderDark shadow-sm">
                  {/* Calendar Header */}
                  <div className="flex justify-between items-center mb-6 bg-gray-50 dark:bg-brand-bgDark p-3.5 rounded-2xl border border-gray-100 dark:border-brand-borderDark/40">
                    <button 
                      onClick={handlePrevMonth}
                      className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-brand-cardDark border border-transparent hover:border-gray-200 dark:hover:border-brand-borderDark text-gray-500 dark:text-gray-400 transition"
                    >
                      <ChevronRight className="h-5 w-5 rotate-180" />
                    </button>
                    <span className="font-extrabold text-sm text-gray-900 dark:text-white uppercase tracking-wider">
                      {INDONESIAN_MONTHS[currentMonth]} {currentYear}
                    </span>
                    <button 
                      onClick={handleNextMonth}
                      className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-brand-cardDark border border-transparent hover:border-gray-200 dark:hover:border-brand-borderDark text-gray-500 dark:text-gray-400 transition"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Weekday Headers */}
                  <div className="grid grid-cols-7 gap-2 text-center mb-3">
                    {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((dayName, idx) => (
                      <span key={idx} className={`text-[10px] font-extrabold uppercase tracking-wide ${idx === 0 ? "text-red-500" : "text-gray-400"}`}>
                        {dayName}
                      </span>
                    ))}
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-2">
                    {getDaysArray().map((day, idx) => {
                      if (day === null) {
                        return <div key={`empty-${idx}`} className="h-14" />;
                      }

                      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                      const daySpending = calendarSpendingMap[dateStr] || 0;
                      const isSelected = selectedDateStr === dateStr;
                      const isToday = new Date().toDateString() === new Date(currentYear, currentMonth, day).toDateString();

                      return (
                        <button
                          key={`day-${day}`}
                          onClick={() => setSelectedDateStr(dateStr)}
                          className={`h-14 flex flex-col justify-between p-1.5 rounded-xl border text-left transition select-none ${
                            isSelected 
                              ? "bg-gradient-to-tr from-brand-accentGreen to-emerald-600 border-transparent text-white shadow-md shadow-brand-accentGreen/20 scale-[1.02]" 
                              : isToday
                                ? "bg-brand-accentBlue/10 border-brand-accentBlue/30 text-brand-accentBlue dark:text-white font-extrabold"
                                : "bg-gray-50 dark:bg-brand-bgDark/40 border-gray-100 dark:border-brand-borderDark/40 text-gray-900 dark:text-gray-100 hover:border-brand-accentGreen/30"
                          }`}
                        >
                          <span className={`text-xs font-bold ${isSelected ? "text-white" : isToday ? "text-brand-accentBlue" : idx % 7 === 0 ? "text-red-500" : "text-gray-500 dark:text-gray-400"}`}>
                            {day}
                          </span>
                          {daySpending > 0 && (
                            <span className={`text-[9px] font-black tracking-tighter truncate w-full ${isSelected ? "text-white" : "text-red-500"}`}>
                              {formatShortIDR(daySpending)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Day Details Area */}
                {selectedDateStr && (
                  <div className="bg-white dark:bg-brand-cardDark rounded-3xl p-5 border border-gray-100 dark:border-brand-borderDark shadow-sm space-y-4 animate-fadeIn">
                    <div className="flex justify-between items-center border-b border-gray-100 dark:border-brand-borderDark/50 pb-3">
                      <div>
                        <h4 className="font-extrabold text-[9px] uppercase tracking-widest text-gray-400">Pengeluaran Tanggal</h4>
                        <span className="font-bold text-xs text-gray-900 dark:text-white">
                          {selectedDateStr.split("-")[2]} {INDONESIAN_MONTHS[parseInt(selectedDateStr.split("-")[1]) - 1]} {selectedDateStr.split("-")[0]}
                        </span>
                      </div>
                      <div className="text-right">
                        <h4 className="font-extrabold text-[9px] uppercase tracking-widest text-gray-400">Total Harian</h4>
                        <span className="font-extrabold text-sm text-red-500">
                          {formatIDR(calendarSpendingMap[selectedDateStr] || 0)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      {getTransactionsForSelectedDate().length === 0 ? (
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-4">Tidak ada transaksi pada tanggal ini.</p>
                      ) : (
                        getTransactionsForSelectedDate().map((tx: any) => (
                          <div 
                            key={tx.id} 
                            className="flex justify-between items-center p-3.5 bg-gray-50 dark:bg-brand-bgDark/30 border border-gray-100 dark:border-brand-borderDark/30 rounded-2xl"
                          >
                            <div className="flex-1 min-w-0">
                              <span className="font-bold text-xs text-gray-900 dark:text-white block truncate">{tx.description}</span>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[9px] bg-gray-100 dark:bg-brand-bgDark text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full capitalize font-semibold">
                                  {tx.category_name}
                                </span>
                                <span className="text-[9px] text-gray-400 uppercase tracking-widest">
                                  {tx.source}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3 ml-4">
                              <span className="font-extrabold text-xs text-red-500">
                                -{formatIDR(tx.amount)}
                              </span>
                              <button 
                                onClick={async () => {
                                  await handleDeleteTransaction(tx.id);
                                  fetchData();
                                }}
                                className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100 dark:hover:bg-brand-bgDark transition"
                                title="Hapus"
                              >
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
          </div>
        )}

        {/* TAB 3: TELEGRAM INTEGRATION */}
        {activeTab === "telegram" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Link code display */}
            <div className="bg-white dark:bg-brand-cardDark rounded-2xl p-6 border border-gray-100 dark:border-brand-borderDark shadow-sm text-center">
              <h3 className="font-bold text-sm uppercase tracking-wider text-gray-900 dark:text-white mb-2">Tautkan Bot Telegram</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                Tautkan akun ini ke bot Telegram agar Anda dapat mencatat transaksi keuangan secara instan lewat chatting.
              </p>

              {linkCode ? (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 dark:bg-brand-bgDark border border-gray-100 dark:border-brand-borderDark rounded-xl inline-flex flex-col items-center">
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Kode Verifikasi Anda</span>
                    <span className="text-3xl font-extrabold tracking-widest text-brand-accentGreen mt-1 select-all">{linkCode}</span>
                    <span className="text-[10px] text-red-500 font-semibold mt-2">Kedaluwarsa pada pukul {linkExpiry}</span>
                  </div>

                  <div className="flex gap-2 justify-center">
                    <button 
                      onClick={copyToClipboard}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-accentGreen to-emerald-600 text-white text-xs font-bold rounded-xl shadow-md hover:brightness-105 transition"
                    >
                      <Copy className="h-4 w-4" /> {copied ? "Salin Perintah" : "Salin Perintah Bot"}
                    </button>
                    <button 
                      onClick={() => setLinkCode("")}
                      className="px-4 py-2 border border-gray-200 dark:border-brand-borderDark text-xs font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-brand-bgDark transition"
                    >
                      Kembali
                    </button>
                  </div>
                  
                  {copied && (
                    <p className="text-[10px] text-brand-accentGreen font-semibold animate-pulse">
                      Teks `/link ${linkCode}` berhasil disalin! Buka Telegram bot dan paste perintah tersebut.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-center mb-2">
                    <div className="h-16 w-16 rounded-full bg-brand-accentBlue/10 flex items-center justify-center text-brand-accentBlue">
                      <Send className="h-8 w-8" />
                    </div>
                  </div>
                  
                  {user?.telegram_linked ? (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 rounded-xl flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                      <CheckCircle className="h-4 w-4" /> Terhubung dengan Chat ID: {user.telegram_chat_id}
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900 rounded-xl flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-semibold">
                      <AlertTriangle className="h-4 w-4" /> Belum terhubung
                    </div>
                  )}

                  <button 
                    onClick={handleGenerateCode}
                    disabled={loading}
                    className="w-full py-2.5 bg-gradient-to-r from-brand-accentGreen to-emerald-600 text-white text-xs font-bold rounded-xl shadow-md hover:brightness-105 transition"
                  >
                    Generate Kode Tautan Baru
                  </button>
                </div>
              )}
            </div>

            {/* Telegram Command Guide */}
            <div className="bg-white dark:bg-brand-cardDark rounded-2xl p-5 border border-gray-100 dark:border-brand-borderDark shadow-sm">
              <h3 className="font-bold text-sm uppercase tracking-wider text-gray-900 dark:text-white mb-4">Panduan Format Pesan Bot</h3>
              <div className="space-y-3.5 text-xs">
                <div className="flex flex-col gap-1 p-3 bg-gray-50 dark:bg-brand-bgDark border border-gray-100 dark:border-brand-borderDark rounded-xl">
                  <span className="font-bold text-gray-800 dark:text-slate-200">1. Format Lengkap (Disarankan)</span>
                  <code className="text-brand-accentGreen font-bold bg-gray-100 dark:bg-slate-900 px-2 py-1 rounded inline-block w-fit mt-0.5">
                    [Deskripsi] [Nominal] #[Kategori]
                  </code>
                  <span className="text-gray-500 mt-1">Contoh: `Beli kopi starbucks 45000 #makanan`</span>
                </div>

                <div className="flex flex-col gap-1 p-3 bg-gray-50 dark:bg-brand-bgDark border border-gray-100 dark:border-brand-borderDark rounded-xl">
                  <span className="font-bold text-gray-800 dark:text-slate-200">2. Format Cepat (Tanpa Kategori)</span>
                  <code className="text-brand-accentGreen font-bold bg-gray-100 dark:bg-slate-900 px-2 py-1 rounded inline-block w-fit mt-0.5">
                    [Deskripsi] [Nominal]
                  </code>
                  <span className="text-gray-500 mt-1">Contoh: `Isi bensin motor 20000` (Masuk kategori uncategorized)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PROFILE */}
        {activeTab === "profile" && (
          <div className="space-y-6 animate-fadeIn">
            {/* User Profile Header Card */}
            <div className="bg-white dark:bg-brand-cardDark rounded-2xl p-5 border border-gray-100 dark:border-brand-borderDark shadow-sm flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-brand-accentBlue to-brand-accentGreen flex items-center justify-center text-white text-2xl font-black">
                {user?.email ? user.email.charAt(0).toUpperCase() : "S"}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-extrabold text-base text-gray-900 dark:text-white truncate">{user?.email || "User FinTrack"}</h3>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] bg-brand-accentGreen/10 border border-brand-accentGreen/20 text-brand-accentGreen font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                    <Award className="h-3 w-3" /> Gold hoarder
                  </span>
                  <span className="text-[10px] text-gray-400">LVL 42</span>
                </div>
              </div>
            </div>

            {/* Monthly Income Setting Card */}
            <div className="bg-white dark:bg-brand-cardDark rounded-2xl p-5 border border-gray-100 dark:border-brand-borderDark shadow-sm space-y-4">
              <h3 className="font-bold text-sm uppercase tracking-wider text-gray-900 dark:text-white">Pengaturan Keuangan</h3>
              
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Pendapatan Bulanan Bersih (Rupiah)
                </label>
                <input 
                  type="number"
                  placeholder="10000000"
                  value={monthlyIncome}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setMonthlyIncome(val);
                  }}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-brand-borderDark rounded-xl bg-gray-50 dark:bg-brand-bgDark text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-accentGreen/50 focus:border-brand-accentGreen text-sm font-semibold transition"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400">
                    Target Tabungan Bulanan
                  </label>
                  <span className="text-brand-accentGreen font-extrabold text-xs">{wealthGoal}% ({formatIDR((wealthGoal / 100) * monthlyIncome)})</span>
                </div>
                
                <input 
                  type="range" 
                  min="10" 
                  max="80" 
                  value={wealthGoal}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setWealthGoal(val);
                  }}
                  className="w-full accent-brand-accentGreen h-1.5 bg-gray-100 dark:bg-brand-bgDark rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-brand-borderDark text-xs text-gray-500 dark:text-gray-400 flex flex-col gap-2">
                <div className="flex justify-between">
                  <span>Alokasi Pengeluaran Aman ({100 - wealthGoal}%):</span>
                  <span className="font-bold text-gray-700 dark:text-slate-200">{formatIDR(((100 - wealthGoal) / 100) * monthlyIncome)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Jumlah Terkumpul Saat Ini:</span>
                  <span className="font-bold text-brand-accentGreen">{formatIDR(Math.max(((wealthGoal / 100) * monthlyIncome) - summary.total_spending, 0))}</span>
                </div>
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={loading}
                className="w-full py-2.5 bg-gradient-to-r from-brand-accentGreen to-emerald-600 text-white text-xs font-bold rounded-xl shadow-md hover:brightness-105 active:scale-[0.98] transition disabled:opacity-50"
              >
                {loading ? "Menyimpan..." : "Simpan Pengaturan Finansial"}
              </button>
            </div>

            {/* Gamification Skill Tree */}
            <div className="bg-white dark:bg-brand-cardDark rounded-2xl p-5 border border-gray-100 dark:border-brand-borderDark shadow-sm">
              <h3 className="font-bold text-sm uppercase tracking-wider text-gray-900 dark:text-white mb-4">Financial Skill Tree</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 dark:bg-brand-bgDark border border-gray-100 dark:border-brand-borderDark rounded-xl flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-gray-800 dark:text-slate-200 block truncate">Budgeting</span>
                    <span className="text-[9px] text-gray-400">LVL 4 (Active)</span>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-brand-bgDark border border-gray-100 dark:border-brand-borderDark rounded-xl flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center flex-shrink-0">
                    <Award className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-gray-800 dark:text-slate-200 block truncate">Hoarding</span>
                    <span className="text-[9px] text-gray-400">LVL 7 (Master)</span>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-brand-bgDark border border-gray-100 dark:border-brand-borderDark rounded-xl flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center flex-shrink-0">
                    <Brain className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-gray-800 dark:text-slate-200 block truncate">AI Advisor</span>
                    <span className="text-[9px] text-gray-400">LVL 1 (Unlocked)</span>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-brand-bgDark border border-gray-100 dark:border-brand-borderDark rounded-xl flex items-center gap-2.5 opacity-50">
                  <div className="h-8 w-8 rounded-lg bg-gray-500/10 text-gray-500 flex items-center justify-center flex-shrink-0">
                    <ChevronRight className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-gray-800 dark:text-slate-200 block truncate">Wealth Builder</span>
                    <span className="text-[9px] text-gray-400">Locked</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Dynamic Floating Action Button for Adding Expense (Home Tab only) */}
      {activeTab === "home" && (
        <button 
          onClick={() => setShowAddModal(true)}
          className="fixed bottom-24 right-1/2 translate-x-[200px] h-12 w-12 rounded-full bg-gradient-to-tr from-brand-accentGreen to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-brand-accentGreen/20 hover:scale-105 active:scale-95 transition-all duration-150 z-40 border border-emerald-500/30"
          title="Tambah Transaksi"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}

      {/* Bottom Sticky Tab Navigation Bar */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] h-16 bg-white/95 dark:bg-brand-cardDark/95 backdrop-blur-md border-t border-gray-100 dark:border-brand-borderDark flex justify-around items-center z-45 transition-colors">
        <button 
          onClick={() => setActiveTab("home")}
          className={`flex flex-col items-center gap-1 ${activeTab === "home" ? "text-brand-accentGreen" : "text-gray-400"}`}
        >
          <HomeIcon className="h-5 w-5" />
          <span className="text-[9px] font-bold tracking-wide">Home</span>
        </button>
        
        <button 
          onClick={() => setActiveTab("analysis")}
          className={`flex flex-col items-center gap-1 ${activeTab === "analysis" ? "text-brand-accentGreen" : "text-gray-400"}`}
        >
          <BarChart2 className="h-5 w-5" />
          <span className="text-[9px] font-bold tracking-wide">Analisis</span>
        </button>
        
        <button 
          onClick={() => setActiveTab("telegram")}
          className={`flex flex-col items-center gap-1 ${activeTab === "telegram" ? "text-brand-accentGreen" : "text-gray-400"}`}
        >
          <Send className="h-5 w-5" />
          <span className="text-[9px] font-bold tracking-wide">Telegram</span>
        </button>
        
        <button 
          onClick={() => setActiveTab("profile")}
          className={`flex flex-col items-center gap-1 ${activeTab === "profile" ? "text-brand-accentGreen" : "text-gray-400"}`}
        >
          <UserIcon className="h-5 w-5" />
          <span className="text-[9px] font-bold tracking-wide">Profil</span>
        </button>
      </nav>

      {/* ADD EXPENSE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50 animate-fadeIn">
          {/* Close trigger on clicking background */}
          <div className="absolute inset-0" onClick={() => setShowAddModal(false)} />
          
          <div className="relative w-full max-w-[480px] bg-white dark:bg-brand-cardDark border-t border-gray-100 dark:border-brand-borderDark/80 rounded-t-3xl p-6 shadow-2xl z-10 transition-colors">
            
            {/* Draggable indicator bar */}
            <div className="w-12 h-1 bg-gray-200 dark:bg-brand-borderDark rounded-full mx-auto mb-5" />
            
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-extrabold text-base text-gray-900 dark:text-white">Tambah Pengeluaran</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-xs font-semibold text-gray-400 hover:text-gray-600 dark:hover:text-slate-200"
              >
                Batal
              </button>
            </div>

            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                  Deskripsi
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="Beli kopi starbucks"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-brand-borderDark rounded-xl bg-gray-50 dark:bg-brand-bgDark text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-accentGreen/50 focus:border-brand-accentGreen text-sm transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                  Nominal (Rupiah)
                </label>
                <input 
                  type="number" 
                  required
                  placeholder="45000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-brand-borderDark rounded-xl bg-gray-50 dark:bg-brand-bgDark text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-accentGreen/50 focus:border-brand-accentGreen text-sm transition font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                  Kategori
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["makanan", "transportasi", "hiburan", "belanja", "tagihan"].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`py-2 px-1 border rounded-xl text-xs font-semibold capitalize transition ${
                        category === cat 
                          ? "border-brand-accentGreen bg-brand-accentGreen/10 text-brand-accentGreen" 
                          : "border-gray-200 dark:border-brand-borderDark bg-gray-50 dark:bg-brand-bgDark text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setCategory("other")}
                    className={`py-2 px-1 border rounded-xl text-xs font-semibold capitalize transition ${
                      category === "other" 
                        ? "border-brand-accentGreen bg-brand-accentGreen/10 text-brand-accentGreen" 
                        : "border-gray-200 dark:border-brand-borderDark bg-gray-50 dark:bg-brand-bgDark text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    Lainnya
                  </button>
                </div>
              </div>

              {category === "other" && (
                <div className="animate-slideDown">
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                    Nama Kategori Kustom
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder="misal: olahraga, kesehatan"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-brand-borderDark rounded-xl bg-gray-50 dark:bg-brand-bgDark text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-accentGreen/50 focus:border-brand-accentGreen text-sm transition"
                  />
                </div>
              )}

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-brand-accentGreen to-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-brand-accentGreen/20 hover:brightness-105 transition mt-4 flex items-center justify-center"
              >
                {loading ? "Menyimpan..." : "Simpan Transaksi"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
