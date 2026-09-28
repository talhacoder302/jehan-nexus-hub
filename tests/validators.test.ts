import { describe, expect, it } from "vitest";
import {
  acceptInviteSchema,
  inviteUserSchema,
  loginSchema,
  passwordSchema,
  resetPasswordSchema,
} from "@/lib/validators/auth";
import { adAccountIdsSchema, clientFormSchema, slugify } from "@/lib/validators/client";
import { contactSchema } from "@/lib/validators/lead";
import { commentSchema, postFormSchema, requestChangesSchema } from "@/lib/validators/post";

const ID = "65f000000000000000000001";

describe("contactSchema", () => {
  const valid = {
    name: "Jane Doe",
    email: "  Jane@Example.COM ",
    service: "meta-ads",
    message: "We want to grow online sales this year.",
  };

  it("accepts and normalizes a valid submission", () => {
    const parsed = contactSchema.parse({ ...valid, phone: "", company: "" });
    expect(parsed.email).toBe("jane@example.com");
    expect(parsed.phone).toBeUndefined();
    expect(parsed.company).toBeUndefined();
  });

  it("rejects bad email, unknown service and short messages", () => {
    const result = contactSchema.safeParse({
      ...valid,
      email: "nope",
      service: "seo",
      message: "hi",
    });
    expect(result.success).toBe(false);
    const fields = result.error!.issues.map((i) => i.path[0]);
    expect(fields).toEqual(expect.arrayContaining(["email", "service", "message"]));
  });

  it("caps message length", () => {
    expect(contactSchema.safeParse({ ...valid, message: "x".repeat(5001) }).success).toBe(false);
  });
});

describe("auth schemas", () => {
  it("enforces the password policy", () => {
    expect(passwordSchema.safeParse("short1").success).toBe(false);
    expect(passwordSchema.safeParse("longpasswordnodigits").success).toBe(false);
    expect(passwordSchema.safeParse("1234567890123").success).toBe(false);
    expect(passwordSchema.safeParse("GoodPassw0rd").success).toBe(true);
  });

  it("lowercases login emails", () => {
    expect(loginSchema.parse({ email: "A@B.CO", password: "x" }).email).toBe("a@b.co");
  });

  it("requires matching passwords on reset and invite acceptance", () => {
    const token = "t".repeat(43);
    expect(
      resetPasswordSchema.safeParse({
        token,
        password: "GoodPassw0rd",
        confirmPassword: "Different1234",
      }).success,
    ).toBe(false);
    expect(
      acceptInviteSchema.safeParse({
        token,
        name: "Sam",
        password: "GoodPassw0rd",
        confirmPassword: "GoodPassw0rd",
      }).success,
    ).toBe(true);
  });

  it("requires a client for client-role invites", () => {
    expect(
      inviteUserSchema.safeParse({ name: "Sam", email: "s@x.co", role: "client" }).success,
    ).toBe(false);
    expect(
      inviteUserSchema.safeParse({ name: "Sam", email: "s@x.co", role: "client", clientId: ID })
        .success,
    ).toBe(true);
    expect(
      inviteUserSchema.safeParse({ name: "Sam", email: "s@x.co", role: "manager", clientId: "" })
        .success,
    ).toBe(true);
  });
});

describe("client schemas", () => {
  it("normalizes Meta ad account ids", () => {
    expect(adAccountIdsSchema.parse("act_123456789, 987654321\nact_123456789")).toEqual([
      "123456789",
      "987654321",
    ]);
    expect(adAccountIdsSchema.parse("")).toEqual([]);
    expect(adAccountIdsSchema.safeParse("act_abc").success).toBe(false);
  });

  it("slugifies names", () => {
    expect(slugify("Café Délice & Co.")).toBe("cafe-delice-co");
  });

  it("validates the client form", () => {
    const base = {
      name: "Acme",
      slug: "acme",
      metaAdAccountIds: "",
      assignedManagers: [],
      plan: "growth",
      status: "active",
    };
    expect(clientFormSchema.safeParse(base).success).toBe(true);
    expect(clientFormSchema.safeParse({ ...base, slug: "Bad Slug" }).success).toBe(false);
    expect(clientFormSchema.safeParse({ ...base, brandPrimary: "blue" }).success).toBe(false);
    expect(
      clientFormSchema.safeParse({ ...base, logo: "http://insecure.example/logo.png" }).success,
    ).toBe(false);
  });
});

describe("post schemas", () => {
  const post = {
    clientId: ID,
    title: "Weekly offer",
    caption: "Hello",
    platforms: ["instagram"],
    mediaUrls: ["https://cdn.example.com/a.jpg"],
    scheduledAt: "2026-10-01T10:00:00.000Z",
  };

  it("accepts a valid post", () => {
    expect(postFormSchema.safeParse(post).success).toBe(true);
  });

  it("rejects missing platforms, insecure media and bad dates", () => {
    expect(postFormSchema.safeParse({ ...post, platforms: [] }).success).toBe(false);
    expect(postFormSchema.safeParse({ ...post, platforms: ["tiktok"] }).success).toBe(false);
    expect(
      postFormSchema.safeParse({ ...post, mediaUrls: ["http://x.example/a.jpg"] }).success,
    ).toBe(false);
    expect(postFormSchema.safeParse({ ...post, scheduledAt: "tomorrow" }).success).toBe(false);
    expect(postFormSchema.safeParse({ ...post, clientId: "not-an-id" }).success).toBe(false);
  });

  it("requires a comment when requesting changes", () => {
    expect(requestChangesSchema.safeParse({ postId: ID, comment: "  " }).success).toBe(false);
    expect(
      requestChangesSchema.safeParse({ postId: ID, comment: "Use the brighter photo" }).success,
    ).toBe(true);
  });

  it("rejects empty comments", () => {
    expect(commentSchema.safeParse({ postId: ID, body: "" }).success).toBe(false);
  });
});
