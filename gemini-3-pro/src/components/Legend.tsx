import { useSimulationStore } from '../store/simulationStore';
import { UNIVERSE_CONSTANTS } from '../constants/universe';

export const Legend = () => {
    const { viewMode } = useSimulationStore();

    const items = [
        { label: 'Sun', color: UNIVERSE_CONSTANTS.SUN.COLOR },
        { label: 'Earth / You', color: '#2244ff' }, // Blue/Hotpink depending on view, but let's generalize
        { label: 'Galactic Center', color: UNIVERSE_CONSTANTS.GALAXY.CENTER_COLOR },
        { label: 'Big Dipper', color: 'cyan' },
        { label: 'Ecliptic (Sun Path)', color: 'yellow' },
        { label: 'Milky Way Band', color: '#666' },
    ];

    // Filter items based on view mode if needed, but showing all is fine for now
    // or we can customize.
    const activeItems = items.filter(item => {
        if (viewMode === 'human') return true;
        if (viewMode === 'solar-system') return ['Sun', 'Earth / You', 'Earth\'s Orbit'].includes(item.label) || true; // Show all for context
        return true;
    });

    return (
        <div style={{
            position: 'absolute',
            bottom: 20,
            right: 20,
            background: 'rgba(0, 0, 0, 0.7)',
            padding: '15px',
            borderRadius: '8px',
            color: 'white',
            fontFamily: 'sans-serif',
            border: '1px solid #333',
            pointerEvents: 'none', // Let clicks pass through
            userSelect: 'none'
        }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', textTransform: 'uppercase', color: '#aaa' }}>Legend</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {activeItems.map((item) => (
                    <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            backgroundColor: item.color,
                            boxShadow: `0 0 5px ${item.color}`
                        }} />
                        <span style={{ fontSize: '12px' }}>{item.label}</span>
                    </div>
                ))}
                {/* Special case for Earth in Human View */}
                {viewMode === 'human' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: '12px',
                            height: '12px',
                            backgroundColor: 'hotpink', // Box shape
                            display: 'inline-block'
                        }} />
                        <span style={{ fontSize: '12px' }}>You (Observer)</span>
                    </div>
                )}
            </div>
        </div>
    );
};
