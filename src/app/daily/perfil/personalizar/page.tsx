import type { Metadata } from "next";
import { Customizer } from "@/components/profile/customize/Customizer";

export const metadata: Metadata = { title: "Personalizar perfil" };

export default function CustomizeProfilePage() {
  return <Customizer />;
}
