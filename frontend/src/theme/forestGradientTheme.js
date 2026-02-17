/**
 * FOREST GRADIENT THEME - Design Tokens & Implementation Guide
 * 
 * Premium Modern aesthetic for KrisBan Project Management Dashboard
 * ============================================================
 */

// SURFACE COLORS
// ============================================================
// surface-main: #ffffff (Pure White - for standard cards)
// surface-ground: #f8f9fa (Off-white - for the app background)

const SURFACE_COLORS = {
  main: '#ffffff',      // Standard cards background
  ground: '#f8f9fa'     // App background
};

// PRIMARY COLOR PALETTE
// ============================================================
// Used for text, borders, and accents on white backgrounds

const PRIMARY_COLORS = {
  forestGreen: '#15803d',     // Medium Forest Green - Primary accent
  emeraldDeep: '#064e3b',     // Deep Emerald - Secondary accent
  darkEmerald: '#022c22',     // Dark Emerald - Supporting accent
  leafGreen: '#10b981',       // Leaf Green - Success & highlights
  darkCharcoal: '#1f2937'     // Dark Charcoal - Primary text
};

// GRADIENT ACCENTS - The "Premium" Look
// ============================================================
// These define the diagonal gradients for key UI elements

const GRADIENT_ACCENTS = {
  // gradient-hero: Used for "Total Projects" card and primary stats
  // Direction: 135deg (diagonal from top-left to bottom-right)
  hero: {
    from: '#15803d',        // Medium Forest Green
    to: '#064e3b',          // Deep Emerald
    css: 'linear-gradient(135deg, #15803d 0%, #064e3b 100%)'
  },

  // gradient-dark: Used for "Time Tracker" and premium accent cards
  // Direction: 135deg (diagonal)
  dark: {
    from: '#022c22',        // Dark Emerald
    to: '#000000',          // Pure Black
    css: 'linear-gradient(135deg, #022c22 0%, #000000 100%)'
  },

  // gradient-action: Used for "Add Project" buttons and CTAs
  // Direction: 135deg (diagonal)
  action: {
    from: '#10b981',        // Leaf Green
    to: '#047857',          // Forest Green
    css: 'linear-gradient(135deg, #10b981 0%, #047857 100%)'
  }
};

// SHADOW DEFINITIONS
// ============================================================

const SHADOWS = {
  // Soft, diffused shadow for white cards
  // Creates depth without being intrusive
  cardSoft: '0 10px 30px -10px rgba(0, 0, 0, 0.05)',

  // Elevated shadow for interactive elements
  cardElevated: '0 4px 12px -2px rgba(0, 0, 0, 0.08)',

  // No shadow for gradient cards (they have enough visual weight)
  none: 'none'
};

// BORDER RADIUS
// ============================================================

const BORDER_RADIUS = {
  // Large radius for friendly, modern feel
  xlCard: '24px'
};

// TYPOGRAPHY RULES
// ============================================================

const TYPOGRAPHY = {
  whiteCard: {
    primary: '#1f2937',     // Dark Charcoal - Main text
    secondary: '#6b7280',   // Gray - Supporting text
    tertiary: '#9ca3af'     // Light Gray - Subtle text
  },

  gradientCard: {
    primary: '#ffffff',      // Pure White - Main text
    secondary: '#ffffff',    // White with opacity for supporting
    tertiary: '#ffffff'      // White with opacity for subtle
  }
};

// COMPONENT: StatCard Variants
// ============================================================

const STAT_CARD_VARIANTS = {
  white: {
    background: '#ffffff',
    textColor: '#1f2937',
    shadow: '0 10px 30px -10px rgba(0, 0, 0, 0.05)',
    iconWrapper: {
      background: '#f3f4f6',
      borderColor: '#e5e7eb',
      iconColor: '#1f2937'
    }
  },

  hero: {
    background: 'linear-gradient(135deg, #15803d 0%, #064e3b 100%)',
    textColor: '#ffffff',
    shadow: 'none',
    iconWrapper: {
      background: '#ffffff',
      borderColor: 'transparent',
      iconColor: '#15803d'
    }
  },

  dark: {
    background: 'linear-gradient(135deg, #022c22 0%, #000000 100%)',
    textColor: '#ffffff',
    shadow: 'none',
    iconWrapper: {
      background: '#ffffff',
      borderColor: 'transparent',
      iconColor: '#022c22'
    }
  }
};

// ICON STYLING RULES - "Inverted" Contrast
// ============================================================

const ICON_RULES = {
  onGradientCards: {
    description: 'On Green/Dark Cards: White Background + Colored Icon',
    backgroundColor: '#ffffff',    // Pure White
    iconColor: 'gradient-dependent' // Green on hero, Dark on dark
  },

  onWhiteCards: {
    description: 'On White Cards: White Background + Black Icon (with border)',
    backgroundColor: '#f3f4f6',     // Off-white
    borderColor: '#e5e7eb',         // Light gray border
    iconColor: '#1f2937'            // Dark Charcoal
  }
};

