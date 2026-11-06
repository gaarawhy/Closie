import type { Metadata } from "next";
import { Notifications } from "@/components/daily/Notifications";

export const metadata: Metadata = { title: "Notificações" };

export default function NotificationsPage() {
  return <Notifications />;
}
