import { useMemo, useState } from 'react';
import { computeMetrics, METRIC_DEFS, MODELS, applyModel, redistribute } from '../metrics.js';
import { sketchBoxStyle } from '../sketch.js';
import PopulationLine from '../components/PopulationLine.jsx';
import ConfusionMatrix from '../components/ConfusionMatrix.jsx';
import MetricCard from '../components/MetricCard.jsx';
import Controls from '../components/Controls.jsx';

export default function AccuracyPage() {
  // the whiteboard photo: rare positives + a model that almost never says yes
  const [cells, setCells] = useState(() => applyModel(MODELS[1], 10, 990));
  const [activeModel, setActiveModel] = useState(MODELS[1].name);
  const metrics = useMemo(() => computeMetrics(cells), [cells]);

  const onCellChange = (key, value) => {
    setCells((c) => ({ ...c, [key]: value }));
    setActiveModel(null); // hand-edited: no longer a named behavior
  };

  // new totals keep the current model behavior, redistributed across them
  const onTotalsChange = (which, value) => {
    setCells((c) =>
      redistribute(c, which === 'pos' ? value : c.tp + c.fn, which === 'neg' ? value : c.fp + c.tn),
    );
  };

  const onPopPick = (p) => {
    setCells((c) => redistribute(c, p.pos, p.neg));
  };

  const onModelPick = (model) => {
    setCells((c) => applyModel(model, c.tp + c.fn, c.fp + c.tn));
    setActiveModel(model.name);
  };

  // extremes set the population AND the model rates in one click
  const onExtremePick = (extreme) => {
    setCells(applyModel(extreme, extreme.pos, extreme.neg));
    setActiveModel(extreme.name);
  };

  return (
    <>
      <p style={{ textAlign: 'center', fontSize: 14.5, margin: '0 0 8px' }}>
        A model can be <b>98.9% accurate</b> and still find <b>none</b> of what you’re looking for —
        set the population, pick a model’s behavior, or edit any number directly.
      </p>

      <Controls
        pos={metrics.actualPos}
        neg={metrics.actualNeg}
        activeModel={activeModel}
        onTotalsChange={onTotalsChange}
        onPopPick={onPopPick}
        onModelPick={onModelPick}
        onExtremePick={onExtremePick}
      />

      <section style={{ ...sketchBoxStyle(0), padding: '8px 12px 0', margin: '10px auto 14px', maxWidth: 1020 }}>
        <PopulationLine
          cells={cells}
          metrics={metrics}
          scenarioKey={activeModel ?? 'custom'}
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
    </>
  );
}
