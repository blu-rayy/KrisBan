import React from 'react';

/**
 * StatCard Component - Premium Modern Design with Forest Gradient Theme
 * 
 * Variants:
 * - white: White background with dark text (for standard stat cards)
 * - hero: Forest gradient background with white text (for key metrics)
 * - dark: Deep emerald-to-black gradient with white text (for highlighted stats)
 */
export const StatCard = ({
  variant = 'white',
  title,
  value,
  subtitle,
  icon,
  trend,
  className = '',
  onClick
}) => {
  const baseStyles = 'rounded-[24px] transition-all duration-300 hover:scale-105 cursor-pointer';
  
  const variantStyles = {
    white: 'bg-white text-dark-charcoal shadow-card-soft',
    hero: 'bg-gradient-hero text-white shadow-none',
    dark: 'bg-gradient-dark text-white shadow-none'
  };

  const iconWrapperStyles = {
    white: 'bg-white border-2 border-gray-200 text-dark-charcoal',
    hero: 'bg-white text-forest-green',
    dark: 'bg-white text-dark-emerald'
  };

  const iconBackgroundColor = {
    white: '#f3f4f6',
    hero: '#ffffff',
    dark: '#ffffff'
  };

  const trendStyles = {
    white: 'text-green-600 font-semibold text-sm',
    hero: 'text-green-100 font-semibold text-sm',
    dark: 'text-green-300 font-semibold text-sm'
  };

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${className} p-6 flex flex-col`}
      onClick={onClick}
    >
      {/* Header with Icon and Title */}
      <div className="flex items-start justify-between mb-4">
        {/* Icon Wrapper */}
        {icon && (
          <div
            className={`${iconWrapperStyles[variant]} w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-sm`}
          >
            {icon}
          </div>
        )}
        {trend && (
          <span className={trendStyles[variant]}>
            {trend}
          </span>
        )}
      </div>

      {/* Title */}
      <p className={`text-sm font-medium mb-2 ${variant === 'white' ? 'text-gray-600' : 'text-opacity-90'}`}>
        {title}
      </p>

      {/* Value */}
      <h3 className={`text-3xl font-bold mb-2 text-left leading-relaxed ${variant === 'white' ? 'text-dark-charcoal' : 'text-white'}`}>
        {value}
      </h3>

      {/* Subtitle */}
      {subtitle && (
        <p className={`text-xs ${variant === 'white' ? 'text-gray-500' : 'text-opacity-75'}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default StatCard;
