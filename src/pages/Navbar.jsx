import React from 'react';
import '../css/components/Navbar.css';

const Navbar = () => {
    return (
        <div className="uwu-navbar">
            <div className="uwu-navbar-left">
                <a className="uwu-navbar-title" href="/">uwu bot</a>
            </div>
            <div className="uwu-navbar-right">
                <a className="uwu-navbar-link" href="/faq">FAQ</a>
                <a className="uwu-navbar-link" href="/stats">Stats</a>
                <button 
                  className="navbar-button" 
                  href="/routes"
                  onClick={() => window.open("/donate", "_self")}
                >
                  <span>Donate</span>
                </button>
            </div>
        </div>
    )
};

export default Navbar;
