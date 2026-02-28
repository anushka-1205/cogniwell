import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { getLanguage, setLanguage } from "../utils/language";

export default function Navbar() {
  const { user, role, logout } = useAppContext();
  const location = useLocation();
  const navigate = useNavigate();
  const [isHindi, setIsHindi] = useState(getLanguage() === "hi");

  useEffect(() => {
    const handleLangChange = () => setIsHindi(getLanguage() === "hi");
    window.addEventListener("languageChange", handleLangChange);
    return () => window.removeEventListener("languageChange", handleLangChange);
  }, []);

  const hiddenRoutes = ["/", "/login", "/signup", "/caregiver/login"];
  const shouldHide = hiddenRoutes.includes(location.pathname);

  const handleHome = () => {
    if (role === "caregiver") navigate("/caregiver/dashboard");
    else navigate("/test");
  };

  const handleLogout = async () => {
    await logout(navigate);
  };

  const toggleLanguage = () => {
    const newLang = isHindi ? "en" : "hi";
    setLanguage(newLang);
    const e = new Event("languageChange");
    window.dispatchEvent(e);
  };

  if (shouldHide) return null;

  return (
    <nav
      className="
        fixed top-0 left-0 right-0 z-50
        flex justify-between items-center 
        px-6 py-3 bg-black text-yellow-400 shadow-md
      "
      style={{ height: "64px" }}
    >
      <div className="font-semibold text-lg">
        {isHindi
          ? `नमस्ते, ${user?.name || "यूज़र"} 👋`
          : `Hi, ${user?.name || "User"} 👋`}
      </div>

      <div className="flex items-center gap-6">
        <button onClick={handleHome} className="hover:text-white font-medium">
          {isHindi ? "होम" : "Home"}
        </button>
        <button
          onClick={handleLogout}
          className="hover:text-red-400 font-medium"
        >
          {isHindi ? "लॉगआउट" : "Logout"}
        </button>
        <button
          onClick={toggleLanguage}
          className="px-3 py-1 rounded-md bg-yellow-400 text-black hover:bg-yellow-300 font-semibold"
        >
          {isHindi ? "English" : "हिंदी"}
        </button>
      </div>
    </nav>
  );
}
