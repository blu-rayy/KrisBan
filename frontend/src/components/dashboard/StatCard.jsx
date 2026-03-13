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
    white: 'bg-white dark:bg-dm-card text-dark-charcoal dark:text-dm-text shadow-card-soft dark:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.4)]',
    hero: 'bg-gradient-hero text-white shadow-none',
    dark: 'bg-gradient-dark text-white shadow-none'
  };

  const iconWrapperStyles = {
    white: 'bg-slate-100/85 dark:bg-dm-elevated border border-slate-300/60 dark:border-dm-border text-dark-charcoal dark:text-emerald-200',
    hero: 'bg-emerald-900/35 border border-emerald-700/40 text-emerald-100',
    dark: 'bg-emerald-900/30 border border-emerald-700/35 text-emerald-100'
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
            className={`${iconWrapperStyles[variant]} w-12 h-12 rounded-full flex items-center justify-center text-2xl`}
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
      <p className={`text-sm font-medium mb-2 ${variant === 'white' ? 'text-gray-600 dark:text-dm-muted' : 'text-opacity-90'}`}>
        {title}
      </p>

      {/* Value */}
      <h3 className={`text-3xl font-bold mb-2 text-left leading-relaxed ${variant === 'white' ? 'text-dark-charcoal dark:text-dm-text' : 'text-white'}`}>
        {value}
      </h3>

      {/* Subtitle */}
      {subtitle && (
        <p className={`text-xs ${variant === 'white' ? 'text-gray-500 dark:text-dm-soft' : 'text-opacity-75'}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default StatCard;
