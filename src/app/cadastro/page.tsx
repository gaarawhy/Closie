import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { SignupFlow } from "@/components/auth/SignupFlow";

export const metadata: Metadata = { title: "Criar conta" };

export default function CadastroPage() {
  return (
    <AuthShell>
      <RouteGuard mode="guest">
        <SignupFlow />
      </RouteGuard>
    </AuthShell>
  );
}
