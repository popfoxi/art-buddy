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
