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
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">預估</span>
                </div>
                <div className="text-3xl font-black text-slate-900">--</div>
                <div className="text-sm text-slate-500 mt-1">需連接資料庫以顯示會員數</div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-rose-50 text-rose-500 rounded-lg">
                        <Shield size={20} />
                    </div>
                </div>
                <div className="text-3xl font-black text-slate-900">Admin</div>
                <div className="text-sm text-slate-500 mt-1">當前權限等級</div>
            </div>
        </div>

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
