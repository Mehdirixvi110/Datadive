import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Session } from "next-auth";

/**
 * Admin server-action integration tests (design §9/§12/§14, §22). Auth, cache
 * revalidation, redirect, and the Airtable fetch boundary are all mocked — no
 * network, no live credentials. Covers: unauthorized rejected before any DAL
 * call; a valid create writes + revalidates (then redirects); invalid input
 * returns field errors with no write; and the no-creds save returns the typed
 * "content backend not configured" result with no network call.
 */

const authMock = vi.fn<[], Promise<Session | null>>();
vi.mock("@/auth", () => ({ auth: () => authMock() }));

const revalidateTagMock = vi.fn();
vi.mock("next/cache", () => ({
  revalidateTag: (tag: string) => revalidateTagMock(tag),
}));

const redirectMock = vi.fn((url: string): never => {
  const error = new Error("NEXT_REDIRECT") as Error & { digest: string };
  error.digest = `NEXT_REDIRECT;replace;${url};307;`;
  throw error;
});
vi.mock("next/navigation", () => ({
  redirect: (url: string) => redirectMock(url),
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

import {
  createServiceAction,
  deleteServiceAction,
} from "../services";

const SAVED = { ...process.env };
const fetchMock = vi.fn();
const originalFetch = globalThis.fetch;

const ADMIN_SESSION = {
  user: { email: "admin@datadive.io" },
  expires: "2099-01-01T00:00:00.000Z",
} as Session;

const validService = {
  name: "New Service",
  description: "A fresh service",
  icon: "dashboard",
  accent: "blue" as const,
  order: 0,
  visible: true,
};

function setAuthCreds() {
  process.env.AUTH_SECRET = "secret";
  process.env.AUTH_GOOGLE_ID = "gid";
  process.env.AUTH_GOOGLE_SECRET = "gsecret";
  process.env.ADMIN_EMAILS = "admin@datadive.io";
}
function setAirtableCreds() {
  process.env.AIRTABLE_API_KEY = "pat_test";
  process.env.AIRTABLE_BASE_ID = "app_test";
}
function clearAirtableCreds() {
  delete process.env.AIRTABLE_API_KEY;
  delete process.env.AIRTABLE_BASE_ID;
}

function jsonResponse(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

beforeEach(() => {
  authMock.mockReset();
  revalidateTagMock.mockReset();
  redirectMock.mockClear();
  fetchMock.mockReset();
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  setAuthCreds();
  clearAirtableCreds();
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "info").mockImplementation(() => {});
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
  process.env = { ...SAVED };
});

describe("authorization", () => {
  it("rejects an unauthorized caller BEFORE any DAL call", async () => {
    setAirtableCreds();
    authMock.mockResolvedValue(null); // no session → not an admin

    const result = await createServiceAction(validService);

    expect(result).toMatchObject({ ok: false, code: "unauthorized" });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(revalidateTagMock).not.toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
  });
});

describe("valid create", () => {
  it("writes via the DAL, revalidates the tag, then redirects to the list", async () => {
    setAirtableCreds();
    authMock.mockResolvedValue(ADMIN_SESSION);
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, {
        id: "svc1",
        fields: { Name: "New Service", Order: 0, Visible: true },
      }),
    );

    await expect(createServiceAction(validService)).rejects.toThrow(
      "NEXT_REDIRECT",
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(revalidateTagMock).toHaveBeenCalledWith("services");
    expect(redirectMock).toHaveBeenCalledWith("/admin/services");
  });

  it("deletes via the DAL and revalidates without a redirect", async () => {
    setAirtableCreds();
    authMock.mockResolvedValue(ADMIN_SESSION);
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { deleted: true }));

    const result = await deleteServiceAction("svc1");

    expect(result).toEqual({ ok: true, message: "Done." });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(revalidateTagMock).toHaveBeenCalledWith("services");
  });
});

describe("invalid input", () => {
  it("returns typed field errors and makes NO write", async () => {
    setAirtableCreds();
    authMock.mockResolvedValue(ADMIN_SESSION);

    const result = await createServiceAction({
      name: "",
      description: "",
      order: 0,
      visible: true,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("validation");
      expect(result.fieldErrors?.name).toBeTruthy();
    }
    expect(fetchMock).not.toHaveBeenCalled();
    expect(revalidateTagMock).not.toHaveBeenCalled();
  });
});

describe("no Airtable creds (degraded)", () => {
  it("returns the typed 'not configured' result with NO network call", async () => {
    // Auth creds present + authorized admin, but NO Airtable creds.
    authMock.mockResolvedValue(ADMIN_SESSION);

    const result = await createServiceAction(validService);

    expect(result).toMatchObject({ ok: false, code: "no-backend" });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(revalidateTagMock).not.toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
