import type { Metadata } from "next";
import { Manrope, Montserrat } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Meu INC App · Painel do projeto",
  description: "Painel de execução do projeto Meu INC App — INC Empreendimentos",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${manrope.variable} ${montserrat.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
