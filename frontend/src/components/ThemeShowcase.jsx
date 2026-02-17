import React from 'react';
import { StatCard } from './StatCard';

/**
 * ThemeShowcase Component
 * 
 * This component demonstrates all Forest Gradient Theme features:
 * - StatCard variants (white, hero, dark)
 * - Icon styling rules (inverted contrast)
 * - Bento Grid layout
 * - Gradient applications
 * - Shadow and border radius consistency
 * 
 * Use this as a reference when building new dashboard pages.
 */
export const ThemeShowcase = () => {
  return (
    <div className="min-h-screen bg-surface-ground p-8">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-dark-charcoal mb-2">
          Forest Gradient Theme Showcase
        </h1>
        <p className="text-gray-600">
          Premium Modern Design System for KrisBan Dashboard
        </p>
      </div>

      {/* ============================================================
          SECTION 1: StatCard Variants
          ============================================================ */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-dark-charcoal mb-6">
          StatCard Component Variants
        </h2>
        <p className="text-gray-600 mb-6">
          Three visual variants to match different information hierarchy levels.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* White Card Example */}
          <div>
            <p className="text-sm font-medium text-dark-charcoal mb-3">
              Variant: white
            </p>
            <StatCard
              variant="white"
              title="Ended Projects"
              value="10"
              subtitle="Increased from last month"
              icon="✓"
            />
          </div>

          {/* Hero Card Example */}
          <div>
            <p className="text-sm font-medium text-dark-charcoal mb-3">
              Variant: hero
            </p>
            <StatCard
              variant="hero"
              title="Total Projects"
              value="24"
              subtitle="Increased from last month"
              icon="📊"
              trend="↑ +4"
            />
          </div>

          {/* Dark Card Example */}
          <div>
            <p className="text-sm font-medium text-dark-charcoal mb-3">
              Variant: dark
            </p>
            <StatCard
              variant="dark"
              title="Active Tasks"
              value="42"
              subtitle="In progress"
              icon="⚡"
              trend="↑ +8"
            />
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 2: Icon Styling Rules (Inverted Contrast)
          ============================================================ */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-dark-charcoal mb-6">
          Icon Styling: "Inverted" Contrast Pattern
        </h2>
        <p className="text-gray-600 mb-6">
          Icons are styled to maximize readability on each card type.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* On Gradient Cards */}
          <div>
            <h3 className="font-semibold text-dark-charcoal mb-4">
              On Gradient Cards: White Background + Colored Icon
            </h3>
            <div className="bg-gradient-hero rounded-[24px] p-6 text-white">
              <p className="text-sm mb-4">White icon wrapper with green icon color</p>
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-xl text-forest-green">
                  📊
                </div>
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-xl text-forest-green">
                  ⚡
                </div>
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-xl text-forest-green">
                  ✓
                </div>
              </div>
            </div>
          </div>

          {/* On White Cards */}
          <div>
            <h3 className="font-semibold text-dark-charcoal mb-4">
              On White Cards: Gray Background + Black Icon (with Border)
            </h3>
            <div className="bg-white rounded-[24px] p-6 shadow-card-soft">
              <p className="text-sm text-gray-600 mb-4">
                Off-white icon wrapper with dark icon color
              </p>
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-gray-100 border-2 border-gray-200 rounded-full flex items-center justify-center text-xl text-dark-charcoal">
                  📊
                </div>
                <div className="w-12 h-12 bg-gray-100 border-2 border-gray-200 rounded-full flex items-center justify-center text-xl text-dark-charcoal">
                  ⚡
                </div>
                <div className="w-12 h-12 bg-gray-100 border-2 border-gray-200 rounded-full flex items-center justify-center text-xl text-dark-charcoal">
                  ✓
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 3: Bento Grid Layout (Visual Hierarchy)
          ============================================================ */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-dark-charcoal mb-6">
          Bento Grid Layout: "1-2 Per Row" Rule
        </h2>
        <p className="text-gray-600 mb-6">
          Strategic placement of gradient cards prevents visual clutter and maintains focus.
        </p>

        {/* Row 1: Hero + 3 White Cards */}
        <div className="mb-8">
          <p className="text-sm font-medium text-gray-600 mb-3">Row 1: Hero Gradient + 3 White Cards</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              variant="hero"
              title="Total Projects"
              value="24"
              subtitle="Increased from last month"
              icon="📊"
              trend="↑ +4"
            />
            <StatCard variant="white" title="Ended" value="10" icon="✓" />
            <StatCard variant="white" title="Running" value="12" icon="⚡" />
            <StatCard variant="white" title="Pending" value="2" icon="⏳" />
          </div>
        </div>

        {/* Row 2: 2 White + 1 Dark Gradient */}
        <div className="mb-8">
          <p className="text-sm font-medium text-gray-600 mb-3">Row 2: 2 White Cards + Dark Gradient</p>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <StatCard variant="white" title="Completed" value="8" icon="✓" />
            <StatCard variant="white" title="In Review" value="5" icon="👁" />
            <StatCard
              variant="dark"
              title="Critical"
              value="3"
              subtitle="Need attention"
              icon="🚨"
              trend="↑ +1"
            />
          </div>
        </div>

        {/* Row 3: Mixed Gradient Cards */}
        <div>
          <p className="text-sm font-medium text-gray-600 mb-3">Row 3: Action Button + Dark Gradient Card</p>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Wide card using CSS grid */}
            <button className="lg:col-span-1 bg-gradient-action text-white rounded-[24px] p-6 font-semibold hover:shadow-lg transition-all h-32 flex items-center justify-center">
              <span className="text-2xl mr-2">+</span>
              Add Project
            </button>
            <div className="lg:col-span-2 bg-gradient-dark text-white rounded-[24px] p-6">
              <h3 className="text-lg font-bold mb-2">Time Tracker</h3>
              <p className="text-white text-opacity-80 mb-4">Current session</p>
              <div className="text-3xl font-mono font-bold">01:24:08</div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 4: Design Tokens
          ============================================================ */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-dark-charcoal mb-6">
          Design Tokens & Colors
        </h2>

        {/* Surface Colors */}
        <div className="mb-8">
          <h3 className="font-semibold text-dark-charcoal mb-4">Surface Colors</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-[24px] overflow-hidden shadow-card-soft">
              <div className="bg-white h-20" />
              <div className="bg-surface-ground p-4">
                <p className="font-mono text-sm">surface-main: #ffffff</p>
                <p className="text-xs text-gray-600">Pure white for cards</p>
              </div>
            </div>
            <div className="rounded-[24px] overflow-hidden shadow-card-soft">
              <div className="bg-surface-ground h-20" />
              <div className="bg-white p-4">
                <p className="font-mono text-sm">surface-ground: #f8f9fa</p>
                <p className="text-xs text-gray-600">Off-white for background</p>
              </div>
            </div>
          </div>
        </div>

        {/* Primary Colors */}
        <div className="mb-8">
          <h3 className="font-semibold text-dark-charcoal mb-4">Primary Colors</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: 'forest-green', hex: '#15803d', text: 'text-white' },
              { name: 'emerald-deep', hex: '#064e3b', text: 'text-white' },
              { name: 'dark-emerald', hex: '#022c22', text: 'text-white' },
              { name: 'leaf-green', hex: '#10b981', text: 'text-white' }
            ].map((color) => (
              <div key={color.name} className="rounded-[24px] overflow-hidden shadow-card-soft">
                <div
                  className={`h-20 ${color.text} flex items-center justify-center font-mono text-sm font-bold`}
                  style={{ backgroundColor: color.hex }}
                >
                  {color.hex}
                </div>
                <div className="bg-white p-4">
                  <p className="font-mono text-sm">{color.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gradients */}
        <div>
          <h3 className="font-semibold text-dark-charcoal mb-4">Gradient Accents</h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="rounded-[24px] overflow-hidden shadow-none border border-gray-200">
              <div className="bg-gradient-hero h-24" />
              <div className="bg-white p-4">
                <p className="font-semibold text-sm mb-1">gradient-hero</p>
                <p className="font-mono text-xs text-gray-600">#15803d → #064e3b</p>
                <p className="text-xs text-gray-500 mt-2">Primary stats & hero cards</p>
              </div>
            </div>
            <div className="rounded-[24px] overflow-hidden shadow-none border border-gray-200">
              <div className="bg-gradient-dark h-24" />
              <div className="bg-white p-4">
                <p className="font-semibold text-sm mb-1">gradient-dark</p>
                <p className="font-mono text-xs text-gray-600">#022c22 → #000000</p>
                <p className="text-xs text-gray-500 mt-2">Premium accents & time tracker</p>
              </div>
            </div>
            <div className="rounded-[24px] overflow-hidden shadow-none border border-gray-200">
              <div className="bg-gradient-action h-24" />
              <div className="bg-white p-4">
                <p className="font-semibold text-sm mb-1">gradient-action</p>
                <p className="font-mono text-xs text-gray-600">#10b981 → #047857</p>
                <p className="text-xs text-gray-500 mt-2">Buttons & CTAs</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 5: Typography & Spacing
          ============================================================ */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-dark-charcoal mb-6">
          Typography & Spacing
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Typography */}
          <div className="bg-white rounded-[24px] p-6 shadow-card-soft">
            <h3 className="font-semibold text-dark-charcoal mb-4">Typography Hierarchy</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-600 mb-1">Body (Regular)</p>
                <p className="text-base text-dark-charcoal">Plan, prioritize, and accomplish your tasks with ease.</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Stat Title</p>
                <p className="stat-title text-dark-charcoal">Total Projects</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Stat Value</p>
                <p className="stat-value text-dark-charcoal">24</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Stat Subtitle</p>
                <p className="stat-subtitle text-gray-600">Increased from last month</p>
              </div>
            </div>
          </div>

          {/* Spacing & Shadows */}
          <div className="bg-white rounded-[24px] p-6 shadow-card-soft">
            <h3 className="font-semibold text-dark-charcoal mb-4">Spacing & Shadows</h3>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-xs text-gray-600 mb-1">Border Radius</p>
                <p className="text-dark-charcoal font-mono">rounded-[24px] / 1.5rem</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Card Shadow (Soft)</p>
                <p className="text-dark-charcoal font-mono text-xs">
                  0 10px 30px -10px rgba(0,0,0,0.05)
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Card Padding</p>
                <p className="text-dark-charcoal font-mono">p-6 (1.5rem)</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Grid Gap</p>
                <p className="text-dark-charcoal font-mono">gap-6 (1.5rem)</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 6: Implementation Notes
          ============================================================ */}
      <section>
        <h2 className="text-2xl font-bold text-dark-charcoal mb-6">
          Implementation Notes
        </h2>

        <div className="bg-white rounded-[24px] p-6 shadow-card-soft">
          <ul className="space-y-3 text-dark-charcoal">
            <li className="flex gap-3">
              <span className="text-leaf-green">✓</span>
              <span>Use StatCard component for all statistics</span>
            </li>
            <li className="flex gap-3">
              <span className="text-leaf-green">✓</span>
              <span>Apply bento-grid classes for layout structure</span>
            </li>
            <li className="flex gap-3">
              <span className="text-leaf-green">✓</span>
              <span>Limit gradient cards to 1-2 per row maximum</span>
            </li>
            <li className="flex gap-3">
              <span className="text-leaf-green">✓</span>
              <span>Use inverted icon contrast (white bg on gradients)</span>
            </li>
            <li className="flex gap-3">
              <span className="text-leaf-green">✓</span>
              <span>Maintain 24px border radius on all cards</span>
            </li>
            <li className="flex gap-3">
              <span className="text-leaf-green">✓</span>
              <span>Apply shadow-card-soft to white cards only</span>
            </li>
            <li className="flex gap-3">
              <span className="text-leaf-green">✓</span>
              <span>Test accessibility with contrast checker tools</span>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
};

export default ThemeShowcase;
