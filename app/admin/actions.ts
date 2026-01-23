"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

async function checkAdmin() {
  const session = await auth();
  if (!session?.user?.email) {
     throw new Error("Unauthorized");
  }
  
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  // @ts-ignore
  if (session.user.email !== adminEmail && session.user.role !== 'admin') {
     throw new Error("Unauthorized");
  }
  return session;
}

export async function getAdminStats() {
  await checkAdmin();

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Basic counts
  const totalUsers = await prisma.user.count();
  const totalAnalysis = await prisma.analysis.count();
  
  // Recent activity (7 days)
  const last7DaysAnalyses = await prisma.analysis.findMany({
    where: { createdAt: { gte: sevenDaysAgo } },
    include: { user: true }
  });

  const last7DaysTotal = last7DaysAnalyses.length;
  
  // Unique users in last 7 days
  const uniqueUserIds = new Set(last7DaysAnalyses.map(a => a.userId));
  const last7DaysUniqueUsers = uniqueUserIds.size;

  // Average usage
  const last7DaysAvgUsage = last7DaysUniqueUsers > 0 
    ? (last7DaysTotal / last7DaysUniqueUsers).toFixed(1) 
    : "0";

  // Paid ratio (analyses by paid users / total)
  const paidAnalyses = last7DaysAnalyses.filter(a => a.user.plan === 'plus' || a.user.plan === 'pro').length;
  const last7DaysPaidRatio = last7DaysTotal > 0 
    ? ((paidAnalyses / last7DaysTotal) * 100).toFixed(1) 
    : "0";

  // Distributions
  const users = await prisma.user.findMany();
  const paidUsersPlus = users.filter(u => u.plan === 'plus').length;
  const paidUsersPro = users.filter(u => u.plan === 'pro').length;
  const totalPaidUsers = paidUsersPlus + paidUsersPro;

  // Trend 7 days
  const trend7dMap = new Map<string, { total: number, general: number, master: number, paid: number }>();
  
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString();
    trend7dMap.set(dateStr, { total: 0, general: 0, master: 0, paid: 0 });
  }

  last7DaysAnalyses.forEach(a => {
    const dateStr = new Date(a.createdAt).toLocaleDateString();
    if (trend7dMap.has(dateStr)) {
        const entry = trend7dMap.get(dateStr)!;
        entry.total++;
        if (a.type === 'general') entry.general++;
        if (a.type === 'master_style') entry.master++;
        if (a.user.plan === 'plus' || a.user.plan === 'pro') entry.paid++;
    }
  });

  const trend7d = Array.from(trend7dMap.entries()).map(([date, data]) => ({
    date,
    ...data
  })).reverse();

  // Revenue Metrics (Estimated)
  // Monthly Revenue: Plus(150) + Pro(300)
  const revenuePlus = paidUsersPlus * 150;
  const revenuePro = paidUsersPro * 300;
  const monthlyRevenue = revenuePlus + revenuePro;
  
  // Today Revenue (Estimated as 1/30 of monthly)
  const todayRevenue = Math.round(monthlyRevenue / 30);
  
  const arpu = totalUsers > 0 ? Math.round(monthlyRevenue / totalUsers) : 0;
  
  // API Cost Estimation (approx 1 TWD per analysis)
  const last7DaysApiCost = last7DaysTotal * 1; 
  const last7DaysGrossProfit = Math.round((monthlyRevenue * 7 / 30) - last7DaysApiCost);

  // Recent Users
  const recentUsers = await prisma.user.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, image: true, createdAt: true, loginMethod: true }
  });

  const totalCredits = users.reduce((sum, u) => sum + u.credits + u.subscriptionCredits, 0);

  return {
    totalUsers,
    totalAnalysis,
    totalPaidUsers,
    paidUsersPlus,
    paidUsersPro,
    totalCredits,
    recentUsers: recentUsers.map(u => ({ ...u, provider: u.loginMethod || 'email' })),
    trend7d,
    trendMonthly: [], // Placeholder if not needed immediately
    last7DaysTotal,
    last7DaysUniqueUsers,
    last7DaysAvgUsage,
    last7DaysPaidRatio,
    revenueMetrics: {
        monthlyRevenue,
        todayRevenue,
        revenuePlus,
        revenuePro,
        arpu,
        last7DaysPaidAnalysis: paidAnalyses,
        last7DaysApiCost,
        last7DaysGrossProfit
    }
  };
}

export async function getUsers(query: string, role: string, plan: string) {
  await checkAdmin();
  
  const where: any = {};
  if (query) {
    where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } }
    ];
  }
  if (role !== 'all') where.role = role;
  if (plan !== 'all') where.plan = plan;

  return await prisma.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100
  });
}

export async function createUser(data: any) {
    await checkAdmin();
    // Simplified create
    return await prisma.user.create({ data });
}

export async function updateUser(userId: string, data: any) {
    await checkAdmin();
    return await prisma.user.update({
        where: { id: userId },
        data
    });
}

export async function deleteUser(userId: string) {
    await checkAdmin();
    return await prisma.user.delete({
        where: { id: userId }
    });
}

export async function updateUserCredits(userId: string, credits: number) {
    await checkAdmin();
    return await prisma.user.update({
        where: { id: userId },
        data: { credits }
    });
}

export async function getTickets(status: string = 'all', tag: string = '') {
    await checkAdmin();
    const where: any = {};
    if (status !== 'all') where.status = status;
    if (tag) where.tags = { has: tag };

    return await prisma.ticket.findMany({
        where,
        include: { user: true },
        orderBy: { createdAt: 'desc' }
    });
}

export async function replyTicket(ticketId: string, reply: string) {
  await checkAdmin();
  return await prisma.ticket.update({
    where: { id: ticketId },
    data: { 
        reply,
        status: 'closed',
        updatedAt: new Date()
    }
  });
}

export async function updateTicketTags(ticketId: string, tags: string[]) {
    await checkAdmin();
    return await prisma.ticket.update({
        where: { id: ticketId },
        data: { tags }
    });
}

export async function getSystemSettings() {
    await checkAdmin();
    const settings = await prisma.systemSetting.findMany();
    const result: Record<string, string> = {};
    settings.forEach(s => result[s.key] = s.value);
    return result;
}

export async function saveSystemSetting(key: string, value: string) {
    await checkAdmin();
    return await prisma.systemSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value, description: '' }
    });
}

export async function resetAllAnalysis() {
    await checkAdmin();
    const { count } = await prisma.analysis.deleteMany();
    // Also clear favorites and user challenges if necessary, but analysis delete cascade might handle it if set up, 
    // otherwise manual delete. Schema says User -> Analysis (Cascade), but Analysis -> others?
    // Assuming simple delete for now.
    return { success: true, count };
}
