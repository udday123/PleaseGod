// src/app/signup/page.tsx
"use client";

import { useState } from "react";
import { FaEye, FaEyeSlash, FaSpinner } from 'react-icons/fa';
import { useRouter } from "next/navigation"; 
import Link from "next/link";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter(); // Initialize useRouter

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setIsLoading(true);

    // Basic Client-Side Validation
    if (!email || !username || !password || !confirmPassword) {
      setMessage({ type: 'error', text: 'All fields are required.' });
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long.' });
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/registerTheUser", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, name: username, password }),
      });

      const contentType = res.headers.get("content-type");

      if (!res.ok) {
        if (contentType && contentType.includes("application/json")) {
          const errorData = await res.json();
          setMessage({ type: 'error', text: errorData.error || "Registration failed. Please try again." });
        } else {
          setMessage({ type: 'error', text: "An unexpected error occurred. Please try again later." });
        }
        return;
      }

      const data = await res.json();
      setMessage({ type: 'success', text: data.message || "Account created successfully! Redirecting..." });

      // **New addition: Redirect to homepage after successful registration**
      // You might want to automatically sign them in here using next-auth's signIn function
      // after successful registration, then redirect.
      // For now, let's just redirect.
      setTimeout(() => {
        router.push("/"); // Redirect to the main page (app/page.tsx)
      }, 1000); // Give user a moment to see success message

    } catch (err) {
      console.error("Client error:", err);
      setMessage({ type: 'error', text: "Network error or something went wrong. Please check your connection." });
    } finally {
      setIsLoading(false);
    }
  };

  const getMessageClasses = () => {
    if (!message) return "";
    switch (message.type) {
      case 'success':
        return "text-green-700 bg-green-100 border border-green-200";
      case 'error':
        return "text-red-700 bg-red-100 border border-red-200";
      case 'info':
        return "text-blue-700 bg-blue-100 border border-blue-200";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md w-full bg-white shadow-xl rounded-xl p-8 space-y-6 transform transition-all duration-300 hover:shadow-2xl">
        <h2 className="text-3xl font-extrabold text-center text-gray-800 mb-6">
          Create Your Account
        </h2>

        {message && (
          <div className={`p-3 rounded-lg text-sm text-center ${getMessageClasses()}`}>
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out placeholder-gray-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              aria-required="true"
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              id="username"
              type="text"
              placeholder="Your unique username"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out placeholder-gray-400"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              aria-required="true"
              autoComplete="username"
            />
          </div>

          <div className="relative">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Minimum 6 characters"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 pr-10 transition duration-150 ease-in-out placeholder-gray-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              aria-required="true"
              minLength={6}
              autoComplete="new-password"
            />
            <span
              className="absolute inset-y-0 right-0 top-6 pr-3 flex items-center cursor-pointer text-gray-500 hover:text-gray-700"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <div className="relative">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Re-enter your password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 pr-10 transition duration-150 ease-in-out placeholder-gray-400"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              aria-required="true"
              autoComplete="new-password"
            />
            <span
              className="absolute inset-y-0 right-0 top-6 pr-3 flex items-center cursor-pointer text-gray-500 hover:text-gray-700"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
            >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150 ease-in-out flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <FaSpinner className="animate-spin mr-2" /> Creating Account...
              </>
            ) : (
              "Create Account"
            )}
          </button>

          <p className="text-center text-sm text-gray-600 mt-4">
            Already have an account? <Link href="/login" className="text-blue-600 hover:underline font-medium">Log In</Link>
          </p>
        </form>
      </div>
    </div>
  );
}