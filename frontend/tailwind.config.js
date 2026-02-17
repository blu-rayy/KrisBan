export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
        secondary: '#8b5cf6',
        success: '#10b981',
        danger: '#ef4444',
        warning: '#f59e0b',
        // Forest Gradient Theme - Surface Colors
        'surface-main': '#ffffff',
        'surface-ground': '#f8f9fa',
        'dark-charcoal': '#1f2937',
        // Forest Gradient Theme - Accent Colors
        'forest-green': '#15803d',
        'emerald-deep': '#064e3b',
        'dark-emerald': '#022c22',
        'leaf-green': '#10b981'
      },
      backgroundImage: {
        // Gradient Accents - The "Premium" Look
        'gradient-hero': 'linear-gradient(135deg, #15803d 0%, #064e3b 100%)',
        'gradient-dark': 'linear-gradient(135deg, #022c22 0%, #000000 100%)',
        'gradient-action': 'linear-gradient(135deg, #10b981 0%, #047857 100%)'
      },
      borderRadius: {
        // Bento Card Styling - Large radius for modern feel
        'xl-card': '24px'
      },
      boxShadow: {
        // Soft, diffused shadow for white cards
        'card-soft': '0 10px 30px -10px rgba(0, 0, 0, 0.05)',
        // Subtle shadow for interactive elements
        'card-elevated': '0 4px 12px -2px rgba(0, 0, 0, 0.08)'
      }
    }
  },
  plugins: []
};
