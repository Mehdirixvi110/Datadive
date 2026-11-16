import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { WriteResult } from "@/lib/airtable/write";
import type { ContactSubmission } from "@/lib/types";

/**
 * `submitContact` server-action tests (design §13/§14, FR-12). Airtable writes
 * and request headers are mocked — no network, no live creds.
 */

// Mockable per-test client IP (keyed buckets are isolated by using unique IPs).
let mockIp = "0.0.0.0";
vi.mock("next/headers", () => ({
  headers: async () => ({
    get: (key: string) =>
      key === "x-forwarded-for"
        ? mockIp
        : key === "referer"
          ? "https://example.com/"
          : null,
  }),
}));

// Mock the DAL write boundary.
vi.mock("@/lib/airtable/write", () => ({
  createContactSubmission: vi.fn(),
}));

import { submitContact } from "../contact";
import { createContactSubmission } from "@/lib/airtable/write";

const mockCreate = vi.mocked(createContactSubmission);

function okSubmission(): WriteResult<ContactSubmission> {
  return {
    ok: true,
    data: {
      id: "sub1",
      name: "Ada",
      email: "ada@example.com",
      company: "",
      subject: "",
      phone: "",
      message: "",
      submittedAt: "",
      status: "New",
      sourcePage: "",
    },
  };
}

const validValues = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  company: "",
  subject: "",
  phone: "",
  message: "Hello there, I'd like to talk about a data project.",
  website: "",
};

beforeEach(() => {
  mockCreate.mockReset();
  mockCreate.mockResolvedValue(okSubmission());
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "info").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("honeypot", () => {
  it("silently drops a filled honeypot and makes NO Airtable write", async () => {
    mockIp = "honeypot-ip";
    const res = await submitContact({ ...validValues, website: "http://spam" });
    expect(res.ok).toBe(true);
    expect(mockCreate).not.toHaveBeenCalled();
  });
});

describe("validation", () => {
  it("returns typed field errors and makes NO Airtable write", async () => {
    mockIp = "validation-ip";
    const res = await submitContact({ ...validValues, email: "not-an-email", message: "too short" });
    expect(res.ok).toBe(false);
    if (!res.ok && res.code === "validation") {
      expect(res.fieldErrors.email).toBeTruthy();
      expect(res.fieldErrors.message).toBeTruthy();
    } else {
      throw new Error("expected a validation result");
    }
    expect(mockCreate).not.toHaveBeenCalled();
  });
});

describe("rate limit", () => {
  it("trips after 5 submissions in the same window for one IP", async () => {
    mockIp = "rate-limit-ip";
    for (let i = 0; i < 5; i++) {
      const res = await submitContact(validValues);
      expect(res.ok).toBe(true);
    }
    const sixth = await submitContact(validValues);
    expect(sixth.ok).toBe(false);
    if (!sixth.ok) expect(sixth.code).toBe("rate-limit");
    expect(mockCreate).toHaveBeenCalledTimes(5);
  });
});

describe("Airtable failure", () => {
  it("returns a non-success error result so the form keeps its values", async () => {
    mockIp = "airtable-fail-ip";
    mockCreate.mockResolvedValueOnce({
      ok: false,
      error: "airtable",
      message: "Couldn't save — please try again.",
    });
    const res = await submitContact(validValues);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe("error");
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });
});

describe("success", () => {
  it("writes to Airtable and returns ok", async () => {
    mockIp = "success-ip";
    const res = await submitContact(validValues);
    expect(res.ok).toBe(true);
    expect(mockCreate).toHaveBeenCalledTimes(1);
    const [data] = mockCreate.mock.calls[0];
    expect(data).not.toHaveProperty("website");
    expect(data.email).toBe("ada@example.com");
  });
});
