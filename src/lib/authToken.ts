// JWT authentication token manager for customer and admin sessions.
const TOKEN_KEY = "glp_auth_token";

let memoryToken: string | null = null;

export function setAuthToken(token: string | null): void {
  memoryToken = token;
  if (token) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {}
  } else {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {}
  }
}

export async function getAuthToken(): Promise<string | null> {
  if (memoryToken) return memoryToken;
  try {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (stored) {
      memoryToken = stored;
      return stored;
    }
  } catch {}
  return null;
}

export function clearAuthToken(): void {
  setAuthToken(null);
}
