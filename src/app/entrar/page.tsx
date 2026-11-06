import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { RouteGuard } from "@/components/auth/RouteGuard";

export const metadata: Metadata = { title: "Entrar" };

export default function EntrarPage() {
  return (
    <AuthShell>
      <RouteGuard mode="guest">
        <LoginForm />
      </RouteGuard>
    </AuthShell>
  );
}
