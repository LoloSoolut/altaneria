
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error("No se encontró el elemento #root en el DOM.");
} else {
  console.log("Iniciando aplicación de Altanería...");
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error: any) {
    console.error("Error durante el renderizado:", error);
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="padding:40px; font-family: system-ui, sans-serif; background: #fff5f5; border: 2px solid #feb2b2; border-radius: 12px; margin: 20px;">
          <h1 style="color: #c53030; margin-top: 0;">Error Crítico al Iniciar</h1>
          <p style="color: #742a2a;">${error?.message || 'Error desconocido'}</p>
          <pre style="background: #fff; padding: 10px; border-radius: 4px; overflow: auto; font-size: 12px; border: 1px solid #fed7d7;">${error?.stack || ''}</pre>
          <button onclick="window.location.reload()" style="background: #c53030; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">
            Reintentar Carga
          </button>
        </div>
      `;
    }
  }
}
