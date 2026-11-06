import type { Metadata } from "next";
import { Suspense } from "react";
import { ProfilePage, ProfileSkeleton } from "@/components/profile/ProfilePage";

export const metadata: Metadata = { title: "Meu perfil" };

// O álbum aberto fica no endereço (?momento=…), lido com useSearchParams: precisa de Suspense
export default function MyProfilePage() {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfilePage />
    </Suspense>
  );
}
