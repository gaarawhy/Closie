import type { Metadata } from "next";
import { EditProfile } from "@/components/profile/EditProfile";

export const metadata: Metadata = { title: "Editar perfil" };

export default function EditProfilePage() {
  return <EditProfile />;
}
