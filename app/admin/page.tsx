"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Shield, Users, Database, Activity, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/");
      return;
    }

    // Check if user is admin
    // You should add your email to .env.local as NEXT_PUBLIC_ADMIN_EMAIL
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
    
    // For testing purposes, we log the current user email to help you set it up
    console.log("Current User Email:", session.user?.email);
    console.log("Configured Admin Email:", adminEmail);

    if (session.user?.email === adminEmail) {
      setIsAdmin(true);
    } else {
      // alert("權限不足：您不是管理員");
      // router.push("/");
      // For now, let's allow viewing but show a warning if email doesn't match
      // This helps you test without setting up env immediately, but in production this should be strict
      // setIsAdmin(true); // Uncomment to force allow for testing
    }
  }, [session, status, router]);

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50">載入中...</div>;
  }

  // Strict check for render
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  const isUserAdmin = session?.user?.email === adminEmail;

  if (!isUserAdmin) {
     return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
            <Shield size={64} className="text-slate-300 mb-4" />
            <h1 className="text-2xl font-bold text-slate-900 mb-2">權限不足</h1>
            <p className="text-slate-500 text-center max-w-md mb-8">
                此頁面僅限管理員存取。<br/>
                請確認您已在 `.env` 檔案中設定 `NEXT_PUBLIC_ADMIN_EMAIL={session?.user?.email}`。
            </p>
            <div className="bg-white p-4 rounded-xl border border-slate-200 mb-8 w-full max-w-md">
                <p className="text-xs text-slate-400 font-bold mb-1">您的 Email</p>
                <code className="block bg-slate-100 p-2 rounded text-sm break-all">{session?.user?.email}</code>
            </div>
            <Link href="/" className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors">
                回首頁
            </Link>
        </div>
     );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <ArrowLeft size={20} className="text-slate-600" />
            </Link>
            <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Shield size={18} className="text-rose-500" />
                總管理後台
            </h1>
          </div>
          <div className="flex items-center gap-3">
             <div className="text-xs text-right hidden sm:block">
                <div className="font-bold text-slate-900">{session?.user?.name}</div>
                <div className="text-slate-400">超級管理員</div>
             </div>
             <img 
                src={session?.user?.image || ""} 
                alt="Admin" 
                className="w-8 h-8 rounded-full bg-slate-200"
             />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        
        {/* Warning Banner about Database */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-start gap-4">
            <div className="bg-amber-100 p-2 rounded-full text-amber-600 shrink-0">
                <Database size={24} />
            </div>
            <div>
                <h3 className="text-amber-900 font-bold text-lg mb-1">尚未連接資料庫</h3>
                <p className="text-amber-700/80 text-sm leading-relaxed">
                    目前系統運行在「無伺服器 (Serverless)」模式，會員資料與使用紀錄僅暫存在使用者的瀏覽器中 (LocalStorage)。
                    <br/><br/>
                    <strong>無法執行以下功能：</strong>
                    <ul className="list-disc pl-5 mt-1 space-y-1">
                        <li>查看所有註冊會員列表</li>
                        <li>統計總分析次數</li>
                        <li>管理特定會員權限</li>
                    </ul>
                    <br/>
                    建議連接 <strong>Vercel Postgres</strong> 或 <strong>MongoDB</strong> 以啟用完整後台功能。
                </p>
            </div>
        </div>

        {/* Stats Grid (Mockup/Realtime Session) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-blue-50 text-blue-500 rounded-lg">
                        <Activity size={20} />
                    </div>
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">即時</span>
                </div>
                <div className="text-3xl font-black text-slate-900">運行中</div>
                <div className="text-sm text-slate-500 mt-1">系統狀態正常</div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-purple-50 text-purple-500 rounded-lg">
                        <Users size={20} />
                    </div>
                    <span className="text-xs font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded">模擬數據</span>
                </div>
                <div className="text-3xl font-black text-slate-900">1,248</div>
                <div className="text-sm text-slate-500 mt-1">總註冊會員數 (範例)</div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-emerald-50 text-emerald-500 rounded-lg">
                        <Shield size={20} />
                    </div>
                </div>
                <div className="text-3xl font-black text-slate-900">Plus</div>
                <div className="text-sm text-slate-500 mt-1">最多訂閱方案 (範例)</div>
            </div>
        </div>

        {/* Member List Mockup */}
        <section>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900">會員列表 (模擬預覽)</h2>
                <div className="flex gap-2">
                    <button className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50">匯出 CSV</button>
                    <button className="px-3 py-1.5 bg-rose-500 text-white rounded-lg text-xs font-bold hover:bg-rose-600">新增會員</button>
                </div>
            </div>
            
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="p-4 text-xs font-bold text-slate-500">用戶資訊</th>
                                <th className="p-4 text-xs font-bold text-slate-500">登入方式</th>
                                <th className="p-4 text-xs font-bold text-slate-500">會員等級</th>
                                <th className="p-4 text-xs font-bold text-slate-500">分析次數</th>
                                <th className="p-4 text-xs font-bold text-slate-500">註冊日期</th>
                                <th className="p-4 text-xs font-bold text-slate-500">狀態</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {/* Mock Data Row 1: Admin */}
                            <tr className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden">
                                            <img src={session?.user?.image || "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin"} alt="User" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-slate-900">{session?.user?.name || "Irisa Ho"}</div>
                                            <div className="text-xs text-slate-400">{session?.user?.email || "admin@example.com"}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                                        <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">G</div>
                                        Google
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-600 border border-rose-200">
                                        Pro+ 會員
                                    </span>
                                </td>
                                <td className="p-4 text-sm text-slate-600 font-bold">142 次</td>
                                <td className="p-4 text-xs text-slate-400">2024/01/15</td>
                                <td className="p-4">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block mr-2"></span>
                                    <span className="text-xs font-bold text-emerald-600">正常</span>
                                </td>
                            </tr>

                            {/* Mock Data Row 2: Free User */}
                            <tr className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 text-xs font-bold">
                                            AL
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-slate-900">Alex Chen</div>
                                            <div className="text-xs text-slate-400">alex.chen@test.com</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                                        <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center text-green-600">L</div>
                                        LINE
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                                        免費會員
                                    </span>
                                </td>
                                <td className="p-4 text-sm text-slate-600 font-bold">5 次</td>
                                <td className="p-4 text-xs text-slate-400">2024/02/01</td>
                                <td className="p-4">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block mr-2"></span>
                                    <span className="text-xs font-bold text-emerald-600">正常</span>
                                </td>
                            </tr>

                            {/* Mock Data Row 3: Plus User */}
                            <tr className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-amber-100 overflow-hidden">
                                             <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" alt="User" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-slate-900">Sarah Wu</div>
                                            <div className="text-xs text-slate-400">sarah.wu@gmail.com</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                                        <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">G</div>
                                        Google
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-purple-100 text-purple-600 border border-purple-200">
                                        Plus 會員
                                    </span>
                                </td>
                                <td className="p-4 text-sm text-slate-600 font-bold">28 次</td>
                                <td className="p-4 text-xs text-slate-400">2024/01/20</td>
                                <td className="p-4">
                                    <span className="w-2 h-2 rounded-full bg-amber-500 inline-block mr-2"></span>
                                    <span className="text-xs font-bold text-amber-600">待續費</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
                    <p className="text-xs text-slate-400">僅顯示前 3 筆模擬資料，請連接資料庫以查看完整列表</p>
                </div>
            </div>
        </section>

        {/* Action Area */}
        <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">開發者工具</h2>
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer" onClick={() => alert("功能開發中")}>
                    <div>
                        <div className="font-bold text-slate-900">清除系統緩存</div>
                        <div className="text-xs text-slate-500">重置所有本地暫存數據</div>
                    </div>
                    <button className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-bold">執行</button>
                </div>
                <div className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer" onClick={() => alert("功能開發中")}>
                    <div>
                        <div className="font-bold text-slate-900">測試 AI 分析接口</div>
                        <div className="text-xs text-slate-500">發送測試請求以驗證 OpenAI 連線</div>
                    </div>
                    <button className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-bold">執行</button>
                </div>
            </div>
        </section>

      </main>
    </div>
  );
}
