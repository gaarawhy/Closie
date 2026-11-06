import type { Metadata } from "next";
import { Friends } from "@/components/daily/Friends";

export const metadata: Metadata = { title: "Amigos" };

export default function FriendsPage() {
  return <Friends />;
}
