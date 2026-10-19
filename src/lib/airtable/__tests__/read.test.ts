import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getAllServices,
  getProject,
  getReviews,
  getServices,
} from "../read";
import { SEED_REVIEWS, SEED_SERVICES } from "@/lib/seed";

/**
 * DAL read integration tests (design §22). Airtable is NEVER hit live — the
 * global `fetch` is mocked at the single client boundary.
 */

type MockResponse = {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
};

function jsonResponse(
  status: number,
  body: unknown,
): MockResponse {
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
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
  clearCreds();
});

describe("no credentials → seed, no network", () => {
  it("getServices returns seed and never calls fetch", async () => {
    const result = await getServices();
    expect(result).toEqual(SEED_SERVICES);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("offset pagination", () => {
  it("follows offset until exhausted and concatenates records", async () => {
    setCreds();
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse(200, {
          records: [
            { id: "s1", fields: { Name: "One", Order: 0, Visible: true } },
          ],
          offset: "page2",
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse(200, {
          records: [
            { id: "s2", fields: { Name: "Two", Order: 1, Visible: true } },
          ],
        }),
      );

    const result = await getServices();
    expect(result.map((s) => s.name)).toEqual(["One", "Two"]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    // second call carried the offset
    expect(String(fetchMock.mock.calls[1][0])).toContain("offset=page2");
  });
});

describe("audience-split caching", () => {
  it("public reads pass next.revalidate + tags", async () => {
    setCreds();
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { records: [] }));
    await getServices();
    const init = fetchMock.mock.calls[0][1] as {
      next?: { revalidate?: number; tags?: string[] };
      cache?: string;
    };
    expect(init.next?.revalidate).toBe(3600);
    expect(init.next?.tags).toContain("services");
    expect(init.cache).toBeUndefined();
  });

  it("admin reads pass cache:'no-store' and no tags", async () => {
    setCreds();
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { records: [] }));
    await getAllServices();
    const init = fetchMock.mock.calls[0][1] as {
      next?: unknown;
      cache?: string;
    };
    expect(init.cache).toBe("no-store");
    expect(init.next).toBeUndefined();
  });
});

describe("empty-result rules (creds present)", () => {
  it("a non-reviews list returns the REAL empty set (no seed)", async () => {
    setCreds();
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { records: [] }));
    expect(await getServices()).toEqual([]);
  });

  it("getReviews falls back to seed on an empty live table", async () => {
    setCreds();
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { records: [] }));
    expect(await getReviews()).toEqual(SEED_REVIEWS);
  });
});

describe("draft safety", () => {
  it("getProject returns null for an unpublished project", async () => {
    setCreds();
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, {
        records: [
          {
            id: "p1",
            fields: { Name: "Draft", Slug: "draft", Published: false, Body: "x" },
          },
        ],
      }),
    );
    expect(await getProject("draft")).toBeNull();
  });
});

describe("error degradation with backoff", () => {
  it("429 retries then falls back to seed", async () => {
    setCreds();
    vi.useFakeTimers();
    fetchMock.mockResolvedValue(jsonResponse(429, { error: "RATE" }));

    const promise = getServices();
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toEqual(SEED_SERVICES);
    // initial attempt + 3 retries
    expect(fetchMock).toHaveBeenCalledTimes(4);
    vi.useRealTimers();
  });

  it("5xx retries then falls back to seed", async () => {
    setCreds();
    vi.useFakeTimers();
    fetchMock.mockResolvedValue(jsonResponse(503, { error: "DOWN" }));

    const promise = getServices();
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toEqual(SEED_SERVICES);
    expect(fetchMock).toHaveBeenCalledTimes(4);
    vi.useRealTimers();
  });
});
