import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { getLanguage } from "../utils/language";

export default function TestSelection() {
  const navigate = useNavigate();
  const { user, loading, refreshUser } = useAppContext();
  const [isHindi, setIsHindi] = useState(getLanguage() === "hi");

  useEffect(() => {
    const handleLangChange = () => setIsHindi(getLanguage() === "hi");
    window.addEventListener("languageChange", handleLangChange);
    return () => window.removeEventListener("languageChange", handleLangChange);
  }, []);

  useEffect(() => {
    refreshUser();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-yellow-400 text-4xl font-semibold">
        {isHindi ? "लोड हो रहा है..." : "Loading..."}
      </div>
    );
  }

  const Button = ({ onClick, text }) => (
    <button
      onClick={onClick}
      className="min-w-[260px] sm:min-w-[300px] md:min-w-[340px] lg:min-w-[380px]
                 h-[75px] bg-yellow-500 hover:bg-yellow-400
                 text-black font-semibold text-lg sm:text-xl md:text-2xl
                 rounded-full shadow-xl transition-transform transform hover:scale-105
                 flex items-center justify-center px-6 text-center
                 whitespace-normal leading-tight mb-6"
      style={{ wordBreak: "keep-all" }}
    >
      {text}
    </button>
  );

  // Decide whether test or therapy should be shown
  const shouldTakeTest = (disorderData) => {
    if (!disorderData) return true; // no result yet → show Test
    if (disorderData.color === "green") return true; // green → Test
    return false; // red or yellow → Therapy
  };

  return (
    <div
      className="relative flex flex-col items-center justify-center min-h-screen bg-black text-white px-6 pt-24 sm:pt-20"
      style={{ overflow: "hidden", position: "relative", zIndex: 0 }}
    >
      {/* Questionnaire Button */}
      <button
        onClick={() => navigate("/questionnaire")}
        className="fixed top-24 right-6 sm:top-24 md:top-24 lg:top-24 z-50
                   bg-gradient-to-r from-amber-400 to-orange-500
                   hover:from-amber-300 hover:to-yellow-400
                   text-black font-semibold text-lg sm:text-xl
                   rounded-full px-8 py-3 shadow-[0_0_20px_rgba(255,200,0,0.5)]
                   transition-all duration-300 transform hover:scale-110"
      >
        {isHindi ? "प्रश्नावली" : "Questionnaire"}
      </button>

      <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-10 text-yellow-400 text-center">
        {isHindi ? "अपना टेस्ट या थेरेपी चुनें" : "Choose Your Test or Therapy"}
      </h1>

      {/* Parkinson’s */}
      <Button
        onClick={() =>
          navigate(
            shouldTakeTest(user?.d1)
              ? "/test/parkinsons"
              : "/therapy/parkinsons"
          )
        }
        text={
          isHindi
            ? shouldTakeTest(user?.d1)
              ? "पार्किंसंस टेस्ट शुरू करें"
              : "पार्किंसंस थेरेपी शुरू करें"
            : shouldTakeTest(user?.d1)
            ? "Start Parkinson’s Test"
            : "Start Parkinson’s Therapy"
        }
      />

      {/* Dementia */}
      <Button
        onClick={() =>
          navigate(
            shouldTakeTest(user?.d2)
              ? "/test/dementia"
              : "/therapy/dementia"
          )
        }
        text={
          isHindi
            ? shouldTakeTest(user?.d2)
              ? "डिमेंशिया टेस्ट शुरू करें"
              : "डिमेंशिया थेरेपी शुरू करें"
            : shouldTakeTest(user?.d2)
            ? "Start Dementia Test"
            : "Start Dementia Therapy"
        }
      />

      {/* Vision */}
      <Button
        onClick={() =>
          navigate(
            shouldTakeTest(user?.d3)
              ? "/test/vision"
              : "/therapy/vision"
          )
        }
        text={
          isHindi
            ? shouldTakeTest(user?.d3)
              ? "विजन टेस्ट शुरू करें"
              : "विजन थेरेपी शुरू करें"
            : shouldTakeTest(user?.d3)
            ? "Start Vision Test"
            : "Start Vision Therapy"
        }
      />
    </div>
  );
}
