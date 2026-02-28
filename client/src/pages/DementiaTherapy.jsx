import { useState, useEffect } from "react";
import { getLanguage } from "../utils/language";
import { useAppContext } from "../context/AppContext";

export default function DementiaTherapy({ onFinish }) {
  const [gridSize, setGridSize] = useState(2);
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [mistakes, setMistakes] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [stopped, setStopped] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [stoppedTooEarly, setStoppedTooEarly] = useState(false);
  const [totalTime, setTotalTime] = useState(0);
  const [isHindi, setIsHindi] = useState(getLanguage() === "hi");

  const MIN_PLAY_TIME = 10;
  const { axios } = useAppContext();

  useEffect(() => {
    const handleLangChange = () => setIsHindi(getLanguage() === "hi");
    window.addEventListener("languageChange", handleLangChange);
    return () => window.removeEventListener("languageChange", handleLangChange);
  }, []);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.body.style.height = "100vh";
    return () => {
      document.body.style.overflow = "";
      document.body.style.height = "";
    };
  }, []);

  const generateCards = (size) => {
    const totalPairs = (size * size) / 2;
    const numbers = [];
    for (let i = 1; i <= totalPairs; i++) numbers.push(i, i);
    return numbers.sort(() => Math.random() - 0.5);
  };

  useEffect(() => {
    const shuffled = generateCards(gridSize);
    setCards(shuffled);
    setFlipped([]);
    setMatched([]);
    setMistakes(0);
    setStartTime(Date.now());
  }, [gridSize]);

  const handleClick = (index) => {
    if (flipped.length === 2 || flipped.includes(index) || matched.includes(index)) return;

    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      if (cards[newFlipped[0]] === cards[newFlipped[1]]) {
        setMatched([...matched, ...newFlipped]);
        setFlipped([]);
      } else {
        setMistakes((m) => m + 1);
        setTimeout(() => setFlipped([]), 1000);
      }
    }
  };

  useEffect(() => {
    if (matched.length === cards.length && cards.length > 0 && !stopped) {
      if (gridSize < 8) setGridSize((g) => g + 1);
    }
  }, [matched]);

  const handleStop = async () => {
    if (stopped) return;
    setStopped(true);

    const elapsedSeconds = (Date.now() - startTime) / 1000;
    const roundedTime = parseFloat(elapsedSeconds.toFixed(2));
    setTotalTime(roundedTime);

    if (elapsedSeconds < MIN_PLAY_TIME) {
      setStoppedTooEarly(true);
      setShowResult(true);
      return;
    }

    const sessionData = {
      diseaseType: "dementia",
      mode: "therapy",
      result: "completed",
      metrics: {
        dementia: {
          gridSize,
          correctAnswers: matched.length / 2,
          mistakes,
          time: roundedTime,
        },
      },
    };

    try {
      await axios.post("/api/game-session/record", sessionData);
    } catch (err) {
      console.error("Failed to record therapy:", err);
    }

    setShowResult(true);
  };

  const handleRetry = () => {
    setStopped(false);
    setShowResult(false);
    setStoppedTooEarly(false);
    setCards(generateCards(gridSize));
    setFlipped([]);
    setMatched([]);
    setMistakes(0);
    setStartTime(Date.now());
  };

  const Screen = ({ children }) => (
    <div className="flex flex-col items-center justify-center fixed inset-0 bg-black text-white p-4 text-center overflow-hidden">
      {children}
    </div>
  );

  if (showResult) {
    const matchedPairs = matched.length / 2;

    if (stoppedTooEarly) {
      return (
        <Screen>
          <h1 className="text-4xl font-bold text-yellow-400 mb-6">
            {isHindi ? "बहुत जल्दी रुक गए!" : "Stopped Too Early!"}
          </h1>
          <p className="text-xl text-gray-300 mb-6">
            {isHindi
              ? `कृपया कम से कम ${MIN_PLAY_TIME} सेकंड तक खेलें फिर रुकें।`
              : `Please play for at least ${MIN_PLAY_TIME} seconds before stopping.`}
          </p>
          <button
            className="bg-yellow-500 hover:bg-yellow-400 text-black px-8 py-4 rounded-2xl text-xl font-semibold transition-all focus:ring-4 focus:ring-yellow-200"
            onClick={handleRetry}
          >
            {isHindi ? "फिर से जारी रखें" : "Resume Where You Left Off"}
          </button>
        </Screen>
      );
    }

    return (
      <Screen>
        <h1 className="text-4xl md:text-5xl font-bold text-yellow-400 mb-4">
          {isHindi ? "थेरेपी सत्र पूरा हुआ" : "Therapy Session Complete"}
        </h1>
        <p className="text-lg text-gray-300 mb-2">
          {isHindi ? `ग्रिड का आकार: ${gridSize}x${gridSize}` : `Grid Size: ${gridSize}x${gridSize}`}
        </p>
        <p className="text-lg text-gray-300 mb-2">
          {isHindi ? `मिली जोड़ी: ${matchedPairs}` : `Matched Pairs: ${matchedPairs}`}
        </p>
        <p className="text-lg text-gray-300 mb-2">
          {isHindi ? `गलतियाँ: ${mistakes}` : `Mistakes: ${mistakes}`}
        </p>
        <p className="text-lg text-gray-300 mb-6">
          {isHindi ? `कुल समय: ${totalTime.toFixed(2)} सेकंड` : `Total Time: ${totalTime.toFixed(2)} sec`}
        </p>
        <button
          className="bg-yellow-500 hover:bg-yellow-400 text-black px-8 py-4 rounded-2xl text-xl font-semibold transition-all focus:ring-4 focus:ring-yellow-200"
          onClick={onFinish}
        >
          {isHindi ? "समाप्त करें" : "Finish"}
        </button>
      </Screen>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center fixed inset-0 bg-black text-white p-4 overflow-hidden text-center">
      <h1 className="text-4xl font-bold mb-4 text-yellow-400">
        {isHindi ? "मेमोरी थेरेपी" : "Memory Therapy"}
      </h1>
      <p className="text-lg text-gray-300 mb-4">
        {isHindi
          ? `सभी जोड़ी मिलाएँ। ग्रिड का आकार: ${gridSize}x${gridSize}`
          : `Find all matching pairs. Grid size: ${gridSize}x${gridSize}`}
      </p>

      <div
        className="grid gap-3 md:gap-4"
        style={{
          gridTemplateColumns: `repeat(${gridSize}, minmax(40px, 1fr))`,
          gridTemplateRows: `repeat(${gridSize}, minmax(40px, 1fr))`,
        }}
      >
        {cards.map((num, index) => (
          <div
            key={index}
            className={`w-14 h-14 flex items-center justify-center border-2 border-white text-black text-xl cursor-pointer rounded-lg ${
              flipped.includes(index) || matched.includes(index)
                ? "bg-yellow-500"
                : "bg-gray-800"
            }`}
            onClick={() => handleClick(index)}
          >
            {(flipped.includes(index) || matched.includes(index)) && num}
          </div>
        ))}
      </div>

      <p className="mt-4 text-lg">
        {isHindi ? `मिली जोड़ी: ${matched.length / 2}` : `Matched Pairs: ${matched.length / 2}`}
      </p>
      <p className="mt-2 text-lg">
        {isHindi ? `गलतियाँ: ${mistakes}` : `Mistakes: ${mistakes}`}
      </p>

      <button
        className="bg-red-500 hover:bg-red-400 text-black px-8 py-3 rounded-lg text-xl font-semibold mt-8 transition-transform hover:scale-110"
        onClick={handleStop}
      >
        {isHindi ? "खेलना रोकें" : "Stop Playing"}
      </button>
    </div>
  );
}
