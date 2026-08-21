import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

import { InquiryForm } from "./inquiry-form";

describe("InquiryForm", () => {
  it("renders the private inquiry fields for a vendor", () => {
    render(
      <InquiryForm
        vendorId="00000000-0000-0000-0000-000000000001"
        vendorName="Aamchi Home Care"
        returnPath="/vendors/aamchi-home-care"
      />,
    );

    expect(screen.getByText("Contact Aamchi Home Care")).toBeInTheDocument();
    expect(screen.getByLabelText("Subject")).toBeInTheDocument();
    expect(screen.getByLabelText("Message")).toBeInTheDocument();
  });
});
