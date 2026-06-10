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
    <div style={{ maxWidth: 1180, margin: '0 auto', padding: '12px 18px 20px' }}>
      <style>{ALL_CSS}</style>

      <header style={{ textAlign: 'center', marginBottom: 8 }}>
        <h1
          style={{
            fontFamily: "'Caveat', 'Comic Sans MS', 'Chalkboard SE', cursive",
            fontWeight: 700,
            fontSize: 34,
            color: MARKER_BLUE,
            margin: 0,
            display: 'inline-block',
            transform: 'rotate(-1deg)',
          }}
        >
          Accuracy ≠ Understanding
        </h1>
        <span style={{ fontSize: 14.5, marginLeft: 14, color: INK }}>
          A model can be <b>98.9% accurate</b> and still find <b>none</b> of what you’re looking for —
          pick a scenario or edit the numbers right on the line.
        </span>
      </header>

      <PresetBar activeName={activePreset} onPick={onPick} />

      <section style={{ ...sketchBoxStyle(0), padding: '8px 12px 0', margin: '10px auto 14px', maxWidth: 1020 }}>
        <PopulationLine
          cells={cells}
          metrics={metrics}
          scenarioKey={activePreset ?? 'custom'}
          onChange={onCellChange}
        />
      </section>

      <section style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'stretch' }}>
        <ConfusionMatrix cells={cells} onChange={onCellChange} />
        <div
          style={{
            flex: '1 1 480px',
            minWidth: 320,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(max(225px, 40%), 1fr))',
            gap: 12,
          }}
        >
          {METRIC_DEFS.map((def, i) => (
            <MetricCard key={def.key} def={def} cells={cells} value={metrics[def.key]} boxIndex={i + 6} />
          ))}
        </div>
      </section>
    </div>
  );
}
