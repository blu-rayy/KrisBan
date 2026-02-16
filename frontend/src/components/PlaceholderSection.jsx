export const PlaceholderSection = ({ title, icon }) => {
  return (
    <div className="flex flex-col items-center justify-center h-96 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-2xl font-bold text-gray-600 mb-2">{title}</h3>
      <p className="text-gray-500">Coming Soon</p>
      <p className="text-sm text-gray-400 mt-4">This feature is under development</p>
    </div>
  );
};
