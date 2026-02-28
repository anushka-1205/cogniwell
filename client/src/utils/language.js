// src/utils/language.js

export const getLanguage = () => {
  return localStorage.getItem("language") || "en";
};

export const setLanguage = (lang) => {
  localStorage.setItem("language", lang);
  window.dispatchEvent(new Event("languageChange"));
};
