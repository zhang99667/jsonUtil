import toast from 'react-hot-toast';

// 统一的成功 toast 样式
const successStyle = {
  background: 'var(--brand-primary)',
  color: '#fff',
  fontSize: '14px',
  fontWeight: '500',
};

// 统一的错误 toast 样式
const errorStyle = {
  background: 'var(--brand-danger)',
  color: '#fff',
  fontSize: '14px',
  fontWeight: '500',
};

export const showSuccess = (message: string, duration = 2000) => {
  toast.success(message, {
    duration,
    style: successStyle,
    iconTheme: { primary: '#fff', secondary: 'var(--brand-primary)' },
  });
};

export const showError = (message: string, duration = 3000) => {
  toast.error(message, {
    duration,
    style: errorStyle,
  });
};
