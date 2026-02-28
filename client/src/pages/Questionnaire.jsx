import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getLanguage } from "../utils/language";
import { useAppContext } from "../context/AppContext.jsx";

export default function Questionnaire() {
  const navigate = useNavigate();
  const { axios, user, role, refreshUser } = useAppContext();

  const [isHindi, setIsHindi] = useState(getLanguage() === "hi");
  const [form, setForm] = useState({
    height: "",
    weight: "",
    bloodPressure: "",
    heartRate: "",
    breathsPerMin: "",
    physicalActivity: "",
    sleepHours: "",
    stressLevel: 3,
  });
  const [bmi, setBmi] = useState(null);
  const [bmiStatus, setBmiStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const handleLangChange = () => setIsHindi(getLanguage() === "hi");
    window.addEventListener("languageChange", handleLangChange);
    return () => window.removeEventListener("languageChange", handleLangChange);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "bloodPressure") {
      let formatted = value.replace(/[^0-9/]/g, "");
      const parts = formatted.split("/");
      if (parts.length > 2) formatted = parts[0] + "/" + parts[1];
      if (parts[0]?.length > 3) parts[0] = parts[0].slice(0, 3);
      if (parts[1]?.length > 3) parts[1] = parts[1].slice(0, 3);
      formatted = parts.join("/");
      setForm((s) => ({ ...s, [name]: formatted }));
      return;
    }

    setForm((s) => ({ ...s, [name]: value }));
  };

  const computeBmiAndStatus = (heightVal = form.height, weightVal = form.weight) => {
    if (!heightVal || !weightVal) {
      setBmi(null);
      setBmiStatus("");
      return null;
    }
    const h = parseFloat(heightVal) / 100;
    const w = parseFloat(weightVal);
    if (!h || !w) return null;
    const val = Math.round((w / (h * h)) * 10) / 10;
    let status = "";
    if (val < 18.5) status = isHindi ? "कम वज़न (Underweight)" : "Underweight";
    else if (val >= 18.5 && val < 25) status = isHindi ? "सामान्य (Normal)" : "Normal";
    else status = isHindi ? "अधिक वज़न (Overweight)" : "Overweight";

    setBmi(val);
    setBmiStatus(status);
    return { bmi: val, bmiStatus: status };
  };

  useEffect(() => {
    computeBmiAndStatus();
  }, [form.height, form.weight, isHindi]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.height || !form.weight || !form.breathsPerMin) {
      setError(isHindi ? "ऊँचाई, वज़न और साँसें भरें।" : "Please fill height, weight and breaths per minute.");
      return;
    }

    const payload = {
      height: Number(form.height),
      weight: Number(form.weight),
      bloodPressure: form.bloodPressure || undefined,
      heartRate: form.heartRate ? Number(form.heartRate) : undefined,
      breathsPerMin: Number(form.breathsPerMin),
      physicalActivity: form.physicalActivity || undefined,
      sleepHours: form.sleepHours ? Number(form.sleepHours) : undefined,
      stressLevel: form.stressLevel ? Number(form.stressLevel) : 3,
      ...(user && user._id ? { userId: user._id } : {}),
    };

    const clientBmi = computeBmiAndStatus(payload.height, payload.weight);
    if (clientBmi) {
      payload.bmi = clientBmi.bmi;
      payload.bmiStatus = clientBmi.bmiStatus;
    }

    setSubmitting(true);
    try {
      const res = await axios.post("/api/questionnaire", payload);

      if (role === "caregiver" && typeof refreshUser === "function") {
        try { await refreshUser(); } catch (_) {}
      }

      localStorage.setItem(
        "questionnaireData",
        JSON.stringify({
          ...form,
          bmi: payload.bmi ?? null,
          bmiStatus: payload.bmiStatus ?? "",
          savedAt: new Date().toISOString(),
          serverResponse: res?.data ?? null,
        })
      );

      navigate("/test");
    } catch (err) {
      console.error("Questionnaire submit error:", err);
      const msg = err?.response?.data?.message || err?.message || "Submit failed";
      setError(isHindi ? `सबमिट विफल: ${msg}` : `Submit failed: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-start p-6 pt-28 sm:pt-24 md:pt-24">
      <h1 className="text-3xl sm:text-4xl md:text-5xl text-yellow-400 font-bold mb-10 text-center">
        {isHindi ? "स्वास्थ्य प्रश्नावली" : "Health Questionnaire"}
      </h1>

      <form
        onSubmit={handleSubmit}
        className="bg-gray-900 p-8 rounded-2xl shadow-2xl w-full max-w-md space-y-5 mb-8"
      >
        <div>
          <label className="block mb-2 text-yellow-400 text-lg sm:text-xl font-medium">
            {isHindi ? "ऊँचाई (से.मी.)" : "Height (cm)"}
          </label>
          <input
            type="number"
            name="height"
            value={form.height}
            onChange={handleChange}
            onWheel={(e) => e.target.blur()}
            className="w-full p-3 rounded-md bg-gray-800 text-white"
            required
          />
        </div>

        <div>
          <label className="block mb-2 text-yellow-400 text-lg sm:text-xl font-medium">
            {isHindi ? "वज़न (कि.ग्रा.)" : "Weight (kg)"}
          </label>
          <input
            type="number"
            name="weight"
            value={form.weight}
            onChange={handleChange}
            onWheel={(e) => e.target.blur()}
            className="w-full p-3 rounded-md bg-gray-800 text-white"
            required
          />
        </div>

        <div>
          <label className="block mb-2 text-yellow-400 text-lg sm:text-xl font-medium">
            {isHindi ? "रक्तचाप (वैकल्पिक)" : "Blood Pressure (optional)"}
          </label>
          <input
            type="text"
            name="bloodPressure"
            value={form.bloodPressure}
            onChange={handleChange}
            className="w-full p-3 rounded-md bg-gray-800 text-white"
            placeholder={isHindi ? "उदा: 120/80" : "e.g. 120/80"}
          />
        </div>

        <div>
          <label className="block mb-2 text-yellow-400 text-lg sm:text-xl font-medium">
            {isHindi ? "हृदय गति (वैकल्पिक)" : "Heart Rate (optional)"}
          </label>
          <input
            type="number"
            name="heartRate"
            value={form.heartRate}
            onChange={handleChange}
            onWheel={(e) => e.target.blur()}
            className="w-full p-3 rounded-md bg-gray-800 text-white"
            placeholder={isHindi ? "धड़कन/मिनट" : "beats/min"}
          />
        </div>

        <div>
          <label className="block mb-2 text-yellow-400 text-lg sm:text-xl font-medium">
            {isHindi ? "1 मिनट में ली गई साँसों की संख्या" : "Number of Breaths per Minute"}
          </label>
          <input
            type="number"
            name="breathsPerMin"
            value={form.breathsPerMin}
            onChange={handleChange}
            onWheel={(e) => e.target.blur()}
            className="w-full p-3 rounded-md bg-gray-800 text-white"
            required
          />
        </div>

        <div>
          <label className="block mb-2 text-yellow-400 text-lg sm:text-xl font-medium">
            {isHindi ? "शारीरिक गतिविधि स्तर" : "Physical Activity Level"}
          </label>
          <select
            name="physicalActivity"
            value={form.physicalActivity}
            onChange={handleChange}
            className="w-full p-3 rounded-md bg-gray-800 text-white"
            required
          >
            <option value="">{isHindi ? "चुनें..." : "Select..."}</option>
            <option value="Sedentary">{isHindi ? "निष्क्रिय" : "Sedentary"}</option>
            <option value="Moderate">{isHindi ? "मध्यम" : "Moderate"}</option>
            <option value="Active">{isHindi ? "सक्रिय" : "Active"}</option>
          </select>
        </div>

        <div>
          <label className="block mb-2 text-yellow-400 text-lg sm:text-xl font-medium">
            {isHindi ? "नींद के घंटे (वैकल्पिक)" : "Sleep Hours per Day (optional)"}
          </label>
          <input
            type="number"
            name="sleepHours"
            value={form.sleepHours}
            onChange={handleChange}
            onWheel={(e) => e.target.blur()}
            className="w-full p-3 rounded-md bg-gray-800 text-white"
            placeholder={isHindi ? "उदा: 7" : "e.g. 7"}
          />
        </div>

        <div>
          <label className="block mb-2 text-yellow-400 text-lg sm:text-xl font-medium">
            {isHindi ? "तनाव स्तर (1 से 5)" : "Stress Level (1 to 5)"}
          </label>
          <input
            type="range"
            name="stressLevel"
            min="1"
            max="5"
            value={form.stressLevel}
            onChange={handleChange}
            onWheel={(e) => e.target.blur()}
            className="w-full accent-yellow-400"
          />
          <p className="text-center text-lg sm:text-xl font-medium text-yellow-300 mt-1">
            {isHindi
              ? `वर्तमान स्तर: ${form.stressLevel}`
              : `Current Level: ${form.stressLevel}`}
          </p>
        </div>

        {bmi !== null && (
          <div className="text-center text-lg sm:text-xl font-medium text-yellow-300 mt-4">
            {isHindi ? `आपका BMI: ${bmi} (${bmiStatus})` : `Your BMI: ${bmi} (${bmiStatus})`}
          </div>
        )}

        {error && <div className="text-red-400 text-center">{error}</div>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 rounded-full mt-6 text-lg transition-transform transform hover:scale-105 disabled:opacity-60"
        >
          {submitting
            ? isHindi
              ? "सबमिट कर रहे हैं..."
              : "Submitting..."
            : isHindi
            ? "जमा करें"
            : "Submit"}
        </button>
      </form>

      <button
        onClick={() => navigate("/test")}
        className="mt-4 mb-10 text-yellow-400 hover:text-yellow-300 underline"
      >
        {isHindi ? "वापस जाएं" : "Go Back"}
      </button>
    </div>
  );
}
