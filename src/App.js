import React from 'react';
import './App.css';
import HomePage from "./pages/HomePage";
import Navbar from '../src/pages/Navbar';
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';
import DonatePage from "./pages/DonatePage";
import FAQPage from './pages/FAQPage';
import StatsPage from './pages/StatsPage';

function App() {
  return (
    <div className="App">
      <header className="App-header">
      <Router>


      <Routes>
        <Route path="/" element={<><Navbar /><HomePage /></>} />
        <Route path="/faq" element={<><Navbar /><FAQPage /></>} />
        <Route path="/donate" element={<><Navbar /><DonatePage /></>} />
        <Route path="/stats" element={<><Navbar /><StatsPage /></>} />
      </Routes>
      </Router>
        
      </header>
    </div>
  );
}

export default App;
