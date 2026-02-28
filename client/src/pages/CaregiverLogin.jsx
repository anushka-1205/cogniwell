import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getLanguage } from "../utils/language";
import { useAppContext } from "../context/AppContext";

export default function CaregiverLogin() {
  const navigate = useNavigate();
  const { loginCaregiver } = useAppContext();

  const [lang, setLang] = useState(getLanguage());
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const isHindi = lang === "hi";

  useEffect(() => {
    const handleLanguageChange = () => setLang(getLanguage());
    window.addEventListener("languageChange", handleLanguageChange);
    return () => window.removeEventListener("languageChange", handleLanguageChange);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const response = await loginCaregiver(form.email, form.password, navigate);
    if (!response.success) {
      setError(
        isHindi
          ? "अमान्य ईमेल या पासवर्ड। कृपया पुनः प्रयास करें।"
          : response.message || "Invalid email or password. Please try again."
      );
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-black text-white p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-blue-950 p-10 rounded-2xl shadow-2xl w-[90%] max-w-md"
      >
        <h2 className="text-4xl font-bold mb-6 text-center text-yellow-400">
          {isHindi ? "केयरगिवर लॉगिन" : "Caregiver Login"}
        </h2>

        {error && (
          <p className="text-red-500 text-xl mb-4 text-center transition-all duration-200">
            {error}
          </p>
        )}

        <input
          type="email"
          placeholder={isHindi ? "ईमेल" : "Email"}
          className="border border-gray-400 w-full p-4 mb-4 rounded-xl text-xl 
                     text-yellow-400 bg-blue-900 placeholder-yellow-300 focus:outline-none"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />

        <input
          type="password"
          placeholder={isHindi ? "पासवर्ड" : "Password"}
          className="border border-gray-400 w-full p-4 mb-4 rounded-xl text-xl 
                     text-yellow-400 bg-blue-900 placeholder-yellow-300 focus:outline-none"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />

        <button
          type="submit"
          className="bg-yellow-400 hover:bg-yellow-300 text-black w-full py-4 
                     rounded-2xl text-2xl font-semibold transition-all focus:ring-4 
                     focus:ring-yellow-200"
        >
          {isHindi ? "लॉगिन करें" : "Login"}
        </button>

        <p className="text-center mt-4 text-lg text-gray-300">
          {isHindi ? "नया केयरगिवर?" : "New caregiver?"}{" "}
          <span
            onClick={() => navigate("/signup")}
            className="underline cursor-pointer hover:text-yellow-300"
          >
            {isHindi ? "साइन अप करें" : "Sign up here"}
          </span>
        </p>
      </form>
    </div>
  );
}
