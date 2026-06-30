import React from 'react';

export const AppFileDropOverlay: React.FC = () => (
  <div
    data-tour="file-drop-overlay"
    className="absolute inset-0 z-50 bg-brand-primary/10 border-2 border-dashed border-brand-primary rounded-lg flex items-center justify-center pointer-events-none"
  >
    <div className="bg-editor-bg/90 px-6 py-4 rounded-xl border border-brand-primary shadow-lg text-center">
      <svg
        className="w-10 h-10 mx-auto mb-2 text-brand-primary"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
        />
      </svg>
      <p className="text-sm font-medium text-white">释放以打开文件</p>
      <p className="text-xs text-gray-400 mt-1">支持 JSON、TXT、JS、TS 等文本文件</p>
    </div>
  </div>
);
