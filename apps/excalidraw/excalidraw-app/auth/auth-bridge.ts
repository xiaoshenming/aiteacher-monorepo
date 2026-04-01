/**
 * Auth Bridge - Excalidraw <-> Nuxt parent window authentication bridge
 *
 * Handles postMessage-based authentication between the Nuxt parent window
 * and the Excalidraw iframe. Provides token/user info and token refresh.
 */

// --- Types ---

interface BridgeMessage {
  source: "aiteacher-nuxt" | "aiteacher-excalidraw";
  type: string;
  payload?: any;
  requestId?: string;
}

interface AuthUser {
  id: number;
  username: string;
  role: number;
  avatar?: string;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  tokenExpiry: number | null; // Unix timestamp in ms
}

type AuthCallback = (state: AuthState) => void;

// --- State ---

const PARENT_ORIGIN =
  import.meta.env.VITE_APP_PARENT_ORIGIN || "http://localhost:10003";

// 允许的 origin 列表（支持 localhost 和局域网 IP 访问）
const ALLOWED_ORIGINS = new Set([PARENT_ORIGIN]);
if (typeof window !== "undefined") {
  // 动态添加当前页面 referrer 的 origin（处理 IP 访问场景）
  try {
    const ref = document.referrer;
    if (ref) {
      const refOrigin = new URL(ref).origin;
      ALLOWED_ORIGINS.add(refOrigin);
    }
  } catch {
    // ignore
  }
}

let authState: AuthState = {
  token: null,
  user: null,
  tokenExpiry: null,
};

let initialized = false;
const subscribers = new Set<AuthCallback>();
let tokenWatcherInterval: ReturnType<typeof setInterval> | null = null;

// --- Helpers ---

function isValidOrigin(origin: string): boolean {
  return ALLOWED_ORIGINS.has(origin);
}

// 记录实际的 parent origin（从收到的第一条合法消息中获取）
let actualParentOrigin = PARENT_ORIGIN;

function sendToParent(type: string, payload?: any, requestId?: string): void {
  if (!window.parent || window.parent === window) {
    return;
  }
  const message: BridgeMessage = {
    source: "aiteacher-excalidraw",
    type,
    ...(payload !== undefined && { payload }),
    ...(requestId && { requestId }),
  };
  window.parent.postMessage(message, actualParentOrigin);
}

function notifySubscribers(): void {
  const snapshot = { ...authState };
  subscribers.forEach((cb) => {
    try {
      cb(snapshot);
    } catch (e) {
      console.error("[auth-bridge] subscriber error:", e);
    }
  });
}

function parseJwtExpiry(token: string): number | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }
    const payload = JSON.parse(atob(parts[1]));
    if (typeof payload.exp === "number") {
      return payload.exp * 1000; // convert to ms
    }
    return null;
  } catch {
    return null;
  }
}

// --- Message Handler ---

function handleMessage(event: MessageEvent): void {
  if (!isValidOrigin(event.origin)) {
    return;
  }

  // 记录实际的 parent origin，用于 sendToParent
  actualParentOrigin = event.origin;

  const data = event.data as BridgeMessage;
  if (!data || data.source !== "aiteacher-nuxt") {
    return;
  }

  switch (data.type) {
    case "auth:init": {
      const { token, user } = data.payload || {};
      authState = {
        token: token || null,
        user: user || null,
        tokenExpiry: token ? parseJwtExpiry(token) : null,
      };
      notifySubscribers();
      startTokenExpiryWatcher();
      break;
    }

    case "auth:token-refreshed": {
      const { token } = data.payload || {};
      if (token) {
        authState = {
          ...authState,
          token,
          tokenExpiry: parseJwtExpiry(token),
        };
        notifySubscribers();
      }
      break;
    }

    case "auth:logout": {
      authState = { token: null, user: null, tokenExpiry: null };
      stopTokenExpiryWatcher();
      notifySubscribers();
      break;
    }
  }
}

// --- Token Expiry Watcher ---

function startTokenExpiryWatcher(): void {
  if (tokenWatcherInterval) {
    return;
  }
  // Check every 60 seconds
  tokenWatcherInterval = setInterval(() => {
    if (!authState.token || !authState.tokenExpiry) {
      return;
    }
    const now = Date.now();
    const timeUntilExpiry = authState.tokenExpiry - now;
    // Request refresh 5 minutes before expiry
    if (timeUntilExpiry > 0 && timeUntilExpiry <= 5 * 60 * 1000) {
      sendToParent("auth:request-token-refresh");
    }
  }, 60 * 1000);
}

function stopTokenExpiryWatcher(): void {
  if (tokenWatcherInterval) {
    clearInterval(tokenWatcherInterval);
    tokenWatcherInterval = null;
  }
}

// --- Public API ---

/**
 * Initialize the auth bridge. Sets up postMessage listener and
 * sends a ready signal to the parent window.
 */
export function initAuthBridge(): void {
  if (initialized) {
    return;
  }
  initialized = true;
  window.addEventListener("message", handleMessage);
  // Notify parent that Excalidraw is ready to receive auth
  sendToParent("excalidraw:ready");
}

/**
 * Get the current JWT token, or null if not authenticated.
 */
export function getAuthToken(): string | null {
  return authState.token;
}

/**
 * Get the current authenticated user info, or null.
 */
export function getAuthUser(): AuthUser | null {
  return authState.user;
}

/**
 * Subscribe to auth state changes. Returns an unsubscribe function.
 */
export function onAuth(callback: AuthCallback): () => void {
  subscribers.add(callback);
  // If already authenticated, fire immediately
  if (authState.token) {
    try {
      callback({ ...authState });
    } catch (e) {
      console.error("[auth-bridge] subscriber error:", e);
    }
  }
  return () => {
    subscribers.delete(callback);
  };
}

/**
 * Cleanup: remove listener and stop watcher. Call on unmount if needed.
 */
export function destroyAuthBridge(): void {
  window.removeEventListener("message", handleMessage);
  stopTokenExpiryWatcher();
  subscribers.clear();
  initialized = false;
  authState = { token: null, user: null, tokenExpiry: null };
}
