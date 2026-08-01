import { AdminRole } from "@prisma/client";

import { permissionsForRole } from "./permissions.guard";
import { AdminPermission } from "../decorators/permissions.decorator";

describe("admin permission matrix", () => {
  it("allows reviewers to review but not suspend", () => {
    const reviewer = permissionsForRole(AdminRole.REVIEWER);

    expect(reviewer).toContain(AdminPermission.APPROVE_VENDOR);
    expect(reviewer).toContain(AdminPermission.VIEW_VENDOR_DOCUMENTS);
    expect(reviewer).not.toContain(AdminPermission.SUSPEND_VENDOR);
  });

  it("allows operations to suspend approved vendors", () => {
    expect(permissionsForRole(AdminRole.OPERATIONS)).toContain(
      AdminPermission.SUSPEND_VENDOR,
    );
  });
});
