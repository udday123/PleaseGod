// src/app/signin/page.tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react"; // Provides the client-side signIn function
import { useRouter } from "next/navigation"; // For client-side navigation
import { FaEye, FaEyeSlash, FaSpinner } from 'react-icons/fa'; // For UI enhancements

export default function Signin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<{ type: 'error' | 'info', text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setIsLoading(true);

    if (!email || !password) {
      setMessage({ type: 'error', text: 'Email and password are required.' });
      setIsLoading(false);
      return;
    }

    try {
      // **This is the core of the sign-in handling:**
      // It sends a POST request to your NextAuth.js API route
      // (specifically /api/auth/signin/credentials) with the email and password.
      
      const res = await signIn("credentials", {
        redirect: false, // Prevents NextAuth.js from automatically redirecting
        email,
        password,
      });

      if (res?.error) {
        // If your NextAuth.js authorize function returned null
        // (meaning user not found or password incorrect)
        setMessage({ type: 'error', text: "Invalid email or password. Please try again." });
      } else {
        // If the NextAuth.js authorize function returned a user object
        // (meaning authentication was successful)
        setMessage({ type: 'info', text: 'Login successful! Redirecting...' });
        // Redirect to the home page (which is handled by app/page.tsx)
        setTimeout(() => {
          router.push("/");
        }, 500);
      }
    } catch (err) {
      // Handles network errors or unexpected client-side issues
      console.error("Client error during sign-in:", err);
      setMessage({ type: 'error', text: "A network error occurred. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  // ... (rest of your UI code for the Signin component, as previously provided)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-teal-50 to-emerald-100 p-4">
      <div className="max-w-md w-full bg-white shadow-xl rounded-xl p-8 space-y-6 transform transition-all duration-300 hover:shadow-2xl">
        <h2 className="text-3xl font-extrabold text-center text-gray-800 mb-6">
          Welcome Back!
        </h2>

        {message && (
          <div className={`p-3 rounded-lg text-sm text-center ${message.type === 'error' ? "text-red-700 bg-red-100 border border-red-200" : "text-blue-700 bg-blue-100 border border-blue-200"}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 transition duration-150 ease-in-out placeholder-gray-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              aria-required="true"
              autoComplete="email"
            />
          </div>

          <div className="relative">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Your password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 pr-10 transition duration-150 ease-in-out placeholder-gray-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              aria-required="true"
              autoComplete="current-password"
            />
            <span
              className="absolute inset-y-0 right-0 top-6 pr-3 flex items-center cursor-pointer text-gray-500 hover:text-gray-700"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <button
            type="submit"
            className="w-full bg-green-600 text-white font-semibold py-3 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition duration-150 ease-in-out flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <FaSpinner className="animate-spin mr-2" /> Signing In...
              </>
            ) : (
              "Sign In"
            )}
          </button>

          <p className="text-center text-sm text-gray-600 mt-4">
            Don't have an account? <a href="/signup" className="text-green-600 hover:underline font-medium">Sign Up</a>
          </p>
          <p className="text-center text-sm text-gray-600">
            <a href="/forgot-password" className="text-gray-500 hover:underline text-sm">Forgot Password?</a>
          </p>
        </form>
      </div>
    </div>
  );
}