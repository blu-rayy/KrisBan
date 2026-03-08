import { useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Cancel01Icon,
  ChartBarLineIcon,
  DashboardSquare01Icon,
  DocumentAttachmentIcon,
  FlashIcon,
  HelpCircleIcon,
  KanbanIcon,
  Mail01Icon,
  Menu01Icon,
  Settings01Icon,
  Ticket01Icon
} from '@hugeicons/core-free-icons';

export const Sidebar = ({
  activeSection,
  setActiveSection,
  userRole,
  isCollapsed = false,
  isMobile = false,
  isMobileOpen = false,
  onToggleCollapse,
  onCloseMobile
}) => {
  const [showHelp, setShowHelp] = useState(false);

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: DashboardSquare01Icon,
      status: 'active',
      visibility: 'all',
      section: 'MENU'
    },
    {
      id: 'progress-reports',
      label: 'Progress Reports',
      icon: ChartBarLineIcon,
      status: 'active',
      visibility: 'all',
      section: 'MENU'
    },
    {
      id: 'sprints',
      label: 'Sprints',
      icon: FlashIcon,
      status: 'active',
      visibility: 'all',
      section: 'MENU'
    },
    {
      id: 'emails',
      label: 'Emails',
      icon: Mail01Icon,
      status: 'active',
      visibility: 'all',
      section: 'MENU'
    },
    {
      id: 'kanban',
      label: 'KanBan',
      icon: KanbanIcon,
      status: 'active',
      visibility: 'all',
      section: 'MENU'
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: DocumentAttachmentIcon,
      status: 'TBD',
      visibility: 'all',
      section: 'MENU'
    },
    {
      id: 'tickets',
      label: 'Tickets',
      icon: Ticket01Icon,
      status: 'active',
      visibility: 'all',
      section: 'MENU'
    }
  ];

  const generalItems = [
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings01Icon,
      action: () => setActiveSection('settings'),
      section: 'GENERAL'
    },
    {
      id: 'help',
      label: 'Help',
      icon: HelpCircleIcon,
      action: () => setShowHelp(true),
      section: 'GENERAL'
    }
  ];

  // Filter menu items based on user role
  const visibleItems = menuItems.filter(item => {
    if (item.visibility === 'admin' && userRole !== 'ADMIN') return false;
    return true;
  });

  const desktopWidthClass = isCollapsed ? 'lg:w-20' : 'lg:w-64';
  const mobileVisibilityClass = isMobileOpen ? 'translate-x-0' : '-translate-x-full';
  const shouldShowText = !isCollapsed || isMobile;

  return (
    <>
    <aside
      className={`bg-white border-r border-gray-200 h-[calc(100vh-80px)] shadow-sm flex flex-col fixed left-0 top-20 z-40 transition-[width,transform] duration-300 ease-in-out ${desktopWidthClass} w-72 max-w-[85vw] lg:max-w-none ${mobileVisibilityClass} lg:translate-x-0`}
    >
      <div className="h-14 flex items-center" style={{ paddingLeft: '22px' }}>
        <button
          onClick={isMobile ? onCloseMobile : onToggleCollapse}
          className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors duration-200"
          aria-label={isMobile ? 'Close sidebar' : 'Toggle sidebar'}
        >
          <HugeiconsIcon
            icon={isMobile ? Cancel01Icon : Menu01Icon}
            size={18}
            color="currentColor"
          />
        </button>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-hide">
        {/* Menu Items */}
        {visibleItems.map(item => (
          (() => {
            const isActive = activeSection === item.id;
            const iconColorClass = isActive ? 'text-white' : 'text-forest-green';
            return (
          <button
            key={item.id}
            onClick={() => {
              setActiveSection(item.id);
              if (isMobile) {
                onCloseMobile?.();
              }
            }}
            disabled={item.status === 'TBD'}
            className={`w-full h-12 flex items-center rounded-lg text-left transition-colors duration-200 ${
              isActive
                ? 'bg-gradient-hero text-white shadow-md'
                : item.status === 'TBD'
                ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                : 'hover:bg-gray-100 text-gray-700 hover:text-dark-charcoal'
            }`}
            title={!shouldShowText ? item.label : undefined}
          >
            <span className={`w-12 flex-shrink-0 flex items-center justify-center ${iconColorClass}`}>
              <HugeiconsIcon icon={item.icon} size={20} color="currentColor" />
            </span>
            <div
              className={`min-w-0 overflow-hidden transition-[max-width,opacity,margin-left] duration-300 ease-in-out ${
                shouldShowText ? 'flex-1 max-w-[180px] opacity-100 ml-3' : 'max-w-0 opacity-0 ml-0'
              }`}
            >
              <span className="block font-medium text-sm truncate whitespace-nowrap">{item.label}</span>
            </div>
            {item.badge && (
              <span
                className={`text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold whitespace-nowrap overflow-hidden transition-[max-width,opacity,margin] duration-300 ease-in-out ${
                  shouldShowText ? 'max-w-16 opacity-100 ml-1' : 'max-w-0 opacity-0 ml-0 px-0 py-0'
                }`}
              >
                {item.badge}
              </span>
            )}

          </button>
            );
          })()
        ))}
      </nav>

      {/* General Section - Bottom */}
      <div className="border-t border-gray-200 p-4 space-y-2">
        {/* General Items */}
        {generalItems.map(item => (
          (() => {
            const iconColorClass = 'text-forest-green';
            return (
          <button
            key={item.id}
            onClick={item.action}
            className={`w-full h-12 flex items-center rounded-lg text-left transition-colors duration-200 ${
              item.isDanger
                ? 'hover:bg-red-50 text-red-600 hover:text-red-700'
                : 'hover:bg-gray-100 text-gray-700 hover:text-dark-charcoal'
            }`}
            title={!shouldShowText ? item.label : undefined}
          >
            <span className={`w-12 flex-shrink-0 flex items-center justify-center ${iconColorClass}`}>
              <HugeiconsIcon icon={item.icon} size={20} color="currentColor" />
            </span>
            <span
              className={`block font-medium text-sm truncate whitespace-nowrap overflow-hidden transition-[max-width,opacity,margin] duration-300 ease-in-out ${
                shouldShowText ? 'max-w-[140px] opacity-100 ml-3' : 'max-w-0 opacity-0 ml-0'
              }`}
            >
              {item.label}
            </span>
          </button>
            );
          })()
        ))}
      </div>
    </aside>

    {showHelp && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-800/40 p-4">
        <button
          type="button"
          className="absolute inset-0"
          aria-label="Close help"
          onClick={() => setShowHelp(false)}
        />
        <div className="relative z-10 w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl bg-white shadow-2xl [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          {/* Header */}
          <div className="bg-gradient-hero px-6 py-5 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/20">
                  <HugeiconsIcon icon={HelpCircleIcon} size={20} color="white" />
                </span>
                <div>
                  <h2 className="text-lg font-bold text-white">Help &amp; Reference</h2>
                  <p className="text-xs text-emerald-100">Quick guide to using KrisBan</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHelp(false)}
                className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 transition"
                aria-label="Close"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={16} color="white" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Quick Start */}
            <section>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-emerald-700 border-b border-emerald-100 pb-1">Quick Start</p>
              <ol className="space-y-2 text-sm text-slate-700 list-decimal list-inside">
                <li>Go to <span className="font-medium text-slate-900">Progress Reports</span> and fill in your sprint entry for the day.</li>
                <li>To attach a screenshot, click the paste zone and press <kbd className="px-1.5 py-0.5 rounded border border-slate-300 bg-slate-100 text-xs font-mono">Ctrl+V</kbd>.</li>
                <li>Head to the <span className="font-medium text-slate-900">Generate Report</span> tab, pick a date range, and click <span className="font-medium text-slate-900">Generate Draft</span>.</li>
                <li>In <span className="font-medium text-slate-900">Emails CRM</span>, add an SME, select a template, and copy the generated draft.</li>
                <li>Log the conversation result back on the SME&apos;s outreach panel.</li>
              </ol>
            </section>

            {/* FAQs */}
            <section>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-emerald-700 border-b border-emerald-100 pb-1">FAQs</p>
              <div className="space-y-3">
                {[
                  { q: 'How do I paste a screenshot into a progress entry?', a: 'Click the dashed paste zone in the entry form, then press Ctrl+V. The image will be attached automatically.' },
                  { q: 'Can I edit a submitted entry?', a: 'Yes — open the Recent Entries table, click the edit icon on any row, and save your changes.' },
                  { q: 'What does "Generate Draft" produce?', a: 'It compiles all progress entries within the selected date range into a formatted weekly report draft you can copy or export.' },
                  { q: 'How do I assign a sprint to an entry?', a: 'The sprint is set automatically based on the entry date. The active sprint badge appears below the date field.' }
                ].map(({ q, a }) => (
                  <div key={q} className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
                    <p className="text-sm font-semibold text-slate-800 mb-1">{q}</p>
                    <p className="text-sm text-slate-600">{a}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Template Variables */}
            <section>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-emerald-700 border-b border-emerald-100 pb-1">Email Template Variables</p>
              <p className="text-xs text-slate-500 mb-3">Use these placeholders in your email templates. They are replaced automatically when a draft is generated.</p>
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 text-xs uppercase tracking-wide">
                      <th className="px-4 py-2.5 text-left font-semibold">Variable</th>
                      <th className="px-4 py-2.5 text-left font-semibold">Replaced With</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      { variable: '[SME_NAME]', description: "SME's full name" },
                      { variable: '[ORGANIZATION]', description: "SME's organization" },
                      { variable: '[SME_TITLE]', description: "SME's title or role" },
                      { variable: '[SENDER_NAME]', description: "Point person's name" },
                      { variable: '[LAST_CONTACT_DATE]', description: 'Last recorded contact date' }
                    ].map(({ variable, description }) => (
                      <tr key={variable} className="bg-white">
                        <td className="px-4 py-2.5">
                          <code className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-xs font-mono">{variable}</code>
                        </td>
                        <td className="px-4 py-2.5 text-slate-600">{description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* SME Statuses */}
            <section>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-emerald-700 border-b border-emerald-100 pb-1">SME Status Guide</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {[
                  { status: 'Draft', color: 'bg-slate-100 text-slate-700', desc: 'SME added but not yet contacted.' },
                  { status: 'Sent', color: 'bg-blue-50 text-blue-700', desc: 'Message sent, awaiting reply.' },
                  { status: 'Waiting', color: 'bg-amber-50 text-amber-700', desc: 'Follow-up pending or in progress.' },
                  { status: 'Responded', color: 'bg-emerald-50 text-emerald-700', desc: 'SME has replied to outreach.' },
                  { status: 'No Reply', color: 'bg-red-50 text-red-600', desc: 'No response received after outreach.' }
                ].map(({ status, color, desc }) => (
                  <div key={status} className="flex items-start gap-3 rounded-lg border border-slate-100 bg-white px-4 py-3">
                    <span className={`mt-0.5 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${color}`}>{status}</span>
                    <p className="text-sm text-slate-600">{desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Keyboard Shortcuts */}
            <section>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-emerald-700 border-b border-emerald-100 pb-1">Keyboard Shortcuts</p>
              <div className="space-y-2">
                {[
                  { keys: 'Ctrl+V', action: 'Paste a screenshot into the progress entry paste zone' }
                ].map(({ keys, action }) => (
                  <div key={keys} className="flex items-center gap-3 text-sm text-slate-700">
                    <kbd className="px-2 py-1 rounded border border-slate-300 bg-slate-100 text-xs font-mono whitespace-nowrap">{keys}</kbd>
                    <span>{action}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    )}
    </>
  );
};
