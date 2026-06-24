import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ToastProvider } from './components/Toast.tsx';
import { GoogleAuthProvider } from './components/GoogleIntegration.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <GoogleAuthProvider>
        <App />
      </GoogleAuthProvider>
    </ToastProvider>
  </StrictMode>,
);

