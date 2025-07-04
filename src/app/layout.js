// app/layout.jsx
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import ClientProviders from "./ClientProviders";
import { WebSocketProvider } from "@/context/WebSocketContext"; // <-- import your context

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "WhatsApp",
  description: "WhatsApp UI",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <WebSocketProvider>
          <ClientProviders>
            {children}
            <Toaster
              richColors
              position="bottom-right"
              toastOptions={{
                className: "text-xs px-2 py-1 rounded",
              }}
            />
          </ClientProviders>
        </WebSocketProvider>
      </body>
    </html>
  );
}
