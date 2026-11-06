import type { Metadata, Viewport } from "next";
import { Sora } from "next/font/google";
import { colors } from "@/lib/tokens";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

const title = "Closie — seu daily, só pra quem você escolhe";
const description =
  "Crie sua conta, escolha seu @ e coloque closie.co/@seunome na bio. Seus dumps organizados por dia, só pra quem você escolhe.";

export const metadata: Metadata = {
  metadataBase: new URL("https://closie.co"),
  title: { default: title, template: "%s Closie" },
  description,
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    siteName: "Closie",
    title,
    description,
  },
  // A imagem de compartilhamento (opengraph-image.png, com o logo) aparece grande nos links
  twitter: { card: "summary_large_image", title, description },
};

export const viewport: Viewport = {
  themeColor: colors.bg,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${sora.variable} h-full`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
