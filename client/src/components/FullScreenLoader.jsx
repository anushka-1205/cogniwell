import React from "react";
import { getLanguage } from "../utils/language";

export default function FullScreenLoader() {
  const isHindi = getLanguage() === "hi";
  return (
    <div className="flex items-center justify-center h-screen bg-black text-yellow-400 text-3xl">
      {isHindi ? "लोड हो रहा है..." : "Loading..."}
    </div>
  );
}
