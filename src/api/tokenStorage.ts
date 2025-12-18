// tokenStorage.ts
export const ACCESS_TOKEN_KEY = "access_token";

export const tokenStorage = {
  get(): string | null {
    try { return localStorage.getItem(ACCESS_TOKEN_KEY); } 
    catch { return null; }
  },
  set(token: string) {
    console.log("setting ACT- ",token)
    try { localStorage.setItem(ACCESS_TOKEN_KEY, token); } catch {}
  },
  remove() {
    try { localStorage.removeItem(ACCESS_TOKEN_KEY); } catch {}
  }
};
