import React, { useState } from 'react';
import { BrandLogo } from './BrandLogo';
import { Menu, X, ArrowRight, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NavbarProps {
  currentView: 'landing' | 'login' | 'register' | 'app';
  onChangeView: (view: 'landing' | 'login' | 'register' | 'app') => void;
  variant?: 'landing' | 'app';
}

export default function Navbar({ currentView, onChangeView, variant = 'landing' }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Smooth scroll helper for landing links that reliably scrolls on mobile, tablet & desktop
  const handleScrollTo = (id: string) => {
    // Immediately initiate closing the mobile drawer
    setIsOpen(false);

    const scrollToTarget = () => {
      const element = document.getElementById(id);
      if (!element) return;

      // Calculate absolute scroll position accounting for the fixed top navbar (64px + breathing room)
      const rect = element.getBoundingClientRect();
      const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
      const headerOffset = 76;
      const targetY = Math.max(0, rect.top + currentScrollTop - headerOffset);

      // 1. Primary window scroll with smooth behavior
      try {
        window.scrollTo({
          top: targetY,
          behavior: 'smooth'
        });
      } catch {
        window.scrollTo(0, targetY);
      }

      // 2. Also ensure documentElement / body follow in mobile WebKit wrappers
      if (document.documentElement && typeof document.documentElement.scrollTo === 'function') {
        try {
          document.documentElement.scrollTo({ top: targetY, behavior: 'smooth' });
        } catch {
          // Ignore if unsupported
        }
      }

      // 3. Fallback scrollIntoView with scroll-margin-top
      try {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } catch {
        // Fallback already handled by scrollTo
      }
    };

    if (currentView !== 'landing') {
      onChangeView('landing');
      // Delay for landing view to mount into DOM
      setTimeout(scrollToTarget, 180);
      setTimeout(scrollToTarget, 360);
    } else {
      // Run immediately and also after drawer animation finishes to guarantee perfect alignment
      scrollToTarget();
      setTimeout(scrollToTarget, 80);
      setTimeout(scrollToTarget, 260);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 w-full max-w-full z-50 bg-indigo-950/95 backdrop-blur-md border-b border-indigo-900/80 shadow-md box-border viewport-fit">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          
          {/* Brand Logo Clickable to Landing */}
          <div 
            onClick={() => handleScrollTo('features')} 
            className="cursor-pointer hover:opacity-90 active:scale-[0.99] transition-all"
          >
            <BrandLogo darkTheme={true} size={30} />
          </div>

          {/* Desktop Navigation Links */}
          {variant === 'landing' && (
            <nav className="hidden lg:flex items-center gap-6 text-xs font-bold text-slate-300">
              <button 
                type="button"
                onClick={() => handleScrollTo('features')} 
                className="hover:text-emerald-400 transition-colors duration-150 cursor-pointer"
              >
                Features
              </button>
              <button 
                type="button"
                onClick={() => handleScrollTo('samples')} 
                className="hover:text-emerald-400 transition-colors duration-150 cursor-pointer"
              >
                Samples
              </button>
              <button 
                type="button"
                onClick={() => handleScrollTo('pricing')} 
                className="hover:text-emerald-400 transition-colors duration-150 cursor-pointer"
              >
                Pricing
              </button>
              <button 
                type="button"
                onClick={() => handleScrollTo('about')} 
                className="hover:text-emerald-400 transition-colors duration-150 cursor-pointer"
              >
                About Story
              </button>
              <button 
                type="button"
                onClick={() => handleScrollTo('faq')} 
                className="hover:text-emerald-400 transition-colors duration-150 cursor-pointer"
              >
                FAQ
              </button>
              <button 
                type="button"
                onClick={() => handleScrollTo('contact')} 
                className="hover:text-emerald-400 transition-colors duration-150 cursor-pointer"
              >
                Contact Support
              </button>
            </nav>
          )}

          {/* Call to Actions */}
          <div className="hidden sm:flex items-center gap-2.5">
            {currentView !== 'login' && currentView !== 'app' && (
              <button
                type="button"
                onClick={() => onChangeView('login')}
                className="text-xs font-bold text-white px-3.5 py-1.5 hover:bg-white/10 rounded-lg transition cursor-pointer"
              >
                Sign In
              </button>
            )}

            {currentView !== 'register' && currentView !== 'app' && (
              <motion.button
                whileTap={{ scale: 0.96 }}
                type="button"
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
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="text-white hover:text-emerald-400 p-2 rounded transition-colors"
              aria-label="Toggle mobile menu"
            >
              {isOpen ? <X size={22} /> : <Menu size={22} />}
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
            transition={{ duration: 0.2 }}
            className="lg:hidden border-t border-indigo-900 bg-indigo-950 px-4 py-4 space-y-1 shadow-2xl"
          >
            <button 
              type="button"
              onClick={() => handleScrollTo('features')} 
              className="w-full text-left text-sm font-bold text-slate-200 hover:text-emerald-400 active:text-emerald-300 py-2.5 px-2 rounded-lg hover:bg-white/5 active:bg-white/10 transition-colors flex items-center justify-between cursor-pointer"
            >
              <span>Features</span>
              <ChevronRight size={14} className="text-slate-500" />
            </button>
            <button 
              type="button"
              onClick={() => handleScrollTo('samples')} 
              className="w-full text-left text-sm font-bold text-slate-200 hover:text-emerald-400 active:text-emerald-300 py-2.5 px-2 rounded-lg hover:bg-white/5 active:bg-white/10 transition-colors flex items-center justify-between cursor-pointer"
            >
              <span>Samples</span>
              <ChevronRight size={14} className="text-slate-500" />
            </button>
            <button 
              type="button"
              onClick={() => handleScrollTo('pricing')} 
              className="w-full text-left text-sm font-bold text-slate-200 hover:text-emerald-400 active:text-emerald-300 py-2.5 px-2 rounded-lg hover:bg-white/5 active:bg-white/10 transition-colors flex items-center justify-between cursor-pointer"
            >
              <span>Pricing</span>
              <ChevronRight size={14} className="text-slate-500" />
            </button>
            <button 
              type="button"
              onClick={() => handleScrollTo('about')} 
              className="w-full text-left text-sm font-bold text-slate-200 hover:text-emerald-400 active:text-emerald-300 py-2.5 px-2 rounded-lg hover:bg-white/5 active:bg-white/10 transition-colors flex items-center justify-between cursor-pointer"
            >
              <span>About Story</span>
              <ChevronRight size={14} className="text-slate-500" />
            </button>
            <button 
              type="button"
              onClick={() => handleScrollTo('faq')} 
              className="w-full text-left text-sm font-bold text-slate-200 hover:text-emerald-400 active:text-emerald-300 py-2.5 px-2 rounded-lg hover:bg-white/5 active:bg-white/10 transition-colors flex items-center justify-between cursor-pointer"
            >
              <span>FAQ</span>
              <ChevronRight size={14} className="text-slate-500" />
            </button>
            <button 
              type="button"
              onClick={() => handleScrollTo('contact')} 
              className="w-full text-left text-sm font-bold text-slate-200 hover:text-emerald-400 active:text-emerald-300 py-2.5 px-2 rounded-lg hover:bg-white/5 active:bg-white/10 transition-colors flex items-center justify-between cursor-pointer"
            >
              <span>Contact Support</span>
              <ChevronRight size={14} className="text-slate-500" />
            </button>

            <div className="pt-3 border-t border-indigo-900/80 flex flex-col gap-2.5 mt-2">
              <button
                type="button"
                onClick={() => { setIsOpen(false); onChangeView('login'); }}
                className="w-full text-center text-xs font-bold text-white py-2.5 bg-indigo-900/80 hover:bg-indigo-900 active:bg-indigo-800 rounded-xl transition cursor-pointer"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setIsOpen(false); onChangeView('register'); }}
                className="w-full text-center text-xs font-black uppercase tracking-wider text-white py-2.5 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 rounded-xl transition shadow-md cursor-pointer"
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
