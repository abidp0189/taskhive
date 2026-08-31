import React from 'react';

/**
 * bKash Brand Logo Badge (SVG)
 */
export const BKashLogo = ({ className = "h-6 w-6" }) => {
  return (
    <div className={`inline-flex items-center justify-center rounded-lg bg-[#E2136E] text-white p-1 shadow-sm shrink-0 ${className}`}>
      <svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full">
        {/* Stylized bKash Origami Bird */}
        <polygon points="50,15 20,45 50,40" fill="#FFFFFF" opacity="0.95" />
        <polygon points="50,15 80,35 50,40" fill="#FFFFFF" opacity="0.9" />
        <polygon points="20,45 50,40 50,85" fill="#FFFFFF" opacity="0.85" />
        <polygon points="80,35 50,40 65,70" fill="#FFFFFF" opacity="0.8" />
        <polygon points="65,70 50,85 85,85" fill="#FFFFFF" opacity="0.75" />
      </svg>
    </div>
  );
};

/**
 * Nagad Brand Logo Badge (SVG)
 */
export const NagadLogo = ({ className = "h-6 w-6" }) => {
  return (
    <div className={`inline-flex items-center justify-center rounded-lg bg-gradient-to-tr from-[#ED1C24] to-[#F7931E] text-white p-1 shadow-sm shrink-0 ${className}`}>
      <svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full">
        {/* Stylized Nagad Swirl / Ribbon Mark */}
        <circle cx="50" cy="50" r="32" fill="none" stroke="#FFFFFF" strokeWidth="10" strokeDasharray="150 50" strokeLinecap="round" transform="rotate(-45 50 50)" />
        <circle cx="50" cy="50" r="16" fill="#FFFFFF" />
      </svg>
    </div>
  );
};

/**
 * Helper to render appropriate logo based on name or type
 */
export const PaymentMethodBadge = ({ method, className = "h-7 w-7" }) => {
  const str = (typeof method === 'string' ? method : method?.name || method?.type || '').toLowerCase();
  
  if (str.includes('bkash')) {
    return <BKashLogo className={className} />;
  }
  if (str.includes('nagad')) {
    return <NagadLogo className={className} />;
  }
  return (
    <div className={`inline-flex items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-xs ${className}`}>
      💳
    </div>
  );
};
