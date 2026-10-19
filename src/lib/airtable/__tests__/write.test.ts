import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createContactSubmission,
  createProjectImage,
  createService,
  updateHero,
} from "../write";

/**
 * DAL write integration tests (design §22). fetch is mocked; no live Airtable.
 */

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

const fetchMock = vi.fn();
const originalFetch = globalThis.fetch;

function setCreds() {
  process.env.AIRTABLE_API_KEY = "pat_test";
  process.env.AIRTABLE_BASE_ID = "app_test";
}
function clearCreds() {
  delete process.env.AIRTABLE_API_KEY;
  delete process.env.AIRTABLE_BASE_ID;
}

beforeEach(() => {
  fetchMock.mockReset();
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  clearCreds();
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
  clearCreds();
});

const serviceInput = {
  name: "New Service",
  description: "desc",
  icon: "dashboard",
  accent: "blue" as const,
  order: 0,
  visible: true,
};

describe("no backend (missing creds)", () => {
  it("returns a typed no-backend result and makes NO network call", async () => {
    const res = await createService(serviceInput);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe("no-backend");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("create success", () => {
  it("POSTs and returns the mapped record", async () => {
    setCreds();
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, {
        id: "svc1",
        fields: { Name: "New Service", Order: 0, Visible: true },
      }),
    );

    const res = await createService(serviceInput);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.data.id).toBe("svc1");

    const [, init] = fetchMock.mock.calls[0];
    expect((init as RequestInit).method).toBe("POST");
    expect((init as RequestInit).cache).toBe("no-store");
  });
});

describe("createContactSubmission", () => {
  it("sets Status:'New' explicitly on write (F6)", async () => {
    setCreds();
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, { id: "sub1", fields: { Name: "Ada", Status: "New" } }),
    );

    const res = await createContactSubmission({
      name: "Ada",
      email: "ada@example.com",
      message: "Hello there, I'd like to chat.",
      company: "",
      subject: "",
      phone: "",
    });
    expect(res.ok).toBe(true);

    const body = JSON.parse(String((fetchMock.mock.calls[0][1] as RequestInit).body));
    expect(body.fields.Status).toBe("New");
  });
});

describe("createProjectImage", () => {
  it("writes the Project link as an id ARRAY", async () => {
    setCreds();
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, {
        id: "img1",
        fields: { Name: "G", ImageUrl: "/seed/project.png", Alt: "a", Order: 0 },
      }),
    );

    await createProjectImage({
      projectId: "proj123",
      name: "Gallery 1",
      imageUrl: "/seed/project.png",
      alt: "a",
      order: 0,
    });

    const body = JSON.parse(String((fetchMock.mock.calls[0][1] as RequestInit).body));
    expect(body.fields.Project).toEqual(["proj123"]);
  });
});

describe("singleton upsert", () => {
  it("updates the first row when one exists", async () => {
    setCreds();
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse(200, { records: [{ id: "hero1", fields: {} }] }),
      )
      .mockResolvedValueOnce(
        jsonResponse(200, { id: "hero1", fields: { Headline: "Hi" } }),
      );

    const res = await updateHero({
      name: "Hero",
      headline: "Hi",
      eyebrow: "",
      subheadline: "",
      primaryCtaLabel: "",
      primaryCtaHref: "",
      secondaryCtaLabel: "",
      secondaryCtaHref: "",
      imageUrl: "",
      imageAlt: "",
    });

    expect(res.ok).toBe(true);
    // first call lists (GET), second patches (PATCH) the existing row
    expect((fetchMock.mock.calls[1][1] as RequestInit).method).toBe("PATCH");
    expect(String(fetchMock.mock.calls[1][0])).toContain("hero1");
  });
});
