import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

const container = document.getElementById('root');

if (container) {
  try {
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("Sistema de Altanería Profesional iniciado.");
  } catch (err) {
    console.error("Fallo al renderizar la aplicación:", err);
  }
} else {
  console.error("No se encontró el elemento #root.");
}