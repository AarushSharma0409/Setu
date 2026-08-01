import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

import HomePage from "./page";

describe("HomePage", () => {
  it("renders the Setu foundation page", () => {
    render(<HomePage />);

    expect(screen.getByRole("heading", { name: "Setu" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /find trusted local providers/i }),
    ).toBeInTheDocument();
  });
});
