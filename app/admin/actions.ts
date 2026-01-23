"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// Helper to check admin permission
async function checkAdmin() {
  const session = await auth();
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  // @ts-ignore
  const isAdmin = session?.user?.email === adminEmail || session?.user?.role === 'admin';
  
  if (!isAdmin) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function getAdminStats() {
  await checkAdmin();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // 1. User Stats
  const totalUsers = await prisma.user.count();
  const dailyRegistrations = await prisma.user.count({
    where: { createdAt: { gte: today } }
  });
  
  // Daily Logins (DAU)
  const dailyLogins = await prisma.user.count({
    where: { lastLogin: { gte: today } }
  });

  // Monthly Active Users (MAU) - Proxy for Retention/Activity
  const monthlyActiveUsers = await prisma.user.count({
    where: { lastLogin: { gte: thirtyDaysAgo } }
  });
  
  const retentionRate = totalUsers > 0 ? (monthlyActiveUsers / totalUsers) * 100 : 0;
  const activityLevel = totalUsers > 0 ? (dailyLogins / totalUsers) * 100 : 0;

  // Paid Users Breakdown
  const paidUsersPlus = await prisma.user.count({ where: { plan: "plus" } });
  const paidUsersPro = await prisma.user.count({ where: { plan: "pro" } });
  const totalPaidUsers = paidUsersPlus + paidUsersPro;

  // Unresolved Tickets
  const unresolvedTickets = await prisma.ticket.count({
    where: { status: "open" }
  });

  // 2. Analysis Stats
  const todayAnalysis = await prisma.analysis.count({
    where: { createdAt: { gte: today } }
  });
  const totalAnalysis = await prisma.analysis.count();

  // 3. Credits
  const usersWithCredits = await prisma.user.findMany({
    select: { credits: true },
  });
  const totalCredits = usersWithCredits.reduce((sum, user) => sum + (user.credits || 0), 0);

  // 4. Analysis Trend
  // 7 Days (Daily)
  const trend7d = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    const nextDate = new Date(date);
    nextDate.setDate(date.getDate() + 1);

    const generalCount = await prisma.analysis.count({
      where: { createdAt: { gte: date, lt: nextDate }, type: { not: "master_style" } },
    });
    const masterCount = await prisma.analysis.count({
      where: { createdAt: { gte: date, lt: nextDate }, type: "master_style" },
    });

    trend7d.push({
      date: date.toISOString(),
      general: generalCount,
      master: masterCount,
      total: generalCount + masterCount
    });
  }

  // Monthly Trend (Last 6 Months)
  const trendMonthly = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
    
    const nextMonth = new Date(date);
    nextMonth.setMonth(date.getMonth() + 1);

    const generalCount = await prisma.analysis.count({
      where: { createdAt: { gte: date, lt: nextMonth }, type: { not: "master_style" } },
    });
    const masterCount = await prisma.analysis.count({
      where: { createdAt: { gte: date, lt: nextMonth }, type: "master_style" },
    });

    trendMonthly.push({
      date: date.toISOString(),
      general: generalCount,
      master: masterCount,
      total: generalCount + masterCount
    });
  }

  // 5. Recent Users
  const recentUsers = await prisma.user.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      createdAt: true,
      plan: true
    }
  });

  return {
    totalUsers,
    dailyRegistrations,
    dailyLogins,
    monthlyActiveUsers,
    retentionRate: retentionRate.toFixed(1),
    activityLevel: activityLevel.toFixed(1),
    paidUsersPlus,
    paidUsersPro,
    totalPaidUsers,
    unresolvedTickets,
    todayAnalysis,
    totalAnalysis,
    totalCredits,
    recentUsers,
    trend7d,
    trendMonthly
  };
}

export async function getUsers(search?: string, role?: string, plan?: string) {
  await checkAdmin();
  
  const where: any = {};
  
  if (search) {
    where.OR = [
      { name: { contains: search } }, // mode: 'insensitive' is default in some DBs, explicitly set if needed but Prisma usually handles it
      { email: { contains: search } }
    ];
  }
  
  if (role && role !== 'all') {
    where.role = role;
  }
  
  if (plan && plan !== 'all') {
    where.plan = plan;
  }

  return await prisma.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 50 // Limit for performance
  });
}

export async function createUser(data: { name: string; email: string; role: string; plan: string; credits: number }) {
  await checkAdmin();
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new Error("Email already exists");
  
  return await prisma.user.create({
    data
  });
}

export async function updateUser(userId: string, data: { name?: string; email?: string; role?: string; plan?: string; credits?: number }) {
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

export async function updateUserRole(userId: string, role: string) {
  await checkAdmin();
  return await prisma.user.update({
    where: { id: userId },
    data: { role }
  });
}

export async function updateUserCredits(userId: string, credits: number) {
  await checkAdmin();
  return await prisma.user.update({
    where: { id: userId },
    data: { credits }
  });
}

export async function updateUserPlan(userId: string, plan: string) {
  await checkAdmin();
  return await prisma.user.update({
    where: { id: userId },
    data: { plan }
  });
}

export async function getTickets(status?: string, tag?: string) {
  await checkAdmin();
  
  const where: any = {};
  if (status && status !== 'all') where.status = status;
  if (tag) where.tags = { has: tag };

  return await prisma.ticket.findMany({
    where,
    include: {
        user: {
            select: { name: true, email: true, image: true, credits: true }
        }
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function replyTicket(ticketId: string, reply: string) {
  await checkAdmin();
  return await prisma.ticket.update({
    where: { id: ticketId },
    data: { 
        reply,
        status: 'replied',
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

export async function closeTicket(ticketId: string) {
    await checkAdmin();
    return await prisma.ticket.update({
      where: { id: ticketId },
      data: { status: 'closed' }
    });
}

export async function getSystemSettings() {
    await checkAdmin();
    // Assuming we store settings in a JSON file or a Settings table. 
    // For now, we can mock or use a simple KV store if implemented.
    // Or we can query the first row of a Settings table.
    
    // For this implementation, let's assume we might have a Settings model later.
    // Or we just return mock data for GA/AdSense if not stored in DB yet.
    // If you want to persist, you should add a Settings model to Prisma.
    // But user asked for frontend changes mostly.
    // Let's assume we return empty object or mocked data.
    return {};
}

export async function saveSystemSetting(key: string, value: string) {
    await checkAdmin();
    // TODO: Implement persistence
    console.log(`Saving setting ${key} = ${value}`);
    return { success: true };
}

export async function resetAllAnalysis() {
  await checkAdmin();
  try {
    // Delete all analysis records
    const { count } = await prisma.analysis.deleteMany({});
    return { success: true, count };
  } catch (error) {
    console.error("Failed to reset analysis:", error);
    throw new Error("Reset failed");
  }
}
