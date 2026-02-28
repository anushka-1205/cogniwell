import { useState, useEffect } from "react";
import ParkinsonsTherapy from "../pages/ParkinsonsTherapy";
import { getLanguage } from "../utils/language";
import { useAppContext } from "../context/AppContext";

export default function ParkinsonsTestPage() {
  const [started, setStarted] = useState(false);
  const [taps, setTaps] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [finished, setFinished] = useState(false);
  const [result, setResult] = useState(null);
  const [showTherapy, setShowTherapy] = useState(false);
  const [showReady, setShowReady] = useState(true);
  const [isHindi, setIsHindi] = useState(getLanguage() === "hi");

  
  const { axios, updateUserFlag, refreshUser } = useAppContext();

  useEffect(() => {
    const handleLangChange = () => setIsHindi(getLanguage() === "hi");
    window.addEventListener("languageChange", handleLangChange);
    return () => window.removeEventListener("languageChange", handleLangChange);
  }, []);

  useEffect(() => {
    let timer;
    if (started && timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    } else if (started && timeLeft === 0) {
      const tapsPer15s = taps;
      let status = "";
      if (tapsPer15s >= 35) status = "Green";
      else if (tapsPer15s >= 27) status = "Yellow";
      else status = "Red";

      setResult({ taps, tapsPer15s, status });
      setFinished(true);
      setStarted(false);

      
      const sessionData = {
        diseaseType: "parkinson",
        mode: "detection",
        result: status,
        metrics: {
          parkinson: {
            tapsPerSecond: (taps / 15).toFixed(2),
            correctTaps: taps,
            time: 15,
          },
        },
      };

      axios
        .post("/api/game-session/record", sessionData)
        .then(() => console.log("Parkinson test recorded"))
        .catch((err) => console.error("Failed to record test:", err));

      
      if (status === "Red" || status === "Yellow") {
        axios
          .put("/api/user/update-disease-status", { d1: true })
          .then(() => {
            console.log("Parkinson flag (d1) updated in user profile");
            updateUserFlag("d1");
            refreshUser();
          })
          .catch((err) =>
            console.error("Failed to update disease status:", err)
          );
      }
    }
    return () => clearTimeout(timer);
  }, [timeLeft, started]);

  const startTest = () => {
    setShowReady(false);
    setStarted(true);
    setTaps(0);
    setTimeLeft(15);
    setFinished(false);
    setResult(null);
    setShowTherapy(false);
  };

  const handleTap = (e) => {
    e.stopPropagation();
    if (started && timeLeft > 0) setTaps((t) => t + 1);
  };

  const handleRetake = () => {
    setShowReady(true);
    setFinished(false);
    setResult(null);
    setShowTherapy(false);
  };

  const handleTherapyStart = () => {
    setShowTherapy(true);
    setResult(null);
    setFinished(false);
    setShowReady(false);
    setStarted(false);
  };

  const handleTherapyFinish = () => {
    // alert(isHindi ? "थेरेपी सत्र पूरा हुआ!" : "Therapy session completed!");
    setShowTherapy(false);
    setShowReady(true);
  };

  
  if (showReady && !started && !showTherapy && !result) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black text-white">
        <h1 className="text-5xl font-bold mb-6 text-yellow-400">
          {isHindi ? "तैयार?" : "Ready?"}
        </h1>
        <p className="text-2xl mb-6 text-gray-300">
          {isHindi
            ? "पार्किंसंस टैप टेस्ट के लिए तैयार हो जाइए।"
            : "Get ready for the Parkinson’s Tap Test."}
        </p>
        <button
          className="bg-yellow-500 hover:bg-yellow-400 text-black font-semibold px-8 py-4 rounded-xl text-2xl shadow-lg transition-transform transform hover:scale-110"
          onClick={startTest}
        >
          {isHindi ? "शुरू करें" : "Start"}
        </button>
      </div>
    );
  }

  
  if (started && !finished) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black text-white">
        <h1 className="text-4xl font-bold mb-4">
          {isHindi ? "जितनी जल्दी हो सके टैप करें!" : "Tap as Fast as You Can!"}
        </h1>
        <p className="text-6xl mb-6 text-yellow-400">{timeLeft}s</p>
        <button
          className="bg-gradient-to-br from-yellow-400 to-yellow-600 text-black px-16 py-16 rounded-full text-4xl font-bold shadow-[0_0_40px_10px_rgba(255,255,0,0.5)] hover:shadow-[0_0_60px_15px_rgba(255,255,0,0.7)] transition-all duration-300 transform hover:scale-110"
          onClick={handleTap}
        >
          {isHindi ? "मुझे टैप करें" : "TAP ME"}
        </button>
        <p className="text-2xl mt-6 text-gray-300">
          {isHindi ? `टैप्स: ${taps}` : `Taps: ${taps}`}
        </p>
      </div>
    );
  }

  
  if (finished && result && !showTherapy) {
    const color =
      result.status === "Green"
        ? "text-green-400"
        : result.status === "Yellow"
        ? "text-yellow-400"
        : "text-red-500";

    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black text-white p-6">
        <h1 className="text-5xl font-bold mb-4 text-yellow-400">
          {isHindi ? "टेस्ट पूरा" : "Test Complete"}
        </h1>
        <p className="text-2xl mb-2">
          {isHindi ? `कुल टैप्स: ${result.taps}` : `Total Taps: ${result.taps}`}
        </p>
        <p className="text-2xl mb-2">
          {isHindi ? "समय: 15 सेकंड" : "Time: 15 seconds"}
        </p>
        <p className={`text-3xl mb-6 font-bold ${color}`}>
          {isHindi ? `परिणाम: ${result.status}` : `Result: ${result.status}`}
        </p>

        {result.status === "Red" && (
          <>
            <p className="text-xl mb-4 text-red-400">
              {isHindi
                ? "आप रेड रेंज में हैं, थेरेपी की सिफारिश की जाती है।"
                : "You’re in the red range, therapy is recommended."}
            </p>
            <button
              className="bg-yellow-500 hover:bg-yellow-400 text-black px-6 py-3 rounded-lg text-xl mb-4 font-semibold"
              onClick={handleTherapyStart}
            >
              {isHindi ? "थेरेपी शुरू करें" : "Start Therapy"}
            </button>
          </>
        )}

        {result.status === "Yellow" && (
          <>
            <p className="text-xl mb-4 text-yellow-400">
              {isHindi
                ? "आप येलो रेंज में हैं, क्या आप थेरेपी शुरू करना चाहते हैं?"
                : "You’re in the yellow range, do you want to start therapy?"}
            </p>
            <button
              className="bg-yellow-500 hover:bg-yellow-400 text-black px-6 py-3 rounded-lg text-xl mb-4 font-semibold"
              onClick={handleTherapyStart}
            >
              {isHindi ? "हाँ, थेरेपी शुरू करें" : "Yes, Start Therapy"}
            </button>
          </>
        )}

        {result.status === "Green" && (
          <p className="text-xl mb-4 text-green-400">
            {isHindi
              ? "शानदार! आप ग्रीन रेंज में हैं, स्क्रीनिंग जारी रखें।"
              : "Great! You’re in the green range, continue with screening."}
          </p>
        )}

        <button
          className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg text-xl font-semibold mt-2 transition-transform hover:scale-105"
          onClick={handleRetake}
        >
          {isHindi ? "पुनः परीक्षण करें" : "Retake Test"}
        </button>
      </div>
    );
  }

  
  if (showTherapy) {
    return <ParkinsonsTherapy onFinish={handleTherapyFinish} />;
  }

  return null;
}
