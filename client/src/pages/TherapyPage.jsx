import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getLanguage } from "../utils/language";
import ParkinsonsTherapy from "./ParkinsonsTherapy";
import DementiaTherapy from "./DementiaTherapy";
import VisionTherapy from "./VisionTherapy";

export default function TherapyPage() {
  const { disease } = useParams();
  const navigate = useNavigate();
  const [finished, setFinished] = useState(false);
  const [isHindi, setIsHindi] = useState(getLanguage() === "hi");

  useEffect(() => {
    const handleLangChange = () => setIsHindi(getLanguage() === "hi");
    window.addEventListener("languageChange", handleLangChange);
    return () => window.removeEventListener("languageChange", handleLangChange);
  }, []);

  const handleFinish = () => setFinished(true);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
      {!finished ? (
        <>
          {disease === "parkinsons" && <ParkinsonsTherapy onFinish={handleFinish} />}
          {disease === "dementia" && <DementiaTherapy onFinish={handleFinish} />}
          {disease === "vision" && <VisionTherapy onFinish={handleFinish} />}
        </>
      ) : (
        <>
          <h1 className="text-5xl font-bold mb-4 text-yellow-400">
            {isHindi ? "थेरेपी पूरा" : "Therapy Complete"}
          </h1>
          <button
            className="bg-yellow-500 text-black px-8 py-4 rounded-lg text-2xl mt-4"
            onClick={() => navigate("/test")}
          >
            {isHindi ? "स्क्रीनिंग पर वापस जाएँ" : "Back to Screening"}
          </button>
        </>
      )}
    </div>
  );
}
