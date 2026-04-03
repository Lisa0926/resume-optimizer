import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  imageUrl?: string;
}

export function EmptyState({ icon, title, description, action, imageUrl }: EmptyStateProps) {
  return (
    <div className="text-center py-16 px-4">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          className="h-32 w-32 mx-auto mb-6 opacity-80"
        />
      ) : (
        <div className="h-24 w-24 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
          <div className="text-gray-400 dark:text-gray-500">
            {icon}
          </div>
        </div>
      )}
      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
      <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">{description}</p>
      {action && <div className="flex justify-center gap-3">{action}</div>}
    </div>
  );
}
