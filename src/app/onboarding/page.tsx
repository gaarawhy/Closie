import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";

export const metadata: Metadata = { title: "Seu perfil" };

export default function OnboardingPage() {
  return (
    <AuthShell>
      <RouteGuard mode="protected">
        <OnboardingFlow />
      </RouteGuard>
    </AuthShell>
  );
}
