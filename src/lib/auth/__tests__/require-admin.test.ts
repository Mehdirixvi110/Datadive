import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { AuthError } from "@auth/core/errors";
import type { Session } from "next-auth";

// Mock the auth() singleton and next/navigation.redirect so no live Auth.js
// machinery runs. `redirect()` is modeled as a NEXT_REDIRECT control-flow throw.
const authMock = vi.fn<[], Promise<Session | null>>();
const redirectMock = vi.fn((url: string): never => {
  const error = new Error("NEXT_REDIRECT") as Error & { digest: string };
  error.digest = `NEXT_REDIRECT;replace;${url};307;`;
  throw error;
});

vi.mock("@/auth", () => ({
  auth: () => authMock(),
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => redirectMock(url),
}));

import { isAllowedAdminEmail, parseAdminEmails } from "../allowlist";
import {
  requireAdmin,
  requireAdminPage,
  withAdmin,
  UNAUTHORIZED_RESULT,
} from "../require-admin";

const SAVED = { ...process.env };

function clearAuthEnv() {
  delete process.env.ADMIN_EMAILS;
  delete process.env.AUTH_SECRET;
  delete process.env.AUTH_GOOGLE_ID;
  delete process.env.AUTH_GOOGLE_SECRET;
}

function setCreds() {
  process.env.AUTH_SECRET = "secret";
  process.env.AUTH_GOOGLE_ID = "gid";
  process.env.AUTH_GOOGLE_SECRET = "gsecret";
}

beforeEach(() => {
  authMock.mockReset();
  redirectMock.mockClear();
  clearAuthEnv();
});

afterEach(() => {
  process.env = { ...SAVED };
});

describe("allowlist (isAllowedAdminEmail)", () => {
  it("accepts an email present in ADMIN_EMAILS", () => {
    process.env.ADMIN_EMAILS = "admin@datadive.io, boss@datadive.io";
    expect(isAllowedAdminEmail("admin@datadive.io")).toBe(true);
    expect(isAllowedAdminEmail("boss@datadive.io")).toBe(true);
  });

  it("is case-insensitive and trims whitespace on both sides", () => {
    process.env.ADMIN_EMAILS = "  Admin@Datadive.io  ";
    expect(isAllowedAdminEmail("ADMIN@DATADIVE.IO")).toBe(true);
    expect(isAllowedAdminEmail("  admin@datadive.io ")).toBe(true);
  });

  it("rejects an email not in the list", () => {
    process.env.ADMIN_EMAILS = "admin@datadive.io";
    expect(isAllowedAdminEmail("intruder@evil.com")).toBe(false);
  });

  it("rejects when ADMIN_EMAILS is empty or unset", () => {
    expect(isAllowedAdminEmail("admin@datadive.io")).toBe(false);
    process.env.ADMIN_EMAILS = "   ";
    expect(isAllowedAdminEmail("admin@datadive.io")).toBe(false);
  });

  it("rejects null / undefined / blank emails", () => {
    process.env.ADMIN_EMAILS = "admin@datadive.io";
    expect(isAllowedAdminEmail(null)).toBe(false);
    expect(isAllowedAdminEmail(undefined)).toBe(false);
    expect(isAllowedAdminEmail("")).toBe(false);
    expect(isAllowedAdminEmail("   ")).toBe(false);
  });

  it("parseAdminEmails drops blanks and lowercases", () => {
    expect(parseAdminEmails("A@x.com, ,B@x.com,")).toEqual([
      "a@x.com",
      "b@x.com",
    ]);
    expect(parseAdminEmails("")).toEqual([]);
    expect(parseAdminEmails(undefined)).toEqual([]);
  });
});

