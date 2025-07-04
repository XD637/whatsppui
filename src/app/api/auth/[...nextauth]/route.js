import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { verifyPassword } from "@/lib/auth";
import { query } from "@/lib/db";

export const authOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        login: { label: "Email or Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const users = await query(
          "SELECT * FROM users WHERE email = ? OR username = ?",
          [credentials.login, credentials.login]
        );
        const user = users[0];
        if (!user) {
          throw new Error("User not found");
        }
        if (!user.is_verified) {
          throw new Error("Please verify your email first");
        }

        const isValid = await verifyPassword(credentials.password, user.password);
        if (!isValid) {
          throw new Error("Incorrect password");
        }

        // Return user with uuid as id
        return {
          uuid: user.uuid,      // use uuid as user ID
          name: user.username,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.uuid = user.uuid;   // save uuid in token
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.uuid = token.uuid;   // expose uuid in session.user
      session.user.role = token.role;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "defaultsecret",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
