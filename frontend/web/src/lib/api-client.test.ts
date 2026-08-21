import { afterEach, describe, expect, it, vi } from "vitest";

import { publicApi } from "./api-client";

describe("publicApi", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends JSON content type with an authenticated category update", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ vendor: {} }), { status: 200 }),
      );
    vi.stubGlobal("fetch", fetchMock);

    await publicApi.replaceVendorCategories("access-token", [
      "a4af5a55-581b-45bb-906a-2160edeccbfa",
    ]);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/api/v1/vendors/me/categories",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({
          categoryIds: ["a4af5a55-581b-45bb-906a-2160edeccbfa"],
        }),
        headers: {
          Authorization: "Bearer access-token",
          "Content-Type": "application/json",
        },
      }),
    );
  });
});
