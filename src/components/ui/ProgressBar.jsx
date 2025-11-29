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
    <div className="fixed top-0 left-0 w-full h-1.5 bg-gray-100 z-50">
      <div 
        className="h-full bg-[#008751] transition-all duration-150"
        style={{ width: `${scroll * 100}%` }}
      ></div>
    </div>
  );
};

export default ProgressBar;
