import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button, EmptyState, FormField, StatusBadge } from "./primitives";

describe("Button", () => {
  it("renders button content", () => {
    render(<Button>Continue</Button>);

    expect(
      screen.getByRole("button", { name: "Continue" }),
    ).toBeInTheDocument();
  });

  it("supports loading state without losing the button semantics", () => {
    render(<Button loading>Save</Button>);
    expect(screen.getByRole("button", { name: /working/i })).toBeDisabled();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renders semantic status text", () => {
    render(<StatusBadge status="PENDING_REVIEW" />);
    expect(screen.getByText("PENDING REVIEW")).toBeInTheDocument();
  });

  it("associates field descriptions and errors", () => {
    render(
      <FormField
        htmlFor="company"
        label="Company"
        description="Public name"
        error="Required"
      >
        <input
          id="company"
          aria-describedby="company-description company-error"
        />
      </FormField>,
    );
    expect(screen.getByText("Public name")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Required");
  });

  it("provides an honest empty state", () => {
    render(
      <EmptyState title="Nothing here yet" description="Try another filter." />,
    );
    expect(
      screen.getByRole("heading", { name: "Nothing here yet" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Try another filter.")).toBeInTheDocument();
  });
});
