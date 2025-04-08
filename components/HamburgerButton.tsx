import React from 'react';

interface HamburgerButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

export const HamburgerButton: React.FC<HamburgerButtonProps> = ({ onClick, isOpen }) => {
  return (
    <button
      onClick={onClick}
      className="p-2 rounded-xl hover:bg-indigo-500/10 transition-colors group fixed top-6 left-6 z-50 bg-[#0A0F29]/80 backdrop-blur-xl border border-indigo-950/20"
      aria-label="Toggle menu"
    >
      <div className="w-6 h-5 flex flex-col justify-between relative">
        <span
          className={`w-6 h-0.5 bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400 rounded-full transform transition-all duration-300 origin-left
            ${isOpen ? 'rotate-45 translate-x-px' : ''}`}
        />
        <span
          className={`w-6 h-0.5 bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400 rounded-full transform transition-all duration-300
            ${isOpen ? 'opacity-0' : ''}`}
        />
        <span
          className={`w-6 h-0.5 bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400 rounded-full transform transition-all duration-300 origin-left
            ${isOpen ? '-rotate-45 translate-x-px' : ''}`}
        />
      </div>
    </button>
  );
}; 