describe("hasAuthCreds() gating (fail safe)", () => {
  it("requireAdmin throws AuthError WITHOUT calling auth() when creds missing", async () => {
    await expect(requireAdmin()).rejects.toBeInstanceOf(AuthError);
    expect(authMock).not.toHaveBeenCalled();
  });

  it("requireAdminPage redirects WITHOUT calling auth() when creds missing", async () => {
    await expect(requireAdminPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(redirectMock).toHaveBeenCalledWith("/admin/login");
    expect(authMock).not.toHaveBeenCalled();
  });
});

describe("requireAdmin / requireAdminPage with creds present", () => {
  beforeEach(() => {
    setCreds();
    process.env.ADMIN_EMAILS = "admin@datadive.io";
  });

  it("returns the session for an allowlisted email", async () => {
    const session = {
      user: { email: "admin@datadive.io" },
      expires: "2099-01-01T00:00:00.000Z",
    } as Session;
    authMock.mockResolvedValue(session);
    await expect(requireAdmin()).resolves.toBe(session);
    expect(authMock).toHaveBeenCalledTimes(1);
  });

  it("requireAdmin throws AuthError when the session email is not allowlisted", async () => {
    authMock.mockResolvedValue({
      user: { email: "intruder@evil.com" },
      expires: "2099-01-01T00:00:00.000Z",
    } as Session);
    await expect(requireAdmin()).rejects.toBeInstanceOf(AuthError);
  });

  it("requireAdmin throws AuthError when there is no session", async () => {
    authMock.mockResolvedValue(null);
    await expect(requireAdmin()).rejects.toBeInstanceOf(AuthError);
  });

  it("requireAdminPage redirects when the session email is not allowlisted", async () => {
    authMock.mockResolvedValue({
      user: { email: "intruder@evil.com" },
      expires: "2099-01-01T00:00:00.000Z",
    } as Session);
    await expect(requireAdminPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(redirectMock).toHaveBeenCalledWith("/admin/login");
  });
});

describe("withAdmin (narrow catch)", () => {
  it("returns the action result on success", async () => {
    setCreds();
    process.env.ADMIN_EMAILS = "admin@datadive.io";
    authMock.mockResolvedValue({
      user: { email: "admin@datadive.io" },
      expires: "2099-01-01T00:00:00.000Z",
    } as Session);
    const result = await withAdmin(async () => ({ ok: true as const, data: 42 }));
    expect(result).toEqual({ ok: true, data: 42 });
  });

  it("maps a thrown AuthError to the typed 401 result", async () => {
    // No creds -> requireAdmin throws AuthError -> mapped to 401.
    const result = await withAdmin(async () => "unreachable");
    expect(result).toEqual(UNAUTHORIZED_RESULT);
    expect(result).toMatchObject({ ok: false, status: 401 });
  });

  it("re-throws NEXT_REDIRECT control-flow from a successful action", async () => {
    setCreds();
    process.env.ADMIN_EMAILS = "admin@datadive.io";
    authMock.mockResolvedValue({
      user: { email: "admin@datadive.io" },
      expires: "2099-01-01T00:00:00.000Z",
    } as Session);
    const redirectError = new Error("NEXT_REDIRECT") as Error & {
      digest: string;
    };
    redirectError.digest = "NEXT_REDIRECT;replace;/admin/services;307;";
    await expect(
      withAdmin(async () => {
        throw redirectError;
      }),
    ).rejects.toBe(redirectError);
  });

  it("re-throws NEXT_NOT_FOUND control-flow from a successful action", async () => {
    setCreds();
    process.env.ADMIN_EMAILS = "admin@datadive.io";
    authMock.mockResolvedValue({
      user: { email: "admin@datadive.io" },
      expires: "2099-01-01T00:00:00.000Z",
    } as Session);
    const notFoundError = new Error("NEXT_NOT_FOUND") as Error & {
      digest: string;
    };
    notFoundError.digest = "NEXT_NOT_FOUND";
    await expect(
      withAdmin(async () => {
        throw notFoundError;
      }),
    ).rejects.toBe(notFoundError);
  });

  it("re-throws an unexpected (non-Auth, non-control-flow) error", async () => {
    setCreds();
    process.env.ADMIN_EMAILS = "admin@datadive.io";
    authMock.mockResolvedValue({
      user: { email: "admin@datadive.io" },
      expires: "2099-01-01T00:00:00.000Z",
    } as Session);
    const boom = new Error("DAL exploded");
    await expect(
      withAdmin(async () => {
        throw boom;
      }),
    ).rejects.toBe(boom);
  });
});
