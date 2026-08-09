import { BadRequestException } from "@nestjs/common";
import {
  InsuranceQuestionFieldType,
  InsuranceVisibilityOperator,
} from "@prisma/client";

export function isVisible(
  config: unknown,
  answers: ReadonlyMap<string, unknown>,
) {
  if (
    !isRecord(config) ||
    typeof config.questionKey !== "string" ||
    !config.operator
  )
    return true;
  const actual = answers.get(config.questionKey);
  const expected = config.value;
  switch (config.operator as InsuranceVisibilityOperator) {
    case InsuranceVisibilityOperator.EQUALS:
      return actual === expected;
    case InsuranceVisibilityOperator.NOT_EQUALS:
      return actual !== expected;
    case InsuranceVisibilityOperator.IN:
      return Array.isArray(expected) && expected.includes(actual);
    case InsuranceVisibilityOperator.NOT_IN:
      return Array.isArray(expected) && !expected.includes(actual);
    case InsuranceVisibilityOperator.IS_TRUE:
      return actual === true;
    case InsuranceVisibilityOperator.IS_FALSE:
      return actual === false;
    default:
      return false;
  }
}

export function validateAnswer(
  fieldType: InsuranceQuestionFieldType,
  value: unknown,
  config: unknown,
  options: readonly string[],
) {
  if (!isRecord(config)) config = {};
  const rules = config as Record<string, unknown>;
  const fail = (message: string): never => {
    throw new BadRequestException({ code: "INVALID_ANSWER", message });
  };
  if (value === null || value === undefined || value === "") return;
  if (
    fieldType === InsuranceQuestionFieldType.TEXT ||
    fieldType === InsuranceQuestionFieldType.TEXTAREA ||
    fieldType === InsuranceQuestionFieldType.DATE ||
    fieldType === InsuranceQuestionFieldType.PHONE ||
    fieldType === InsuranceQuestionFieldType.EMAIL
  ) {
    const text =
      typeof value === "string" ? value : fail("Answer must be text");
    if (typeof rules.minLength === "number" && text.length < rules.minLength)
      fail("Answer is too short");
    if (typeof rules.maxLength === "number" && text.length > rules.maxLength)
      fail("Answer is too long");
    if (
      typeof rules.pattern === "string" &&
      !new RegExp(rules.pattern).test(text)
    )
      fail("Answer format is invalid");
    return;
  }
  if (
    fieldType === InsuranceQuestionFieldType.NUMBER ||
    fieldType === InsuranceQuestionFieldType.CURRENCY
  ) {
    const number =
      typeof value === "number" && Number.isFinite(value)
        ? value
        : fail("Answer must be a number");
    if (typeof rules.min === "number" && number < rules.min)
      fail("Answer is below the permitted minimum");
    if (typeof rules.max === "number" && number > rules.max)
      fail("Answer is above the permitted maximum");
    return;
  }
  if (
    fieldType === InsuranceQuestionFieldType.BOOLEAN &&
    typeof value !== "boolean"
  )
    fail("Answer must be yes or no");
  if (
    fieldType === InsuranceQuestionFieldType.SINGLE_SELECT &&
    (typeof value !== "string" || !options.includes(value))
  )
    fail("Answer must be a permitted option");
  if (fieldType === InsuranceQuestionFieldType.MULTI_SELECT) {
    const selections =
      Array.isArray(value) &&
      value.every((item) => typeof item === "string" && options.includes(item))
        ? value
        : fail("Answers must be permitted options");
    if (
      typeof rules.minSelections === "number" &&
      selections.length < rules.minSelections
    )
      fail("Select more options");
    if (
      typeof rules.maxSelections === "number" &&
      selections.length > rules.maxSelections
    )
      fail("Select fewer options");
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
