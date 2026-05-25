import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FaltaUno - Conecta jugadores en Chile",
  description: "Encuentra tu próximo partido o completa tu equipo en minutos.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body style={{ margin: 0, padding: 0, fontFamily: 'system-ui, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
