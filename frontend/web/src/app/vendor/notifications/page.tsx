import type { Metadata } from "next";

import { NotificationsPanel } from "../../../components/notifications-panel";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Vendor notifications | Setu",
  robots: { index: false, follow: false },
};

export default function VendorNotificationsPage() {
  return <NotificationsPanel mode="vendor" />;
}
