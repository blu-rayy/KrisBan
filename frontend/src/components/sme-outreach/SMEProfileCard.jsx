import { HugeiconsIcon } from '@hugeicons/react';
import { Linkedin01Icon, Mail01Icon, SmartPhone01Icon } from '@hugeicons/core-free-icons';
import { SMEStatusBadge } from './SMEStatusBadge';

const getInitials = (fullName = '') => {
  const parts = String(fullName || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  if (parts.length === 0) return '?';
  return parts.map((part) => part[0].toUpperCase()).join('');
};

const PointPersonAvatar = ({ name, profilePicture }) => (
  <div className="flex items-center gap-2">
    {profilePicture ? (
      <img
        src={profilePicture}
        alt={name || 'Point person'}
        className="h-6 w-6 rounded-full border border-slate-200 object-cover"
      />
    ) : (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 dark:border-dm-border bg-slate-200 dark:bg-dm-elevated text-[10px] font-semibold text-slate-600 dark:text-dm-muted">
        {getInitials(name)}
      </span>
    )}
      <span className="text-sm text-slate-700 dark:text-dm-text">{name || 'N/A'}</span>
  </div>
);

export const SMEProfileCard = ({ sme }) => {
  if (!sme) return null;

  const hasContactDetails = sme.email || sme.phone || sme.linkedinUrl;

  return (
    <div className="rounded-xl border border-slate-200 dark:border-dm-border bg-white dark:bg-dm-card p-4 md:p-5">
      {/* Avatar + identity */}
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          {sme.profilePicture ? (
            <img
              src={sme.profilePicture}
              alt={sme.name}
              className="h-16 w-16 rounded-full border-2 border-slate-200 object-cover"
            />
          ) : (
            <span className="inline-flex h-16 w-16 items-center justify-center rounded-full border-2 border-emerald-100 bg-emerald-50 text-xl font-bold text-emerald-700">
              {getInitials(sme.name)}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-slate-800 dark:text-dm-text leading-tight">{sme.name}</h3>
          <p className="text-sm text-slate-600 dark:text-dm-muted">{sme.title}</p>
          <p className="text-sm text-slate-500 dark:text-dm-soft">{sme.organization}</p>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 dark:text-dm-soft">Point Person:</span>
              <PointPersonAvatar
                name={sme.pointPerson}
                profilePicture={sme.pointPersonProfilePicture}
              />
            </div>
            <SMEStatusBadge status={sme.status} />
          </div>
        </div>
      </div>

      {/* Summary / bio */}
      {sme.summary && (
        <div className="mt-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-dm-soft">About</p>
          <p className="text-sm text-slate-700 dark:text-dm-muted leading-relaxed">{sme.summary}</p>
        </div>
      )}

      {/* Contact details */}
      {hasContactDetails && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-dm-soft">Contact</p>
          <div className="space-y-1.5">
            {sme.email && (
              <a
                href={`mailto:${sme.email}`}
                className="flex items-center gap-2 text-sm text-slate-700 dark:text-dm-text hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
              >
                <HugeiconsIcon icon={Mail01Icon} size={15} color="currentColor" className="flex-shrink-0" />
                <span className="truncate">{sme.email}</span>
              </a>
            )}
            {sme.phone && (
              <a
                href={`tel:${sme.phone}`}
                className="flex items-center gap-2 text-sm text-slate-700 dark:text-dm-text hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
              >
                <HugeiconsIcon icon={SmartPhone01Icon} size={15} color="currentColor" className="flex-shrink-0" />
                <span>{sme.phone}</span>
              </a>
            )}
            {sme.linkedinUrl && (
              <a
                href={sme.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-slate-700 dark:text-dm-text hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
              >
                <HugeiconsIcon icon={Linkedin01Icon} size={15} color="currentColor" className="flex-shrink-0" />
                <span className="truncate">{sme.linkedinUrl}</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* Notes */}
      {sme.notes && (
        <div className="mt-4 rounded-lg bg-slate-50 dark:bg-dm-elevated border border-slate-100 dark:border-dm-border px-3 py-2.5">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-dm-soft">Notes</p>
          <p className="text-sm text-slate-700 dark:text-dm-muted leading-relaxed">{sme.notes}</p>
        </div>
      )}

      {sme.lastContactDate && (
        <p className="mt-3 text-xs text-slate-400 dark:text-dm-soft">
          Last contacted: <span className="font-medium text-slate-500 dark:text-dm-muted">{sme.lastContactDate}</span>
        </p>
      )}
    </div>
  );
};
