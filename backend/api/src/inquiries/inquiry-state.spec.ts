import { InquiryStatus } from "@prisma/client";

import {
  assertTransition,
  canUserClose,
  canUserWithdraw,
} from "./inquiry-state";

describe("inquiry state machine", () => {
  it("allows valid vendor transitions and rejects invalid ones", () => {
    expect(() =>
      assertTransition(InquiryStatus.NEW, InquiryStatus.VIEWED),
    ).not.toThrow();
    expect(() =>
      assertTransition(InquiryStatus.NEW, InquiryStatus.RESOLVED),
    ).toThrow();
  });

  it("allows user withdrawal only before terminal states", () => {
    expect(canUserWithdraw(InquiryStatus.IN_PROGRESS)).toBe(true);
    expect(canUserWithdraw(InquiryStatus.RESOLVED)).toBe(false);
    expect(canUserClose(InquiryStatus.RESOLVED)).toBe(true);
    expect(canUserClose(InquiryStatus.NEW)).toBe(false);
  });
});
