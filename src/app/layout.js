export const metadata = {
  title: "Simulador Educativo (Jogo) · MVP",
  description:
    "Plataforma 100% educativa: simulação lúdica, sem dinheiro real.",
};

import "./globals.css";
import Nav from "@/components/Nav";
import Disclaimer from "@/components/Disclaimer";
import { AuthProvider } from "@/context/auth";
import { CoinsProvider } from "@/context/coins";

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider>
          <CoinsProvider>
            <Disclaimer />
            <Nav />
            <div className="container">{children}</div>
          </CoinsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
