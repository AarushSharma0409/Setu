import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import AdminTwoFactorPage from "./page";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }) }));

describe("AdminTwoFactorPage", () => {
  it("renders the authenticator verification form", () => {
    sessionStorage.setItem("setu_admin_challenge_token", "challenge-token");
    render(<AdminTwoFactorPage />);

    expect(
      screen.getByRole("heading", { name: "Verify your sign-in" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Authenticator code")).toBeInTheDocument();
  });
});
