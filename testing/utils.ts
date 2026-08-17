export const API_BASE = process.env.API_BASE || "http://localhost:4000";
export const FRONTEND_BASE = process.env.FRONTEND_BASE || "http://localhost:3000";

export type TestResult = {
  name: string;
  passed: boolean;
  error?: string;
  durationMs: number;
};

// ANSI color codes for terminal
export const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
};

export function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

export function assertEqual(actual: any, expected: any, message: string) {
  if (actual !== expected) {
    throw new Error(
      `Assertion Failed: ${message} (Expected: ${JSON.stringify(expected)}, Got: ${JSON.stringify(actual)})`
    );
  }
}

export async function apiRequest(
  method: string,
  endpoint: string,
  options: {
    body?: any;
    token?: string;
    headers?: Record<string, string>;
  } = {}
) {
  const url = `${API_BASE}${endpoint}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (options.token) {
    headers["Authorization"] = `Bearer ${options.token}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const contentType = res.headers.get("content-type") || "";
  let data: any = null;
  if (contentType.includes("json")) {
    data = await res.json().catch(() => null);
  } else {
    const text = await res.text().catch(() => "");
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  return {
    status: res.status,
    ok: res.ok,
    data,
    headers: res.headers,
  };
}

export async function loginAs(email: string, password = "password123") {
  const res = await apiRequest("POST", "/auth/login", {
    body: { email, password },
  });
  if (!res.ok) {
    throw new Error(`Login failed for ${email}: ${res.data?.error || res.status}`);
  }
  return {
    token: res.data.token as string,
    user: res.data.user,
  };
}
