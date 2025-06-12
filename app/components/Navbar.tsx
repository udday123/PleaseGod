// app/components/Navbar.tsx
'use client';

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";


// Define navigation items for better maintainability


export default function Navbar() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return null;
  }

  return (
    <nav className="bg-black text-gray-500 h-10">
      <div className="h-full">
        <div className="grid grid-cols-12 h-full items-center pt-1">
          {/* Left Section with Logo and Navigation */}
          <div className="col-span-8">
            <div className="flex items-center space-x-8 pl-4">
              <Link 
                href="/" 
                className="text-xl font-semibold text-white hover:text-gray-300"
              >
                APEX Exchange
              </Link>
             
            </div>
          </div>

          {/* Auth Section */}
          <div className="col-span-4">
            <div className="flex justify-end pr-4 space-x-7">
              {!session ? (
                <>
                  <Link
                    href="/signup"
                    className="text-white hover:text-gray-300"
                  >
                    SignUp
                  </Link>
                  <Link
                    href="/signin"
                    className="text-white hover:text-gray-300"
                  >
                    SignIn
                  </Link>
                </>
              ) : (
                <>
                <Link
                  href="/portfolio"
                  className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-md 
                           hover:from-blue-700 hover:to-blue-900 transition-all duration-300 
                           shadow-md hover:shadow-lg transform hover:-translate-y-0.5
                           font-medium text-sm"
                >
                  Portfolio
                </Link>
                <button
                  onClick={() => signOut()}
                  className="text-white hover:text-gray-300"
                >
                  SignOut
                </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
