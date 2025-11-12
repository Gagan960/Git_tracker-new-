import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Home from './pages/Home';
import SectionPage from './pages/SectionPage';
import TopPerformers from './pages/TopPerformers';

function App() {
  return (
    <Router>
      <div className="App">
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/section/:sectionId" element={<SectionPage />} />
          <Route path="/top-performers/:sectionId" element={<TopPerformers />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
