export const PlaceholderSection = ({ title, icon }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] bg-surface-ground rounded-[24px] border-2 border-dashed border-gray-300 m-8">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-2xl font-bold text-dark-charcoal mb-2">{title}</h3>
      <p className="text-gray-600">Coming Soon</p>
      <p className="text-sm text-gray-500 mt-4">This feature is under development</p>
    </div>
  );
};
