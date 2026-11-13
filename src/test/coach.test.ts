import { describe, expect, it } from "vitest";
import { bookingSchema, messageText, toMessage } from "@/features/coach/model";
describe("coach booking and history rules", () => {
  it("callback requests have no appointment slot", () => {
    expect(
      bookingSchema.safeParse({
        kind: "callback",
        slotId: null,
        contact: "test@example.com",
        notes: "",
      }).success,
    ).toBe(true);
    expect(
      bookingSchema.safeParse({
        kind: "callback",
        slotId: "00000000-0000-4000-8000-000000000001",
        contact: "test@example.com",
        notes: "",
      }).success,
    ).toBe(false);
  });
  it("calls and video consultations require a slot", () => {
    for (const kind of ["call", "video"])
      expect(
        bookingSchema.safeParse({ kind, slotId: null, contact: "test@example.com", notes: "" })
          .success,
      ).toBe(false);
  });
  it("saved parts preserve all text for conversation continuity", () => {
    const message = toMessage({
      id: "saved-id",
      role: "assistant",
      parts: [
        { type: "text", text: "First" },
        { type: "text", text: "Second" },
      ],
    });
    expect(messageText(message)).toBe("First\nSecond");
    expect(message.id).toBe("saved-id");
  });
});
