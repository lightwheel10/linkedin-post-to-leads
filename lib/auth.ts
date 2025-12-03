import { cookies } from "next/headers";
import { jwtVerify } from "jose";

/**
 * Gets the authenticated user's email from the JWT token in cookies.
 * Returns null if not authenticated or token is invalid.
 */
export async function getAuthenticatedUser(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    return null;
  }

  try {
    const secret = new TextEncoder().encode(
      process.env.OTP_SECRET || "dev-secret-do-not-use-in-prod"
    );
    const { payload } = await jwtVerify(token, secret);
    return payload.email as string;
  } catch {
    return null;
  }
}

/**
 * Requires authentication - throws redirect to login if not authenticated.
 * Returns the user's email if authenticated.
 */
export async function requireAuth(): Promise<string> {
  const email = await getAuthenticatedUser();
  if (!email) {
    throw new Error("Unauthorized");
  }
  return email;
}

