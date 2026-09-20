import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import RouteProgressBar from "@/components/RouteProgressBar";
import SplashScreen from "@/components/SplashScreen";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { MarketplaceFiltersProvider } from "@/context/MarketplaceFiltersContext";

// A single system-wide font (closest match to the brand's UI typeface) used
// for both body copy and display headings — see --font-display alias in
// globals.css, which points it at this same variable.
const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata = {
  title: "Nagar Bazaar",
  description:
    "Nagar Bazaar is a government-aligned marketplace connecting citizens, verified local sellers, and civic services in one trusted platform.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-surface font-sans text-ink">
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <MarketplaceFiltersProvider>
                <SplashScreen />
                <RouteProgressBar />
                <Navbar />
                <main className="flex-1 pt-20">{children}</main>
                <Footer />
              </MarketplaceFiltersProvider>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
