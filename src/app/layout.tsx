import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ConvexClientProvider } from "@/providers/convex-client-provider";
import { CartProvider } from "@/providers/cart-provider";
import { Toaster } from "@/components/ui/sonner";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});

const helveticaNeueMedium = localFont({
  src: "./fonts/HelveticaNeueMedium.otf",
  variable: "--font-helvetica-neue-medium",
});

export const metadata: Metadata = {
  title: "Khit | Myanmar Local Fashion",
  description: "Premium menswear from Khit - Quality shirts, pants, and accessories made in Myanmar",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${helveticaNeueMedium.variable} font-sans antialiased`}>
        <ConvexClientProvider>
          <CartProvider>
            {children}
            <Toaster />
          </CartProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
