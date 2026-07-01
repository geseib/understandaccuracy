import { useState } from 'react';
import { MARKER_BLUE } from './metrics.js';
import { ALL_CSS } from './styles/global.js';
import AccuracyPage from './pages/AccuracyPage.jsx';
import FoldPage from './pages/FoldPage.jsx';
import PositiveTestPage from './pages/PositiveTestPage.jsx';
import BirthdayPage from './pages/BirthdayPage.jsx';
import MontyHallPage from './pages/MontyHallPage.jsx';

const PAGES = [
  { key: 'accuracy', tab: 'Accuracy ≠ Understanding', title: 'Accuracy ≠ Understanding', Component: AccuracyPage },
  { key: 'positivetest', tab: 'The Positive Test', title: 'The Positive Test Paradox', Component: PositiveTestPage },
  { key: 'montyhall', tab: 'Monty Hall', title: 'Monty Hall', Component: MontyHallPage },
  { key: 'fold', tab: 'The Folding Paper', title: 'Fold to the Moon', Component: FoldPage },
  { key: 'birthday', tab: 'The Birthday Paradox', title: 'The Birthday Paradox', Component: BirthdayPage },
];

export default function App() {
  const [page, setPage] = useState('accuracy');
  const active = PAGES.find((p) => p.key === page);

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', padding: '12px 18px 28px' }}>
      <style>{ALL_CSS}</style>

      <header style={{ textAlign: 'center', marginBottom: 6 }}>
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
          {active.title}
        </h1>
        <div style={{ fontSize: 12.5, color: '#999', marginTop: 2 }}>
          a whiteboard for the things our intuition gets wrong
        </div>
      </header>

      {/* hand-drawn tabs */}
      <nav style={{ display: 'flex', gap: 10, justifyContent: 'center', margin: '6px 0 12px' }}>
        {PAGES.map((p) => (
          <button
            key={p.key}
            className={`sketch-btn${p.key === page ? ' active' : ''}`}
            style={{ fontSize: 16, padding: '5px 16px' }}
            onClick={() => setPage(p.key)}
          >
            {p.tab}
          </button>
        ))}
      </nav>

      <active.Component />
    </div>
  );
}
