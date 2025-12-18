// ✅ src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import Sidebar from "@/components/Sidebar";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "sonner";




<Toaster 
  position="top-right"
  toastOptions={{
    duration: 4000,
    style: {
      background: '#fff',
      color: '#333',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
    },
  }}
/>
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "UN-IT Business Suite",
  description: "Plateforme de gestion d'entreprise tout-en-un",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head />
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50/50`}
      >
        <Toaster
          position="top-right"
          expand={false}
          richColors
          closeButton
          duration={3000}
        />
        <AuthProvider>
          <div className="flex min-h-screen">
            <aside className="flex-shrink-0">
              <Sidebar />
            </aside>

            <main className="flex-1 overflow-y-auto">
              <div className="p-6 lg:p-8 max-w-7xl mx-auto">{children}</div>
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
