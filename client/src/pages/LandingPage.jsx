import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { getLanguage, setLanguage } from "../utils/language";
import { useState, useEffect } from "react";

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, role, loading, refreshUser } = useAppContext();
  const [isHindi, setIsHindi] = useState(getLanguage() === "hi");

  useEffect(() => {
    const handleLangChange = () => setIsHindi(getLanguage() === "hi");
    window.addEventListener("languageChange", handleLangChange);
    return () => window.removeEventListener("languageChange", handleLangChange);
  }, []);

  useEffect(() => {
    refreshUser();
  }, []);


  const toggleLanguage = () => {
    const newLang = isHindi ? "en" : "hi";
    setLanguage(newLang);
    const event = new Event("languageChange");
    window.dispatchEvent(event);
  };


  
  const handleStart = () => {
    
    if (user && role === "user") {
      navigate("/test");
    } else if (user && role === "caregiver") {
      navigate("/caregiver/dashboard");
    } else {
      navigate("/signup");
    }
  };

  
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-black text-white text-center px-4">
      <h1 className="text-6xl font-bold mb-8 text-yellow-400">
        {isHindi ? "कॉग्निवेल में आपका स्वागत है" : "Welcome to CogniWell"}
      </h1>

      <p className="text-2xl mb-10 text-gray-300 max-w-xl">
        {isHindi
          ? "अपने लिए उपयुक्त स्क्रीनिंग टेस्ट चुनें और शुरू करें।"
          : "Choose your suitable screening test and begin your journey."}
      </p>

      <button
        onClick={handleStart}
        className="bg-yellow-400 hover:bg-yellow-300 text-black px-10 py-5 rounded-2xl text-3xl font-semibold transition-transform hover:scale-110 mb-6"
      >
        {isHindi ? "स्क्रीनिंग शुरू करें" : "Start Screening"}
      </button>

      
      <button
        onClick={toggleLanguage}
        className="underline text-lg text-white hover:text-gray-300"
      >
        {isHindi ? "Switch to English" : "हिंदी में बदलें"}
      </button>

      
      {loading && (
        <p className="mt-4 text-sm text-gray-400">
          {isHindi ? "लॉगिन स्थिति जांची जा रही है..." : "Checking login status..."}
        </p>
      )}

      {user && (
        <p className="mt-6 text-gray-400 text-sm">
          {isHindi
            ? role === "caregiver"
              ? `लॉगिन: ${user.name} (केयरगिवर)`
              : `लॉगिन: ${user.name} (यूज़र)`
            : role === "caregiver"
            ? `Logged in as ${user.name} (Caregiver)`
            : `Logged in as ${user.name} (User)`}
        </p>
      )}

    </div>
  );
}
