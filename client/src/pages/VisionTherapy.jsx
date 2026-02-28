import { useEffect, useState } from "react";
import { getLanguage } from "../utils/language";
import { useAppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";

export default function VisionTherapyPage() {
  const { axios, updateUserFlag, refreshUser } = useAppContext();
  const [isHindi, setIsHindi] = useState(getLanguage() === "hi");
  const navigate = useNavigate();

  useEffect(() => {
    const handleLang = () => setIsHindi(getLanguage() === "hi");
    window.addEventListener("languageChange", handleLang);
    return () => window.removeEventListener("languageChange", handleLang);
  }, []);

  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);

  const [difference, setDifference] = useState(18);
  const [trial, setTrial] = useState(1);
  const [correctCount, setCorrectCount] = useState(0);

  const TOTAL_TRIALS = 12;

  const [leftValue, setLeftValue] = useState(100);
  const [rightValue, setRightValue] = useState(100);
  const [correctSide, setCorrectSide] = useState(null);

  useEffect(() => {
    if (!started) return;
    generateStimuli();
  }, [started, trial]);

  const generateStimuli = () => {
    const base = 110;
    const variation = difference / 2;

    const pickLeft = Math.random() < 0.5;
    const bigger = base + variation;
    const smaller = base - variation;

    if (pickLeft) {
      setLeftValue(bigger);
      setRightValue(smaller);
      setCorrectSide("left");
    } else {
      setLeftValue(smaller);
      setRightValue(bigger);
      setCorrectSide("right");
    }
  };

  const handleChoice = (side) => {
    const isCorrect = side === correctSide;

    if (isCorrect) {
      setCorrectCount((s) => s + 1);
      setDifference((d) => Math.max(2, d - 2));
    } else {
      setDifference((d) => Math.min(26, d + 2));
    }

    if (trial >= TOTAL_TRIALS) {
      finishTherapy();
    } else {
      setTrial((t) => t + 1);
    }
  };

  const finishTherapy = async () => {
    setFinished(true);
    setStarted(false);

    const sessionData = {
      diseaseType: "vision",
      mode: "therapy",
      result: "completed",
      metrics: {
        vision: {
          correctAnswers: correctCount,
          attempts: TOTAL_TRIALS,
          time: null,
          finalThreshold: difference,
        },
      },
    };

    try {
      await axios.post("/api/game-session/record", sessionData);
    } catch (err) {
      console.error("Failed to record therapy data:", err);
    }

    try {
      await axios.put("/api/user/update-disease-status", { d3: false });
      if (typeof updateUserFlag === "function") updateUserFlag("d3");
      if (typeof refreshUser === "function") refreshUser();
    } catch (err) {
      console.error("Failed to update user vision therapy flag:", err);
    }
  };

  const resetTherapy = () => {
    setStarted(false);
    setFinished(false);
    setCorrectCount(0);
    setDifference(18);
    setTrial(1);
  };

  if (!started && !finished) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black text-white p-6">
        <h1 className="text-5xl font-bold text-yellow-400 mb-6">
          {isHindi ? "दृष्टि थेरेपी" : "Vision Therapy"}
        </h1>
        <p className="text-2xl text-gray-300 max-w-2xl text-center mb-8">
          {isHindi
            ? "दो आकृतियों में से कौन सी बड़ी या अधिक स्पष्ट है—यह चुनें। समय के साथ अंतर कम होता जाएगा, जिससे आपकी दृश्य संवेदनशीलता बेहतर होगी।"
            : "Choose which shape is bigger or more visible. The difference reduces over time, improving visual sensitivity through perceptual learning."}
        </p>
        <button
          onClick={() => setStarted(true)}
          className="bg-yellow-500 hover:bg-yellow-400 text-black px-12 py-5 rounded-2xl text-3xl font-semibold shadow-lg"
        >
          {isHindi ? "शुरू करें" : "Start Therapy"}
        </button>
      </div>
    );
  }

  if (started && !finished) {
    return (
      <div className="flex flex-col items-center justify-start min-h-screen bg-black text-white p-6 pt-20">
        <h1 className="text-4xl font-bold text-yellow-400 mb-6">
          {isHindi ? "दृष्टि थेरेपी" : "Perceptual Learning Therapy"}
        </h1>

        <div className="text-2xl text-gray-300 mb-6">
          {isHindi
            ? `ट्रायल: ${trial} / ${TOTAL_TRIALS}`
            : `Trial: ${trial} / ${TOTAL_TRIALS}`}{" "}
          •{" "}
          {isHindi
            ? `सही: ${correctCount}`
            : `Correct: ${correctCount}`}
        </div>

        <div className="flex items-center justify-between gap-10 mt-6">
          <button
            onClick={() => handleChoice("left")}
            className="flex items-center justify-center transition-transform hover:scale-105"
            style={{ background: "transparent", border: "none", padding: 0 }}
          >
            <div
              style={{
                width: leftValue,
                height: leftValue,
                borderRadius: "50%",
                background: `rgba(255,255,255,0.85)`,
                display: "block",
              }}
            />
          </button>

          <button
            onClick={() => handleChoice("right")}
            className="flex items-center justify-center transition-transform hover:scale-105"
            style={{ background: "transparent", border: "none", padding: 0 }}
          >
            <div
              style={{
                width: rightValue,
                height: rightValue,
                borderRadius: "50%",
                background: `rgba(255,255,255,0.85)`,
                display: "block",
              }}
            />
          </button>
        </div>

        <p className="mt-6 text-gray-400 text-2xl">
          {isHindi
            ? "बताएँ कौन सा आकार बड़ा है।"
            : "Select which circle is larger."}
        </p>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black text-white p-6">
        <h1 className="text-5xl text-yellow-400 font-bold mb-6">
          {isHindi ? "थेरेपी पूरी हुई" : "Therapy Complete"}
        </h1>

        <p className="text-2xl mb-2">
          {isHindi
            ? `सही: ${correctCount} / ${TOTAL_TRIALS}`
            : `Correct: ${correctCount} / ${TOTAL_TRIALS}`}
        </p>

        <p className="text-2xl text-gray-300 mb-6">
          {isHindi
            ? `अंतिम थ्रेशहोल्ड: ${difference}`
            : `Final Threshold: ${difference}`}
        </p>

        <button
          className="bg-gray-700 hover:bg-gray-600 text-white px-8 py-4 rounded-xl text-2xl font-semibold mb-3"
          onClick={resetTherapy}
        >
          {isHindi ? "फिर से करें" : "Restart"}
        </button>

        <button
          className="bg-yellow-500 hover:bg-yellow-400 text-black px-10 py-4 rounded-xl text-2xl font-semibold"
          onClick={() => navigate("/test")}
        >
          {isHindi ? "डैशबोर्ड पर जाएँ" : "Back to Screening"}
        </button>
      </div>
    );
  }

  return null;
}
