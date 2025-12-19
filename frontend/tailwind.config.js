/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 编辑器特定颜色
        editor: {
          bg: 'var(--editor-bg)',
          sidebar: 'var(--editor-sidebar)',
          header: 'var(--editor-header)',
          border: 'var(--editor-border)',
          hover: 'var(--editor-hover)',
          active: 'var(--editor-active)',
          fg: {
            DEFAULT: 'var(--editor-fg)',
            sub: 'var(--editor-fg-sub)',
            dim: 'var(--editor-fg-dim)',
          }
        },
        // 滚动条
        scrollbar: {
          bg: 'var(--scrollbar-bg)',
          hover: 'var(--scrollbar-hover)',
        },
        // 状态颜色
        status: {
          error: {
            bg: 'var(--status-error-bg)',
            border: 'var(--status-error-border)',
            text: 'var(--status-error-text)',
          },
          success: {
            bg: 'var(--status-success-bg)',
            border: 'var(--status-success-border)',
            text: 'var(--status-success-text)',
          },
        },
        // 品牌色
        brand: {
          primary: 'var(--brand-primary)',
          hover: 'var(--brand-hover)',
        }
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', '"Noto Sans"', 'sans-serif'],
        mono: ['"Menlo"', '"Monaco"', '"Consolas"', '"Liberation Mono"', '"Courier New"', 'monospace'],
      },
      cursor: {
        'col-resize': 'col-resize',
      },
      animation: {
        'slide-up': 'slideUp 0.3s ease-out forwards',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}