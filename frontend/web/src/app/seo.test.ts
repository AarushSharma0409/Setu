import { describe, expect, it } from "vitest";

import { metadata as categoryMetadata } from "./categories/page";
import { metadata as searchMetadata } from "./search/page";

describe("public discovery SEO", () => {
  it("keeps category pages canonical and search pages noindex", () => {
    expect(categoryMetadata.alternates?.canonical).toBe("/categories");
    expect(searchMetadata.robots).toMatchObject({ index: false, follow: true });
  });
});
