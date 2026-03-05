import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },

  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email:    { label: "Email",    type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            userRoles: {
              include: {
                role: {
                  include: {
                    rolePermissions: { include: { permission: true } },
                  },
                },
              },
            },
          },
        });

        if (!user || !user.password || !user.isActive) return null;

        const passwordMatch = await bcrypt.compare(credentials.password, user.password);
        if (!passwordMatch) return null;

        const roles = user.userRoles.map((ur) => ur.role.name);
        const permissions = [
          ...new Set(
            user.userRoles.flatMap((ur) =>
              ur.role.rolePermissions.map((rp) => rp.permission.name)
            )
          ),
        ];

        return { id: user.id, email: user.email, name: user.name, roles, permissions };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id          = user.id;
        token.roles       = user.roles ?? [];
        token.permissions = user.permissions ?? [];
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id          = token.id;
      session.user.roles       = token.roles;
      session.user.permissions = token.permissions;
      return session;
    },
  },
};
