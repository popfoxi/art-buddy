import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import LineProvider from "next-auth/providers/line";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || process.env.GGOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    LineProvider({
      clientId: process.env.LINE_CLIENT_ID,
      clientSecret: process.env.LINE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user && user?.id) {
        // @ts-ignore
        session.user.id = user.id;
        // @ts-ignore
        session.user.role = user.role || "user"; // Pass role to session
      }
      return session;
    },
  },
  events: {
    async signIn({ user, account }) {
      if (user.id) {
        let ip = "unknown";
        try {
          const headersList = await headers();
          const forwarded = headersList.get("x-forwarded-for");
          ip = forwarded ? forwarded.split(',')[0] : "unknown";
        } catch (e) {
          console.error("Failed to get IP", e);
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { 
            lastLogin: new Date(),
            lastIp: ip,
            loginMethod: account?.provider
          },
        });
      }
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});
