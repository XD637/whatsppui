import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { ChatProvider } from "./ChatContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "WhatsApp UI",
  description: "WhatsApp UI Clone",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ChatProvider>
          {children}
          <Toaster
            richColors
            position="bottom-right"
            toastOptions={{
              className: "text-xs px-2 py-1 rounded"
            }}
          />
        </ChatProvider>
      </body>
    </html>
  );
}
