import { useState, useEffect, useRef } from "react";
import DementiaTherapy from "../pages/DementiaTherapy";
import { getLanguage } from "../utils/language";
import { useAppContext } from "../context/AppContext";

export default function DementiaTestPage() {
  const { axios, updateUserFlag, refreshUser } = useAppContext();

  const [level, setLevel] = useState(1);
  const [sequence, setSequence] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentNumber, setCurrentNumber] = useState(null);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [result, setResult] = useState(null);
  const [showTherapy, setShowTherapy] = useState(false);
  const [showReady, setShowReady] = useState(true);
  const [isHindi, setIsHindi] = useState(getLanguage() === "hi");
  const [showBlank, setShowBlank] = useState(false);
  const [clickedThisNumber, setClickedThisNumber] = useState(false);
  const [userStopped, setUserStopped] = useState(false);
  const [showTransition, setShowTransition] = useState(false);
  const [nextLevelToStart, setNextLevelToStart] = useState(null);

  const perLevelScoreRef = useRef(0);
  const perLevelAttemptsRef = useRef(0);
  const indexRef = useRef(0);
  const sessionStartRef = useRef(0);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const isMountedRef = useRef(true);
  const dingSoundRef = useRef(null);
  const finishCalledRef = useRef(false);

  const levelThresholds = { 1: 70, 2: 60, 3: 50 };
  const levelsResultsRef = useRef({
    1: { score: 0, matches: 0, attempts: 0, accuracy: 0 },
    2: { score: 0, matches: 0, attempts: 0, accuracy: 0 },
    3: { score: 0, matches: 0, attempts: 0, accuracy: 0 },
  });

  const DIGIT_VISIBLE_TIME = 2500;
  const DIGIT_BLANK_TIME = 800;
  const SEQUENCE_LENGTH = 15;

  useEffect(() => {
    isMountedRef.current = true;
    const handleLangChange = () => setIsHindi(getLanguage() === "hi");
    window.addEventListener("languageChange", handleLangChange);
    dingSoundRef.current = new Audio(
      "https://actions.google.com/sounds/v1/alarms/beep_short.ogg"
    );
    return () => {
      isMountedRef.current = false;
      window.removeEventListener("languageChange", handleLangChange);
      clearAllTimers();
    };
  }, []);

  const clearAllTimers = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    intervalRef.current = null;
    timeoutRef.current = null;
  };

  const generateSequence = (roundLevel = level) => {
    const arr = [];
    const total = SEQUENCE_LENGTH;
    const matchProbability = 0.25;
    for (let i = 0; i < total; i++) {
      if (i < roundLevel) arr.push(Math.floor(Math.random() * 9) + 1);
      else if (Math.random() < matchProbability) arr.push(arr[i - roundLevel]);
      else {
        let num;
        do {
          num = Math.floor(Math.random() * 9) + 1;
        } while (num === arr[i - roundLevel]);
        arr.push(num);
      }
    }

    // ensure at least one true n-back match exists for this roundLevel
    let hasMatch = false;
    for (let i = roundLevel; i < total; i++) {
      if (arr[i] === arr[i - roundLevel]) {
        hasMatch = true;
        break;
      }
    }
    if (!hasMatch) {
      const idx = Math.floor(Math.random() * (total - roundLevel)) + roundLevel;
      arr[idx] = arr[idx - roundLevel];
    }

    return arr;
  };

  const startRound = (roundLevel) => {
    clearAllTimers();
    if (!sessionStartRef.current) sessionStartRef.current = Date.now();

    const seq = generateSequence(roundLevel);
    setSequence(seq);
    setCurrentIndex(0);
    indexRef.current = 0;
    perLevelScoreRef.current = 0;
    perLevelAttemptsRef.current = 0;
    setScore(0);
    setAttempts(0);
    setStarted(true);
    setFinished(false);
    setShowBlank(false);
    setClickedThisNumber(false);
    setUserStopped(false);
    setCurrentNumber(seq[0]);

    let idx = 0;
    intervalRef.current = setInterval(() => {
      setShowBlank(true);
      setClickedThisNumber(false);
      timeoutRef.current = setTimeout(() => {
        setShowBlank(false);
        idx++;
        if (idx < seq.length) {
          indexRef.current = idx;
          setCurrentNumber(seq[idx]);
          setCurrentIndex(idx);
        } else {
          clearAllTimers();
          setTimeout(() => evaluateLevel(roundLevel, seq), 150);
        }
      }, DIGIT_BLANK_TIME);
    }, DIGIT_VISIBLE_TIME + DIGIT_BLANK_TIME);
  };

  const handleMatch = () => {
    if (!started || finished || showBlank) return;
    if (clickedThisNumber) return;

    const i = indexRef.current;
    if (i < level) return;

    setClickedThisNumber(true);
    setAttempts((a) => a + 1);
    perLevelAttemptsRef.current += 1;

    if (sequence[i] === sequence[i - level]) {
      setScore((s) => s + 1);
      perLevelScoreRef.current += 1;
    }
  };

  const handleStop = () => {
    setUserStopped(true);
    clearAllTimers();
    evaluateLevel(level, sequence);
  };

  const evaluateLevel = (evaluatedLevel, seq = sequence) => {
    let totalMatchesThisLevel = 0;
    for (let i = evaluatedLevel; i < seq.length; i++) {
      if (seq[i] === seq[i - evaluatedLevel]) totalMatchesThisLevel++;
    }

    const correctThisLevel = perLevelScoreRef.current;
    const attemptsThisLevel = perLevelAttemptsRef.current;

    const accuracyThisLevel =
      attemptsThisLevel > 0 ? (correctThisLevel / attemptsThisLevel) * 100 : 0;

    levelsResultsRef.current[evaluatedLevel] = {
      score: correctThisLevel,
      matches: totalMatchesThisLevel,
      attempts: attemptsThisLevel,
      accuracy: Math.round(accuracyThisLevel),
    };

    const threshold = levelThresholds[evaluatedLevel] ?? 70;

    if (accuracyThisLevel >= threshold && evaluatedLevel < 3) {
      const next = evaluatedLevel + 1;
      showNextLevelTransition(next);
    } else {
      let forcedStatus = null;
      if (accuracyThisLevel < 50) {
        forcedStatus = "Red";
      } else if (evaluatedLevel === 3 && accuracyThisLevel >= levelThresholds[3]) {
        forcedStatus = "Green";
      } else {
        forcedStatus = "Yellow";
      }

      finishTest(evaluatedLevel, accuracyThisLevel, forcedStatus);
    }
  };

  const showNextLevelTransition = (nextLevel) => {
    clearAllTimers();
    if (dingSoundRef.current) dingSoundRef.current.play().catch(() => {});
    setShowTransition(true);
    setNextLevelToStart(nextLevel);
    setTimeout(() => {
      setShowTransition(false);
      setNextLevelToStart(null);
      setLevel(nextLevel);
      startRound(nextLevel);
    }, 3500);
  };

  const finishTest = async (reachedLevel, accuracy, forcedStatus = null) => {
    if (finishCalledRef.current) return;
    finishCalledRef.current = true;

    clearAllTimers();

    const totalCorrect = Object.values(levelsResultsRef.current).reduce(
      (sum, l) => sum + (l.score || 0),
      0
    );
    const totalMatches = Object.values(levelsResultsRef.current).reduce(
      (sum, l) => sum + (l.matches || 0),
      0
    );
    const totalAttempts = Object.values(levelsResultsRef.current).reduce(
      (sum, l) => sum + (l.attempts || 0),
      0
    );

    let status = "Red";
    if (forcedStatus) {
      status = forcedStatus;
    } else {
      if (reachedLevel === 2) status = "Yellow";
      else if (reachedLevel === 3) status = "Green";
      else status = "Red";
    }

    setFinished(true);
    setStarted(false);
    setResult({
      reachedLevel,
      status,
      totalCorrect,
      totalMatches,
      totalAttempts,
      accuracy: Math.round(accuracy),
      levels: levelsResultsRef.current,
    });
    sessionStartRef.current = 0;


    try {
      await axios.post("/api/game-session/record", {
        diseaseType: "dementia",
        mode: "detection",
        result: status,
        metrics: {
          dementia: {
            correctAnswers: totalCorrect,
            attempts: totalAttempts,
            levelReached: reachedLevel,
          },
        },
      });


      if ((status === "Red" || status === "Yellow") && !userStopped) {
        await axios.put("/api/user/update-disease-status", { d2: true });
        updateUserFlag("d2");
        refreshUser();
      }
    } catch (err) {
      console.error("Backend error:", err);
    }
  };

  const startLevel = () => {
    setShowReady(false);
    setResult(null);
    setFinished(false);
    setScore(0);
    setAttempts(0);
    perLevelScoreRef.current = 0;
    perLevelAttemptsRef.current = 0;
    finishCalledRef.current = false;
    setLevel(1);
    setUserStopped(false);
    levelsResultsRef.current = {
      1: { score: 0, matches: 0, attempts: 0, accuracy: 0 },
      2: { score: 0, matches: 0, attempts: 0, accuracy: 0 },
      3: { score: 0, matches: 0, attempts: 0, accuracy: 0 },
    };
    startRound(1);
  };

  const handleTherapyStart = () => {
    clearAllTimers();
    setShowTherapy(true);
    setResult(null);
    setFinished(false);
    setShowReady(false);
  };

  const handleTherapyFinish = () => {
    // alert(isHindi ? "थेरेपी सत्र पूरा हुआ!" : "Therapy session completed!");
    setShowTherapy(false);
    setShowReady(true);
  };

  const getInstructionText = (lvl) => {
    if (isHindi) {
      if (lvl === 1)
        return "अगर यह संख्या पिछली संख्या के समान है, तो 'मेल' दबाएँ।";
      if (lvl === 2)
        return "अगर यह संख्या दो संख्याओं पहले वाली के समान है, तो 'मेल' दबाएँ।";
      if (lvl === 3)
        return "अगर यह संख्या तीन संख्याओं पहले वाली के समान है, तो 'मेल' दबाएँ।";
      return "";
    } else {
      if (lvl === 1)
        return "Press 'MATCH' if this number is the same as the one before this.";
      if (lvl === 2)
        return "Press 'MATCH' if this number is the same as the one shown two turns before.";
      if (lvl === 3)
        return "Press 'MATCH' if this number is the same as the one shown three turns before.";
      return "";
    }
  };

  if (showTransition && nextLevelToStart) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black text-center">
        <h1
          className="text-yellow-400 font-bold"
          style={{ fontSize: "6rem", lineHeight: "1.3" }}
        >
          {isHindi
            ? `अब शुरू हो रहा है ${nextLevelToStart}-बैक स्तर`
            : `Now starting with ${nextLevelToStart}-Back`}
        </h1>
      </div>
    );
  }

  if (showReady && !started && !showTherapy && !result) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black text-white px-6 text-center">
        <h1 className="text-5xl font-bold mb-6 text-yellow-400">
          {isHindi ? "तैयार?" : "Ready?"}
        </h1>
        <p className="text-2xl mb-4 text-gray-300">
          {isHindi
            ? `आपको एक-एक करके संख्याएँ दिखाई देंगी। यह ${level}-बैक टेस्ट है।`
            : `You’ll see numbers appear one by one. This is a ${level}-Back test.`}
        </p>
        <p className="text-2xl mb-8 text-yellow-400 font-semibold">
          {getInstructionText(level)}
        </p>
        <button
          className="bg-yellow-500 hover:bg-yellow-400 text-black font-semibold px-8 py-4 rounded-xl text-2xl shadow-lg transition-transform transform hover:scale-110"
          onClick={startLevel}
        >
          {isHindi ? "शुरू करें" : "Start"}
        </button>
      </div>
    );
  }

  if (started && !finished) {
    return (
      <div className="flex flex-col items-center justify-start min-h-screen bg-black text-white pt-28 pb-12 px-6">
        <h1 className="text-4xl font-bold mb-3 text-yellow-400">
          {isHindi ? `${level}-बैक टेस्ट` : `${level}-Back Test`}
        </h1>
        <p className="text-xl mb-6 text-gray-300 font-semibold">
          {getInstructionText(level)}
        </p>

        <div className="flex items-center justify-center mb-10 min-h-[180px]">
          <div className="text-9xl font-bold text-yellow-400">
            {showBlank ? "" : currentNumber}
          </div>
        </div>

        <button
          className={`bg-gradient-to-br from-yellow-400 to-yellow-600 text-black px-10 py-6 rounded-full text-3xl font-bold shadow-[0_0_30px_10px_rgba(255,255,0,0.5)] hover:shadow-[0_0_50px_15px_rgba(255,255,0,0.7)] transition-all duration-300 transform hover:scale-110 ${
            clickedThisNumber || showBlank ? "opacity-50 cursor-not-allowed" : ""
          }`}
          onClick={handleMatch}
          disabled={clickedThisNumber || showBlank}
        >
          {isHindi ? "मेल" : "MATCH"}
        </button>

        <button
          className="bg-red-500 hover:bg-red-400 text-black px-6 py-3 rounded-lg text-xl mt-6"
          onClick={handleStop}
        >
          {isHindi ? "खेलना रोकें" : "Stop Playing"}
        </button>

        <p className="mt-2 text-lg text-gray-300">
          {isHindi
            ? "सही परिणाम तभी मिलेगा जब अंत तक पूरा किया जाए।"
            : "Proper result will be given only when finished till the end."}
        </p>

        <p className="text-xl mt-6 text-gray-300">
          {isHindi ? `स्कोर: ${score}` : `Score: ${score}`}
        </p>
        <p className="text-xl text-gray-300">
          {isHindi ? `प्रयास: ${attempts}` : `Attempts: ${attempts}`}
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

    const levels = result.levels || {
      1: { score: 0, matches: 0, attempts: 0, accuracy: 0 },
      2: { score: 0, matches: 0, attempts: 0, accuracy: 0 },
      3: { score: 0, matches: 0, attempts: 0, accuracy: 0 },
    };

    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black text-white p-6">
        <h1 className="text-5xl font-bold mb-4 text-black">
          {isHindi ? "टेस्ट पूरा हुआ" : "Test Complete"}
        </h1>
        <p className="text-2xl mb-4">
          {isHindi
            ? `पहुंचा स्तर: ${result.reachedLevel}-बैक`
            : `Level Reached: ${result.reachedLevel}-Back`}
        </p>
        <p className={`text-3xl mb-6 font-bold ${color}`}>
          {isHindi ? `परिणाम: ${result.status}` : `Result: ${result.status}`}
        </p>

        <div className="w-full max-w-md bg-gray-900/50 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-3 text-yellow-300">
            {isHindi ? "स्तर अनुसार विवरण" : "Per-level details"}
          </h2>
          {[1, 2, 3].map((lvl) => {
            const L = levels[lvl] || { score: 0, matches: 0, attempts: 0, accuracy: 0 };
            return (
              <div
                key={lvl}
                className="flex items-center justify-between py-2 border-b border-gray-800 last:border-b-0"
              >
                <div>
                  <div className="text-lg font-medium">
                    {isHindi ? `${lvl}-बैक` : `${lvl}-Back`}
                  </div>
                  <div className="text-lg text-gray-300">
                    {isHindi
                      ? `स्कोर: ${L.score} • प्रयास: ${L.attempts} • मेल: ${L.matches}`
                      : `Score: ${L.score} • Attempts: ${L.attempts} • Matches: ${L.matches}`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold">
                    {isHindi ? `सटीकता` : `Accuracy`}
                  </div>
                  <div className="text-lg">{`${L.accuracy ?? 0}%`}</div>
                </div>
              </div>
            );
          })}
        </div>

        {["Red", "Yellow"].includes(result.status) && (
          <button
            className="bg-yellow-500 hover:bg-yellow-400 text-black px-6 py-3 rounded-lg text-xl mb-4 font-semibold mt-6"
            onClick={handleTherapyStart}
          >
            {isHindi ? "थेरेपी शुरू करें" : "Start Therapy"}
          </button>
        )}

        <button
          className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg text-xl font-semibold mt-2 transition-transform hover:scale-105"
          onClick={() => window.location.reload()}
        >
          {isHindi ? "पुनः परीक्षण करें" : "Retake Test"}
        </button>
      </div>
    );
  }

  if (showTherapy) return <DementiaTherapy onFinish={handleTherapyFinish} />;
  return null;
}
