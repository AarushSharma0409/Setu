import type { Metadata } from "next";

import { NotificationsPanel } from "../../../components/notifications-panel";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Notifications | Setu",
  robots: { index: false, follow: false },
};

export default function AccountNotificationsPage() {
  return <NotificationsPanel mode="user" />;
}
