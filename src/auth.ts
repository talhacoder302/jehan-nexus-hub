import bcrypt from "bcryptjs";
import NextAuth, { CredentialsSignin, type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { authConfig } from "@/auth.config";
import { connectDB } from "@/lib/db";
import { loginSchema } from "@/lib/validators/auth";
import { User } from "@/models";

const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

/** bcrypt hash of a random string, compared when the account does not exist. */
const DUMMY_HASH = "$2b$12$BGO.kuCz98RZ2wDECKoXNeWaAGyVx4x7DtbtQ3ksgCyBFfq3djsLq";

class InvalidLogin extends CredentialsSignin {
  code = "invalid_credentials";
}

const providers: NextAuthConfig["providers"] = [
  Credentials({
    credentials: { email: { type: "email" }, password: { type: "password" } },
    async authorize(raw) {
      const parsed = loginSchema.safeParse(raw);
      if (!parsed.success) throw new InvalidLogin();

      await connectDB();
      const user = await User.findOne({ email: parsed.data.email }).select("+passwordHash");
      // Compare against a dummy hash when the user doesn't exist so timing doesn't reveal accounts.
      const hash = user?.passwordHash ?? DUMMY_HASH;
      const valid = await bcrypt.compare(parsed.data.password, hash);
      if (!user || !valid || user.status !== "active") throw new InvalidLogin();

      return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        image: user.image ?? null,
        role: user.role,
        clientId: user.clientId?.toString() ?? null,
      };
    },
  }),
];

if (googleEnabled) providers.push(Google);

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers,
  callbacks: {
    ...authConfig.callbacks,
    /** Google sign-in is only allowed for users an admin has already created or invited. */
    async signIn({ user, account }) {
      if (account?.provider !== "google") return true;
      if (!user.email) return false;
      await connectDB();
      const existing = await User.findOne({ email: user.email.toLowerCase() });
      if (!existing || existing.status === "disabled") return "/login?error=AccessDenied";
      if (existing.status === "invited") {
        existing.status = "active";
        if (!existing.image && user.image) existing.image = user.image;
        await existing.save();
      }
      return true;
    },
    async jwt(params) {
      const { token, account, user } = params;
      if (account?.provider === "google" && user?.email) {
        await connectDB();
        const dbUser = await User.findOne({ email: user.email.toLowerCase() }).lean();
        if (dbUser) {
          token.uid = dbUser._id.toString();
          token.role = dbUser.role;
          token.clientId = dbUser.clientId?.toString() ?? null;
          token.name = dbUser.name;
        }
        return token;
      }
      return authConfig.callbacks.jwt(params);
    },
  },
  events: {
    async signIn({ user, account }) {
      const email = user.email?.toLowerCase();
      if (!email) return;
      try {
        await connectDB();
        await User.updateOne({ email }, { $set: { lastLoginAt: new Date() } });
      } catch (error) {
        console.error("[auth] failed to update lastLoginAt", account?.provider, error);
      }
    },
  },
});

export const isGoogleAuthEnabled = googleEnabled;
