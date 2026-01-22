"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { calculateUserCredits } from "@/lib/credits";

export async function createTicket(subject: string, content: string, category?: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const ticket = await prisma.ticket.create({
    data: {
      userId: session.user.id,
      subject,
      content,
      tags: category ? [category] : [],
    },
  });

  return { success: true, ticketId: ticket.id };
}

export async function getUserTickets() {
  const session = await auth();
  if (!session?.user?.id) {
    return [];
  }

  const tickets = await prisma.ticket.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return tickets;
}

export async function getUserCredits() {
  const session = await auth();
  if (!session?.user?.id) {
    return { 
      credits: 0, 
      subscriptionCredits: 0, 
      plan: 'free', 
      total: 0,
      isTrialExpired: false 
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { 
      credits: true,
      subscriptionCredits: true,
      plan: true,
      trialStartedAt: true,
      subscriptionExpiresAt: true
    },
  });

  if (!user) return { credits: 0, subscriptionCredits: 0, plan: 'free', total: 0, isTrialExpired: false, canStartTrial: false };

  const { total, isTrialExpired } = calculateUserCredits(user);

  // Check if user is eligible to start a trial (Free plan, no trial started yet)
  const canStartTrial = user.plan === 'free' && !user.trialStartedAt;

  return {
    credits: user.credits,
    subscriptionCredits: user.subscriptionCredits,
    plan: user.plan,
    trialStartedAt: user.trialStartedAt,
    subscriptionExpiresAt: user.subscriptionExpiresAt,
    isTrialExpired,
    total,
    canStartTrial
  };
}

// Deprecated: Logic moved to API
export async function decrementUserCredits() {
  return { success: true }; 
}
