import type { MetadataRoute } from "next";

// Manifesto do app: nome e ícones quando alguém adiciona a Closie à tela inicial do celular.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Closie",
    short_name: "Closie",
    description: "Seu daily, só pra quem você escolhe.",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#FFFFFF",
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any" },
      { src: "/apple-icon.png", type: "image/png", sizes: "180x180" },
    ],
  };
}
