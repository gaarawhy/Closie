import { redirect } from "next/navigation";

// Sem landing: closie.co abre direto no login (como o vsco.co/user/login).
export default function Home() {
  redirect("/entrar");
}
