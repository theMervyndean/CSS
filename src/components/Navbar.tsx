import React, { useState } from 'react';
import { BrandLogo } from './BrandLogo';
import { Menu, X, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NavbarProps {
  currentView: 'landing' | 'login' | 'register' | 'app';
  onChangeView: (view: 'landing' | 'login' | 'register' | 'app') => void;
  variant?: 'landing' | 'app';
}

export default function Navbar({ currentView, onChangeView, variant = 'landing' }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Smooth scroll helper for landing links or navigate to landing first then scroll
  const handleScrollTo = (id: string) => {
    setIsOpen(false);
    if (currentView !== 'landing') {
      onChangeView('landing');
      // Delay slightly for render cycles
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-indigo-950/95 backdrop-blur border-b border-indigo-900/80 shadow-md">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Brand Logo Clickable to Landing */}
        <div 
          onClick={() => onChangeView('landing')} 
          className="cursor-pointer hover:opacity-90 active:scale-[0.99] transition-all"
        >
          <BrandLogo darkTheme={true} size={30} />
        </div>

        {/* Desktop Navigation Links */}
        {variant === 'landing' && (
          <nav className="hidden lg:flex items-center gap-6 text-xs font-bold text-slate-300">
            <button 
              onClick={() => handleScrollTo('features')} 
              className="hover:text-emerald-400 transition-colors duration-150 cursor-pointer"
            >
              Features
            </button>
            <button 
              onClick={() => handleScrollTo('samples')} 
              className="hover:text-emerald-400 transition-colors duration-150 cursor-pointer"
            >
              Samples
            </button>
            <button 
              onClick={() => handleScrollTo('pricing')} 
              className="hover:text-emerald-400 transition-colors duration-150 cursor-pointer"
            >
              Pricing
            </button>
            <button 
              onClick={() => handleScrollTo('about')} 
              className="hover:text-emerald-400 transition-colors duration-150 cursor-pointer"
            >
              About Story
            </button>
            <button 
              onClick={() => handleScrollTo('contact')} 
              className="hover:text-emerald-400 transition-colors duration-150 cursor-pointer"
            >
              Contact Support
            </button>
          </nav>
        )}

        {/* Call to Actions */}
        <div className="hidden sm:flex items-center gap-3">
          {currentView !== 'login' && currentView !== 'app' && (
            <button
              onClick={() => onChangeView('login')}
              className="text-xs font-bold text-white px-4 py-2 hover:bg-white/5 rounded-lg transition"
            >
              Sign In
            </button>
          )}

          {currentView !== 'register' && currentView !== 'app' && (
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => onChangeView('register')}
              className="bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-extrabold text-xs tracking-wider uppercase px-4 py-2 rounded-full shadow-sm cursor-pointer flex items-center gap-1.5 transition"
            >
              <span>Onboard School</span>
              <ArrowRight size={13} className="shrink-0" />
            </motion.button>
          )}

          {currentView === 'app' && (
            <span className="text-[10px] text-emerald-400 font-bold bg-indigo-900/60 px-3 py-1 rounded-full border border-indigo-800 uppercase tracking-widest">
              Authenticated Session
            </span>
          )}
        </div>

        {/* Mobile menu trigger */}
        {variant === 'landing' && (
          <div className="lg:hidden flex items-center gap-2">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-white hover:text-emerald-400 p-2 rounded transition-colors"
              aria-label="Toggle mobile menu"
            >
              {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        )}
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-indigo-900 bg-indigo-950 px-4 py-4 space-y-3 shadow-lg"
          >
            <button 
              onClick={() => handleScrollTo('features')} 
              className="block w-full text-left text-xs font-bold text-slate-300 py-2 hover:text-emerald-400 transition-colors"
            >
              Features
            </button>
            <button 
              onClick={() => handleScrollTo('samples')} 
              className="block w-full text-left text-xs font-bold text-slate-300 py-2 hover:text-emerald-400 transition-colors"
            >
              Samples
            </button>
            <button 
              onClick={() => handleScrollTo('pricing')} 
              className="block w-full text-left text-xs font-bold text-slate-300 py-2 hover:text-emerald-400 transition-colors"
            >
              Pricing
            </button>
            <button 
              onClick={() => handleScrollTo('about')} 
              className="block w-full text-left text-xs font-bold text-slate-300 py-2 hover:text-emerald-400 transition-colors"
            >
              About Story
            </button>
            <button 
              onClick={() => handleScrollTo('contact')} 
              className="block w-full text-left text-xs font-bold text-slate-300 py-2 hover:text-emerald-400 transition-colors"
            >
              Contact Support
            </button>

            <div className="pt-3 border-t border-indigo-900 flex flex-col gap-2">
              <button
                onClick={() => { setIsOpen(false); onChangeView('login'); }}
                className="w-full text-center text-xs font-semibold text-white py-2 bg-indigo-900 rounded-lg hover:bg-indigo-800"
              >
                Sign In
              </button>
              <button
                onClick={() => { setIsOpen(false); onChangeView('register'); }}
                className="w-full text-center text-xs font-bold text-white py-2 bg-emerald-500 rounded-lg hover:bg-emerald-600"
              >
                Onboard School
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
