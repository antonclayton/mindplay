import { useState } from 'react';

export function MoveButton({ move, onClick, disabled, selected, emoji }) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => !disabled && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '1.5rem 2rem',
        backgroundColor: selected ? '#3a3a3a' : '#2a2a2a',
        border: `2px solid ${selected ? '#4a90e2' : '#444'}`,
        borderRadius: '12px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.15s ease-out',
        color: '#fff',
        opacity: disabled ? 0.5 : 1,
        transform: isHovered && !disabled ? 'scale(1.08)' : 'scale(1)',
        boxShadow: isHovered && !disabled ? '0 8px 20px rgba(74, 144, 226, 0.3)' : 'none',
      }}
    >
      <span style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{emoji}</span>
      <span style={{ fontSize: '1rem' }}>{move.charAt(0).toUpperCase() + move.slice(1)}</span>
    </button>
  );
}
