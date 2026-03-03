import { HugeiconsIcon } from '@hugeicons/react';
import { Delete02Icon, Edit02Icon } from '@hugeicons/core-free-icons';
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

const PointPersonCell = ({ name, profilePicture }) => (
  <div className="flex items-center gap-2">
    {profilePicture ? (
      <img
        src={profilePicture}
        alt={name || 'Point person'}
        className="h-7 w-7 rounded-full border border-slate-200 object-cover"
      />
    ) : (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-slate-200 text-[10px] font-semibold text-slate-700">
        {getInitials(name)}
      </span>
    )}
    <span className="text-slate-700">{name || 'N/A'}</span>
  </div>
);

const getBusinessDaysSinceLastContact = (lastContactDate) => {
  if (!lastContactDate) return Number.POSITIVE_INFINITY;

  const startDate = new Date(lastContactDate);
  if (Number.isNaN(startDate.getTime())) return Number.POSITIVE_INFINITY;

  const today = new Date();
  const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  if (start >= end) return 0;

  let businessDays = 0;
  const cursor = new Date(start);
  cursor.setDate(cursor.getDate() + 1);

  while (cursor <= end) {
    const day = cursor.getDay();
    const isWeekday = day !== 0 && day !== 6;
    if (isWeekday) businessDays += 1;
    cursor.setDate(cursor.getDate() + 1);
  }

  return businessDays;
};

const getDesktopRowClassByAge = (businessDaysSinceLastContact) => {
  if (businessDaysSinceLastContact <= 7) return 'bg-emerald-50/40 hover:bg-emerald-50';
  if (businessDaysSinceLastContact <= 10) return 'bg-rose-50/50 hover:bg-rose-50';
  if (businessDaysSinceLastContact <= 15) return 'bg-red-50/60 hover:bg-red-50';
  if (businessDaysSinceLastContact <= 20) return 'bg-red-100/60 hover:bg-red-100';
  return 'bg-red-100/80 hover:bg-red-100';
};

const getMobileCardClassByAge = (businessDaysSinceLastContact) => {
  if (businessDaysSinceLastContact <= 7) return 'border-emerald-100 bg-emerald-50/40 hover:bg-emerald-50';
  if (businessDaysSinceLastContact <= 10) return 'border-rose-100 bg-rose-50/50 hover:bg-rose-50';
  if (businessDaysSinceLastContact <= 15) return 'border-red-100 bg-red-50/60 hover:bg-red-50';
  if (businessDaysSinceLastContact <= 20) return 'border-red-200 bg-red-100/60 hover:bg-red-100';
  return 'border-red-200 bg-red-100/80 hover:bg-red-100';
};

export const SMERoster = ({
  smes,
  selectedSmeId,
  onSelectSme,
  onStartAddSme,
  onStartEditSme,
  onDeleteSme
}) => {
  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50 p-4 md:p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">SME Roster</h2>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
            {smes.length} Records
          </span>
          <button
            type="button"
            onClick={onStartAddSme}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-slate-50 hover:bg-emerald-700"
          >
            Add SME
          </button>
        </div>
      </div>

      <div className="hidden lg:block overflow-x-auto rounded-lg border border-slate-200 bg-slate-100">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Organization</th>
              <th className="px-4 py-3 font-semibold">Point Person</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Last Contact</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-slate-50 text-slate-800">
            {smes.map((sme) => {
              const isSelected = selectedSmeId === sme.id;
              const businessDaysSinceLastContact = getBusinessDaysSinceLastContact(sme.lastContactDate);
              const ageClass = getDesktopRowClassByAge(businessDaysSinceLastContact);

              return (
                <tr
                  key={sme.id}
                  className={`cursor-pointer transition-colors ${isSelected ? 'bg-emerald-100' : ageClass}`}
                  onClick={() => onSelectSme(sme.id)}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{sme.name}</p>
                    <p className="text-xs text-slate-600">{sme.title}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{sme.organization}</td>
                  <td className="px-4 py-3 text-slate-700">
                    <PointPersonCell name={sme.pointPerson} profilePicture={sme.pointPersonProfilePicture} />
                  </td>
                  <td className="px-4 py-3">
                    <SMEStatusBadge status={sme.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-700">{sme.lastContactDate || 'N/A'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onStartEditSme(sme);
                        }}
                        className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-slate-100 p-1.5 text-slate-700 hover:bg-slate-200"
                        aria-label={`Edit ${sme.name}`}
                        title="Edit"
                      >
                        <HugeiconsIcon icon={Edit02Icon} size={16} color="currentColor" />
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onDeleteSme(sme.id);
                        }}
                        className="inline-flex items-center justify-center rounded-md border border-red-200 bg-red-50 p-1.5 text-red-600 hover:bg-red-100"
                        aria-label={`Delete ${sme.name}`}
                        title="Delete"
                      >
                        <HugeiconsIcon icon={Delete02Icon} size={16} color="currentColor" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 lg:hidden">
        {smes.map((sme) => {
          const isSelected = selectedSmeId === sme.id;
          const businessDaysSinceLastContact = getBusinessDaysSinceLastContact(sme.lastContactDate);
          const ageClass = getMobileCardClassByAge(businessDaysSinceLastContact);

          return (
            <div
              key={sme.id}
              onClick={() => onSelectSme(sme.id)}
              className={`w-full rounded-lg border p-4 text-left transition-colors ${
                isSelected
                  ? 'border-emerald-300 bg-emerald-50'
                  : ageClass
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-800">{sme.name}</p>
                  <p className="text-sm text-slate-600">{sme.title}</p>
                </div>
                <SMEStatusBadge status={sme.status} />
              </div>
              <div className="mt-3 space-y-1 text-sm text-slate-700">
                <p>{sme.organization}</p>
                <div className="flex items-center gap-2">
                  <span>Point Person:</span>
                  <PointPersonCell name={sme.pointPerson} profilePicture={sme.pointPersonProfilePicture} />
                </div>
                <p>Last Contact: {sme.lastContactDate || 'N/A'}</p>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onStartEditSme(sme);
                  }}
                  className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-slate-100 p-1.5 text-slate-700 hover:bg-slate-200"
                  aria-label={`Edit ${sme.name}`}
                  title="Edit"
                >
                  <HugeiconsIcon icon={Edit02Icon} size={16} color="currentColor" />
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onDeleteSme(sme.id);
                  }}
                  className="inline-flex items-center justify-center rounded-md border border-red-200 bg-red-50 p-1.5 text-red-600 hover:bg-red-100"
                  aria-label={`Delete ${sme.name}`}
                  title="Delete"
                >
                  <HugeiconsIcon icon={Delete02Icon} size={16} color="currentColor" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};