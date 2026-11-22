import React from 'react';

interface BadgeProps {
  category: string;
  className?: string;
}

export const ProvenanceBadge: React.FC<BadgeProps> = ({ category, className = '' }) => {
  let colorStyles = 'bg-[#1e2528] text-[#8ea4af] border-[#2f3d44]';

  if (category.includes('Experimental')) {
    colorStyles = 'bg-[#12281c] text-[#2ECC71] border-[#1d462f]';
  } else if (category.includes('Published') || category.includes('Literature')) {
    colorStyles = 'bg-[#152a32] text-[#35C6D9] border-[#1d4a57]';
  } else if (category.includes('Physics-based')) {
    colorStyles = 'bg-[#222415] text-[#d4b94e] border-[#44401c]';
  } else if (category.includes('Educational')) {
    colorStyles = 'bg-[#2c1d1d] text-[#e07a5f] border-[#522b2b]';
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded border text-[11px] font-mono-sci uppercase tracking-wider ${colorStyles} ${className}`}
      title={`Data Category: ${category}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-80" />
      {category}
    </span>
  );
};
