export const ALL_CSS = `
  *, *::before, *::after { box-sizing: border-box; }

  html, body {
    margin: 0;
    padding: 0;
    background: #fbfaf6;
    color: #2b2b2b;
    font-family: 'Patrick Hand', 'Comic Sans MS', 'Chalkboard SE', cursive;
    -webkit-font-smoothing: antialiased;
  }

  body {
    background-image: radial-gradient(ellipse at 30% 20%, rgba(29,78,216,0.04), transparent 60%),
                      radial-gradient(ellipse at 80% 80%, rgba(22,163,74,0.04), transparent 55%);
  }

  /* Number inputs that look like writing on a whiteboard line */
  input.cell-input {
    font-family: 'Caveat', 'Comic Sans MS', 'Chalkboard SE', cursive;
    font-weight: 700;
    font-size: 24px;
    color: inherit;
    text-align: center;
    width: 100%;
    border: none;
    border-bottom: 2.5px dashed #2b2b2b;
    background: transparent;
    outline: none;
    padding: 0 2px 2px;
  }
  input.cell-input:focus { border-bottom-style: solid; background: rgba(29,78,216,0.06); }
  input.cell-input::-webkit-outer-spin-button,
  input.cell-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
  input.cell-input[type=number] { -moz-appearance: textfield; appearance: textfield; }

  button.sketch-btn {
    font-family: 'Patrick Hand', 'Comic Sans MS', 'Chalkboard SE', cursive;
    font-size: 15px;
    color: #2b2b2b;
    background: #fff;
    border: 2px solid #2b2b2b;
    border-radius: 225px 15px 255px 15px / 15px 255px 15px 225px;
    padding: 4px 12px;
    cursor: pointer;
    transition: transform .12s ease, background .12s ease, box-shadow .12s ease;
  }
  button.sketch-btn:hover { transform: rotate(-1deg) scale(1.05); background: #fffbe8; }
  button.sketch-btn.active {
    background: #fef3c7;
    border-color: #1d4ed8;
    color: #1d4ed8;
    box-shadow: 0 0 0 3px rgba(29,78,216,0.25);
    transform: rotate(1deg) scale(1.04);
  }

  @keyframes popIn {
    0% { opacity: 0; transform: scale(.6); }
    70% { transform: scale(1.08); }
    100% { opacity: 1; transform: scale(1); }
  }
  .pop-in { animation: popIn .35s ease both; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .fade-up { animation: fadeUp .4s ease both; }
`;
