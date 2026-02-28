// src/utils/language.js

export const getLanguage = () => {
  return localStorage.getItem("language") || "en"; // Default to English
};

export const setLanguage = (lang) => {
  localStorage.setItem("language", lang);
  window.dispatchEvent(new Event("languageChange")); // Notify all components to re-render
};
