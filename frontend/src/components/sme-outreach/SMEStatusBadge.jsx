const STATUS_STYLES = {
  Draft: 'bg-slate-100 text-slate-700 border-slate-200',
  Sent: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Waiting: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Responded: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  'No Reply': 'bg-slate-200 text-slate-700 border-slate-300'
};

export const SMEStatusBadge = ({ status }) => {
  const colorClass = STATUS_STYLES[status] || STATUS_STYLES.Draft;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${colorClass}`}
    >
      {status}
    </span>
  );
};