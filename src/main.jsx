import React from 'react';
import ReactDOM from 'react-dom/client';
import { JumiaProductFeed } from './components/JumiaProductFeed/JumiaProductFeed';
import './index.css';

const rootElement = document.getElementById('recommended-tools-root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <JumiaProductFeed />
    </React.StrictMode>
  );
}
