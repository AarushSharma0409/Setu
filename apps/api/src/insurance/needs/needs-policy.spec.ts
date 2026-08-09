import { InsuranceQuestionFieldType } from "@prisma/client";

import { isVisible, validateAnswer } from "./needs-policy";

describe("insurance needs policy", () => {
  it("evaluates restrained visibility rules", () => {
    expect(
      isVisible(
        { questionKey: "insured", operator: "EQUALS", value: true },
        new Map([["insured", true]]),
      ),
    ).toBe(true);
    expect(
      isVisible(
        { questionKey: "insured", operator: "EQUALS", value: true },
        new Map([["insured", false]]),
      ),
    ).toBe(false);
  });

  it("validates selected options without evaluating executable schema content", () => {
    expect(() =>
      validateAnswer(InsuranceQuestionFieldType.SINGLE_SELECT, "SELF", {}, [
        "SELF",
      ]),
    ).not.toThrow();
    expect(() =>
      validateAnswer(InsuranceQuestionFieldType.SINGLE_SELECT, "OTHER", {}, [
        "SELF",
      ]),
    ).toThrow("permitted option");
  });
});
