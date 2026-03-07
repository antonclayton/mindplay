export function Button({ children, onClick, type = 'button', variant = 'primary', disabled }) {
  const variantStyles = {
    primary: {
      backgroundColor: '#4a90e2',
      color: '#fff',
    },
    secondary: {
      backgroundColor: '#444',
      color: '#fff',
    },
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...styles.button,
        ...variantStyles[variant],
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {children}
    </button>
  );
}

const styles = {
  button: {
    width: '100%',
    padding: '0.75rem',
    fontSize: '1rem',
    border: 'none',
    borderRadius: '4px',
    fontWeight: '500',
    transition: 'opacity 0.2s',
  },
};
