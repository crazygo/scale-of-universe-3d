import { useSimulationStore } from '../store/simulationStore';
import type { ViewMode } from '../store/simulationStore';

export const ViewSwitcher = () => {
    const { viewMode, setViewMode } = useSimulationStore();

    const modes: { id: ViewMode; label: string }[] = [
        { id: 'human', label: '1. Human View (Ground)' },
        { id: 'solar-system', label: '2. Solar System (Orbit)' },
        { id: 'galactic', label: '3. Galactic View (Macro)' },
    ];

    return (
        <div style={{
            position: 'absolute',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '10px',
            background: 'rgba(0,0,0,0.5)',
            padding: '10px',
            borderRadius: '12px',
            backdropFilter: 'blur(4px)'
        }}>
            {modes.map((mode) => (
                <button
                    key={mode.id}
                    onClick={() => setViewMode(mode.id)}
                    style={{
                        background: viewMode === mode.id ? '#2244ff' : 'rgba(255,255,255,0.1)',
                        color: 'white',
                        border: '1px solid rgba(255,255,255,0.2)',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: viewMode === mode.id ? 'bold' : 'normal',
                        transition: 'all 0.2s'
                    }}
                >
                    {mode.label}
                </button>
            ))}
        </div>
    );
};
