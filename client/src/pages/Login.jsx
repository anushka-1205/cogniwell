import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getLanguage } from "../utils/language";
import { useAppContext } from "../context/AppContext";

export default function Login() {
  const navigate = useNavigate();
  const { loginUser } = useAppContext();
  const [lang, setLang] = useState(getLanguage());
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const isHindi = lang === "hi";

  useEffect(() => {
    const handleLanguageChange = () => setLang(getLanguage());
    window.addEventListener("languageChange", handleLanguageChange);
    return () => window.removeEventListener("languageChange", handleLanguageChange);
  }, []);

  
  const translateError = (message) => {
    if (!isHindi) return message;

    const map = {
      "Invalid email or password": "अमान्य ईमेल या पासवर्ड",
      "Unable to connect to server. Please try again later.":
        "सर्वर से कनेक्ट नहीं हो सका। कृपया बाद में पुनः प्रयास करें।",
      "Login failed": "लॉगिन असफल हुआ",
      "Missing credentials": "ईमेल या पासवर्ड आवश्यक है",
      "User not found": "उपयोगकर्ता नहीं मिला",
    };

    
    return map[message] || message;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const response = await loginUser(form.email, form.password, navigate);
    if (!response.success) {
      setError(translateError(response.message));
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-black text-white p-4">
      <form
        className="bg-blue-900 p-10 rounded-2xl shadow-2xl w-[90%] max-w-lg"
        onSubmit={handleLogin}
      >
        <h2 className="text-4xl font-bold mb-6 text-center text-yellow-400">
          {isHindi ? "लॉगिन करें" : "Login"}
        </h2>

        {error && <p className="text-red-500 text-xl mb-4 text-center">{error}</p>}

        <input
          type="email"
          placeholder={isHindi ? "ईमेल" : "Email"}
          className="border border-gray-400 w-full p-4 mb-4 rounded-xl text-xl text-yellow-400 bg-blue-900 placeholder-yellow-300"
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <input
          type="password"
          placeholder={isHindi ? "पासवर्ड" : "Password"}
          className="border border-gray-400 w-full p-4 mb-6 rounded-xl text-xl text-yellow-400 bg-blue-900 placeholder-yellow-300"
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />

        <button className="bg-yellow-400 hover:bg-yellow-300 text-black w-full py-4 rounded-2xl text-2xl transition-all focus:ring-4 focus:ring-yellow-200">
          {isHindi ? "लॉगिन करें" : "Login"}
        </button>
      </form>
    </div>
  );
}
