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

  // 4. Analysis Trend (Last 7 Days)
  const analysisTrend = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    const nextDate = new Date(date);
    nextDate.setDate(date.getDate() + 1);

    const count = await prisma.analysis.count({
      where: {
        createdAt: { gte: date, lt: nextDate },
      },
    });
    analysisTrend.push(count);
  }

  // 5. Recent Users (for dashboard list)
  const recentUsers = await prisma.user.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: { accounts: { select: { provider: true } } },
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
    analysisTrend,
    recentUsers: recentUsers.map((u: any) => ({
      ...u,
      provider: u.accounts[0]?.provider || "email",
    })),
  };
}

export async function getUsers(query?: string, role?: string, plan?: string) {
  await checkAdmin();

  const where: any = {};

  if (query) {
    where.OR = [
      { name: { contains: query, mode: "insensitive" } },
      { email: { contains: query, mode: "insensitive" } },
    ];
  }

  // Filter by Role
  if (role && role !== "all") {
    where.role = role;
  }

  // Filter by Plan
  if (plan && plan !== "all") {
    where.plan = plan;
  }
  
  const users = await prisma.user.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      accounts: {
        select: {
          provider: true,
        },
      },
      _count: {
        select: {
          analyses: true
        }
      }
    },
  });

  return users.map((u: any) => ({
    ...u,
    provider: u.accounts[0]?.provider || "email",
    analysisCount: u._count.analyses
  }));
}

export async function deleteUser(userId: string) {
    await checkAdmin();
    await prisma.user.delete({ where: { id: userId } });
    return { success: true };
}

export async function createUser(data: { name: string, email: string, role: string, plan: string, credits: number }) {
    await checkAdmin();
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new Error("Email already exists");
    
    await prisma.user.create({ data });
    return { success: true };
}

export async function updateUser(userId: string, data: { name?: string, email?: string, role?: string, plan?: string, credits?: number }) {
    await checkAdmin();
    await prisma.user.update({
        where: { id: userId },
        data,
    });
    return { success: true };
}

export async function getSystemSettings() {
  await checkAdmin();
  const settings = await prisma.systemSetting.findMany();
  return settings.reduce((acc: any, curr: any) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {});
}

export async function updateSystemSetting(key: string, value: string) {
  await checkAdmin();
  await prisma.systemSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
  return { success: true };
}

// === User Management ===

export async function updateUserCredits(userId: string, credits: number) {
    await checkAdmin();
    await prisma.user.update({
        where: { id: userId },
        data: { credits },
    });
    return { success: true };
}

// === Customer Support ===

export async function getTickets() {
    await checkAdmin();
    const tickets = await prisma.ticket.findMany({
        orderBy: { updatedAt: 'desc' },
        include: {
            user: {
                select: { id: true, name: true, email: true, image: true, credits: true }
            }
        }
    });
    return tickets;
}

export async function replyTicket(ticketId: string, reply: string) {
    await checkAdmin();
    await prisma.ticket.update({
        where: { id: ticketId },
        data: {
            reply,
            status: 'closed', // Auto close on reply? Or keep in progress? Let's close for now.
        }
    });
    return { success: true };
}

// Public/User Action (No Admin Check)
export async function createTicket(subject: string, content: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    await prisma.ticket.create({
        data: {
            userId: session.user.id,
            subject,
            content
        }
    });
    return { success: true };
}

export async function getUserTickets() {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const tickets = await prisma.ticket.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' }
    });
    return tickets;
}
