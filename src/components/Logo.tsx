import React from 'react';

/** Isonga mark: three rising steps (graduation) topped by a sprout (growth). */
export const LogoMark: React.FC<{ size?: number; className?: string }> = ({ size = 36, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className={className}>
        <rect width="48" height="48" rx="13" fill="#1B4332" />
        <rect x="9" y="30" width="8" height="9" rx="2" fill="#6EE7B7" />
        <rect x="20" y="24" width="8" height="15" rx="2" fill="#A7F3D0" />
        <rect x="31" y="18" width="8" height="21" rx="2" fill="#F59E0B" />
        <path d="M13 24c0-4 2.4-6.6 6-7.2 0 3.8-2.2 6.6-6 7.2Z" fill="#D7E9A6" />
        <path d="M13 24c.2-3 1.4-5 3.4-6.4" stroke="#1B4332" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
);

interface LogoProps {
    size?: number;
    /** Use light text for dark backgrounds. */
    light?: boolean;
    className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 36, light = false, className = '' }) => (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
        <LogoMark size={size} />
        <span className={`font-display text-xl font-bold tracking-tight ${light ? 'text-white' : 'text-primary'}`}>
            isonga<span className="text-accent">.</span>
        </span>
    </span>
);

export default Logo;
