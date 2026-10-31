import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Moul7anout — le carnet de votre hanout",
  description: "Prototype de carnet de vente en Darija. Données de démonstration.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body>{children}</body></html>;
}
