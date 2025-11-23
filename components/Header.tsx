
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-white/95 backdrop-blur-sm p-8 rounded-2xl mb-8 shadow-2xl text-center">
      <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-2">DSSSB Cipher</h1>
      <p className="text-lg text-gray-600">Log and analyze each question to identify strengths and weaknesses.</p>
    </header>
  );
};

export default Header;
