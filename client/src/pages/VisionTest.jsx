import { useState, useEffect, useRef, useMemo } from "react";
import { getLanguage } from "../utils/language";
import { useAppContext } from "../context/AppContext";
import VisionTherapy from "../pages/VisionTherapy";

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

function ShapeSVG({ type = "Circle", size = 72 }) {
  const stroke = "#1f2937";
  const common = { width: size, height: size, viewBox: `0 0 ${size} ${size}` };
  const gradId = `g-${type}-${size}`;

  const circle = (
    <svg {...common} className="mx-auto">
      <defs>
        <radialGradient id={gradId}>
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="60%" stopColor="#f3f4f6" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#c7cbd1" stopOpacity="0.95" />
        </radialGradient>
      </defs>
      <circle cx={size / 2} cy={size / 2} r={(size / 2) - 4} fill={`url(#${gradId})`} stroke={stroke} strokeWidth="2" />
    </svg>
  );

  const square = (
    <svg {...common} className="mx-auto">
      <defs>
        <linearGradient id={gradId} x1="0" x2="1">
          <stop offset="0%" stopColor="#fff" />
          <stop offset="100%" stopColor="#d9dce1" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width={size - 8} height={size - 8} rx="8" fill={`url(#${gradId})`} stroke={stroke} strokeWidth="2" />
    </svg>
  );

  const triangle = (
    <svg {...common} className="mx-auto">
      <defs>
        <linearGradient id={gradId} x1="0" x2="1">
          <stop offset="0%" stopColor="#fff" />
          <stop offset="100%" stopColor="#dfe3e8" />
        </linearGradient>
      </defs>
      <polygon
        points={`${size / 2},6 ${size - 6},${size - 6} 6,${size - 6}`}
        fill={`url(#${gradId})`}
        stroke={stroke}
        strokeWidth="2"
      />
    </svg>
  );

  const star = (
    <svg {...common} className="mx-auto">
      <defs>
        <linearGradient id={gradId} x1="0" x2="1">
          <stop offset="0%" stopColor="#fff" />
          <stop offset="100%" stopColor="#e5e9ee" />
        </linearGradient>
      </defs>
      <path
        d={`
          M ${size / 2} 6
          L ${size * 0.62} ${size * 0.38}
          L ${size - 6} ${size * 0.42}
          L ${size * 0.68} ${size * 0.62}
          L ${size * 0.76} ${size - 6}
          L ${size / 2} ${size * 0.78}
          L ${size * 0.24} ${size - 6}
          L ${size * 0.32} ${size * 0.62}
          L 6 ${size * 0.42}
          L ${size * 0.38} ${size * 0.38} Z
        `}
        fill={`url(#${gradId})`}
        stroke={stroke}
        strokeWidth="1.8"
      />
    </svg>
  );

  const diamond = (
    <svg {...common} className="mx-auto">
      <defs>
        <linearGradient id={gradId} x1="0" x2="1">
          <stop offset="0%" stopColor="#fff" />
          <stop offset="100%" stopColor="#e0e4ea" />
        </linearGradient>
      </defs>
      <polygon
        points={`${size / 2},4 ${size - 4},${size / 2} ${size / 2},${size - 4} 4,${size / 2}`}
        fill={`url(#${gradId})`}
        stroke={stroke}
        strokeWidth="2"
      />
    </svg>
  );

  const hex = (
    <svg {...common} className="mx-auto">
      <defs>
        <linearGradient id={gradId} x1="0" x2="1">
          <stop offset="0%" stopColor="#fff" />
          <stop offset="100%" stopColor="#e7ebef" />
        </linearGradient>
      </defs>
      <polygon
        points={`
          ${size * 0.25},6
          ${size * 0.75},6
          ${size - 6},${size / 2}
          ${size * 0.75},${size - 6}
          ${size * 0.25},${size - 6}
          6,${size / 2}
        `}
        fill={`url(#${gradId})`}
        stroke={stroke}
        strokeWidth="2"
      />
    </svg>
  );

  const map = { Circle: circle, Square: square, Triangle: triangle, Star: star, Diamond: diamond, Hexagon: hex };
  return <div className="inline-block" style={{ filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.45))" }}>{map[type] || circle}</div>;
}

