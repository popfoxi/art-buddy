"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { 
  Shield, 
  Users, 
  Database, 
  Activity, 
  ArrowLeft, 
  LayoutDashboard, 
  CreditCard, 
  Settings,
  Search,
  Filter,
  Download,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  Save,
  MessageSquare,
  AlertTriangle,
  Plus,
  Minus,
  X
} from "lucide-react";
import Link from "next/link";
import { clsx } from "clsx";
import { SUPPORT_CATEGORIES } from "@/lib/constants";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview"); // overview, users, revenue, settings, support
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [stats, setStats] = useState({
    totalUsers: 0,
    dailyRegistrations: 0,
    dailyLogins: 0,
    monthlyActiveUsers: 0,
    retentionRate: "0",
    activityLevel: "0",
    paidUsersPlus: 0,
    paidUsersPro: 0,
    totalPaidUsers: 0,
    unresolvedTickets: 0,
    todayAnalysis: 0,
    totalAnalysis: 0,
    totalCredits: 0,
    recentUsers: [] as any[],
    trend7d: [] as { date: string, general: number, master: number, total: number }[],
    trendMonthly: [] as { date: string, general: number, master: number, total: number }[],
    last7DaysAnalysis: 0,
    analysisFree: 0,
    analysisPlus: 0,
    analysisPro: 0,
    paidUserUsageRatio: "0",
    averageUsagePerUser: "0",
    estimatedCost: "0",
    analysisByScenario: [] as { name: string, value: number }[],
    analysisByMedium: [] as { name: string, value: number }[],
    revenueMetrics: {
        monthlyRevenue: 0,
        todayRevenue: 0,
        revenuePlus: 0,
        revenuePro: 0,
        arpu: 0,
        last7DaysPaidAnalysis: 0,
        last7DaysApiCost: 0,
        last7DaysGrossProfit: 0
    }
  });
  const [users, setUsers] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter States
  const [roleFilter, setRoleFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [analysisTimeRange, setAnalysisTimeRange] = useState<'7d' | '30d'>('7d');

  // Modal States
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null); // For Add/Edit User
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false); // For Credit Management
  const [selectedUserForCredit, setSelectedUserForCredit] = useState<any | null>(null);
  
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [ticketReply, setTicketReply] = useState("");
  const [creditAmount, setCreditAmount] = useState(0);

  // Ticket Filters & Tags
  const [ticketStatusFilter, setTicketStatusFilter] = useState("open");
  const [ticketTagFilter, setTicketTagFilter] = useState("");
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [editingTicketTags, setEditingTicketTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState("");

  // Settings State
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  const loadUsers = async () => {
      setIsLoading(true);
      try {
          const actions = await import("./actions");
          const usersData = await actions.getUsers(searchQuery, roleFilter, planFilter);
          setUsers(usersData);
      } catch (error) {
          console.error("Load users failed", error);
      } finally {
          setIsLoading(false);
      }
  };

  const loadTickets = async () => {
    try {
        const actions = await import("./actions");
        const data = await actions.getTickets(ticketStatusFilter, ticketTagFilter);
        setTickets(data);
    } catch (error) {
        console.error("Load tickets failed", error);
    }
  };

  useEffect(() => {
      if (activeTab === "support") {
          loadTickets();
      }
  }, [ticketStatusFilter, ticketTagFilter, activeTab]);

  const handleSearch = () => {
    loadUsers();
  };


  // Load Data
  useEffect(() => {
    if (status === "loading" || !session) return;
    
    import("./actions").then(async (actions) => {
      try {
        const statsData = await actions.getAdminStats();
        setStats(statsData);
        
        // Initial load of users
        const usersData = await actions.getUsers(searchQuery, roleFilter, planFilter);
        setUsers(usersData);

        const ticketsData = await actions.getTickets();
        setTickets(ticketsData);

        const settingsData = await actions.getSystemSettings();
        setSettings(settingsData);
      } catch (error) {
        console.error("Failed to fetch admin data", error);
      } finally {
        setIsLoading(false);
      }
    });
  }, [session, status]);

  // Reload users when filters change
  useEffect(() => {
    if (session) {
        loadUsers();
    }
  }, [roleFilter, planFilter]);

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
        const actions = await import("./actions");
        if (editingUser.id) {
            // Update
            await actions.updateUser(editingUser.id, {
                name: editingUser.name,
                email: editingUser.email,
                role: editingUser.role,
                plan: editingUser.plan,
                credits: parseInt(editingUser.credits)
            });
            alert("會員資料更新成功");
        } else {
            // Create
            await actions.createUser({
                name: editingUser.name,
                email: editingUser.email,
                role: editingUser.role,
                plan: editingUser.plan,
                credits: parseInt(editingUser.credits)
            });
            alert("會員新增成功");
        }
        setIsUserModalOpen(false);
        setEditingUser(null);
        loadUsers();
    } catch (error) {
        console.error(error);
        alert("儲存失敗: " + (error as any).message);
    }
  };

  const handleDeleteUser = async (userId: string) => {
      if (!confirm("確定要刪除此會員嗎？此動作無法復原。")) return;
      try {
          const actions = await import("./actions");
          await actions.deleteUser(userId);
          setUsers(users.filter(u => u.id !== userId));
          alert("會員已刪除");
      } catch (error) {
          console.error(error);
          alert("刪除失敗");
      }
  };

  const handleUpdateCredits = async (userId: string, newCredits: number) => {
    if (newCredits < 0) return;
    try {
        const actions = await import("./actions");
        await actions.updateUserCredits(userId, newCredits);
        setUsers(users.map(u => u.id === userId ? { ...u, credits: newCredits } : u));
        setTickets(tickets.map(t => t.user?.id === userId ? { ...t, user: { ...t.user, credits: newCredits } } : t));
        if (selectedUserForCredit) setSelectedUserForCredit({ ...selectedUserForCredit, credits: newCredits });
        alert("點數更新成功");
    } catch (e) {
        console.error(e);
        alert("更新失敗");
    }
  };

  const handleReplyTicket = async (ticketId: string) => {
    if (!ticketReply) return;
    try {
        const actions = await import("./actions");
        await actions.replyTicket(ticketId, ticketReply);
        setTickets(tickets.map(t => t.id === ticketId ? { ...t, status: 'closed', reply: ticketReply } : t));
        setSelectedTicket(null);
        setTicketReply("");
        alert("回覆成功");
        loadTickets(); // Reload to refresh list if status changed
    } catch (e) {
        console.error(e);
        alert("回覆失敗");
    }
  };

  const handleUpdateTags = async () => {
      if (!selectedTicket) return;
      try {
          const actions = await import("./actions");
          await actions.updateTicketTags(selectedTicket.id, editingTicketTags);
          setTickets(tickets.map(t => t.id === selectedTicket.id ? { ...t, tags: editingTicketTags } : t));
          setIsTagModalOpen(false);
          setNewTagInput("");
          alert("標籤更新成功");
      } catch (e) {
          console.error(e);
          alert("更新失敗");
      }
  };

  const handleAddTag = () => {
      if (!newTagInput.trim()) return;
      if (editingTicketTags.includes(newTagInput.trim())) return;
      setEditingTicketTags([...editingTicketTags, newTagInput.trim()]);
      setNewTagInput("");
  };

  const handleRemoveTag = (tag: string) => {
      setEditingTicketTags(editingTicketTags.filter(t => t !== tag));
  };


  const handleSaveSetting = async (key: string, value: string) => {
    setIsSaving(true);
    setSaveMessage("");
    try {
      const actions = await import("./actions");
      await actions.saveSystemSetting(key, value);
      setSaveMessage("設定已儲存");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (error) {
      console.error(error);
      alert("儲存失敗");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetAnalysis = async () => {
    if (!confirm("警告：此操作將刪除所有用戶的分析紀錄、挑戰紀錄與收藏。此動作無法復原！\n\n您確定要繼續嗎？")) return;
    
    const verification = prompt("請輸入 'DELETE' 以確認刪除所有分析資料：");
    if (verification !== 'DELETE') {
        alert("驗證失敗，取消操作");
        return;
    }

    setIsResetting(true);
    try {
        const actions = await import("./actions");
        const result = await actions.resetAllAnalysis();
        if (result.success) {
            alert(`重置成功！已刪除 ${result.count} 筆分析紀錄。`);
            const statsData = await actions.getAdminStats();
            setStats(statsData);
        } else {
            throw new Error("Unknown error");
        }
    } catch (error: any) {
        console.error("Reset failed", error);
        alert("重置失敗: " + error.message);
    } finally {
        setIsResetting(false);
    }
  };

  if (status === "loading") return <div className="min-h-screen flex items-center justify-center bg-slate-50">載入中...</div>;

  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  // @ts-ignore - role is passed from session callback
  const isUserAdmin = session?.user?.email === adminEmail || session?.user?.role === 'admin';

  // Chart Data Preparation
  const chartData = analysisTimeRange === '7d' 
    ? (stats.trend7d || [])
    : (stats.trendMonthly || []);

  const totalChartAnalysis = chartData.reduce((sum, d) => sum + d.total, 0);
  const generalChartAnalysis = chartData.reduce((sum, d) => sum + d.general, 0);
  const masterChartAnalysis = chartData.reduce((sum, d) => sum + d.master, 0);
  const generalRatio = totalChartAnalysis > 0 ? Math.round((generalChartAnalysis / totalChartAnalysis) * 100) : 0;
  const masterRatio = totalChartAnalysis > 0 ? Math.round((masterChartAnalysis / totalChartAnalysis) * 100) : 0;

  const maxCount = Math.max(...chartData.map(d => d.total), 10);
  
  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-slate-900/20">
            <Shield size={32} className="text-white" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-900">管理員登入</h1>
            <p className="text-slate-500">請登入以存取管理後台</p>
          </div>
          <div className="space-y-3 w-full">
            <button 
              onClick={() => signIn('google', { callbackUrl: '/admin' })}
              className="w-full py-4 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google 登入
            </button>
            <button 
              onClick={() => signIn('line', { callbackUrl: '/admin' })}
              className="w-full py-4 bg-[#06C755] text-white rounded-xl font-bold hover:bg-[#05b34c] transition-all shadow-lg shadow-[#06C755]/20 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M20.3 10.5c0-4.6-4.5-8.3-10-8.3S.3 5.9.3 10.5c0 4.1 3.6 7.5 8.9 8.1.3.1.8.3.9.8v.1c.1.4.2 1.2.1 1.4-.1.6-.8 2.2-1 3.1-.3 1.5 1.3 1.3 1.3 1.3 3.4-1.9 8.2-5.4 8.2-5.4 3.7-2 5.6-5.1 5.6-8.4zm-13.6 2.4H5.2v-3h1.5v3zm3.5-3h-1.5v1.2h1.5v-1.2zm0 1.8h-1.5v1.2h1.5v-1.2zm3.5-1.8H12v3h1.7v-3zm3.6 2h-2v-2h2v-1h-3.5v4h3.5v-1z" />
              </svg>
              LINE 登入
            </button>
          </div>
          <Link href="/" className="block text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors">
            返回首頁
          </Link>
        </div>
      </div>
    );
  }

  if (!isUserAdmin) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
            <Shield size={64} className="text-slate-300 mb-4" />
            <h1 className="text-2xl font-bold text-slate-900 mb-2">權限不足</h1>
            <p className="text-slate-500 text-center max-w-md mb-8">
              您目前的帳號 ({session?.user?.email || session?.user?.name}) 沒有管理員權限。
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => signOut({ callbackUrl: '/admin' })} 
                className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold shadow-lg shadow-slate-900/20 active:scale-[0.98] transition-all"
              >
                切換帳號
              </button>
              <Link href="/" className="px-6 py-3 bg-slate-200 text-slate-900 rounded-xl font-bold hover:bg-slate-300 transition-colors">回首頁</Link>
            </div>
        </div>
    );
  }

  const renderContent = () => {
    switch(activeTab) {
      case "overview":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">總覽儀表板</h2>

            {/* Alert for Unresolved Tickets */}
            {stats.unresolvedTickets > 0 && (
              <div 
                onClick={() => setActiveTab('support')}
                className="bg-rose-50 border border-rose-100 p-4 rounded-xl flex items-center justify-between cursor-pointer hover:bg-rose-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center text-rose-600">
                    <MessageSquare size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-rose-900">有 {stats.unresolvedTickets} 則未解決的客訴</h3>
                    <p className="text-xs text-rose-600">請盡快前往處理用戶問題</p>
                  </div>
                </div>
                <ArrowLeft className="rotate-180 text-rose-400" size={20} />
              </div>
            )}

            {/* KPI Cards Row 1: Business Overview */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
               <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="text-xs text-slate-500 font-bold mb-1">今日分析</div>
                  <div className="text-2xl font-black text-slate-900">{stats.todayAnalysis}</div>
               </div>
               <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="text-xs text-slate-500 font-bold mb-1">近 7 日分析</div>
                  <div className="text-2xl font-black text-slate-900">{stats.last7DaysAnalysis}</div>
               </div>
               <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="text-xs text-slate-500 font-bold mb-1">付費使用佔比</div>
                  <div className="text-2xl font-black text-slate-900">{stats.paidUserUsageRatio}%</div>
               </div>
               <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="text-xs text-slate-500 font-bold mb-1">平均每人使用</div>
                  <div className="text-2xl font-black text-slate-900">{stats.averageUsagePerUser}</div>
               </div>
               <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="text-xs text-slate-500 font-bold mb-1">估算 API 成本</div>
                  <div className="text-2xl font-black text-slate-900">${stats.estimatedCost}</div>
               </div>
            </div>

            {/* KPI Cards Row 2: Breakdown Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Member Type Breakdown */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-900 mb-4">會員類型分佈</h3>
                    {stats.totalAnalysis === 0 ? (
                         <div className="text-center py-8 text-slate-400 text-sm">尚無資料</div>
                    ) : (
                        <div className="space-y-3">
                            {/* Free */}
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500">Free</span>
                                <span className="font-bold">{stats.analysisFree} ({stats.totalAnalysis > 0 ? ((stats.analysisFree/stats.totalAnalysis)*100).toFixed(1) : 0}%)</span>
                            </div>
                            {/* Plus */}
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-blue-500">Plus</span>
                                <span className="font-bold">{stats.analysisPlus} ({stats.totalAnalysis > 0 ? ((stats.analysisPlus/stats.totalAnalysis)*100).toFixed(1) : 0}%)</span>
                            </div>
                             {/* Pro */}
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-rose-500">Pro</span>
                                <span className="font-bold">{stats.analysisPro} ({stats.totalAnalysis > 0 ? ((stats.analysisPro/stats.totalAnalysis)*100).toFixed(1) : 0}%)</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Function Breakdown */}
                 <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-900 mb-4">功能類型分佈</h3>
                    {stats.analysisByScenario.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 text-sm">尚無資料</div>
                    ) : (
                         <div className="space-y-3">
                            {stats.analysisByScenario.map((item, i) => (
                                <div key={i} className="flex items-center justify-between text-sm">
                                    <span className="text-slate-500">{item.name === 'general' ? '綜合評分' : item.name === 'style-challenge' ? '風格挑戰' : item.name}</span>
                                    <span className="font-bold">{item.value}</span>
                                </div>
                            ))}
                         </div>
                    )}
                </div>

                {/* Medium Breakdown */}
                 <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-900 mb-4">繪畫媒材分佈</h3>
                    {stats.analysisByMedium.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 text-sm">尚無資料</div>
                    ) : (
                         <div className="space-y-3">
                            {stats.analysisByMedium.map((item, i) => (
                                <div key={i} className="flex items-center justify-between text-sm">
                                    <span className="text-slate-500">{item.name}</span>
                                    <span className="font-bold">{item.value}</span>
                                </div>
                            ))}
                         </div>
                    )}
                </div>
            </div>

            {/* Chart */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">AI 分析次數趨勢</h3>
                    {(() => {
                        const total = chartData.reduce((a, b) => a + b.total, 0);
                        const general = chartData.reduce((a, b) => a + b.general, 0);
                        const master = chartData.reduce((a, b) => a + b.master, 0);
                        const gPct = total ? Math.round((general / total) * 100) : 0;
                        const mPct = total ? Math.round((master / total) * 100) : 0;
                        
                        return (
                            <div className="flex items-center gap-4 mt-2">
                                <div className="text-sm text-slate-500 font-bold">總計 {total} 次</div>
                                <div className="h-4 w-px bg-slate-200"></div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                    <span className="text-sm font-bold text-slate-700">一般 {gPct}% ({general})</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                                    <span className="text-sm font-bold text-slate-700">大師 {mPct}% ({master})</span>
                                </div>
                            </div>
                        );
                    })()}
                  </div>
                  <div className="flex bg-slate-100 p-1 rounded-lg self-start">
                    <button 
                      onClick={() => setAnalysisTimeRange('7d')}
                      className={clsx(
                        "px-3 py-1 text-xs font-bold rounded-md transition-all",
                        analysisTimeRange === '7d' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                      )}
                    >
                      近 7 天
                    </button>
                    <button 
                      onClick={() => setAnalysisTimeRange('30d')}
                      className={clsx(
                        "px-3 py-1 text-xs font-bold rounded-md transition-all",
                        analysisTimeRange === '30d' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                      )}
                    >
                      月報表 (6M)
                    </button>
                  </div>
                </div>

                {/* Usage Ratio Bar */}
                <div className="mb-6">
                  <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span>媒介分析 (一般) {chartData.reduce((a,b)=>a+b.total,0) > 0 ? Math.round((chartData.reduce((a,b)=>a+b.general,0) / chartData.reduce((a,b)=>a+b.total,0)) * 100) : 0}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                        <span>大師風格挑戰 {chartData.reduce((a,b)=>a+b.total,0) > 0 ? Math.round((chartData.reduce((a,b)=>a+b.master,0) / chartData.reduce((a,b)=>a+b.total,0)) * 100) : 0}%</span>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                    <div 
                      className="h-full bg-blue-500" 
                      style={{ width: `${chartData.reduce((a,b)=>a+b.total,0) > 0 ? (chartData.reduce((a,b)=>a+b.general,0) / chartData.reduce((a,b)=>a+b.total,0)) * 100 : 0}%` }}
                    />
                    <div 
                      className="h-full bg-purple-500" 
                      style={{ width: `${chartData.reduce((a,b)=>a+b.total,0) > 0 ? (chartData.reduce((a,b)=>a+b.master,0) / chartData.reduce((a,b)=>a+b.total,0)) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div className="h-64 flex items-end justify-between gap-1 md:gap-2">
                    {chartData.map((data, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                            {/* Tooltip */}
                            <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-slate-900 text-white text-[10px] p-2 rounded pointer-events-none whitespace-nowrap shadow-lg">
                              <div className="font-bold mb-1">
                                {new Date(data.date).toLocaleDateString(undefined, analysisTimeRange === '30d' ? {year: 'numeric', month: 'long'} : {month: 'numeric', day: 'numeric'})}
                              </div>
                              <div>總計: {data.total}</div>
                              <div className="text-blue-300">一般: {data.general}</div>
                              <div className="text-purple-300">大師: {data.master}</div>
                            </div>
                            
                            <div className="relative w-full bg-slate-50 rounded-t-sm md:rounded-t-lg overflow-hidden flex flex-col-reverse justify-start" style={{ height: `${maxCount > 0 ? (data.total / maxCount) * 100 : 0}%` }}>
                                {/* General Bar (Blue) */}
                                <div 
                                  className="w-full bg-blue-500 transition-all duration-500" 
                                  style={{ height: `${data.total > 0 ? (data.general / data.total) * 100 : 0}%` }}
                                ></div>
                                {/* Master Bar (Purple) */}
                                <div 
                                  className="w-full bg-purple-500 transition-all duration-500" 
                                  style={{ height: `${data.total > 0 ? (data.master / data.total) * 100 : 0}%` }}
                                ></div>
                            </div>
                            <span className="text-[10px] md:text-xs font-bold text-slate-400 hidden md:block">
                              {new Date(data.date).toLocaleDateString(undefined, analysisTimeRange === '30d' ? {year: '2-digit', month:'numeric'} : {month:'numeric', day:'numeric'})}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
          </div>
        );

      case "users":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">會員管理</h2>
              <div className="flex gap-2">
                <button 
                    onClick={() => {
                        setEditingUser({ name: "", email: "", role: "user", plan: "free", credits: 3 });
                        setIsUserModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-500 transition-colors"
                >
                    <Plus size={16} /> 新增會員
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors">
                    <Download size={16} /> 匯出報表
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap gap-4 items-center justify-between">
               <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                  <Search size={20} className="text-slate-400" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="搜尋會員姓名、Email... (按 Enter 搜尋)" 
                    className="w-full bg-transparent outline-none text-sm font-bold text-slate-700 placeholder:font-normal" 
                  />
               </div>
               <div className="flex items-center gap-3">
                  <select 
                    value={planFilter}
                    onChange={(e) => setPlanFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-lg px-3 py-2 outline-none"
                  >
                    <option value="all">所有等級 (Plan)</option>
                    <option value="free">Free</option>
                    <option value="plus">Plus</option>
                    <option value="pro">Pro</option>
                  </select>
                  <select 
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-lg px-3 py-2 outline-none"
                  >
                    <option value="all">所有身分 (Role)</option>
                    <option value="user">一般會員</option>
                    <option value="admin">管理員</option>
                  </select>
               </div>
            </div>

            {/* User Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="p-4 text-xs font-bold text-slate-500">會員資訊</th>
                            <th className="p-4 text-xs font-bold text-slate-500">身分</th>
                            <th className="p-4 text-xs font-bold text-slate-500">訂閱方案</th>
                            <th className="p-4 text-xs font-bold text-slate-500">可用次數</th>
                            <th className="p-4 text-xs font-bold text-slate-500">上次登入</th>
                            <th className="p-4 text-xs font-bold text-slate-500">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {users.map((u) => (
                            <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden">
                                            {u.image && <img src={u.image} className="w-full h-full object-cover" />}
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-slate-900">{u.name || "Unknown"}</div>
                                            <div className="text-xs text-slate-400">{u.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className={`text-xs font-bold ${u.role === 'admin' ? 'text-purple-600 bg-purple-50 px-2 py-1 rounded-full' : 'text-slate-500'}`}>
                                        {u.role === 'admin' ? 'Admin' : 'User'}
                                    </span>
                                </td>
                                <td className="p-4">
                                    {u.plan === 'pro' ? (
                                        <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-600">Pro</span>
                                    ) : u.plan === 'plus' ? (
                                        <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-600">Plus</span>
                                    ) : (
                                        <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">Free</span>
                                    )}
                                </td>
                                <td className="p-4 text-sm font-bold text-slate-900">{u.credits}</td>
                                <td className="p-4 text-xs text-slate-400">
                                    {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : '-'}
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => {
                                                setEditingUser(u);
                                                setIsUserModalOpen(true);
                                            }}
                                            className="text-xs font-bold text-blue-600 hover:underline"
                                        >
                                            編輯
                                        </button>
                                        <span className="text-slate-300">|</span>
                                        <button 
                                            onClick={() => {
                                                setSelectedUserForCredit(u);
                                                setCreditAmount(u.credits);
                                                setIsCreditModalOpen(true);
                                            }}
                                            className="text-xs font-bold text-emerald-600 hover:underline"
                                        >
                                            點數
                                        </button>
                                        <span className="text-slate-300">|</span>
                                        <button 
                                            onClick={() => handleDeleteUser(u.id)}
                                            className="text-xs font-bold text-red-600 hover:underline"
                                        >
                                            刪除
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>
        );

      case "revenue":
        return (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">營收報表</h2>
                <div className="text-xs text-slate-400 font-bold bg-slate-100 px-3 py-1 rounded-full">
                    資料更新於: {new Date().toLocaleTimeString()}
                </div>
            </div>
            
            {/* Block 1: Revenue Overview */}
            <div className="space-y-4">
                 <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-l-4 border-emerald-500 pl-3">
                    營收總覽 (Revenue Overview)
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Today's Revenue */}
                    <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <DollarSign size={48} className="text-emerald-600" />
                        </div>
                        <div className="text-sm text-slate-500 font-bold mb-1">今日營收 (預估)</div>
                        <div className="text-3xl font-black text-emerald-600">NT$ {stats.revenueMetrics?.todayRevenue?.toLocaleString()}</div>
                        <div className="text-xs font-bold text-slate-400 mt-2 flex items-center gap-1">
                            <TrendingUp size={12} /> vs 昨日 (N/A)
                        </div>
                    </div>

                    {/* MTD Revenue */}
                    <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm hover:shadow-md transition-all">
                        <div className="text-sm text-slate-500 font-bold mb-1">本月累積營收 (MTD)</div>
                        <div className="text-3xl font-black text-slate-900">NT$ {stats.revenueMetrics?.monthlyRevenue?.toLocaleString()}</div>
                        <div className="text-xs font-bold text-emerald-500 mt-2">
                             基於目前活躍訂閱
                        </div>
                    </div>

                    {/* Active Paid Users */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                        <div className="text-sm text-slate-500 font-bold mb-1">有效付費會員數</div>
                        <div className="text-3xl font-black text-slate-900">{stats.totalPaidUsers} <span className="text-sm font-normal text-slate-400">人</span></div>
                        <div className="flex items-center gap-3 mt-2 text-xs font-bold">
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded">Plus {stats.paidUsersPlus}</span>
                            <span className="px-2 py-0.5 bg-rose-100 text-rose-600 rounded">Pro {stats.paidUsersPro}</span>
                        </div>
                    </div>

                    {/* ARPU */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                        <div className="text-sm text-slate-500 font-bold mb-1">ARPU (平均客單價)</div>
                        <div className="text-3xl font-black text-slate-900">NT$ {stats.revenueMetrics?.arpu?.toLocaleString()}</div>
                        <div className="text-xs font-bold text-slate-400 mt-2">
                             每付費會員平均貢獻
                        </div>
                    </div>
                 </div>
            </div>

            {/* Block 2: Revenue Structure */}
            <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-l-4 border-blue-500 pl-3">
                    營收來源結構 (Revenue Structure)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* By Plan */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <h4 className="text-sm font-bold text-slate-900 mb-4">A. 依方案拆分 (By Plan)</h4>
                        <div className="space-y-4">
                            {/* Plus */}
                            <div>
                                <div className="flex justify-between text-sm font-bold mb-1">
                                    <span className="text-blue-600">Plus 方案 (NT$150)</span>
                                    <span className="text-slate-900">NT$ {stats.revenueMetrics?.revenuePlus?.toLocaleString()}</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                    <div className="bg-blue-500 h-full" style={{ width: `${stats.revenueMetrics?.monthlyRevenue > 0 ? (stats.revenueMetrics.revenuePlus / stats.revenueMetrics.monthlyRevenue * 100) : 0}%` }}></div>
                                </div>
                            </div>
                            {/* Pro */}
                            <div>
                                <div className="flex justify-between text-sm font-bold mb-1">
                                    <span className="text-rose-600">Pro 方案 (NT$300)</span>
                                    <span className="text-slate-900">NT$ {stats.revenueMetrics?.revenuePro?.toLocaleString()}</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                    <div className="bg-rose-500 h-full" style={{ width: `${stats.revenueMetrics?.monthlyRevenue > 0 ? (stats.revenueMetrics.revenuePro / stats.revenueMetrics.monthlyRevenue * 100) : 0}%` }}></div>
                                </div>
                            </div>
                            {/* Add-on (Placeholder) */}
                            <div>
                                <div className="flex justify-between text-sm font-bold mb-1">
                                    <span className="text-slate-500">次數加購 (Add-ons)</span>
                                    <span className="text-slate-900">NT$ 0</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2"></div>
                            </div>
                        </div>
                        <div className="mt-4 p-3 bg-slate-50 rounded-xl text-xs text-slate-500">
                            💡 提示: 若 Plus 收入佔比過高，可考慮提升 Pro 方案的吸引力或調整定價。
                        </div>
                    </div>

                    {/* Subscription vs One-time */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <h4 className="text-sm font-bold text-slate-900 mb-4">B. 訂閱 vs 加購比例 (Recurring vs One-time)</h4>
                        <div className="flex items-center gap-8">
                             <div className="relative w-32 h-32 rounded-full border-[12px] border-emerald-500 flex items-center justify-center">
                                 <div className="text-center">
                                     <div className="text-2xl font-black text-emerald-600">100<span className="text-sm">%</span></div>
                                     <div className="text-[10px] font-bold text-slate-400">訂閱制</div>
                                 </div>
                             </div>
                             <div className="space-y-3 flex-1">
                                 <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                                     <div className="flex items-center gap-2">
                                         <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                                         <span className="text-sm font-bold text-emerald-900">訂閱型收入</span>
                                     </div>
                                     <span className="font-black text-emerald-700">100%</span>
                                 </div>
                                 <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                     <div className="flex items-center gap-2">
                                         <div className="w-3 h-3 bg-slate-300 rounded-full"></div>
                                         <span className="text-sm font-bold text-slate-500">單次購買</span>
                                     </div>
                                     <span className="font-black text-slate-400">0%</span>
                                 </div>
                             </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Block 3: Revenue x Usage */}
            <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-l-4 border-rose-500 pl-3">
                    營收 × 使用關係 (Profitability - Last 7 Days)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Total Analysis (7d) */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="text-xs text-slate-500 font-bold mb-1">總分析次數 (7日)</div>
                        <div className="text-2xl font-black text-slate-900">{stats.last7DaysAnalysis}</div>
                    </div>

                    {/* Paid Analysis (7d) */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="text-xs text-slate-500 font-bold mb-1">付費會員使用次數</div>
                        <div className="text-2xl font-black text-slate-900">{stats.revenueMetrics?.last7DaysPaidAnalysis}</div>
                        <div className="text-xs font-bold text-slate-400 mt-1">
                            佔比 {stats.last7DaysAnalysis > 0 ? Math.round(stats.revenueMetrics?.last7DaysPaidAnalysis / stats.last7DaysAnalysis * 100) : 0}%
                        </div>
                    </div>

                    {/* API Cost (7d) */}
                    <div className="bg-white p-5 rounded-2xl border border-rose-50 shadow-sm">
                        <div className="text-xs text-rose-500 font-bold mb-1">估算 API 成本 (7日)</div>
                        <div className="text-2xl font-black text-rose-600">- NT$ {stats.revenueMetrics?.last7DaysApiCost}</div>
                        <div className="text-xs font-bold text-rose-300 mt-1">
                            以 NT$1 / 次 估算
                        </div>
                    </div>

                    {/* Gross Profit (7d) */}
                    <div className="bg-white p-5 rounded-2xl border border-emerald-50 shadow-sm">
                        <div className="text-xs text-emerald-600 font-bold mb-1">預估毛利 (7日)</div>
                        <div className="text-2xl font-black text-emerald-600">
                             NT$ {stats.revenueMetrics?.last7DaysGrossProfit?.toLocaleString()}
                        </div>
                        <div className="text-xs font-bold text-emerald-400 mt-1">
                            營收 - API 成本
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-500 flex items-center gap-2">
                    <Activity size={16} />
                    <strong>經營指標說明:</strong> 
                    此區塊協助您判斷「是否有賺錢」。若毛利為負，表示 API 成本過高或定價過低。目前營收是基於活躍會員的預估值。
                </div>
            </div>
          </div>
        );

      case "settings":
        return (
            <div className="space-y-6 max-w-2xl">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-slate-900">系統設定</h2>
                    {saveMessage && (
                        <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg text-sm font-bold animate-fade-in">
                            <CheckCircle2 size={16} /> {saveMessage}
                        </div>
                    )}
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-6">第三方服務串接</h3>
                    
                    <div className="space-y-6">
                        {/* GA4 */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100 last:pb-0 last:border-0">
                            <div className="flex-1">
                                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                    Google Analytics 4
                                    <span className="text-[10px] bg-green-100 text-green-600 px-2 py-0.5 rounded-full">流量追蹤</span>
                                </h4>
                                <p className="text-xs text-slate-500 mt-1 max-w-md">
                                    輸入您的 GA4 評估 ID (Measurement ID) 以啟用全站流量分析。
                                </p>
                            </div>
                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <input 
                                    type="text" 
                                    value={settings["ga4_id"] || ""}
                                    onChange={(e) => setSettings(prev => ({ ...prev, "ga4_id": e.target.value }))}
                                    placeholder="G-XXXXXXXXXX"
                                    className="flex-1 w-full max-w-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-bold outline-none focus:ring-2 focus:ring-slate-900/10 transition-all"
                                />
                                <button 
                                    onClick={() => handleSaveSetting("ga4_id", settings["ga4_id"] || "")}
                                    disabled={isSaving}
                                    className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 shadow-sm"
                                    title="儲存設定"
                                >
                                    {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Save size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* AdSense */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-1">
                                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                    Google AdSense
                                    <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">廣告收益</span>
                                </h4>
                                <p className="text-xs text-slate-500 mt-1 max-w-md">
                                    輸入發佈商 ID (Publisher ID) 以啟用全站自動廣告 (Auto Ads)。
                                </p>
                            </div>
                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <input 
                                    type="text" 
                                    value={settings["adsense_id"] || ""}
                                    onChange={(e) => setSettings(prev => ({ ...prev, "adsense_id": e.target.value }))}
                                    placeholder="pub-XXXXXXXXXXXXXXXX"
                                    className="flex-1 w-full max-w-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-bold outline-none focus:ring-2 focus:ring-slate-900/10 transition-all"
                                />
                                <button 
                                    onClick={() => handleSaveSetting("adsense_id", settings["adsense_id"] || "")}
                                    disabled={isSaving}
                                    className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 shadow-sm"
                                    title="儲存設定"
                                >
                                    {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Save size={18} />}
                                </button>
                            </div>
                        </div>
                        </div>
                    </div>
                {/* Danger Zone - Moved inside main container */}
                <div className="bg-white p-6 rounded-2xl border border-red-200 shadow-sm">
                    <h3 className="text-lg font-bold text-red-600 mb-6 flex items-center gap-2">
                        <AlertTriangle size={20} />
                        危險區域 (Danger Zone)
                    </h3>
                    
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-red-50 last:pb-0 last:border-0">
                        <div className="flex-1">
                            <h4 className="font-bold text-slate-900 text-sm">重置所有分析紀錄</h4>
                            <p className="text-xs text-slate-500 mt-1 max-w-md">
                                刪除資料庫中所有的分析結果、挑戰紀錄與收藏。這將允許用戶重新分析他們的畫作以獲得最新的評分標準。
                                <br/>
                                <span className="font-bold text-red-500">此動作無法復原。</span>
                            </p>
                        </div>
                        <button 
                            onClick={handleResetAnalysis}
                            disabled={isResetting}
                            className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-bold hover:bg-red-600 hover:text-white transition-all disabled:opacity-50 shadow-sm flex items-center gap-2"
                        >
                            {isResetting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"/>
                                    處理中...
                                </>
                            ) : (
                                <>
                                    <Database size={16} />
                                    清除所有資料
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        );

      case "support":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">客服系統</h2>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button 
                        onClick={() => setTicketStatusFilter("open")}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${ticketStatusFilter === 'open' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        待處理 (Pending)
                    </button>
                    <button 
                        onClick={() => setTicketStatusFilter("closed")}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${ticketStatusFilter === 'closed' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        已結案 (Resolved)
                    </button>
                    <button 
                        onClick={() => setTicketStatusFilter("all")}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${ticketStatusFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        全部 (All)
                    </button>
                </div>
            </div>
            
            {/* Tag Filter */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap gap-2 items-center">
                <div className="flex items-center gap-2 mr-2">
                    <Filter size={20} className="text-slate-400" />
                    <span className="text-sm font-bold text-slate-500">分類篩選:</span>
                </div>
                <button
                    onClick={() => setTicketTagFilter("")}
                    className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                        ticketTagFilter === "" 
                        ? "bg-slate-900 text-white shadow-sm" 
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                >
                    所有分類
                </button>
                {SUPPORT_CATEGORIES.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => setTicketTagFilter(cat.id)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                            ticketTagFilter === cat.id 
                            ? "bg-slate-900 text-white shadow-sm" 
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="p-4 text-xs font-bold text-slate-500">用戶</th>
                            <th className="p-4 text-xs font-bold text-slate-500">主旨</th>
                            <th className="p-4 text-xs font-bold text-slate-500">標籤</th>
                            <th className="p-4 text-xs font-bold text-slate-500">狀態</th>
                            <th className="p-4 text-xs font-bold text-slate-500">時間</th>
                            <th className="p-4 text-xs font-bold text-slate-500">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {tickets.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-slate-400 text-sm">目前沒有符合條件的案件</td>
                            </tr>
                        ) : (
                            tickets.map((ticket) => (
                                <tr key={ticket.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-slate-200 overflow-hidden">
                                                 {ticket.user.image && <img src={ticket.user.image} className="w-full h-full object-cover" />}
                                            </div>
                                            <div className="text-sm font-bold text-slate-900">{ticket.user.name}</div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm text-slate-700 font-bold">{ticket.subject || "無主旨"}</td>
                                    <td className="p-4">
                                        <div className="flex flex-wrap gap-1">
                                            {ticket.tags && ticket.tags.length > 0 ? (
                                                ticket.tags.map((tag: string, idx: number) => {
                                                    const cat = SUPPORT_CATEGORIES.find(c => c.id === tag);
                                                    return (
                                                        <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold">
                                                            {cat ? cat.label : tag}
                                                        </span>
                                                    );
                                                })
                                            ) : (
                                                <span className="text-slate-300 text-xs">-</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                                            ticket.status === 'open' ? 'bg-rose-100 text-rose-600' : 
                                            ticket.status === 'closed' ? 'bg-emerald-100 text-emerald-600' : 
                                            'bg-blue-100 text-blue-600'
                                        }`}>
                                            {ticket.status === 'open' ? '待處理' : ticket.status === 'closed' ? '已結案' : '處理中'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-xs text-slate-400">{new Date(ticket.createdAt).toLocaleString()}</td>
                                    <td className="p-4 flex gap-3">
                                        <button 
                                            onClick={() => setSelectedTicket(ticket)}
                                            className="text-xs font-bold text-blue-600 hover:underline"
                                        >
                                            回覆
                                        </button>
                                        <button 
                                            onClick={() => {
                                                setSelectedTicket(ticket);
                                                setEditingTicketTags(ticket.tags || []);
                                                setIsTagModalOpen(true);
                                            }}
                                            className="text-xs font-bold text-slate-600 hover:underline"
                                        >
                                            標籤
                                        </button>
                                        <button 
                                            onClick={() => {
                                                if (ticket.user) {
                                                    setSelectedUserForCredit(ticket.user);
                                                    setCreditAmount(ticket.user.credits || 0);
                                                    setIsCreditModalOpen(true);
                                                }
                                            }}
                                            className="text-xs font-bold text-emerald-600 hover:underline"
                                        >
                                            補償
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
          </div>
        );

      default: // overview
        return (
          <div className="space-y-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Users size={18} /></div>
                        <span className="text-xs font-bold text-slate-500">總會員數</span>
                    </div>
                    <div className="text-2xl font-black text-slate-900">{stats.totalUsers}</div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Activity size={18} /></div>
                        <span className="text-xs font-bold text-slate-500">總分析次數</span>
                    </div>
                    <div className="text-2xl font-black text-slate-900">{stats.totalAnalysis}</div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Activity size={18} /></div>
                        <span className="text-xs font-bold text-slate-500">分析比例 ({analysisTimeRange})</span>
                    </div>
                    <div className="flex items-end gap-2">
                         <div className="text-xl font-black text-slate-900">{generalRatio}%</div>
                         <div className="text-xs text-slate-400 mb-1">一般</div>
                         <div className="w-px h-4 bg-slate-200 mx-1"></div>
                         <div className="text-xl font-black text-slate-900">{masterRatio}%</div>
                         <div className="text-xs text-slate-400 mb-1">大師</div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><CreditCard size={18} /></div>
                        <span className="text-xs font-bold text-slate-500">總發行點數 (可分析)</span>
                    </div>
                    <div className="text-2xl font-black text-slate-900">{stats.totalCredits.toLocaleString()}</div>
                </div>
            </div>

            {/* Recent Users Table Preview */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-slate-900">最新註冊會員</h3>
                    <button onClick={() => setActiveTab("users")} className="text-xs font-bold text-blue-600 hover:underline">查看全部</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="p-4 text-xs font-bold text-slate-500">用戶</th>
                                <th className="p-4 text-xs font-bold text-slate-500">來源</th>
                                <th className="p-4 text-xs font-bold text-slate-500">日期</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                             {stats.recentUsers.map((u: any) => (
                                <tr key={u.id}>
                                    <td className="p-4 flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-slate-200 overflow-hidden">
                                            {u.image && <img src={u.image} className="w-full h-full object-cover" />}
                                        </div>
                                        <span className="text-sm font-bold text-slate-700">{u.name || "Unknown"}</span>
                                    </td>
                                    <td className="p-4 text-xs font-bold text-slate-500">{u.provider}</td>
                                    <td className="p-4 text-xs text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                                </tr>
                             ))}
                        </tbody>
                    </table>
                </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 fixed h-full z-20 hidden md:flex flex-col">
        <div className="p-6 border-b border-slate-100">
            <Link href="/" className="flex items-center gap-2 text-slate-900 hover:opacity-70 transition-opacity">
                <div className="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center text-white font-black">A</div>
                <span className="font-bold text-lg">ArtBuddy Admin</span>
            </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
            <button 
                onClick={() => setActiveTab("overview")}
                className={clsx("w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-colors", activeTab === "overview" ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50")}
            >
                <LayoutDashboard size={18} />
                總覽儀表板
            </button>
            <button 
                onClick={() => setActiveTab("users")}
                className={clsx("w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-colors", activeTab === "users" ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50")}
            >
                <Users size={18} />
                會員管理
            </button>
            <button 
                onClick={() => setActiveTab("revenue")}
                className={clsx("w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-colors", activeTab === "revenue" ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50")}
            >
                <CreditCard size={18} />
                營收報表
            </button>
            <button 
                onClick={() => setActiveTab("support")}
                className={clsx("w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-colors", activeTab === "support" ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50")}
            >
                <MessageSquare size={18} />
                客服系統
            </button>
            <div className="pt-4 mt-4 border-t border-slate-100">
                <button 
                    onClick={() => setActiveTab("settings")}
                    className={clsx("w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-colors", activeTab === "settings" ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50")}
                >
                    <Settings size={18} />
                    系統設定
                </button>
            </div>
        </nav>
        <div className="p-4 border-t border-slate-100">
            <div className="flex items-center gap-3 px-4 py-2">
                <img src={session?.user?.image || ""} className="w-8 h-8 rounded-full bg-slate-200" />
                <div className="overflow-hidden">
                    <div className="text-sm font-bold text-slate-900 truncate">{session?.user?.name}</div>
                    <div className="text-xs text-slate-400">Super Admin</div>
                </div>
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 min-h-screen">
        <header className="h-16 bg-white/80 backdrop-blur border-b border-slate-200 sticky top-0 z-10 px-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <h1 className="text-lg font-bold text-slate-900 capitalize">
                    {activeTab === "overview" ? "總覽儀表板" : 
                     activeTab === "users" ? "會員管理" : 
                     activeTab === "revenue" ? "營收報表" : 
                     activeTab === "support" ? "客服系統" : "系統設定"}
                </h1>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold border border-emerald-100">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    DB Live
                </div>
            </div>
            <div className="flex items-center gap-4">
                <Link href="/" className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1">
                    回前台 <ArrowLeft size={14} />
                </Link>
            </div>
        </header>
        <div className="p-6 max-w-7xl mx-auto">
            {renderContent()}
        </div>
      </main>

      {/* User Management Modal */}
      {isUserModalOpen && editingUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-4">
                <div className="flex justify-between items-start">
                    <h3 className="text-lg font-bold text-slate-900">{editingUser.id ? '編輯會員' : '新增會員'}</h3>
                    <button onClick={() => setIsUserModalOpen(false)}><X size={20} className="text-slate-400" /></button>
                </div>
                
                <form onSubmit={handleSaveUser} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">姓名</label>
                        <input 
                            type="text" 
                            required
                            value={editingUser.name}
                            onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-slate-900/10"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                        <input 
                            type="email" 
                            required
                            disabled={!!editingUser.id}
                            value={editingUser.email}
                            onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-slate-900/10 disabled:opacity-50"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">身分 (Role)</label>
                            <select 
                                value={editingUser.role}
                                onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-slate-900/10"
                            >
                                <option value="user">一般會員</option>
                                <option value="admin">管理員</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">等級 (Plan)</label>
                            <select 
                                value={editingUser.plan}
                                onChange={(e) => setEditingUser({...editingUser, plan: e.target.value})}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-slate-900/10"
                            >
                                <option value="free">Free</option>
                                <option value="plus">Plus</option>
                                <option value="pro">Pro</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">點數 (Credits)</label>
                        <input 
                            type="number" 
                            required
                            min="0"
                            value={editingUser.credits}
                            onChange={(e) => setEditingUser({...editingUser, credits: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-slate-900/10"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setIsUserModalOpen(false)} className="px-6 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl">取消</button>
                        <button type="submit" className="px-6 py-2 bg-slate-900 text-white font-bold rounded-xl">儲存</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* Edit Credits Modal */}
      {isCreditModalOpen && selectedUserForCredit && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4">
                <h3 className="text-lg font-bold text-slate-900">管理用戶點數</h3>
                <p className="text-sm text-slate-500">調整 {selectedUserForCredit.name} 的可用分析次數。</p>
                <div className="flex items-center gap-4 justify-center py-4">
                    <button onClick={() => setCreditAmount(Math.max(0, creditAmount - 1))} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"><Minus size={20} /></button>
                    <span className="text-3xl font-black text-slate-900">{creditAmount}</span>
                    <button onClick={() => setCreditAmount(creditAmount + 1)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"><Plus size={20} /></button>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setIsCreditModalOpen(false)} className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl">取消</button>
                    <button onClick={() => handleUpdateCredits(selectedUserForCredit.id, creditAmount)} className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-xl">確認更新</button>
                </div>
            </div>
        </div>
      )}

      {/* Ticket Reply Modal */}
      {/* Ticket Reply Modal */}
      {selectedTicket && !isTagModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">回覆客訴案件</h3>
                        <p className="text-xs text-slate-500 mt-1">案件 ID: {selectedTicket.id}</p>
                    </div>
                    <button onClick={() => setSelectedTicket(null)}><X size={20} className="text-slate-400" /></button>
                </div>
                
                <div className="space-y-4">
                    <div className="bg-slate-50 p-4 rounded-xl space-y-2">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">用戶描述</div>
                        <div className="text-sm font-bold text-slate-700">{selectedTicket.subject}</div>
                        <div className="text-sm text-slate-600 whitespace-pre-wrap">{selectedTicket.content}</div>
                    </div>

                    {selectedTicket.reply && (
                        <div className="bg-emerald-50 p-4 rounded-xl space-y-2 border border-emerald-100">
                            <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">先前已回覆</div>
                            <div className="text-sm text-emerald-700 whitespace-pre-wrap">{selectedTicket.reply}</div>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">回覆內容</label>
                        <textarea 
                            rows={4}
                            value={ticketReply}
                            onChange={(e) => setTicketReply(e.target.value)}
                            placeholder="輸入回覆內容..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-slate-900/10 transition-all resize-none"
                        />
                    </div>

                    <div className="flex gap-3">
                        <button 
                            onClick={() => handleReplyTicket(selectedTicket.id)}
                            className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10"
                        >
                            傳送回覆並結案
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Ticket Tag Modal */}
      {isTagModalOpen && selectedTicket && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-6 shadow-2xl">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">管理標籤</h3>
                        <p className="text-xs text-slate-500 mt-1">{selectedTicket.subject}</p>
                    </div>
                    <button onClick={() => setIsTagModalOpen(false)}><X size={20} className="text-slate-400" /></button>
                </div>

                <div className="space-y-4">
                    <div className="flex flex-wrap gap-2 min-h-[40px] p-3 bg-slate-50 rounded-xl border border-slate-100">
                        {editingTicketTags.length === 0 ? (
                            <span className="text-slate-400 text-xs italic">尚未設定標籤</span>
                        ) : (
                            editingTicketTags.map((tag) => {
                                const cat = SUPPORT_CATEGORIES.find(c => c.id === tag);
                                return (
                                    <span key={tag} className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-700 border border-slate-200 rounded-lg text-xs font-bold shadow-sm">
                                        {cat ? cat.label : tag}
                                        <button onClick={() => handleRemoveTag(tag)} className="text-slate-400 hover:text-red-500 transition-colors">
                                            <X size={14} />
                                        </button>
                                    </span>
                                );
                            })
                        )}
                    </div>

                    <div className="flex gap-2">
                        <select 
                            value={newTagInput}
                            onChange={(e) => setNewTagInput(e.target.value)}
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-slate-900/10 transition-all cursor-pointer"
                        >
                            <option value="">選擇分類...</option>
                            {SUPPORT_CATEGORIES.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.label}
                                </option>
                            ))}
                        </select>
                        <button 
                            onClick={handleAddTag}
                            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all"
                        >
                            新增
                        </button>
                    </div>

                    <div className="pt-4 flex gap-3 border-t border-slate-100">
                        <button 
                            onClick={() => setIsTagModalOpen(false)}
                            className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
                        >
                            取消
                        </button>
                        <button 
                            onClick={handleUpdateTags}
                            className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/10"
                        >
                            儲存標籤
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
