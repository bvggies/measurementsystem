import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Animated tailoring-themed SVG doodles (scissors, tape measure, thread, pins, ruler lines).
 * Fixed behind content; theme-aware colors for light and dark mode.
 */
const TailoringBackground: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Light: navy/gold/steel at low opacity. Dark: gold/gray at slightly higher opacity for visibility.
  const strokeA = isDark ? 'rgba(212, 175, 55, 0.09)' : 'rgba(13, 33, 54, 0.07)';
  const strokeB = isDark ? 'rgba(212, 175, 55, 0.06)' : 'rgba(212, 175, 55, 0.06)';
  const strokeC = isDark ? 'rgba(160, 160, 160, 0.08)' : 'rgba(88, 101, 119, 0.06)';

  return (
    <div
      aria-hidden
      className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none"
    >
      {/* Scissors - top left */}
      <svg
        className="absolute w-16 h-16 animate-float opacity-90"
        style={{ top: '12%', left: '5%', animationDelay: '0s' }}
        viewBox="0 0 64 64"
        fill="none"
        stroke={strokeA}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 8 L20 56 M44 8 L44 56 M20 32 C20 20 32 12 44 20 M44 32 C44 44 32 52 20 44" />
        <circle cx="20" cy="32" r="4" fill="none" stroke={strokeA} strokeWidth="1.2" />
        <circle cx="44" cy="32" r="4" fill="none" stroke={strokeA} strokeWidth="1.2" />
      </svg>

      {/* Tape measure / ruler doodle - top right */}
      <svg
        className="absolute w-24 h-12 animate-drift opacity-90"
        style={{ top: '8%', right: '8%', animationDelay: '2s' }}
        viewBox="0 0 96 48"
        fill="none"
        stroke={strokeB}
        strokeWidth="1.2"
        strokeLinecap="round"
      >
        <rect x="4" y="18" width="88" height="12" rx="2" />
        <line x1="12" y1="24" x2="12" y2="28" />
        <line x1="24" y1="24" x2="24" y2="28" />
        <line x1="36" y1="24" x2="36" y2="28" />
        <line x1="48" y1="24" x2="48" y2="28" />
        <line x1="60" y1="24" x2="60" y2="28" />
        <line x1="72" y1="24" x2="72" y2="28" />
        <line x1="84" y1="24" x2="84" y2="28" />
      </svg>

      {/* Thread spool - bottom left */}
      <svg
        className="absolute w-14 h-14 animate-float opacity-90"
        style={{ bottom: '18%', left: '10%', animationDelay: '4s' }}
        viewBox="0 0 56 56"
        fill="none"
        stroke={strokeC}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <ellipse cx="28" cy="28" rx="18" ry="8" />
        <ellipse cx="28" cy="28" rx="12" ry="5" />
        <line x1="10" y1="28" x2="46" y2="28" strokeWidth="0.8" />
        <path d="M28 23 Q32 28 28 33 Q24 28 28 23" />
      </svg>

      {/* Pin - middle right */}
      <svg
        className="absolute w-8 h-12 animate-float opacity-90"
        style={{ top: '45%', right: '12%', animationDelay: '1s' }}
        viewBox="0 0 32 48"
        fill="none"
        stroke={strokeA}
        strokeWidth="1.5"
        strokeLinecap="round"
      >
        <path d="M16 4 L16 40 M12 40 L20 40 L20 44 L12 44 Z" />
        <circle cx="16" cy="8" r="3" fill="none" stroke={strokeA} strokeWidth="1" />
      </svg>

      {/* Second scissors - bottom right, rotated */}
      <svg
        className="absolute w-12 h-12 animate-float opacity-80"
        style={{ bottom: '25%', right: '6%', animationDelay: '6s', transform: 'rotate(-25deg)' }}
        viewBox="0 0 48 48"
        fill="none"
        stroke={strokeB}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 6 L14 42 M34 6 L34 42 M14 24 C14 16 22 12 34 16 M34 24 C34 32 26 36 14 32" />
        <circle cx="14" cy="24" r="3" fill="none" stroke={strokeB} strokeWidth="1" />
        <circle cx="34" cy="24" r="3" fill="none" stroke={strokeB} strokeWidth="1" />
      </svg>

      {/* Ruler marks / fabric lines - decorative strip left */}
      <svg
        className="absolute w-6 h-40 animate-drift opacity-70"
        style={{ top: '30%', left: '2%', animationDelay: '3s' }}
        viewBox="0 0 24 160"
        fill="none"
        stroke={strokeC}
        strokeWidth="0.8"
      >
        {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150].map((y, i) => (
          <line key={i} x1={i % 2 === 0 ? 4 : 8} y1={y} x2={20} y2={y} />
        ))}
      </svg>

      {/* Needle / line doodle - center area */}
      <svg
        className="absolute w-20 h-2 animate-drift opacity-60"
        style={{ top: '55%', left: '35%', animationDelay: '5s' }}
        viewBox="0 0 80 8"
        fill="none"
        stroke={strokeC}
        strokeWidth="1"
        strokeLinecap="round"
      >
        <line x1="0" y1="4" x2="70" y2="4" />
        <path d="M70 2 L80 4 L70 6 Z" fill={strokeC} stroke="none" />
      </svg>

      {/* Small pin - top center */}
      <svg
        className="absolute w-6 h-8 animate-float opacity-80"
        style={{ top: '22%', left: '48%', animationDelay: '7s' }}
        viewBox="0 0 24 32"
        fill="none"
        stroke={strokeB}
        strokeWidth="1.2"
        strokeLinecap="round"
      >
        <path d="M12 2 L12 26 M9 26 L15 26 L15 30 L9 30 Z" />
        <circle cx="12" cy="5" r="2" fill="none" stroke={strokeB} strokeWidth="0.8" />
      </svg>

      {/* Curved ruler / French curve doodle - bottom center */}
      <svg
        className="absolute w-28 h-14 animate-float opacity-70"
        style={{ bottom: '12%', left: '38%', animationDelay: '2.5s' }}
        viewBox="0 0 112 56"
        fill="none"
        stroke={strokeA}
        strokeWidth="1"
        strokeLinecap="round"
      >
        <path d="M8 28 Q28 8 56 28 Q84 48 104 28" />
        <path d="M12 28 Q30 12 56 28 Q82 44 100 28" strokeWidth="0.6" opacity="0.7" />
      </svg>

      {/* Subtle grid / fabric weave - very low opacity */}
      <svg
        className="absolute inset-0 w-full h-full opacity-40"
        style={{ opacity: isDark ? 0.04 : 0.03 }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="weave" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M0 16 L32 16 M16 0 L16 32" stroke={isDark ? '#D4A643' : '#0D2136'} strokeWidth="0.5" fill="none" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#weave)" />
      </svg>
    </div>
  );
};

export default TailoringBackground;
