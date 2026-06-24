import React from 'react';
import { motion } from 'motion/react';
import { useGoogleAuth } from './GoogleIntegration';
import { DynamicIcon } from './Icons';

export default function LoginGate() {
  const { loginWithGoogle, isConnected } = useGoogleAuth();

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center overflow-hidden px-4 py-12 select-none">
      {/* 1. Animated background ambient meshes */}
      <div className="absolute inset-0 bg-[#020617] -z-20" />
      
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] bg-indigo-500/10 rounded-full blur-[80px] sm:blur-[120px] -z-10 animate-pulse duration-[8s]" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[300px] sm:w-[450px] h-[300px] sm:h-[450px] bg-emerald-500/5 rounded-full blur-[100px] sm:blur-[150px] -z-10 animate-pulse duration-[12s]" />

      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] -z-15 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

      {/* 2. Main Login Card Container */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-xl rounded-3xl border border-white/10 bg-slate-900/50 p-6 sm:p-10 backdrop-blur-2xl shadow-2xl relative"
      >
        {/* Decorative corner highlights */}
        <div className="absolute top-0 left-0 w-20 h-[1px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
        <div className="absolute top-0 left-0 w-[1px] h-20 bg-gradient-to-b from-transparent via-indigo-500 to-transparent" />

        <div className="space-y-8">
          {/* Brand Header */}
          <div className="text-center space-y-3">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500 text-white shadow-xl shadow-indigo-500/20 border border-indigo-400/30 mx-auto"
            >
              <DynamicIcon name="Layers" size={28} />
            </motion.div>
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
                Central Pessoal
              </h1>
              <p className="text-xs text-indigo-400 font-extrabold uppercase tracking-widest">
                Login Único e Seguro
              </p>
            </div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              Entre com a sua conta Google para sincronizar suas tarefas, compromissos e dados com segurança.
            </p>
          </div>

          {/* Connect Action Button */}
          <div className="space-y-4 pt-4">
            <motion.button
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
              onClick={loginWithGoogle}
              className="w-full flex items-center justify-center gap-3.5 bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700 hover:from-indigo-600 hover:to-indigo-800 text-white font-extrabold py-4 px-6 rounded-2xl text-xs sm:text-sm uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-indigo-500/10 border border-indigo-400/20 group relative overflow-hidden"
            >
              {/* Reflection shine effect */}
              <div className="absolute inset-0 w-1/2 h-full bg-white/5 skew-x-[-30deg] -translate-x-full group-hover:animate-[shine_1.5s_ease-in-out_infinite]" />

              {/* Genuine high-contrast Google logo */}
              <div className="h-6 w-6 rounded-xl bg-white flex items-center justify-center shadow-md p-1 shrink-0">
                <svg viewBox="0 0 24 24" className="h-4 w-4">
                  <path
                    fill="#EA4335"
                    d="M12 5.04c1.64 0 3.12.56 4.28 1.67l3.2-3.2C17.52 1.58 14.96 1 12 1 7.35 1 3.4 3.65 1.56 7.56l3.85 3C6.31 7.56 8.92 5.04 12 5.04z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.49 12.27c0-.81-.07-1.6-.2-2.3H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58l3.73 2.9c2.18-2.01 3.7-4.99 3.7-8.69z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.41 10.56c-.24-.72-.37-1.49-.37-2.28 0-.79.13-1.56.37-2.28L1.56 3a11.93 11.93 0 0 0 0 10.56l3.85-3z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 18.96c-3.08 0-5.69-2.52-6.59-5.52l-3.85 3a11.94 11.94 0 0 0 10.44 6.56c3.24 0 5.96-1.07 7.95-2.91l-3.73-2.9c-1.1.74-2.5 1.17-4.22 1.17z"
                  />
                </svg>
              </div>
              <span>Conectar e Sincronizar com Google</span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
