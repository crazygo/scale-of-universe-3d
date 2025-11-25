import { UNIVERSE_CONSTANTS } from '../constants/universe';

/**
 * Legend - Color identity legend for celestial bodies
 */
export const Legend = () => {
  const items = [
    { label: 'Sun', color: UNIVERSE_CONSTANTS.SUN.COLOR },
    { label: 'Earth', color: UNIVERSE_CONSTANTS.EARTH.COLOR },
    { label: 'Galactic Center', color: UNIVERSE_CONSTANTS.GALAXY.CENTER_COLOR },
    { label: 'Beijing', color: '#ff0000' },
  ];

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        background: 'rgba(0, 0, 0, 0.7)',
        padding: '15px',
        borderRadius: '8px',
        color: 'white',
        fontFamily: 'monospace',
        fontSize: '14px',
      }}
    >
      <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>Legend</div>
      {items.map(({ label, color }) => (
        <div
          key={label}
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '5px',
          }}
        >
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: color,
              marginRight: '8px',
            }}
          />
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
};
