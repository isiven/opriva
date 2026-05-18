// source/main.jsx
//
// App.jsx is a single-file React prototype that:
//   - uses React.useState, React.useEffect, etc. as if React were a global,
//   - mounts itself at the bottom via ReactDOM.createRoot(...).render(<App />).
//
// This entry file makes that pattern compatible with a Vite build (and therefore
// with Vercel) by exposing React + ReactDOM on window BEFORE App.jsx is evaluated.
//
// Important: static `import './App.jsx'` would be hoisted above the global
// assignments below and break the ordering. A dynamic import preserves the order.

import React from 'react';
import * as ReactDOMClient from 'react-dom/client';

if (typeof window !== 'undefined') {
  window.React = React;
  window.ReactDOM = ReactDOMClient;
}

// App.jsx executes its own ReactDOM.createRoot(...).render(<App />) at the bottom.
import('./App.jsx');
