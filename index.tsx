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
    console.log("SISTEMA DE ALTANERÍA PROFESIONAL: Renderizado inicial correcto.");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Fallo crítico en el renderizado de React:", msg);
    // Inyectar mensaje visual si el renderizado falla
    container.innerHTML = `<div style="padding: 20px; color: red; font-family: sans-serif;">Error de carga: ${msg}</div>`;
  }
} else {
  console.error("Elemento raíz #root no encontrado en el DOM.");
}