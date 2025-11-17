import React from 'react';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-black text-white antialiased">
      {/* iOS 26 Dynamic Island / Status Bar Area */}
      <div className="fixed inset-x-0 top-0 z-50 flex justify-center pointer-events-none">
        <div className="mt-3 h-10 w-44 rounded-full bg-black/70 backdrop-blur-3xl border border-white/10 shadow-2xl" />
      </div>

      {/* Safe Area + Frosted Glass Background */}
      <div className="relative min-h-screen overflow-hidden">
        {/* Ultra-subtle gradient (Apple's new 2026 wallpaper style) */}
        <div className="fixed inset-0 bg-gradient-to-br from-indigo-600/20 via-purple-600/10 to-pink-600/20" />
        
        {/* Animated mesh blur (iOS 26 signature) */}
        <div className="fixed inset-0 opacity-40">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(139,92,246,0.4),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(236,72,153,0.3),transparent_50%)]" />
        </div>

        {/* Backdrop blur container – the real iOS glass */}
        <div className="relative min-h-screen backdrop-blur-xl bg-white/5 supports-[backdrop-filter]:bg-white/10">
          {/* Top safe-area padding for Dynamic Island */}
          <div className="pt-16 pb-8 px-6">
            <main className="mx-auto max-w-2xl">
              {children}
            </main>
          </div>

          {/* Bottom navigation bar – iOS 26 style */}
          <div className="fixed inset-x-0 bottom-0 z-40">
            <div className="h-20 bg-black/60 backdrop-blur-3xl border-t border-white/10">
              <div className="flex items-center justify-around h-full px-8">
                {[1, 2, 3, 4].map((i) => (
                  <button
                    key={i}
                    className="relative p-3 rounded-2xl transition-all duration-300 bg-white/10 border border-white/20"
                    style={i === 1 ? { backgroundColor: 'rgba(255,255,255,0.2)' } : {}}
                  >
                    <div className="w-6 h-6 bg-white/40 rounded" />
                    {i === 1 && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-ping" />
                    )}
                  </button>
                ))}
              </div>
            </div>
            {/* Home indicator – iOS 26 thin pill */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-36 h-1 bg-white/30 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}