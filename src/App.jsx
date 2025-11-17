import React, { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden antialiased">
      {/* iOS 26 animated mesh background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 via-purple-600/10 to-pink-600/20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(139,92,246,0.35),transparent_60%)] animate-pulse" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(236,72,153,0.3),transparent_60%)] animate-pulse delay-700" />
      </div>

      {/* Dynamic Island */}
      <div className="fixed inset-x-0 top-0 z-50 flex justify-center pointer-events-none">
        <div className="mt-3 h-10 w-44 rounded-full bg-black/70 backdrop-blur-3xl border border-white/10 shadow-2xl" />
      </div>

      <main className="relative flex min-h-screen flex-col items-center justify-center px-6 pt-20 pb-32">
        <div className="w-full max-w-md rounded-3xl bg-white/10 p-10 text-center backdrop-blur-2xl shadow-2xl border border-white/20">
          <h1 className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-6xl font-black tracking-tighter text-transparent md:text-7xl">
            Edunation
          </h1>

          <p className="mt-8 text-xl text-gray-200 md:text-2xl">
            You clicked: <span className="font-bold text-yellow-300">{count}</span>
          </p>

          <button
            onClick={() => setCount(c => c + 1)}
            className="mt-12 w-full rounded-3xl bg-white/20 py-6 text-xl font-bold text-white shadow-2xl backdrop-blur-xl hover:bg-white/30 transform hover:scale-105 transition-all duration-300"
          >
            Click Me
          </button>

          <p className="mt-12 text-sm text-gray-400">Built with love by Ray • 2025</p>
        </div>

        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 h-1 w-36 rounded-full bg-white/30" />
      </main>
    </div>
  );
}

Save (Ctrl + S)