import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// --- Google Analytics 4 (gtag.js) bootstrap ---
const GA_MEASUREMENT_ID = process.env.REACT_APP_GA_MEASUREMENT_ID;

if (GA_MEASUREMENT_ID) {
  // Load the gtag script
  const script = document.createElement('script');
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  script.async = true;
  document.head.appendChild(script);

  // Initialize dataLayer and configure GA
  window.dataLayer = window.dataLayer || [];
  function gtag(){window.dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID);
} else {
  // eslint-disable-next-line no-console
  console.warn('GA measurement ID not set (REACT_APP_GA_MEASUREMENT_ID). Analytics disabled.');
}
// --- end GA bootstrap ---

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
