
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
  } catch (error) {
    console.error("Error durante el renderizado:", error);
    rootElement.innerHTML = `<div style="padding:20px;color:red;">Error crítico: ${error.message}</div>`;
  }
}
