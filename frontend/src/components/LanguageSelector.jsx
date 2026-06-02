import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi' },
  { code: 'kn', name: 'Kannada' },
  { code: 'ta', name: 'Tamil' },
  { code: 'te', name: 'Telugu' }
];

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage();

  return (
    <select 
      value={language} 
      onChange={(e) => setLanguage(e.target.value)}
      style={{
        padding: '6px 12px',
        borderRadius: '6px',
        border: '1px solid #e0dbd3',
        backgroundColor: '#fff',
        fontSize: '14px',
        cursor: 'pointer',
        outline: 'none',
        color: '#1a3a5c',
        fontFamily: 'inherit'
      }}
    >
      {languages.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.name}
        </option>
      ))}
    </select>
  );
}
