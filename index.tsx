
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error("No se encontró el elemento #root en el DOM.");
} else {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error) {
    console.error("Error fatal durante el renderizado de la aplicación:", error);
    rootElement.innerHTML = `
      <div style="padding: 20px; text-align: center; color: #5D4037; font-family: sans-serif;">
        <h2>Error al cargar la aplicación</h2>
        <p>Ha ocurrido un error técnico. Por favor, revisa la consola del navegador (F12).</p>
      </div>
    `;
  }
}
