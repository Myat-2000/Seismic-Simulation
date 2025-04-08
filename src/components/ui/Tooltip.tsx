import React from 'react';

type TooltipProps = {
  content: string;
};

export function Tooltip({ content }: TooltipProps) {
  return (
    <div className="group relative inline-block">
      <div className="cursor-help">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 text-gray-400 hover:text-gray-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 z-50">
        <div className="bg-gray-900 text-white text-sm rounded-lg py-2 px-3 shadow-lg">
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-2">
            <div className="border-8 border-transparent border-t-gray-900" />
          </div>
        </div>
      </div>
    </div>
  );
}