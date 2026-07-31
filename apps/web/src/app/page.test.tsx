import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import HomePage from "./page";

vi.mock("../components/api-status", () => ({
  ApiStatus: () => <div>API connectivity</div>,
}));

describe("HomePage", () => {
  it("renders the Setu foundation page", () => {
    render(<HomePage />);

    expect(screen.getByRole("heading", { name: "Setu" })).toBeInTheDocument();
    expect(screen.getByText("API connectivity")).toBeInTheDocument();
  });
});
