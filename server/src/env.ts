/**
 * env.ts — fail-fast environment variable access.
 *
 * Pure module (no side effects). Used by index.ts (SUPABASE_URL for the JWKS
 * endpoint) and by persistence.ts (SUPABASE_URL + SUPABASE_SERVICE_KEY).
 */

/**
 * Return the value of an environment variable, throwing if it is missing or empty.
 * @param key environment variable name
 * @returns the non-empty string value
 * @throws Error when the variable is undefined or an empty string
 */
export function requireEnv(key: string): string {
  const value = process.env[key];
  if (value === undefined || value === "") {
    throw new Error(`Missing required env: ${key}`);
  }
  return value;
}