export default function VisionTestPage() {
  const { axios, updateUserFlag, refreshUser } = useAppContext();
  const [isHindi, setIsHindi] = useState(getLanguage() === "hi");
  const [showReady, setShowReady] = useState(true);
  const [started, setStarted] = useState(false);
  const [trialIndex, setTrialIndex] = useState(0);
  const [trials, setTrials] = useState([]);
  const [options, setOptions] = useState([]);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [result, setResult] = useState(null);
  const [disabled, setDisabled] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [showTherapy, setShowTherapy] = useState(false);

  const containerRef = useRef(null);
  const isPostingRef = useRef(false);
  const SHAPES = ["Circle", "Square", "Triangle", "Star", "Diamond", "Hexagon"];
  const THRESHOLDS = { green: 8, yellow: 6 };
  const TOTAL_TRIALS = 10;

  useEffect(() => {
    const handleLangChange = () => setIsHindi(getLanguage() === "hi");
    window.addEventListener("languageChange", handleLangChange);
    return () => window.removeEventListener("languageChange", handleLangChange);
  }, []);

  const initTrials = () => {
    const seq = new Array(TOTAL_TRIALS).fill(0).map(() => SHAPES[Math.floor(Math.random() * SHAPES.length)]);
    setTrials(seq);
    setTrialIndex(0);
    setScore(0);
    setFinished(false);
    setResult(null);
    setDisabled(false);
    setStartTime(Date.now());
    setEndTime(null);
    setOptions(makeOptionsForShape(seq[0]));
  };

  const makeOptionsForShape = (correctShape) => {
    const pool = SHAPES.filter((s) => s !== correctShape);
    const picks = shuffle(pool).slice(0, 3);
    return shuffle([correctShape, ...picks]);
  };

  const startTest = () => {
    setShowReady(false);
    setStarted(true);
    initTrials();
  };

  const handleSelect = (shapeSelected) => {
    if (disabled) return;
    setDisabled(true);
    const correctShape = trials[trialIndex];
    const correct = shapeSelected === correctShape;

    setScore((prev) => {
      const newScore = correct ? prev + 1 : prev;

      const nextIndex = trialIndex + 1;
      setTimeout(() => {
        if (nextIndex >= TOTAL_TRIALS) {
          finishRun(newScore);
        } else {
          setTrialIndex(nextIndex);
          setOptions(makeOptionsForShape(trials[nextIndex]));
          setDisabled(false);
        }
      }, 550);

      return newScore;
    });
  };

  const finishRun = (finalScore) => {
    setFinished(true);
    setStarted(false);
    setEndTime(Date.now());

    const correctCount = finalScore !== undefined ? finalScore : score;
    let status = "Red";
    if (correctCount >= THRESHOLDS.green) status = "Green";
    else if (correctCount >= THRESHOLDS.yellow) status = "Yellow";

    setResult({ correct: correctCount, trials: TOTAL_TRIALS, status });
  };

  useEffect(() => {
    if (!finished || !result) return;

    if (isPostingRef.current) return;
    isPostingRef.current = true;

    const totalTimeSec = startTime && endTime ? Math.floor((endTime - startTime) / 1000) : 0;

    const sessionData = {
      diseaseType: "vision",
      mode: "detection",
      result: result.status,
      metrics: {
        vision: {
          correctAnswers: result.correct,
          time: totalTimeSec,
        },
      },
    };

    axios
      .post("/api/game-session/record", sessionData)
      .then(() => {
        console.log("Vision test recorded");
      })
      .catch((err) => {
        console.error("Failed to record vision test:", err);
      })
      .finally(() => {
        setTimeout(() => {
          isPostingRef.current = false;
        }, 1000);
      });

    if (result.status === "Red" || result.status === "Yellow") {
      axios
        .put("/api/user/update-disease-status", { d3: true })
        .then(() => {
          if (typeof updateUserFlag === "function") updateUserFlag("d3");
          if (typeof refreshUser === "function") refreshUser();
        })
        .catch((err) => {
          console.error("Failed to update user flag for vision:", err);
        });
    }
  }, [finished, result, endTime, startTime]);

  const handleRetake = () => {
    setShowReady(true);
    setStarted(false);
    setTrials([]);
    setOptions([]);
    setTrialIndex(0);
    setScore(0);
    setFinished(false);
    setResult(null);
    setDisabled(false);
    setStartTime(null);
    setEndTime(null);
  };

  const handleTherapyStart = () => {
    setShowTherapy(true);
    setResult(null);
    setFinished(false);
    setShowReady(false);
    setStarted(false);
  };

  const handleTherapyFinish = () => {
    setShowTherapy(false);
    setShowReady(true);
  };

  const DotsField = ({ shape }) => {
    const count = 1200;
    const containerSize = 340;

    const { shapeLeft, shapeTop } = useMemo(
      () => ({
        shapeLeft: Math.random() * (containerSize - 100) + 50,
        shapeTop: Math.random() * (containerSize - 100) + 50,
      }),
      [shape, trialIndex]
    );

    const dots = new Array(count).fill(0).map(() => {
      const size = Math.random() < 0.85 ? 4 : 6;
      return {
        size,
        left: Math.random() * (containerSize - size),
        top: Math.random() * (containerSize - size),
        opacity: Math.random() * 0.55 + 0.25,
      };
    });

    const maskDots = new Array(330).fill(0).map(() => {
      const size = Math.random() < 0.85 ? 4 : 6;
      return {
        size,
        left: Math.min(Math.max(shapeLeft - 20 + Math.random() * 100, 0), containerSize - size),
        top: Math.min(Math.max(shapeTop - 20 + Math.random() * 100, 0), containerSize - size),
        opacity: Math.random() * 0.65 + 0.35,
      };
    });

    return (
      <div
        className="relative bg-gray-800 rounded-lg mx-auto"
        style={{ width: containerSize, height: containerSize, border: "2px solid rgba(255,255,255,0.06)" }}
        ref={containerRef}
      >
        {dots.map((d, i) => (
          <div
            key={"d" + i}
            style={{
              position: "absolute",
              left: d.left,
              top: d.top,
              width: d.size,
              height: d.size,
              borderRadius: "50%",
              background: "#ffffff",
              opacity: d.opacity,
            }}
          />
        ))}

        <div
          style={{
            position: "absolute",
            left: shapeLeft,
            top: shapeTop,
            transform: "translate(-50%,-50%)",
            width: 90,
            height: 90,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: 0.28,
            pointerEvents: "none",
          }}
        >
          <ShapeSVG type={shape} size={90} />
        </div>

        {maskDots.map((d, i) => (
          <div
            key={"m" + i}
            style={{
              position: "absolute",
              left: d.left,
              top: d.top,
              width: d.size,
              height: d.size,
              borderRadius: "50%",
              background: "#ffffff",
              opacity: d.opacity,
            }}
          />
        ))}
      </div>
    );
  };

  if (showReady && !started && !finished && !showTherapy) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black text-white p-6">
        <h1 className="text-5xl font-bold text-yellow-400 mb-6">{isHindi ? "तैयार?" : "Ready?"}</h1>
        <p className="text-2xl text-gray-300 max-w-2xl text-center mb-8">
          {isHindi
            ? "स्क्रीन पर दिखाई देने वाले बिंदुओं के बीच छिपा एक आकार दिखाई देगा। सही विकल्प चुनें। कुल 10 प्रश्न होंगे।"
            : "You will see dots with a hidden shape among them. Choose the correct shape from the four options. There are 10 trials."}
        </p>
        <button onClick={startTest} className="bg-yellow-500 hover:bg-yellow-400 text-black px-12 py-5 rounded-2xl text-3xl font-semibold shadow-lg transition-transform transform hover:scale-105">
          {isHindi ? "शुरू करें" : "Start"}
        </button>
      </div>
    );
  }

  if (started && !finished && !showTherapy) {
    const currentShape = trials[trialIndex];
    return (
      <div className="flex flex-col items-center justify-start min-h-screen bg-black text-white p-6 pt-24">
        <h1 className="text-4xl font-bold text-yellow-400 mb-4 text-center">
          {isHindi ? "दृष्टि परीक्षण" : "Vision — Shape Test"}
        </h1>
        <div className="mb-4 text-gray-300 text-2xl">
          {isHindi ? `सही: ${score} / ${TOTAL_TRIALS}` : `Correct: ${score} / ${TOTAL_TRIALS}`} • {isHindi ? `ट्रायल: ${trialIndex + 1} / ${TOTAL_TRIALS}` : `Trial: ${trialIndex + 1} / ${TOTAL_TRIALS}`}
        </div>
        <DotsField shape={currentShape} />
        <div className="grid grid-cols-2 gap-4 mt-6 w-full max-w-md mx-auto">
          {options.map((opt, idx) => (
            <button key={opt + idx} disabled={disabled} onClick={() => handleSelect(opt)}
              className={`flex items-center justify-center p-4 rounded-2xl bg-blue-900 hover:bg-blue-800 border border-white/10 transition-transform ${disabled ? "opacity-60 cursor-not-allowed" : "hover:scale-[1.03]"}`}
              style={{ height: 110 }}
            >
              <ShapeSVG type={opt} size={88} />
            </button>
          ))}
        </div>
        <div className="mt-6 text-gray-400 text-2xl">
          {isHindi ? "बड़ा बटन चुनें — स्पष्ट रूप से लिखे गए विकल्पों की आवश्यकता नहीं।" : "Tap the option that matches the shape."}
        </div>
      </div>
    );
  }

  if (finished && result && !showTherapy) {
    const colorClass = result.status === "Green" ? "text-green-400" : result.status === "Yellow" ? "text-yellow-400" : "text-red-500";
    const totalTimeSec = endTime && startTime ? Math.floor((endTime - startTime) / 1000) : 0;

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-6">
        <h1 className="text-5xl font-bold mb-4 text-yellow-400">{isHindi ? "टेस्ट पूरा" : "Test Complete"}</h1>
        <p className="text-2xl mb-2">{isHindi ? `सही: ${result.correct} / ${result.trials}` : `Correct: ${result.correct} / ${result.trials}`}</p>
        <p className={`text-3xl mb-2 font-bold ${colorClass}`}>{isHindi ? `परिणाम: ${result.status}` : `Result: ${result.status}`}</p>
        <p className="text-xl mb-4 text-gray-300">{isHindi ? `कुल समय: ${totalTimeSec} सेकंड` : `Total Time: ${totalTimeSec} sec`}</p>

        {(result.status === "Yellow" || result.status === "Red") && (
          <button className="max-w-[250px] bg-yellow-500 hover:bg-yellow-400 text-black px-6 py-3 rounded-lg text-xl font-semibold mb-4" onClick={handleTherapyStart}>
            {isHindi ? "थेरेपी शुरू करें" : "Start Therapy"}
          </button>
        )}
        <button className=" bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg text-xl font-semibold" onClick={handleRetake}>
          {isHindi ? "पुनः परीक्षण करें" : "Retake Test"}
        </button>
      </div>
    );
  }

  if (showTherapy) {
    return <VisionTherapy onFinish={handleTherapyFinish} />;
  }

  return null;
}
