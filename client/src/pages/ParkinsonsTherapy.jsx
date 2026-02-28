import { useState, useEffect } from "react";
import { getLanguage } from "../utils/language";
import { useAppContext } from "../context/AppContext";

export default function ParkinsonsTherapy({ onFinish }) {
  const [started, setStarted] = useState(false);
  const [shapeProps, setShapeProps] = useState({});
  const [reactionTimes, setReactionTimes] = useState([]);
  const [shapeVisible, setShapeVisible] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [shapesClicked, setShapesClicked] = useState(0);
  const totalShapes = 15;
  const [isHindi, setIsHindi] = useState(getLanguage() === "hi");
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

  const getRandomShape = () => {
    const shapes = ["circle", "square", "triangle"];
    const shapeType = shapes[Math.floor(Math.random() * shapes.length)];
    const size = Math.floor(Math.random() * 50) + 40;
    const top = Math.floor(Math.random() * 55) + 25;
    const left = Math.floor(Math.random() * 70) + 10;
    return { shapeType, size, top, left };
  };

  const showNextShape = () => {
    if (shapesClicked >= totalShapes) return;
    setShapeProps(getRandomShape());
    setShapeVisible(true);
    setStartTime(Date.now());
  };

  const handleTap = () => {
    const reactionTime = Date.now() - startTime;
    setReactionTimes((prev) => [...prev, reactionTime]);
    setShapeVisible(false);
    setShapesClicked((prev) => prev + 1);
    setTimeout(showNextShape, 500);
  };

  const handleFinish = () => {
    const totalTimeMs = reactionTimes.reduce((a, b) => a + b, 0);
    const totalTimeSec = totalTimeMs / 1000;

    const sessionData = {
      diseaseType: "parkinson",
      mode: "therapy",
      result: "completed",
      metrics: {
        parkinson: {
          tapsPerSecond: null,
          correctTaps: totalShapes,
          time: parseFloat(totalTimeSec.toFixed(2)),
        },
      },
    };

    axios
      .post("/api/game-session/record", sessionData)
      .catch((err) => console.error("Failed to record therapy:", err));

    onFinish({ totalTime: totalTimeSec });
  };

  const Screen = ({ children }) => (
    <div className="flex flex-col items-center justify-center fixed inset-0 bg-black text-white p-4">
      {children}
    </div>
  );

  if (!started) {
    return (
      <Screen>
        <h1 className="text-4xl md:text-5xl font-bold mb-6 text-center">
          {isHindi ? "तैयार?" : "Ready?"}
        </h1>
        <p className="text-2xl md:text-3xl mb-6 text-center">
          {isHindi
            ? "जितनी जल्दी हो सके आकृतियों को टैप करने के लिए तैयार हो जाइए!"
            : "Get ready to tap the shapes as fast as you can!"}
        </p>
        <button
          className="bg-yellow-500 hover:bg-yellow-400 text-black px-8 py-4 rounded-2xl text-2xl font-semibold transition-all focus:ring-4 focus:ring-yellow-200"
          onClick={() => {
            setStarted(true);
            showNextShape();
          }}
        >
          {isHindi ? "शुरू करें" : "Start"}
        </button>
      </Screen>
    );
  }

  if (shapesClicked >= totalShapes) {
    const totalTimeSec = reactionTimes.reduce((a, b) => a + b, 0) / 1000;
    return (
      <Screen>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center">
          {isHindi ? "थेरेपी पूरा" : "Therapy Complete"}
        </h1>
        <p className="text-2xl md:text-3xl mb-6 text-center">
          {isHindi
            ? `कुल समय: ${totalTimeSec.toFixed(2)} सेकंड`
            : `Total time taken: ${totalTimeSec.toFixed(2)} seconds`}
        </p>
        <button
          className="bg-yellow-500 hover:bg-yellow-400 text-black px-8 py-4 rounded-2xl text-2xl font-semibold transition-all focus:ring-4 focus:ring-yellow-200"
          onClick={handleFinish}
        >
          {isHindi ? "जारी रखें" : "Continue"}
        </button>
      </Screen>
    );
  }

  const shapeStyle = {
    top: `${shapeProps.top}%`,
    left: `${shapeProps.left}%`,
    width: `${shapeProps.size}px`,
    height: `${shapeProps.size}px`,
    cursor: "pointer",
    position: "absolute",
    backgroundColor: "yellow",
  };

  if (shapeProps.shapeType === "triangle") {
    shapeStyle.width = 0;
    shapeStyle.height = 0;
    shapeStyle.borderLeft = `${shapeProps.size / 2}px solid transparent`;
    shapeStyle.borderRight = `${shapeProps.size / 2}px solid transparent`;
    shapeStyle.borderBottom = `${shapeProps.size}px solid yellow`;
    shapeStyle.backgroundColor = "transparent";
  } else if (shapeProps.shapeType === "circle") {
    shapeStyle.borderRadius = "50%";
  }

  return (
    <div className="fixed inset-0 bg-black overflow-hidden pt-32">
      {shapeVisible && <div style={shapeStyle} onClick={handleTap}></div>}
      <div className="absolute top-32 left-1/2 transform -translate-x-1/2 text-white text-xl md:text-2xl font-semibold bg-black/70 px-4 py-2 rounded-xl backdrop-blur-sm z-50">
        {isHindi
          ? `टैप किया: ${shapesClicked} / ${totalShapes}`
          : `Tapped: ${shapesClicked} / ${totalShapes}`}
      </div>
    </div>
  );
}
