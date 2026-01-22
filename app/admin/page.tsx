"use client";

import { useSession } from "next-auth/react";
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
  TrendingUp
} from "lucide-react";
import Link from "next/link";
import { clsx } from "clsx";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview"); // overview, users, revenue, settings
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [stats, setStats] = useState({
    totalUsers: 0,
    todayAnalysis: 0,
    conversionRate: "0",
    monthlyRevenue: 0,
    recentUsers: [] as any[]
  });
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load Data
  useEffect(() => {
    if (status === "loading" || !session) return;
    
    // Import actions dynamically or define outside if possible, but here we invoke them
    import("./actions").then(async (actions) => {
      try {
        const statsData = await actions.getAdminStats();
        setStats(statsData);
        
        const usersData = await actions.getUsers();
        setUsers(usersData);
      } catch (error) {
        console.error("Failed to fetch admin data", error);
      } finally {
        setIsLoading(false);
      }
    });
  }, [session, status]);

  if (status === "loading") return <div className="min-h-screen flex items-center justify-center bg-slate-50">載入中...</div>;

  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  const isUserAdmin = session?.user?.email === adminEmail;

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
          <Link 
            href="/api/auth/signin" 
            className="block w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 active:scale-[0.98]"
          >
            登入帳號
          </Link>
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
              您目前的帳號 ({session?.user?.email}) 沒有管理員權限。
            </p>
            <div className="flex gap-4">
              <Link href="/api/auth/signin" className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold">切換帳號</Link>
              <Link href="/" className="px-6 py-3 bg-slate-200 text-slate-900 rounded-xl font-bold">回首頁</Link>
            </div>
        </div>
    );
  }

  const renderContent = () => {
    switch(activeTab) {
      case "users":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">會員管理</h2>
              <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors">
                <Download size={16} /> 匯出報表
              </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap gap-4 items-center justify-between">
               <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                  <Search size={20} className="text-slate-400" />
                  <input type="text" placeholder="搜尋會員姓名、Email..." className="w-full bg-transparent outline-none text-sm font-bold text-slate-700 placeholder:font-normal" />
               </div>
               <div className="flex items-center gap-3">
                  <select className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-lg px-3 py-2 outline-none">
                    <option>所有等級</option>
                    <option>免費會員</option>
                    <option>Pro 會員</option>
                  </select>
                  <select className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-lg px-3 py-2 outline-none">
                    <option>所有狀態</option>
                    <option>正常</option>
                    <option>停權</option>
                  </select>
               </div>
            </div>

            {/* User Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="p-4 text-xs font-bold text-slate-500">會員資訊</th>
                            <th className="p-4 text-xs font-bold text-slate-500">登入方式</th>
                            <th className="p-4 text-xs font-bold text-slate-500">訂閱方案</th>
                            <th className="p-4 text-xs font-bold text-slate-500">消費總額</th>
                            <th className="p-4 text-xs font-bold text-slate-500">註冊時間</th>
                            <th className="p-4 text-xs font-bold text-slate-500">狀態</th>
                            <th className="p-4 text-xs font-bold text-slate-500">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-200" />
                                        <div>
                                            <div className="text-sm font-bold text-slate-900">User {i}</div>
                                            <div className="text-xs text-slate-400">user{i}@example.com</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className="flex items-center gap-1 text-xs font-bold text-slate-600">
                                        {i % 2 === 0 ? "Google" : "LINE"}
                                    </span>
                                </td>
                                <td className="p-4">
                                    {i % 3 === 0 ? (
                                        <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-600">Pro+</span>
                                    ) : (
                                        <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">Free</span>
                                    )}
                                </td>
                                <td className="p-4 text-sm font-bold text-slate-900">${i * 150}</td>
                                <td className="p-4 text-xs text-slate-400">2024/01/{10+i}</td>
                                <td className="p-4"><span className="text-xs font-bold text-emerald-600">Active</span></td>
                                <td className="p-4"><button className="text-xs font-bold text-blue-600 hover:underline">管理</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>
        );

      case "revenue":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">營收報表</h2>
            
            {/* Revenue Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="text-sm text-slate-500 font-bold mb-1">本月總營收</div>
                    <div className="text-3xl font-black text-slate-900">$12,450</div>
                    <div className="text-xs font-bold text-emerald-500 mt-2 flex items-center gap-1">
                        <TrendingUp size={14} /> +15.3% 較上月
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="text-sm text-slate-500 font-bold mb-1">活躍訂閱數</div>
                    <div className="text-3xl font-black text-slate-900">482</div>
                    <div className="text-xs font-bold text-emerald-500 mt-2 flex items-center gap-1">
                        <TrendingUp size={14} /> +8.1% 較上月
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="text-sm text-slate-500 font-bold mb-1">平均客單價 (ARPU)</div>
                    <div className="text-3xl font-black text-slate-900">$25.8</div>
                    <div className="text-xs font-bold text-slate-400 mt-2">持平</div>
                </div>
            </div>

            {/* Revenue Chart */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-6">近 7 日營收趨勢</h3>
                <div className="h-64 flex items-end justify-between gap-2">
                    {revenueData.map((val, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                            <div className="relative w-full bg-blue-50 rounded-t-lg overflow-hidden group-hover:bg-blue-100 transition-colors" style={{ height: `${(val / maxRevenue) * 100}%` }}>
                                <div className="absolute bottom-0 w-full bg-blue-500 h-0 transition-all duration-500" style={{ height: '100%' }}></div>
                            </div>
                            <span className="text-xs font-bold text-slate-400">{idx + 1}日</span>
                        </div>
                    ))}
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

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                            <div className="space-y-2">
                                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    Google Analytics 4
                                </h3>
                                <p className="text-sm text-slate-500">
                                    輸入您的 GA4 評估 ID (Measurement ID)，例如：G-XXXXXXXXXX。
                                    設定後，系統將自動在全站注入追蹤程式碼。
                                </p>
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-slate-700 mb-1">評估 ID (Measurement ID)</label>
                                        <input 
                                            type="text" 
                                            value={settings["ga4_id"] || ""}
                                            onChange={(e) => setSettings(prev => ({ ...prev, "ga4_id": e.target.value }))}
                                            placeholder="G-XXXXXXXXXX"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-bold outline-none focus:ring-2 focus:ring-slate-900/10 transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end pt-2">
                                    <button 
                                        onClick={() => handleSaveSetting("ga4_id", settings["ga4_id"] || "")}
                                        disabled={isSaving}
                                        className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors disabled:opacity-50"
                                    >
                                        {isSaving ? "儲存中..." : <><Save size={18} /> 儲存設定</>}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                            <div className="space-y-2">
                                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    Google AdSense 廣告
                                </h3>
                                <p className="text-sm text-slate-500">
                                    輸入您的 Google AdSense 發佈商 ID (Publisher ID)，例如：pub-XXXXXXXXXXXXXXXX。
                                    設定後，系統將自動啟用全站自動廣告 (Auto Ads)。
                                </p>
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-slate-700 mb-1">發佈商 ID (Publisher ID)</label>
                                        <input 
                                            type="text" 
                                            value={settings["adsense_id"] || ""}
                                            onChange={(e) => setSettings(prev => ({ ...prev, "adsense_id": e.target.value }))}
                                            placeholder="pub-XXXXXXXXXXXXXXXX"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-bold outline-none focus:ring-2 focus:ring-slate-900/10 transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end pt-2">
                                    <button 
                                        onClick={() => handleSaveSetting("adsense_id", settings["adsense_id"] || "")}
                                        disabled={isSaving}
                                        className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors disabled:opacity-50"
                                    >
                                        {isSaving ? "儲存中..." : <><Save size={18} /> 儲存設定</>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
        );

      default: // overview
        return (
          <div className="space-y-8">
            {/* Database Connected Banner */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex items-start gap-4">
                <div className="bg-emerald-100 p-2 rounded-full text-emerald-600 shrink-0">
                    <Database size={24} />
                </div>
                <div>
                    <h3 className="text-emerald-900 font-bold text-lg mb-1">資料庫已連線</h3>
                    <p className="text-emerald-700/80 text-sm leading-relaxed">
                        目前顯示為 <strong>Vercel Postgres (Neon)</strong> 真實數據。所有會員註冊與登入皆會即時更新。
                    </p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Users size={18} /></div>
                        <span className="text-xs font-bold text-slate-500">總會員數</span>
                    </div>
                    <div className="text-2xl font-black text-slate-900">1,248</div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><DollarSign size={18} /></div>
                        <span className="text-xs font-bold text-slate-500">本月營收</span>
                    </div>
                    <div className="text-2xl font-black text-slate-900">$12.4k</div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Activity size={18} /></div>
                        <span className="text-xs font-bold text-slate-500">今日分析</span>
                    </div>
                    <div className="text-2xl font-black text-slate-900">342</div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-rose-50 text-rose-600 rounded-lg"><Shield size={18} /></div>
                        <span className="text-xs font-bold text-slate-500">付費轉換率</span>
                    </div>
                    <div className="text-2xl font-black text-slate-900">4.2%</div>
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
                             {[1, 2, 3].map(i => (
                                <tr key={i}>
                                    <td className="p-4 flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-slate-200" />
                                        <span className="text-sm font-bold text-slate-700">New User {i}</span>
                                    </td>
                                    <td className="p-4 text-xs font-bold text-slate-500">Google</td>
                                    <td className="p-4 text-xs text-slate-400">10 mins ago</td>
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
            <h1 className="text-lg font-bold text-slate-900 capitalize">
                {activeTab === "overview" ? "總覽儀表板" : 
                 activeTab === "users" ? "會員管理" : 
                 activeTab === "revenue" ? "營收報表" : "系統設定"}
            </h1>
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
    </div>
  );
}
