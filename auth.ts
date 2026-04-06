import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getUserWithRolesAndPermissions } from "./lib/auth-utils";
import db from "./lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;

        // Fetch user with roles and permissions
        const userWithRoles = await getUserWithRolesAndPermissions(user.id);

        if (userWithRoles) {
          token.name = userWithRoles.name;
          token.roles = userWithRoles.userRoles.map((ur) => ({
            id: ur.role.id,
            name: ur.role.name,
            permissions: ur.role.rolePermissions.map((rp) => ({
              id: rp.permission.id,
              name: rp.permission.name,
            })),
          }));
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.roles = token.roles as any[];
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      // Only run this for OAuth providers, not credentials
      if (account && account.provider !== "credentials" && user.email) {
        // Check if this OAuth account has a linked user account
        const existingUser = await db.user.findUnique({
          where: { email: user.email },
          include: {
            userRoles: true,
          },
        });

        // If user doesn't exist, create a new user and assign default role
        if (!existingUser && user.email) {
          // Create a new user
          const newUser = await db.user.create({
            data: {
              email: user.email,
              name: user.name || profile?.name || user.email.split("@")[0],
              // Set a secure random password for OAuth users
              password: await bcrypt.hash(
                Math.random().toString(36).slice(-10),
                10
              ),
            },
          });

          // Find the default "User" role
          const userRole = await db.role.findFirst({
            where: { name: "User" },
          });

          // Assign the default role if it exists
          if (userRole) {
            await db.userRole.create({
              data: {
                userId: newUser.id,
                roleId: userRole.id,
              },
            });
          }
        }
      }
      return true;
    },
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (!parsedCredentials.success) {
          return null;
        }

        const { email, password } = parsedCredentials.data;
        const user = await db.user.findUnique({
          where: { email },
        });

        if (!user) {
          return null;
        }

        const passwordsMatch = await bcrypt.compare(password, user.password);
        if (!passwordsMatch) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
});