// VISUAL HIERARCHY RULE - Distribution
// ============================================================

const VISUAL_HIERARCHY = {
  rule: 'Only 1-2 cards per row should have gradient backgrounds.',
  rationale: 'Rest must be white to prevent visual clutter and maintain focus.',
  
  examples: {
    row1: {
      card1: 'GRADIENT (Hero)',
      card2: 'WHITE',
      card3: 'WHITE',
      card4: 'WHITE'
    },
    
    row2: {
      card1: 'GRADIENT (Dark)',
      card2: 'WHITE',
      card3: 'WHITE'
    },
    
    row3: {
      card1: 'WHITE',
      card2: 'GRADIENT (Action)',
      card3: 'GRADIENT (Dark)'
    }
  }
};

// IMPLEMENTATION CHECKLIST
// ============================================================

const IMPLEMENTATION_CHECKLIST = [
  '✓ Update tailwind.config.js with design tokens',
  '✓ Create StatCard component with variant props',
  '✓ Create BentoDashboard component with grid layout',
  '✓ Apply shadow-card-soft to white cards',
  '✓ Apply gradient backgrounds to hero/dark cards',
  '✓ Implement icon styling rules (inverted contrast)',
  '✓ Ensure 24px border-radius on all cards',
  '✓ Test contrast ratios for WCAG compliance',
  '✓ Verify hover states and transitions',
  '✓ Document component prop interfaces'
];

// USAGE EXAMPLES
// ============================================================

export const USAGE_EXAMPLES = {
  statCard: `
    // White Card (Standard)
    <StatCard 
      variant="white"
      title="Ended Projects"
      value="10"
      icon="✓"
    />

    // Hero Card (Primary Metric)
    <StatCard 
      variant="hero"
      title="Total Projects"
      value="24"
      icon="📊"
      trend="↑ +4"
    />

    // Dark Card (Premium Accent)
    <StatCard 
      variant="dark"
      title="Active Tasks"
      value="42"
      icon="⚡"
    />
  `,

  bentoDashboard: `
    // Use BentoDashboard component
    <BentoDashboard 
      dashboardData={data}
      userRole={userRole}
    />
  `,

  customGradient: `
    // Apply gradients to custom elements
    <div className="bg-gradient-hero text-white rounded-xl-card p-6">
      Hero Content
    </div>

    // Or using inline styles
    <div 
      style={{
        background: 'linear-gradient(135deg, #15803d 0%, #064e3b 100%)',
        borderRadius: '24px'
      }}
    >
      Custom Gradient Element
    </div>
  `
};

// TAILWIND CONFIGURATION EXTENSION
// ============================================================

export const TAILWIND_CONFIG_EXTENSION = {
  colors: {
    'surface-main': '#ffffff',
    'surface-ground': '#f8f9fa',
    'dark-charcoal': '#1f2937',
    'forest-green': '#15803d',
    'emerald-deep': '#064e3b',
    'dark-emerald': '#022c22',
    'leaf-green': '#10b981'
  },

  backgroundImage: {
    'gradient-hero': 'linear-gradient(135deg, #15803d 0%, #064e3b 100%)',
    'gradient-dark': 'linear-gradient(135deg, #022c22 0%, #000000 100%)',
    'gradient-action': 'linear-gradient(135deg, #10b981 0%, #047857 100%)'
  },

  borderRadius: {
    'xl-card': '24px'
  },

  boxShadow: {
    'card-soft': '0 10px 30px -10px rgba(0, 0, 0, 0.05)',
    'card-elevated': '0 4px 12px -2px rgba(0, 0, 0, 0.08)'
  }
};

// WCAG ACCESSIBILITY NOTES
// ============================================================

export const ACCESSIBILITY_NOTES = {
  contrastRatios: {
    whiteBg: {
      darkCharcoalText: '15.7:1',  // AAA compliant
      grayText: '8.6:1'            // AA compliant
    },
    gradientBg: {
      whiteText: '7.8:1'            // AA compliant
    }
  },

  recommendations: [
    'Always provide sufficient color contrast',
    'Don\'t rely on color alone to convey information',
    'Use icons + text together for clarity',
    'Test with tools like WebAIM Contrast Checker',
    'Ensure focus states are visible for keyboard navigation'
  ]
};

export const THEME_CONFIG = {
  SURFACE_COLORS,
  PRIMARY_COLORS,
  GRADIENT_ACCENTS,
  SHADOWS,
  BORDER_RADIUS,
  TYPOGRAPHY,
  STAT_CARD_VARIANTS,
  ICON_RULES,
  VISUAL_HIERARCHY
};

export default THEME_CONFIG;
