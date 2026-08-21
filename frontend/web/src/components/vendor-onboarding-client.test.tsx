import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it } from "vitest";

import { VendorOnboardingClient } from "./vendor-onboarding-client";

describe("VendorOnboardingClient", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("prompts unauthenticated users to sign in before onboarding", async () => {
    render(<VendorOnboardingClient step="start" />);

    expect(
      await screen.findByRole("heading", {
        name: "Sign in to onboard as a vendor",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Create an account")).toBeInTheDocument();
  });
});
