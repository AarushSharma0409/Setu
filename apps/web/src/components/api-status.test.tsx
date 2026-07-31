import "@testing-library/jest-dom/vitest";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { ApiStatus } from "./api-status";

describe("ApiStatus", () => {
  it("renders loading state before the health check resolves", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => undefined)),
    );
    const client = new QueryClient();

    render(
      <QueryClientProvider client={client}>
        <ApiStatus />
      </QueryClientProvider>,
    );

    expect(screen.getByText("Checking API connectivity")).toBeInTheDocument();
  });
});
