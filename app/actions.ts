"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function createTicket(subject: string, content: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const ticket = await prisma.ticket.create({
    data: {
      userId: session.user.id,
      subject,
      content,
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
    return 0;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { credits: true },
  });

  return user?.credits || 0;
}

export async function decrementUserCredits() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { credits: true },
  });

  if (!user || user.credits <= 0) {
    throw new Error("Not enough credits");
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { credits: { decrement: 1 } },
  });

  return { success: true };
}
