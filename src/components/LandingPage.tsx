import React from 'react';
import { motion } from 'motion/react';
import { FileText, TrendingUp, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
}

export default function LandingPage({ onStart }: LandingPageProps) {
  const handleScrollToHowItWorks = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const element = document.getElementById('how-it-works');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans antialiased selection:bg-green-500 selection:text-slate-950 flex flex-col justify-between overflow-x-hidden">
      {/* 1. Navbar */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center text-slate-950 font-bold text-lg shadow-lg shadow-green-900/30">
            T
          </div>
          <span className="text-xl font-black tracking-tight text-white">
            Tax<span className="text-green-500">Sense</span>
          </span>
        </div>

        <button
          onClick={handleScrollToHowItWorks}
          className="text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer px-3 py-1.5 rounded-lg hover:bg-slate-900"
        >
          How it works
        </button>
      </header>

      {/* 2. Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 md:py-24 text-center max-w-4xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold tracking-wider uppercase"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Built for AY 2026-27</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-4xl md:text-6xl font-black tracking-tight text-white leading-none"
        >
          File your ITR <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">
            without the confusion
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed"
        >
          AI-powered tax copilot for Indian salaried employees. Upload your Form 16, discover deductions you're missing, and know exactly how much tax you owe — in minutes.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="pt-4 flex flex-col items-center gap-4"
        >
          <button
            onClick={onStart}
            className="group flex items-center gap-2 px-8 py-4 bg-green-600 hover:bg-green-500 text-slate-950 font-black text-sm rounded-xl tracking-wide uppercase transition-all duration-300 shadow-xl shadow-green-950/50 hover:shadow-green-500/20 hover:scale-102 cursor-pointer active:scale-98"
          >
            <span>Start for free</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>

          {/* Trust Row */}
          <div className="flex items-center gap-2.5 text-xs text-slate-500 font-medium">
            <span>₹0 for salaried individuals</span>
            <span className="text-slate-700">•</span>
            <span>Powered by Gemini AI</span>
            <span className="text-slate-700">•</span>
            <span>AY 2026-27 ready</span>
          </div>
        </motion.div>

        {/* 3. Feature Cards section */}
        <div id="how-it-works" className="w-full pt-16 md:pt-28 border-t border-slate-900 text-left space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Intuitive filing, designed for you
            </h2>
            <p className="text-slate-500 text-xs md:text-sm max-w-lg mx-auto">
              Skip the dynamic grids of complex government sites and let our assistant guide you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="p-6 rounded-2xl bg-slate-900/40 border border-slate-900 hover:border-slate-800 transition-all flex flex-col gap-4 group"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 text-green-500 flex items-center justify-center group-hover:bg-green-500/10 group-hover:border-green-500/20 transition-all">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base">Upload Form 16</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Drag and drop your Form 16 PDF — Gemini extracts salary, TDS, and deductions automatically.
              </p>
            </motion.div>

            {/* Feature 2 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="p-6 rounded-2xl bg-slate-900/40 border border-slate-900 hover:border-slate-800 transition-all flex flex-col gap-4 group"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 text-green-500 flex items-center justify-center group-hover:bg-green-500/10 group-hover:border-green-500/20 transition-all">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base">Compare regimes</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                See old vs new regime side-by-side and get a clear recommendation on which saves you more.
              </p>
            </motion.div>

            {/* Feature 3 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="p-6 rounded-2xl bg-slate-900/40 border border-slate-900 hover:border-slate-800 transition-all flex flex-col gap-4 group"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 text-green-500 flex items-center justify-center group-hover:bg-green-500/10 group-hover:border-green-500/20 transition-all">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base">Find missed deductions</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                The AI copilot proactively flags sections like 80D, NPS, and home loan interest you haven't claimed.
              </p>
            </motion.div>
          </div>
        </div>
      </main>

      {/* 4. Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 px-6 text-center text-xs text-slate-600 flex flex-col sm:flex-row sm:justify-between items-center gap-4">
        <div>
          TaxSense <span className="text-slate-800">•</span> Built for Indian taxpayers <span className="text-slate-800">•</span> FY 2025-26
        </div>
        <div className="flex gap-4">
          <span className="flex items-center gap-1 text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
            100% Secure & Private
          </span>
        </div>
      </footer>
    </div>
  );
}
