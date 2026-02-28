import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getLanguage } from "../utils/language";
import { useAppContext } from "../context/AppContext";

export default function Signup() {
  const navigate = useNavigate();
  const { signup, axios } = useAppContext();

  const [lang, setLang] = useState(getLanguage());
  const [role, setRole] = useState("user");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    age: "",
    gender: "",
    caregiverEmail: "",
    parkinsons: "no",
    dementia: "no",
    vision: "no",
  });
  const [error, setError] = useState("");

  const isHindi = lang === "hi";

  useEffect(() => {
    const handleLanguageChange = () => setLang(getLanguage());
    window.addEventListener("languageChange", handleLanguageChange);
    return () =>
      window.removeEventListener("languageChange", handleLanguageChange);
  }, []);

  const translateError = (message) => {
    if (!isHindi) return message;
    const map = {
      "Email already exists": "यह ईमेल पहले से पंजीकृत है",
      "User already exists": "यह उपयोगकर्ता पहले से मौजूद है",
      "Missing required details": "कृपया सभी आवश्यक विवरण भरें",
      "Signup failed": "पंजीकरण असफल हुआ",
      "Age cannot exceed 125": "आयु 125 से अधिक नहीं हो सकती",
      "Unable to connect to server. Please try again later.":
        "सर्वर से कनेक्ट नहीं हो सका। कृपया बाद में पुनः प्रयास करें।",
      "Invalid email address": "कृपया सही ईमेल दर्ज करें",
      "Password must be at least 8 characters long": "पासवर्ड कम से कम 8 अक्षरों का होना चाहिए",
      "Password must contain at least one uppercase letter": "पासवर्ड में कम से कम एक बड़ा अक्षर होना चाहिए",
    };
    return map[message] || message;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.email.includes("@")) {
      setError(translateError("Invalid email address"));
      return;
    }

    if (form.password.length < 8) {
      setError(translateError("Password must be at least 8 characters long"));
      return;
    }

    if (!/[A-Z]/.test(form.password)) {
      setError(translateError("Password must contain at least one uppercase letter"));
      return;
    }

    if (role === "user" && Number(form.age) > 125) {
      setError(translateError("Age cannot exceed 125"));
      return;
    }

    if (role === "user") {
      const response = await signup(form, navigate);
      if (!response.success) setError(translateError(response.message));
    } else {
      try {
        const { data } = await axios.post("/api/caregiver/register", form);
        if (data.success) navigate("/caregiver/login");
        else setError(translateError(data.message));
      } catch (err) {
        const msg =
          err.response?.data?.message ||
          "Unable to connect to server. Please try again later.";
        setError(translateError(msg));
      }
    }
  };

  const toggleRole = () => {
    setRole((prev) => (prev === "user" ? "caregiver" : "user"));
    setError("");
  };

  const preventScrollChange = (e) => e.target.blur();

  return (
    <div className="flex items-center justify-center min-h-screen bg-black text-white p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-blue-950 p-10 rounded-2xl shadow-2xl w-[90%] max-w-lg"
      >
        <h2 className="text-4xl font-bold mb-6 text-center text-yellow-400">
          {role === "user"
            ? isHindi ? "यूज़र साइन अप" : "User Signup"
            : isHindi ? "केयरगिवर साइन अप" : "Caregiver Signup"}
        </h2>

        {error && <p className="text-red-500 text-xl mb-4 text-center">{error}</p>}

        {["name", "email", "password"].map((field) => (
          <input
            key={field}
            type={field === "password" ? "password" : "text"}
            placeholder={
              isHindi
                ? field === "name"
                  ? "नाम"
                  : field === "email"
                  ? "ईमेल"
                  : "पासवर्ड"
                : field.charAt(0).toUpperCase() + field.slice(1)
            }
            className="border border-gray-400 w-full p-4 mb-4 rounded-xl text-xl text-yellow-400 bg-blue-900 placeholder-yellow-300"
            onChange={(e) => setForm({ ...form, [field]: e.target.value })}
            required
          />
        ))}

        {role === "user" && (
          <>
            <input
              type="number"
              placeholder={isHindi ? "आयु" : "Age"}
              className="border border-gray-400 w-full p-4 mb-4 rounded-xl text-xl text-yellow-400 bg-blue-900 placeholder-yellow-300"
              onWheel={preventScrollChange}
              onChange={(e) => setForm({ ...form, age: e.target.value })}
              required
            />

            <select
              className="border border-gray-400 w-full p-4 mb-4 rounded-xl text-xl text-yellow-400 bg-blue-900"
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
              required
            >
              <option value="">{isHindi ? "लिंग चुनें" : "Select Gender"}</option>
              <option value="Male">{isHindi ? "पुरुष" : "Male"}</option>
              <option value="Female">{isHindi ? "महिला" : "Female"}</option>
              <option value="Other">{isHindi ? "अन्य" : "Other"}</option>
            </select>

            <input
              type="email"
              placeholder={isHindi ? "केयरगिवर ईमेल" : "Caregiver Email"}
              className="border border-gray-400 w-full p-4 mb-4 rounded-xl text-xl text-yellow-400 bg-blue-900 placeholder-yellow-300"
              onChange={(e) =>
                setForm({ ...form, caregiverEmail: e.target.value })
              }
              required
            />

            <div className="flex flex-col gap-4 mb-4">
              <label className="text-xl text-white">
                {isHindi ? "क्या आपको पार्किंसंस है?" : "Do you have Parkinson’s?"}
              </label>
              <select
                className="border border-gray-400 p-3 rounded-xl text-xl text-yellow-400 bg-blue-900"
                onChange={(e) => setForm({ ...form, parkinsons: e.target.value })}
              >
                <option value="no">{isHindi ? "नहीं" : "No"}</option>
                <option value="yes">{isHindi ? "हाँ" : "Yes"}</option>
              </select>

              <label className="text-xl text-white">
                {isHindi ? "क्या आपको डिमेंशिया है?" : "Do you have Dementia?"}
              </label>
              <select
                className="border border-gray-400 p-3 rounded-xl text-xl text-yellow-400 bg-blue-900"
                onChange={(e) => setForm({ ...form, dementia: e.target.value })}
              >
                <option value="no">{isHindi ? "नहीं" : "No"}</option>
                <option value="yes">{isHindi ? "हाँ" : "Yes"}</option>
              </select>

              <label className="text-xl text-white">
                {isHindi ? "क्या आपको दृष्टि संबंधी समस्या है?" : "Do you have vision problems?"}
              </label>
              <select
                className="border border-gray-400 p-3 rounded-xl text-xl text-yellow-400 bg-blue-900"
                onChange={(e) =>
                  setForm({ ...form, vision: e.target.value })
                }
              >
                <option value="no">{isHindi ? "नहीं" : "No"}</option>
                <option value="yes">{isHindi ? "हाँ" : "Yes"}</option>
              </select>
            </div>
          </>
        )}

        <button className="bg-yellow-400 hover:bg-yellow-300 text-black w-full py-4 rounded-2xl text-2xl transition-all focus:ring-4 focus:ring-yellow-200">
          {role === "user"
            ? isHindi ? "यूज़र रजिस्टर करें" : "Register as User"
            : isHindi ? "केयरगिवर रजिस्टर करें" : "Register as Caregiver"}
        </button>

        <p className="text-center mt-4 text-xl text-yellow-400">
          {isHindi ? "पहले से खाता है?" : "Already have an account?"}{" "}
          <span
            onClick={() =>
              navigate(role === "user" ? "/login" : "/caregiver/login")
            }
            className="underline cursor-pointer hover:text-yellow-300"
          >
            {isHindi ? "यहाँ लॉगिन करें" : "Login here"}
          </span>
        </p>

        <p className="text-center mt-3 text-lg text-gray-300">
          {role === "user"
            ? isHindi
              ? "केयरगिवर हैं?"
              : "Are you a caregiver?"
            : isHindi
            ? "यूज़र हैं?"
            : "Are you a user?"}{" "}
          <span
            onClick={toggleRole}
            className="underline cursor-pointer hover:text-yellow-300"
          >
            {isHindi ? "यहाँ स्विच करें" : "Switch here"}
          </span>
        </p>
      </form>
    </div>
  );
}
