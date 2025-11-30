import React, { useState, useEffect } from 'react';

const ProgressBar = () => {
  const [scroll, setScroll] = useState(0);
  
  useEffect(() => {
    const handleScroll = () => {
      const total = document.documentElement.scrollTop;
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scroll = `${total / windowHeight}`;
      setScroll(Number(scroll));
    }
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full h-1 z-[60]">
      <div 
        className="h-full bg-[#FAFF00] transition-all duration-150 ease-out shadow-[0_0_10px_rgba(250,255,0,0.5)]"
        style={{ width: `${scroll * 100}%` }}
      ></div>
    </div>
  );
};

export default ProgressBar;
