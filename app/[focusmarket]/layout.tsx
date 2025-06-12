"use client";
import AuthSessionProvider from "../sessionProv/session"; // path as needed

export default function FocusMarketLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthSessionProvider>
      {children}
    </AuthSessionProvider>
  );
}
