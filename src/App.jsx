import { useMemo, useState } from 'react';
import { computeMetrics, METRIC_DEFS, PRESETS, MARKER_BLUE, INK } from './metrics.js';
import { sketchBoxStyle } from './sketch.js';
import { ALL_CSS } from './styles/global.js';
import PopulationLine from './components/PopulationLine.jsx';
import ConfusionMatrix from './components/ConfusionMatrix.jsx';
import MetricCard from './components/MetricCard.jsx';
import PresetBar from './components/PresetBar.jsx';

export default function App() {
  const [cells, setCells] = useState(PRESETS[0].cells);
  const [activePreset, setActivePreset] = useState(PRESETS[0].name);
  const metrics = useMemo(() => computeMetrics(cells), [cells]);

  const onCellChange = (key, value) => {
    setCells((c) => ({ ...c, [key]: value }));
    setActivePreset(null); // hand-edited: no longer a named scenario
  };

  const onPick = (preset) => {
    setCells(preset.cells);
    setActivePreset(preset.name);
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 20px 60px' }}>
      <style>{ALL_CSS}</style>

      <header style={{ textAlign: 'center', marginBottom: 18 }}>
        <h1
          style={{
            fontFamily: "'Caveat', 'Comic Sans MS', 'Chalkboard SE', cursive",
            fontWeight: 700,
            fontSize: 52,
            color: MARKER_BLUE,
            margin: 0,
            transform: 'rotate(-1deg)',
          }}
        >
          Accuracy ≠ Understanding
        </h1>
        <p style={{ fontSize: 18, margin: '4px 0 0', color: INK }}>
          A model can be <b>98.9% accurate</b> and still find <b>none</b> of what you’re looking for.
          Pick a scenario or type your own numbers and watch accuracy, precision &amp; recall fight it out.
        </p>
      </header>

      <PresetBar activeName={activePreset} onPick={onPick} />

      <section style={{ ...sketchBoxStyle(0), padding: '18px 14px 6px', margin: '22px 0' }}>
        <PopulationLine cells={cells} metrics={metrics} scenarioKey={activePreset ?? 'custom'} />
      </section>

      <section style={{ display: 'flex', flexWrap: 'wrap', gap: 22, alignItems: 'stretch' }}>
        <ConfusionMatrix cells={cells} onChange={onCellChange} />
        <div
          style={{
            flex: '1 1 480px',
            minWidth: 320,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 18,
          }}
        >
          {METRIC_DEFS.map((def, i) => (
            <MetricCard key={def.key} def={def} cells={cells} value={metrics[def.key]} boxIndex={i + 6} />
          ))}
        </div>
      </section>

      <footer style={{ textAlign: 'center', marginTop: 36, fontSize: 15, color: '#888' }}>
        Tip: start with “The whiteboard example”, then click “Predict everything positive” —
        watch recall and precision trade places while accuracy shrugs.
      </footer>
    </div>
  );
}
