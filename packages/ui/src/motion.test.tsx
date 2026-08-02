import "@testing-library/jest-dom/vitest";

import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Reveal } from "./motion";

describe("Reveal", () => {
  it("keeps content immediately visible when reduced motion is enabled", async () => {
    const originalMatchMedia = Object.getOwnPropertyDescriptor(
      window,
      "matchMedia",
    );
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: (query: string) =>
        ({
          matches: true,
          media: query,
          onchange: null,
          addListener: () => undefined,
          removeListener: () => undefined,
          addEventListener: () => undefined,
          removeEventListener: () => undefined,
          dispatchEvent: () => false,
        }) as unknown as MediaQueryList,
    });

    try {
      render(
        <Reveal>
          <p>Accessible content</p>
        </Reveal>,
      );

      await waitFor(() =>
        expect(
          screen.getByText("Accessible content").parentElement,
        ).toHaveClass("setu-motion-visible"),
      );
    } finally {
      if (originalMatchMedia) {
        Object.defineProperty(window, "matchMedia", originalMatchMedia);
      } else {
        Reflect.deleteProperty(window, "matchMedia");
      }
    }
  });
});
