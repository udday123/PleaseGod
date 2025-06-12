import NextAuth, { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      id: string; // Add the 'id' property here
      // Add any other custom properties you expect on the user object in the session
      // For example, if you add a 'role' to your user, you'd add:
      // role?: 'admin' | 'user';
    } & DefaultSession["user"];
  }

  /**
   * The shape of the user object that will be returned by your `authorize` function
   * and passed to the `jwt` callback.
   */
  interface User extends DefaultUser {
    id: string; // Ensure the User type also includes 'id'
    // Add any other custom properties that come directly from your database/provider
    // For example:
    // role: string;
  }
}

// If you're using JWTs and want to extend the JWT token type
// This is less common to have custom properties directly on the JWT for public use,
// but useful if you need to store custom data in the token itself.
import { JWT } from "next-auth/jwt";

declare module "next-auth/jwt" {
  /**
   * Returned by the `jwt` callback and `getToken`, when using JWT sessions
   */
  interface JWT {
    id: string; // Add 'id' to the JWT token type
  }
}