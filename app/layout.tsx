// app/layout.tsx (RootLayout)
import "./globals.css";
import AuthSessionProvider from "./sessionProv/session"; // path to your Client wrapper
import Navbar from "./components/Navbar";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* This wrapper is a Client Component, so no React context error */}
        <AuthSessionProvider>
          <Navbar />
          {children}
        </AuthSessionProvider>
      </body>
    </html>
  );
}
