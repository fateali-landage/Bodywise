/**
 * authMiddleware.js
 * Verifies Supabase JWT tokens on protected routes.
 * Attaches the decoded user to req.user.
 */
import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";

/**
 * A lightweight client used ONLY for token verification.
 * Uses the anon key (public-safe) — we never need the service role key here
 * because getUser() validates the JWT cryptographically.
 */
const supabaseAuthClient =
  env.supabaseUrl && env.supabaseAnonKey
    ? createClient(env.supabaseUrl, env.supabaseAnonKey)
    : null;

/**
 * Express middleware — rejects requests without a valid Bearer token.
 * Usage: router.use(requireAuth) or router.post("/route", requireAuth, handler)
 */
export const requireAuth = async (req, res, next) => {
  // If Supabase is not configured, skip auth in dev/local mode
  if (!supabaseAuthClient) {
    req.user = { id: "dev-user", email: "dev@local" };
    return next();
  }

  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized: missing Bearer token",
    });
  }

  try {
    const { data, error } = await supabaseAuthClient.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized: invalid or expired token",
      });
    }

    req.user = data.user;
    next();
  } catch (err) {
    console.error("[Auth Middleware Error]", err);
    return res.status(500).json({
      success: false,
      error: "Internal server error during authentication",
    });
  }
};
