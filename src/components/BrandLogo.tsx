import React from 'react';

interface LogoProps {
  className?: string;
  size?: number | string;
}

/**
 * BrandLogoIcon - A high-fidelity, mathematically precise SVG representation
 * of the Corner Streams logo emblem.
 * Captures:
 * 1. Deep navy graduation cap (#02244c) sitting perfectly on top.
 * 2. Left side: Vibrant blue "C" (#005cb9) with dangling green academic tassel (#12a13b).
 * 3. Right side: Bright leaf-green "S" (#12a13b) with digital square flows/pixels and a blue play button.
 * 4. Bottom base: Open book with green fanning leaves/pages and a navy active book cover.
 */
export const BrandLogoIcon: React.FC<LogoProps> = ({ className = '', size = 48 }) => {
  return (
    <svg
      id="cs-brand-logo-icon"
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={`inline-block select-none ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* DEFINITIONS FOR GRADIENTS & GLOW EFFECTS */}
      <defs>
        <linearGradient id="blueGradient" x1="120" y1="150" x2="280" y2="280" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#006be6" />
          <stop offset="100%" stopColor="#003d80" />
        </linearGradient>
        <linearGradient id="greenGradient" x1="230" y1="130" x2="380" y2="285" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1bbd50" />
          <stop offset="100%" stopColor="#0a7a27" />
        </linearGradient>
        <linearGradient id="lightGreenGradient" x1="220" y1="235" x2="350" y2="310" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#54c66c" />
          <stop offset="100%" stopColor="#12a13b" />
        </linearGradient>
        <linearGradient id="bookBaseGradient" x1="100" y1="280" x2="412" y2="330" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#02244c" />
          <stop offset="100%" stopColor="#011228" />
        </linearGradient>
      </defs>

      {/* ==================== 1. GRADUATION CAP (TOP EMBLEM) ==================== */}
      {/* Main cap board (navy) */}
      <path
        d="M256 64L384 112L256 160L128 112L256 64Z"
        fill="#02244c"
        stroke="#011228"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Cap under-socket skull cap (navy) */}
      <path
        d="M192 121v20c0 14 28 24 64 24s64-10 64-24v-20"
        fill="#011a37"
        stroke="#02244c"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* ==================== 2. THE STYLIZED "C" (LEFT - VIBRANT BLUE) ==================== */}
      {/* Thick educational "C" curve */}
      <path
        d="M232 153c-16.1 4.7-30.8 14-41.5 26.5-12.7 14.8-19.8 33.7-19.8 53.6s7.1 38.8 19.8 53.6c11.5 13.4 27.5 23 44.8 27.1 9.8 2.3 20 .5 28.7-4.8 2.5-1.5 3.1-4.7 1.4-7l-10-13.3c-1.3-1.7-3.7-2.2-5.5-1.2-11.4 6.7-25.9 5.8-36.2-2.3-11.6-9.1-18.4-23.2-18.4-38.1s6.8-29 18.4-38.1c11.2-8.8 27.2-9.2 38.8-1 1.7 1.2 4 0.7 5.2-1.1l11.4-16.8c1.6-2.4 1-5.7-1.4-7.3-12.1-8-27-11.2-41-9.2z"
        fill="url(#blueGradient)"
      />

      {/* Academic Tassel hanging down the side of C (bright leaf-green) */}
      {/* Tassel string / top mount */}
      <path
        d="M171 118v40"
        stroke="#12a13b"
        strokeWidth="5"
        strokeLinecap="round"
      />
      {/* Tassel connector ball */}
      <circle cx="171" cy="142" r="7" fill="#12a13b" stroke="#0f8731" strokeWidth="1" />
      {/* Tassel major brush body */}
      <path
        d="M165 158l-5 40h22l-5-40z"
        fill="#12a13b"
        stroke="#0a541f"
        strokeWidth="0.5"
        strokeLinejoin="round"
      />
      {/* Subtle lines on tassel */}
      <line x1="168" y1="165" x2="168" y2="194" stroke="#54c66c" strokeWidth="1" />
      <line x1="171" y1="165" x2="171" y2="196" stroke="#90dfa0" strokeWidth="1.2" />
      <line x1="174" y1="165" x2="174" y2="194" stroke="#54c66c" strokeWidth="1" />


      {/* ==================== 3. THE STYLIZED "S" (RIGHT - LEAF GREEN) ==================== */}
      {/* Flows gracefully like river streams, aligning with C's center */}
      <path
        d="M336 142h-68c-12 0-21 9-21 21s10 21 21 21h40c21 0 38 17 38 38s-17 38-38 38h-48v-17h48c10 0 18-8 18-18s-8-18-18-18h-40c-21 0-38-17-38-38s17-38 38-38h68z"
        fill="url(#greenGradient)"
      />


      {/* ==================== 4. DIGITAL PIXELS & PLAY STREAM KEY ==================== */}
      {/* Scattered pixel squares on upper right representing automation Streams */}
      {/* Pixel 1 (green, top right) */}
      <rect x="360" y="152" width="16" height="16" rx="4" fill="#12a13b" />
      {/* Pixel 2 (blue, middle-low) */}
      <rect x="345" y="180" width="16" height="16" rx="4" fill="#005cb9" />
      {/* Pixel 3 (green, top far right) */}
      <rect x="382" y="165" width="14" height="14" rx="3.5" fill="#54c66c" />
      {/* Pixel 4 (blue, right edge) */}
      <rect x="398" y="196" width="12" height="12" rx="3" fill="#005cb9" />
      {/* Pixel 5 (blue, lowest right) */}
      <rect x="385" y="212" width="14" height="14" rx="3.5" fill="#005ec2" />
      {/* Pixel 6 (green) */}
      <rect x="318" y="172" width="14" height="14" rx="3.5" fill="#12a13b" />

      {/* Blue Streaming Play Triangle (Automated digital streams) */}
      <path
        d="M352 232l-23-14V246l23-14z"
        fill="#005cb9"
        stroke="#005cb9"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />


      {/* ==================== 5. OPEN BOOK (BOTTOM BASE) ==================== */}
      {/* Lower solid cover curves of the physical book (Deep Navy) */}
      <path
        d="M256 322c-35-15-81-22-140-14v16c59-8 105-1 140 14c35-15 81-22 140-14v-16c-59-8-105-1-140 14z"
        fill="url(#bookBaseGradient)"
        stroke="#011228"
        strokeWidth="1.5"
      />
      
      {/* Fanning book pages / layers paper trap escaping (Rich Green to Light Green pages fanning open) */}
      {/* Left side book page block */}
      <path
        d="M116 288c30-10 70-13 140 0v-16c-70-13-110-10-140 0v16z"
        fill="#12a13b"
      />
      <path
        d="M124 274c28-8 66-11 132 2v-16c-66-13-104-10-132-2v16z"
        fill="url(#lightGreenGradient)"
      />

      {/* Right side book page block */}
      <path
        d="M396 288c-30-10-70-13-140 0v-16c70-13 110-10 140 0v16z"
        fill="#0f8731"
      />
      <path
        d="M388 274c-28-8-66-11-132 2v-16c66-13 104-10 132-2v16z"
        fill="url(#lightGreenGradient)"
      />

      {/* Beautiful central bookmark ribbon/page split */}
      <path d="M256 260v62" stroke="#02244c" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
};

interface FullLogoProps extends LogoProps {
  darkTheme?: boolean;
  hideText?: boolean;
  hideTagline?: boolean;
}

/**
 * BrandLogo - Full horizontal corporate logotype combining the BrandLogoIcon
 * with beautifully styled text "CornerStreams" and tagline "Taking Away the Paper Trap".
 * Matches colors exactly:
 * - Corner: Deep Navy (#02244c) or absolute White
 * - Streams: Bright Green (#12a13b)
 * - Tagline: Deep Navy/Grey aligned with customizable border lines
 */
export const BrandLogo: React.FC<FullLogoProps> = ({ className = '', size = 48, darkTheme = false, hideText = false, hideTagline = false }) => {
  return (
    <div 
      className={`inline-flex items-center select-none transition-all duration-300 hover:scale-[1.01] ${
        hideText 
          ? 'p-0.5 rounded-lg' 
          : `gap-3.5 px-4 py-2 rounded-xl border ${
              darkTheme 
                ? 'bg-slate-950/95 border-indigo-900/50 shadow-lg' 
                : 'bg-white border-slate-200 shadow-md'
            }`
      } ${className}`} 
      id="cs-full-brand-logo"
    >
      {/* The high-precision icon emblem */}
      <div className="shrink-0 flex items-center justify-center">
        <BrandLogoIcon size={size} />
      </div>

      {!hideText && (
        /* Company Tagline & Typography */
        <div className="flex flex-col text-left">
          <div className="flex items-baseline leading-none">
            <span 
              className={`font-black tracking-tight text-xl leading-none md:text-2.5xl ${
                darkTheme ? 'text-white' : 'text-indigo-950'
              }`}
              style={{ fontFamily: '"Montserrat", "Poppins", sans-serif' }}
            >
              Corner
            </span>
            <span 
              className="font-black tracking-tight text-xl leading-none md:text-2.5xl text-emerald-500"
              style={{ fontFamily: '"Montserrat", "Poppins", sans-serif' }}
            >
              Streams
            </span>
          </div>
          
          {/* Baseline line and tagline representing "Taking Away the Paper Trap" */}
          {!hideTagline && (
            <div className="hidden sm:flex items-center gap-2 mt-1.5 w-full">
              {/* Accent Line Left (Blue) */}
              <div className="h-[2px] w-6 bg-indigo-500 rounded-full" />
              
              <span 
                className={`text-[9px] font-black uppercase tracking-[0.16em] whitespace-nowrap leading-none ${
                  darkTheme ? 'text-indigo-300' : 'text-slate-600'
                }`}
                style={{ fontSize: '9px', fontWeight: 900 }}
              >
                Taking Away the Paper Trap
              </span>
              
              {/* Accent Line Right (Green) */}
              <div className="h-[2px] w-6 bg-emerald-500 rounded-full" />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BrandLogo;
