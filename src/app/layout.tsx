import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/components/app-provider";
export const metadata: Metadata = { title: "SupplyScope | Supplier Assessment", description: "Supplier questionnaire and assessment workspace" };
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  return <html lang="en"><body><AppProvider>{children}</AppProvider></body></html>;
}
