import { useControls, button, folder } from 'leva';
import { useSimulationStore } from '../store/simulationStore';

/**
 * View Switcher - UI controls for switching between view modes
 */
export const ViewSwitcher = () => {
  const { viewMode, setViewMode } = useSimulationStore();

  useControls({
    'View Mode': folder({
      'Current View': {
        value: viewMode,
        editable: false,
      },
      'Human View (Beijing)': button(() => setViewMode('human')),
      'Solar System View': button(() => setViewMode('solar-system')),
      'Galactic View': button(() => setViewMode('galactic')),
    }),
  });

  return null;
};
