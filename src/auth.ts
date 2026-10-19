/**
 * App-wide auth entry point (design §9). Re-exports the NextAuth v5 singletons
 * from the Edge-safe config so route handlers, middleware, guards, and server
 * actions all import from one place.
 */
export { handlers, auth, signIn, signOut } from "@/lib/auth/config";
