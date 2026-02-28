import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";

import ParkinsonsTest from "../pages/ParkinsonsTest.jsx";
import DementiaTest from "../pages/DementiaTest.jsx";
import VisionTest from "../pages/VisionTest.jsx";

import TherapyPage from "./TherapyPage.jsx";

export default function TestRouter() {
  const { disease } = useParams();
  const navigate = useNavigate();
  const [mode, setMode] = useState("test"); // "test" | "therapy"

  const handleFinish = (next) => {
    if (next === "therapy") {
      setMode("therapy");
    } else {
      navigate("/test");
    }
  };

  // THERAPY MODE
  if (mode === "therapy") {
    return (
      <TherapyPage
        disease={disease}
        onBack={() => {
          setMode("test");
          navigate("/test");
        }}
      />
    );
  }

  // TEST MODE
  switch (disease) {
    case "parkinsons":
      return <ParkinsonsTest onFinish={handleFinish} />;

    case "dementia":
      return <DementiaTest onFinish={handleFinish} />;

    case "vision":
      return <VisionTest onFinish={handleFinish} />;

    default:
      return <div>Disease test not found</div>;
  }
}
