import { useState } from 'react';

export function Button({ 
  children, 
  onClick, 
  type = 'button', 
  variant = 'primary', 
  disabled,
  style: customStyle = {},
  fullWidth = true,
}) {
  const [isHovered, setIsHovered] = useState(false);

  const variantStyles = {
    primary: {
      backgroundColor: '#4a90e2',
      color: '#fff',
    },
    secondary: {
      backgroundColor: '#444',
      color: '#fff',
    },
    success: {
      backgroundColor: '#28a745',
      color: '#fff',
    },
    danger: {
      backgroundColor: '#dc3545',
      color: '#fff',
    },
    warning: {
      backgroundColor: '#f39c12',
      color: '#fff',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: '#4a90e2',
      border: '1px solid #4a90e2',
    },
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => !disabled && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        ...styles.button,
        ...variantStyles[variant],
        width: fullWidth ? '100%' : 'auto',
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transform: isHovered && !disabled ? 'scale(1.02)' : 'scale(1)',
        boxShadow: isHovered && !disabled ? '0 4px 12px rgba(0, 0, 0, 0.3)' : 'none',
        ...customStyle,
      }}
    >
      {children}
    </button>
  );
}

const styles = {
  button: {
    padding: '0.75rem 1.25rem',
    fontSize: '1rem',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    transition: 'all 0.15s ease-out',
  },
};
