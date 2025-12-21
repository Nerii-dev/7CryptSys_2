import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  loading?: boolean;
}

export const StatCard = ({ title, value, icon, loading = false }: StatCardProps) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 flex items-center gap-4">
      {icon && (
        <div className="bg-blue-100 text-blue-600 p-3 rounded-full">
          {icon}
        </div>
      )}
      <div>
        <h3 className="text-gray-500 font-medium">{title}</h3>
        {loading ? (
          <div className="h-8 w-24 bg-gray-200 rounded animate-pulse mt-1" />
        ) : (
          <p className="text-4xl font-bold mt-1 text-gray-800">{value}</p>
        )}
      </div>
    </div>
  );
};

// Ícone placeholder
export const IconPlaceholder = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);