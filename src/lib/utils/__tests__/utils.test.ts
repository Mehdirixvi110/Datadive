import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildWaMeUrl } from "../whatsapp";
import { slugify, uniqueSlug } from "../slug";
import { formatStat } from "../stat";
import { hasAirtableCreds, hasAuthCreds } from "../env";

describe("buildWaMeUrl", () => {
  it("strips non-digits and builds a wa.me link", () => {
    expect(buildWaMeUrl("+1 (234) 567-8900")).toBe("https://wa.me/12345678900");
  });

  it("appends an encoded prefill message", () => {
    expect(buildWaMeUrl("12345678900", "Hi there & welcome")).toBe(
      "https://wa.me/12345678900?text=Hi%20there%20%26%20welcome",
    );
  });

  it("returns null when there is no usable number", () => {
    expect(buildWaMeUrl("")).toBeNull();
    expect(buildWaMeUrl(null)).toBeNull();
    expect(buildWaMeUrl("abc")).toBeNull();
  });

  it("ignores a blank prefill", () => {
    expect(buildWaMeUrl("12345678900", "   ")).toBe("https://wa.me/12345678900");
  });
});

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Hello World!")).toBe("hello-world");
  });

  it("collapses separators and trims hyphens", () => {
    expect(slugify("  Data -- Dive  ")).toBe("data-dive");
  });

  it("strips diacritics", () => {
    expect(slugify("Café Niño")).toBe("cafe-nino");
  });
});

describe("uniqueSlug", () => {
  it("returns the base when free", () => {
    expect(uniqueSlug("My Post", [])).toBe("my-post");
  });

  it("appends -2, -3 on conflict", () => {
    expect(uniqueSlug("My Post", ["my-post"])).toBe("my-post-2");
    expect(uniqueSlug("My Post", ["my-post", "my-post-2"])).toBe("my-post-3");
  });

  it("uses the fallback when the desired slug is blank", () => {
    expect(uniqueSlug("!!!", [], "item")).toBe("item");
  });
});

describe("formatStat", () => {
  it("wraps the value with prefix and suffix", () => {
    expect(
      formatStat({ value: 150, prefix: "", suffix: "K+", displayOverride: "" }),
    ).toBe("150K+");
    expect(
      formatStat({ value: 5, prefix: "$", suffix: "M", displayOverride: "" }),
    ).toBe("$5M");
  });

  it("uses the display override verbatim when set", () => {
    expect(
      formatStat({ value: 0, prefix: "$", suffix: "K", displayOverride: "N/A" }),
    ).toBe("N/A");
  });
});

describe("env helpers", () => {
  const SAVED = { ...process.env };
  beforeEach(() => {
    delete process.env.AIRTABLE_API_KEY;
    delete process.env.AIRTABLE_BASE_ID;
    delete process.env.AUTH_SECRET;
    delete process.env.AUTH_GOOGLE_ID;
    delete process.env.AUTH_GOOGLE_SECRET;
  });
  afterEach(() => {
    process.env = { ...SAVED };
  });

  it("hasAirtableCreds requires BOTH secrets", () => {
    expect(hasAirtableCreds()).toBe(false);
    process.env.AIRTABLE_API_KEY = "pat";
    expect(hasAirtableCreds()).toBe(false);
    process.env.AIRTABLE_BASE_ID = "app";
    expect(hasAirtableCreds()).toBe(true);
  });

  it("hasAuthCreds requires ALL three secrets", () => {
    expect(hasAuthCreds()).toBe(false);
    process.env.AUTH_SECRET = "s";
    process.env.AUTH_GOOGLE_ID = "id";
    expect(hasAuthCreds()).toBe(false);
    process.env.AUTH_GOOGLE_SECRET = "secret";
    expect(hasAuthCreds()).toBe(true);
  });
});
