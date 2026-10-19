import { describe, expect, it } from "vitest";
import { contactSchema } from "../contact";
import { settingsSchema } from "../settings";
import {
  hrefSchema,
  imageUrlSchema,
  isAllowedImageUrl,
  httpUrlSchema,
  slugSchema,
} from "../common";
import { projectSchema, reviewSchema } from "../entities";

describe("contactSchema", () => {
  const base = {
    name: "Ada Lovelace",
    email: "ada@example.com",
    message: "I would like to discuss a dashboard project with your team.",
  };

  it("accepts a valid submission", () => {
    expect(contactSchema.safeParse(base).success).toBe(true);
  });

  it("rejects a bad email", () => {
    expect(contactSchema.safeParse({ ...base, email: "nope" }).success).toBe(false);
  });

  it("rejects a name under 2 chars", () => {
    expect(contactSchema.safeParse({ ...base, name: "A" }).success).toBe(false);
  });

  it("rejects a message under 10 chars", () => {
    expect(contactSchema.safeParse({ ...base, message: "hi" }).success).toBe(false);
  });

  it("rejects a message over 5000 chars", () => {
    expect(
      contactSchema.safeParse({ ...base, message: "x".repeat(5001) }).success,
    ).toBe(false);
  });

  it("flags a filled honeypot", () => {
    expect(contactSchema.safeParse({ ...base, website: "spam" }).success).toBe(false);
  });

  it("allows an empty honeypot", () => {
    expect(contactSchema.safeParse({ ...base, website: "" }).success).toBe(true);
  });
});

describe("settingsSchema — WhatsApp digit stripping", () => {
  const base = {
    name: "Site Settings",
    brandName: "Datadive",
    tagline: "Diving Into Data",
    contactEmail: "team@example.com",
  };

  it("strips non-digits to a digits-only value", () => {
    const parsed = settingsSchema.parse({
      ...base,
      whatsappNumber: "+1 (234) 567-8900",
    });
    expect(parsed.whatsappNumber).toBe("12345678900");
  });

  it("allows an empty number", () => {
    const parsed = settingsSchema.parse({ ...base, whatsappNumber: "" });
    expect(parsed.whatsappNumber).toBe("");
  });

  it("rejects fewer than 7 digits", () => {
    expect(
      settingsSchema.safeParse({ ...base, whatsappNumber: "12345" }).success,
    ).toBe(false);
  });

  it("rejects more than 15 digits", () => {
    expect(
      settingsSchema.safeParse({ ...base, whatsappNumber: "1".repeat(16) })
        .success,
    ).toBe(false);
  });
});

describe("image URL rule", () => {
  it("accepts same-origin asset paths", () => {
    expect(isAllowedImageUrl("/seed/project.png")).toBe(true);
    expect(imageUrlSchema.safeParse("/brand/logo.png").success).toBe(true);
  });

  it("accepts Blob host URLs", () => {
    expect(
      isAllowedImageUrl("https://abc.public.blob.vercel-storage.com/x.png"),
    ).toBe(true);
  });

  it("rejects arbitrary external hosts", () => {
    expect(isAllowedImageUrl("https://evil.example.com/x.png")).toBe(false);
    expect(imageUrlSchema.safeParse("https://cdn.example.com/x.png").success).toBe(
      false,
    );
  });

  it("rejects http Blob-like hosts (https only)", () => {
    expect(
      isAllowedImageUrl("http://abc.public.blob.vercel-storage.com/x.png"),
    ).toBe(false);
  });
});

describe("href rule", () => {
  it("accepts anchors, relative paths, and http(s) URLs", () => {
    for (const ok of ["#contact", "/blog", "/", "https://example.com/x"]) {
      expect(hrefSchema.safeParse(ok).success).toBe(true);
    }
  });

  it("rejects malformed hrefs", () => {
    for (const bad of ["javascript:alert(1)", "mailto:a@b.com", "ftp://x"]) {
      expect(hrefSchema.safeParse(bad).success).toBe(false);
    }
  });
});

describe("httpUrlSchema (non-image URL)", () => {
  it("accepts http(s) URLs", () => {
    expect(httpUrlSchema.safeParse("https://example.com").success).toBe(true);
  });
  it("rejects non-http protocols", () => {
    expect(httpUrlSchema.safeParse("ftp://example.com").success).toBe(false);
  });
});

describe("slugSchema", () => {
  it("accepts kebab-case slugs", () => {
    expect(slugSchema.safeParse("hr-analytics-dashboard").success).toBe(true);
  });
  it("rejects uppercase, spaces, and leading/trailing hyphens", () => {
    for (const bad of ["Hr-Dashboard", "hr dashboard", "-hr", "hr-"]) {
      expect(slugSchema.safeParse(bad).success).toBe(false);
    }
  });
});

describe("entity alt-when-url cross rule", () => {
  it("requires cover alt when cover URL is present", () => {
    const res = projectSchema.safeParse({
      name: "P",
      slug: "p",
      summary: "s",
      order: 0,
      published: true,
      coverImageUrl: "/seed/project.png",
      coverImageAlt: "",
    });
    expect(res.success).toBe(false);
  });

  it("passes when alt accompanies the URL", () => {
    const res = projectSchema.safeParse({
      name: "P",
      slug: "p",
      summary: "s",
      order: 0,
      published: true,
      coverImageUrl: "/seed/project.png",
      coverImageAlt: "Cover",
    });
    expect(res.success).toBe(true);
  });

  it("validates review rating bounds", () => {
    const ok = reviewSchema.safeParse({
      name: "R",
      quote: "q",
      order: 0,
      published: true,
      rating: 5,
    });
    expect(ok.success).toBe(true);
    const bad = reviewSchema.safeParse({
      name: "R",
      quote: "q",
      order: 0,
      published: true,
      rating: 6,
    });
    expect(bad.success).toBe(false);
  });
});
