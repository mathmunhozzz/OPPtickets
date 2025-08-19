
import React from 'react';
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log('Main.tsx loading, React:', React);

const rootElement = document.getElementById("root");
console.log('Root element:', rootElement);

if (!rootElement) {
  throw new Error('Root element not found');
}

const root = createRoot(rootElement);
console.log('Root created:', root);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
