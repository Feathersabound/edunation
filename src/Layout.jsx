// src/Layout.jsx
import React from 'react';

export default function Layout({ children }) {
  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden antialiased">
      {/* Subtle animated gradient background – iOS 26 signature */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 via-purple-600/10 to-pink-600/20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(139,92,246,0.3),transparent_60%)] animate-pulse" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(236,72,153,0.25),transparent_60%)] animate-pulse delay-700" />
      </div>

      {/* Dynamic Island / Status Bar area */}
      <div className="fixed inset-x-0 top-0 z-50 flex justify-center pointer-events-none">
        <div className="mt-3 h-10 w-44 rounded-full bg-black/70 backdrop-blur-3xl border border-white/10 shadow-2xl" />
      </div>

      {/* Main glass container */}
      <div className="relative min-h-screen backdrop-blur-xl bg-white/5 supports-[backdrop-filter]:bg-white/10">
        {/* Top safe area */}
        <div className="pt-16 pb-20 px-6">
          <main className="mx-auto max-w-2xl">
            {children}
          </main>
        </div>

        {/* Bottom navigation bar – ultra-thin iOS 26 style */}
        <div className="fixed inset-x-0 bottom-0 z-50">
          <div className="h-20 bg-black/60 backdrop-blur-3xl border-t border-white/10">
            <div className="flex items-center justify-around h-full px-8">
              {[1, 2, 3, 4].map((i) => (
                <button
                  key={i}
                  className="relative p-3 rounded-2xl transition-all duration-300 hover:bg-white/20"
                >
                  <div className="w-6 h-6 bg-white/40 rounded" />
                  {i === 1 && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-ping" />
                  )}
                </button>
              ))}
            </div>
          </div>
          {/* Home indicator pill */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-36 h-1 bg-white/30 rounded-full" />
        </div>
      </div>
    </div>
  );
}