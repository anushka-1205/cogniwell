import { useState, useEffect } from "react";
import { useAppContext } from "../context/AppContext";
import { getLanguage } from "../utils/language";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function CaregiverDashboard() {
  const { axios } = useAppContext();
  const navigate = useNavigate();
  const [lang, setLang] = useState(getLanguage());
  const [elders, setElders] = useState([]);
  const [search, setSearch] = useState("");
  const isHindi = lang === "hi";

  useEffect(() => {
    const handleLanguageChange = () => setLang(getLanguage());
    window.addEventListener("languageChange", handleLanguageChange);
    return () => window.removeEventListener("languageChange", handleLanguageChange);
  }, []);

  useEffect(() => {
    const fetchElders = async () => {
      try {
        const { data } = await axios.get("/api/caregiver/elders");
        const list = data.elders || data.users || [];

        if (data.success && list.length > 0) {
          setElders(list);
        } else {
          setElders([]);
          console.warn("No elders found");
        }
      } catch (err) {
        console.error("Failed to fetch elders:", err);
      }
    };
    fetchElders();
  }, []);

  const filtered = elders.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black text-white p-8 pt-24">
      {/* Heading */}
      <h1 className="text-4xl md:text-5xl font-bold text-center text-yellow-400 mb-10">
        {isHindi ? "केयरगिवर डैशबोर्ड" : "Caregiver Dashboard"}
      </h1>

      {/* Search Bar (Optional) */}
      {/* 
      <div className="flex justify-center mb-8">
        <input
          type="text"
          placeholder={isHindi ? "मरीज खोजें..." : "Search patients..."}
          className="w-full max-w-md p-3 rounded-xl text-black text-xl"
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      */}

      {/* Elder Cards */}
      {filtered.length === 0 ? (
        <p className="text-center text-xl text-gray-400">
          {isHindi ? "कोई मरीज नहीं मिला" : "No matching patients found"}
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-10">
          {filtered.map((elder) => (
            <div
              key={elder._id}
              className="bg-blue-950 p-6 rounded-2xl shadow-xl flex flex-col items-center text-center"
            >
              <h2 className="text-2xl font-semibold text-yellow-300 mb-3">
                {elder.name}
              </h2>
              <p className="text-gray-300 mb-2">
                {isHindi ? "आयु:" : "Age:"} {elder.age}
              </p>
              <button
                onClick={() => navigate(`/caregiver/report/${elder._id}`)}
                className="bg-yellow-400 hover:bg-yellow-300 text-black px-6 py-3 rounded-xl font-semibold mt-3 transition duration-200"
              >
                {isHindi ? "रिपोर्ट देखें" : "View Report"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
