import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  text = 'Loading...' 
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] gap-4">
      <div className="relative">
        <div className={`${sizeClasses[size]} border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin`}></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`${size === 'lg' ? 'w-8 h-8' : size === 'md' ? 'w-5 h-5' : 'w-3 h-3'} bg-primary-500 rounded-full animate-pulse-slow`}></div>
        </div>
      </div>
      {text && <p className="text-secondary-500 text-sm animate-pulse">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;