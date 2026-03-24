import React, { useState, useEffect } from 'react';
import './Landing.css';

const Landing = ({ onNavigate }) => {
  const [index, setIndex] = useState(0);
  const locations = ["china", "austria", "malaysia", "here"];


useEffect(() => {
  // if last word ("here"), dont start timer 
  if (index === locations.length - 1) return;

  const interval = setInterval(() => {
    if (!document.hidden) {
      setIndex((prev) => {
        const nextIndex = prev + 1;
        
        // if next word is the last one ("here"), stop timer
        if (nextIndex === locations.length - 1) {
          clearInterval(interval);
        }
        
        return nextIndex;
      });
    }
  }, 2000);

  return () => clearInterval(interval);
}, [index]); // add [index] so effect re-runs to check stop condition

  const currentWord = locations[index];

  return (
    <div className="landing-container">
      <div className="hero-layout">
        <h1 className="static-label">WorkFrom,</h1>
        <div className="dynamic-word-wrapper">
          {currentWord === "here" ? (
            <button 
              className="flipping-word clickable" 
              onClick={onNavigate}
            >
              {currentWord}
            </button>
          ) : (
            <span className="flipping-word">{currentWord}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Landing;