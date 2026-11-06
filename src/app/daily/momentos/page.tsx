import type { Metadata } from "next";
import { FriendsMoments } from "@/components/daily/FriendsMoments";

export const metadata: Metadata = { title: "Momentos dos amigos" };

export default function MomentosPage() {
  return <FriendsMoments />;
}
