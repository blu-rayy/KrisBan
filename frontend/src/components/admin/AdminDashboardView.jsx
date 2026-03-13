export const AdminDashboardView = () => {
  return (
    <div className="min-h-full bg-surface-ground dark:bg-dm-ground p-4 sm:p-6 lg:p-8 transition-colors duration-300">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-8 sm:mb-12">
        <div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-dark-charcoal dark:text-dm-text mb-2">
            Admin Dashboard
          </h2>
          <p className="text-gray-600 dark:text-dm-muted text-sm sm:text-base lg:text-lg">
            You have unlocked the secret admin panel. Handle with care.
          </p>
        </div>
      </div>

      {/* Centred Nick Wilde */}
      <div className="flex flex-col items-center justify-center py-20 gap-6">
        <img
          src="/nick-wilde-zootopia.gif"
          alt="Nick Wilde"
          className="rounded-2xl shadow-2xl max-w-xs sm:max-w-sm"
        />
        <p className="text-gray-500 dark:text-dm-muted text-sm italic">
          "I'll get you a copy of the file. It'll take twenty minutes." — Nick Wilde
        </p>
      </div>
    </div>
  );
};
