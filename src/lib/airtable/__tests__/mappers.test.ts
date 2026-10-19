import { describe, expect, it } from "vitest";
import { BarChart3, LayoutDashboard, Sparkles } from "lucide-react";
import type { AirtableRecord } from "../client";
import {
  iconFor,
  mapClient,
  mapProject,
  mapReview,
  mapService,
  parseLines,
  parseMetrics,
} from "../mappers";

const rec = (fields: Record<string, unknown>): AirtableRecord => ({
  id: "rec1",
  fields,
});

describe("safe defaults (never throws — FR-24.3)", () => {
  it("maps an empty record without throwing", () => {
    expect(() => mapService(rec({}))).not.toThrow();
    const s = mapService(rec({}));
    expect(s).toMatchObject({
      name: "",
      description: "",
      icon: "",
      accent: "blue",
      order: 0,
      visible: false,
    });
  });

  it("coerces malformed types to safe defaults", () => {
    const s = mapService(
      rec({ Name: 123, Order: "not-a-number", Visible: "yes", Accent: "purple" }),
    );
    expect(s.name).toBe("123");
    expect(s.order).toBe(0);
    expect(s.visible).toBe(false);
    expect(s.accent).toBe("blue"); // unknown accent → default
  });

  it("returns null image when URL is empty", () => {
    const r = mapReview(rec({ Name: "A", Quote: "q", AvatarUrl: "" }));
    expect(r.avatar).toBeNull();
  });

  it("builds an image ref when URL present", () => {
    const r = mapReview(
      rec({ Name: "A", Quote: "q", AvatarUrl: "/seed/avatar.png", AvatarAlt: "alt" }),
    );
    expect(r.avatar).toEqual({ url: "/seed/avatar.png", alt: "alt" });
  });

  it("clamps review rating into 1–5 or null", () => {
    expect(mapReview(rec({ Rating: 9 })).rating).toBe(5);
    expect(mapReview(rec({ Rating: 0 })).rating).toBe(1);
    expect(mapReview(rec({ Rating: "n/a" })).rating).toBeNull();
    expect(mapReview(rec({})).rating).toBeNull();
  });

  it("falls back to a valid sector group on unknown input", () => {
    expect(mapClient(rec({ SectorGroup: "Nonsense" })).sectorGroup).toBe(
      "Independent Case Studies",
    );
  });

  it("derives hasDetail from Published && non-empty Body", () => {
    expect(mapProject(rec({ Published: true, Body: "hi" })).hasDetail).toBe(true);
    expect(mapProject(rec({ Published: true, Body: "  " })).hasDetail).toBe(false);
    expect(mapProject(rec({ Published: false, Body: "hi" })).hasDetail).toBe(false);
  });
});

describe("parseLines", () => {
  it("trims, drops blank lines, and ignores non-strings", () => {
    expect(parseLines("a\n\n  b  \n\nc")).toEqual(["a", "b", "c"]);
    expect(parseLines(undefined)).toEqual([]);
    expect(parseLines(42)).toEqual([]);
  });

  it("caps at 24 items", () => {
    const many = Array.from({ length: 50 }, (_, i) => `line ${i}`).join("\n");
    expect(parseLines(many)).toHaveLength(24);
  });
});

describe("parseMetrics", () => {
  it("splits on the first pipe only", () => {
    expect(parseMetrics("150K+ | records | cleaned")).toEqual([
      { value: "150K+", label: "records | cleaned" },
    ]);
  });

  it("degrades a pipeless line to a label", () => {
    expect(parseMetrics("just a label")).toEqual([
      { value: "", label: "just a label" },
    ]);
  });
});

describe("iconFor", () => {
  it("maps known keys", () => {
    expect(iconFor("dashboard")).toBe(LayoutDashboard);
    expect(iconFor("bi")).toBe(BarChart3);
  });
  it("defaults to Sparkles for empty/unknown keys", () => {
    expect(iconFor("")).toBe(Sparkles);
    expect(iconFor(null)).toBe(Sparkles);
    expect(iconFor("does-not-exist")).toBe(Sparkles);
  });
});
