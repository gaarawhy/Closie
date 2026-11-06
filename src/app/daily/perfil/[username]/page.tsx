import type { Metadata } from "next";
import { Suspense } from "react";
import { ProfileByUsername, ProfileSkeleton } from "@/components/profile/ProfilePage";

export const metadata: Metadata = { title: "Perfil" };

// O @ só é conhecido na hora (os perfis vivem no navegador): useParams pede Suspense
export default function UserProfilePage() {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfileByUsername />
    </Suspense>
  );
}
