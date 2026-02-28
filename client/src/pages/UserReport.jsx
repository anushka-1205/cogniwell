import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getLanguage } from "../utils/language";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-toastify";

export default function UserReport() {
  const { axios } = useAppContext();
  const { id } = useParams();
  const [lang, setLang] = useState(getLanguage());
  const isHindi = lang === "hi";
  const navigate = useNavigate();

  const [sessions, setSessions] = useState(null);
  const [questionnaires, setQuestionnaires] = useState(null);
  const [elderName, setElderName] = useState(null);

  const [openPanel, setOpenPanel] = useState(null);
  const [selectedQuestionnaireIdx, setSelectedQuestionnaireIdx] = useState(0);

  useEffect(() => {
    const handle = () => setLang(getLanguage());
    window.addEventListener("languageChange", handle);
    return () => window.removeEventListener("languageChange", handle);
  }, []);

  useEffect(() => {
    if (!id) return;

    const fetchAll = async () => {
      try {
        const { data } = await axios.get(`/api/caregiver/elder/${id}/sessions`);
        if (data?.success && Array.isArray(data.sessions)) setSessions(data.sessions);
        else if (Array.isArray(data)) setSessions(data);
        else setSessions([]);
      } catch (err) {
        console.warn("sessions fetch failed", err?.message || err);
        setSessions({ error: true });
        toast.error(isHindi ? "रिपोर्ट लाने में त्रुटि" : "Failed to load sessions");
      }

      try {
        const { data } = await axios.get(`/api/questionnaire/user/${id}`);
        let arr = [];
        if (Array.isArray(data)) arr = data;
        else if (Array.isArray(data?.questionnaires)) arr = data.questionnaires;
        else if (data?.questionnaires && !Array.isArray(data.questionnaires)) arr = [data.questionnaires];
        else if (data?.questionnaire) arr = [data.questionnaire];
        arr = arr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setQuestionnaires(arr);
        setSelectedQuestionnaireIdx(0);
      } catch (err) {
        console.warn("questionnaire fetch failed", err?.message || err);
        setQuestionnaires([]);
      }

      try {
        const eldersRes = await axios.get("/api/caregiver/elders");
        const eldersList = eldersRes?.data?.elders || eldersRes?.data?.users || [];
        const found = eldersList.find((e) => String(e._id) === String(id));
        if (found && found.name) {
          setElderName(found.name);
        }
      } catch (err) {
        console.warn("[UserReport] failed to fetch elders for name fallback:", err?.message || err);
      }
    };

    fetchAll();
  }, [id, axios, isHindi]);

  useEffect(() => {
    if (elderName) return;
    if (!Array.isArray(sessions) || sessions.length === 0) return;

    const s0 = sessions[0];
    const possible =
      s0?.user?.name ||
      s0?.userName ||
      s0?.user_name ||
      s0?.username ||
      s0?.user?.fullName ||
      null;

    if (possible) setElderName(possible);
    else console.log("[UserReport] sessions[0] has no clear name fields:", s0);
  }, [sessions, elderName]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString(isHindi ? "hi-IN" : "en-US", { day: "numeric", month: "short", year: "numeric" });
  };

  const diseaseMatches = (s, disease) => {
    if (!s) return false;
    return (s.diseaseType || "unknown") === disease;
  };

  const getDiseaseSessions = (disease, mode = null) =>
    Array.isArray(sessions)
      ? sessions.filter((s) => {
          const sameDisease = diseaseMatches(s, disease);
          if (!sameDisease) return false;
          if (!mode) return true;
          return s.mode === mode;
        })
      : [];

    const extractMetric = (s, disease, mode) => {
      const m = s.metrics || {};
      const md = m[disease] || {};

      if (mode === "therapy") {
        if (disease === "vision") {
          const therapyMetrics = m?.vision ?? m?.therapy ?? {};
          const finalThreshold = therapyMetrics?.finalThreshold ?? therapyMetrics?.threshold ?? null;
          const correct = therapyMetrics?.correctAnswers ?? therapyMetrics?.correct ?? therapyMetrics?.correctCount ?? null;
          const attempts = therapyMetrics?.attempts ?? therapyMetrics?.attemptsCount ?? therapyMetrics?.attemptsTotal ?? null;
          return {
            value: finalThreshold != null ? Number(finalThreshold) : (correct != null ? Number(correct) : (attempts != null ? Number(attempts) : null)),
            unit: finalThreshold != null ? (isHindi ? "थ्रेशहोल्ड" : "threshold") : (isHindi ? "सही" : "correct"),
            extra: finalThreshold != null ? `correct: ${correct ?? "-"}` : (attempts != null ? `attempts: ${attempts}` : null),
          };
        }

        const val = md?.time ?? md?.duration ?? s?.duration ?? null;
        const grid = md?.gridSize ?? md?.level ?? null;
        return { value: typeof val === "number" ? val : (val ? Number(val) : null), unit: isHindi ? "सेकंड" : "sec", extra: grid };
      }

      if (disease === "parkinson") {
        const mpar = md;
        const correct = mpar?.correctTaps ?? mpar?.correctTapsCount ?? mpar?.correct_taps ?? 15;
        const tps = mpar?.tapsPerSecond ?? mpar?.taps_per_second ?? mpar?.taps_per_sec ?? null;
        const rawTime = mpar?.time ?? mpar?.totalTime ?? s?.duration ?? null;

        let timeInSec = null;
        if (rawTime != null) {
          const n = Number(rawTime);
          if (!Number.isNaN(n)) {
            if (n > 1000) timeInSec = n / 1000;
            else timeInSec = n;
          }
        }

        let totalSec = null;
        if (tps && correct) {
          const tpsNum = Number(tps);
          if (!Number.isNaN(tpsNum) && tpsNum > 0) {
            totalSec = Number(correct) / tpsNum;
          }
        } else if (timeInSec != null) {
          const t = Number(timeInSec);
          if (!Number.isNaN(t)) {
            if (t < 10 && Number(correct) >= 5) {
              totalSec = t * Number(correct);
            } else {
              totalSec = t;
            }
          }
        } else if (s?.duration) {
          const d = Number(s.duration);
          if (!Number.isNaN(d)) totalSec = d;
        }

        if (totalSec == null) {
          return {
            value: typeof correct === "number" ? correct : (correct ? Number(correct) : 0),
            unit: isHindi ? "टैप्स" : "taps",
            extra: tps ? `${tps} ${isHindi ? "टैप/सेकंड" : "taps/sec"}` : null,
          };
        }

        return {
          value: Number(totalSec),
          unit: isHindi ? "सेकंड" : "sec",
          extra: null,
        };
      }

      if (disease === "dementia") {
        const val = md?.correctAnswers ?? md?.correctMatches ?? md?.matches ?? md?.score ?? null;
        const grid = md?.gridSize ?? md?.levelReached ?? md?.nBack ?? null;
        return { value: typeof val === "number" ? val : (val ? Number(val) : null), unit: isHindi ? "सही" : "correct", extra: grid };
      }

      if (disease === "vision") {
        const detection = m.vision || {};
        const therapy = m.therapy || {};
        if (mode === "detection") {
          const val = detection?.correctAnswers ?? detection?.correct ?? detection?.score ?? null;
          const attempts = detection?.attempts ?? detection?.attemptsCount ?? detection?.attemptsTotal ?? null;
          return { value: typeof val === "number" ? val : (val ? Number(val) : null), unit: isHindi ? "सही" : "correct", extra: attempts ? `attempts: ${attempts}` : null };
        }
        if (mode === "therapy") {
          const therapyMetrics = m.vision ?? m.therapy ?? {};
          const finalThreshold = therapyMetrics?.finalThreshold ?? therapyMetrics?.threshold ?? null;
          const correct = therapyMetrics?.correctAnswers ?? therapyMetrics?.correct ?? null;
          return { value: finalThreshold != null ? Number(finalThreshold) : (correct != null ? Number(correct) : null), unit: finalThreshold != null ? (isHindi ? "थ्रेशहोल्ड" : "threshold") : (isHindi ? "सही" : "correct"), extra: finalThreshold != null ? `correct: ${correct ?? "-"}` : null };
        }
      }

      const fallback = md?.value ?? md?.score ?? md?.correctAnswers ?? null;
      return { value: typeof fallback === "number" ? fallback : (fallback ? Number(fallback) : null), unit: "", extra: null };
    };


  const makeChartData = (arr, disease, mode) =>
    (arr || [])
      .filter((s) => s.mode === "therapy")
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .slice(-5)
      .map((s) => {
        const metric = extractMetric(s, disease, mode);
        return {
          name: new Date(s.createdAt).toLocaleDateString(isHindi ? "hi-IN" : "en-US", { day: "numeric", month: "short" }),
          value: metric.value ? parseFloat(Number(metric.value).toFixed(2)) : 0,
          unit: metric.unit,
          extra: metric.extra,
          rawSession: s,
        };
      });

  const togglePanel = (panel) => setOpenPanel((prev) => (prev === panel ? null : panel));

  const Card = ({ title, subtitle, onClick, active }) => (
    <button
      onClick={onClick}
      className={`w-full text-left p-6 rounded-2xl transition-shadow border ${active ? "shadow-2xl border-white/20" : "shadow-md border-white/5"} bg-blue-950 hover:scale-[1.01]`}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-yellow-400 font-semibold text-lg md:text-xl">{title}</div>
          <div className="text-gray-300 mt-1">{subtitle}</div>
        </div>
        <div className="text-gray-400 text-sm">{active ? (isHindi ? "छिपाएँ" : "Close") : (isHindi ? "खोलें" : "Open")}</div>
      </div>
    </button>
  );

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    const p = payload[0].payload;
    const unit = p.unit || "";
    const extra = p.extra;
    return (
      <div className="bg-gray-900 text-white p-2 rounded shadow">
        <div className="font-semibold">{label}</div>
        <div>{`${p.value ?? 0} ${unit}`}</div>
        {extra !== null && extra !== undefined && <div className="text-sm text-gray-300">{isHindi ? ` अतिरिक्त: ${extra}` : ` extra: ${extra}`}</div>}
      </div>
    );
  };

  if (!sessions)
    return (
      <div className="h-screen flex justify-center items-center text-yellow-400 text-3xl bg-black">
        {isHindi ? "रिपोर्ट लोड हो रही है..." : "Loading report..."}
      </div>
    );

  if (sessions?.error)
    return (
      <div className="h-screen flex justify-center items-center text-red-400 text-3xl bg-black">
        {isHindi ? "रिपोर्ट लोड करने में त्रुटि" : "Error loading report"}
      </div>
    );

  const parkinsonTherapyCount = getDiseaseSessions("parkinson", "therapy").length;
  const parkinsonDetectionCount = getDiseaseSessions("parkinson", "detection").length;
  const dementiaTherapyCount = getDiseaseSessions("dementia", "therapy").length;
  const dementiaDetectionCount = getDiseaseSessions("dementia", "detection").length;
  const visionTherapyCount = getDiseaseSessions("vision", "therapy").length;
  const visionDetectionCount = getDiseaseSessions("vision", "detection").length;
  const questionnaireCount = Array.isArray(questionnaires) ? questionnaires.length : 0;

  const parkinsonChartTherapy = makeChartData(getDiseaseSessions("parkinson", "therapy"), "parkinson", "therapy");
  const dementiaChartTherapy = makeChartData(getDiseaseSessions("dementia", "therapy"), "dementia", "therapy");
  const visionChartTherapy = makeChartData(getDiseaseSessions("vision", "therapy"), "vision", "therapy");

  const hasQuestionnaires = questionnaireCount > 0;
  const selectedQuestionnaire = hasQuestionnaires ? questionnaires[selectedQuestionnaireIdx] : null;

  return (
    <div className="min-h-screen bg-black text-white p-8 pt-24">
      <div className="max-w-6xl mx-auto mb-2 text-center">
        <h1 className="text-5xl font-bold text-yellow-400">{isHindi ? "कॉग्निवेल रिपोर्ट" : "CogniWell Report"}</h1>
        <div className="text-yellow-400 text-3xl mt-2 font-semibold">{elderName ?? "—"}</div>
        <p className="text-gray-300 mt-2">{isHindi ? "रोगी की संक्षिप्त जानकारी और रुझान" : "Summary & recent trends for the elder"}</p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card
          title={isHindi ? "पार्किंसंस" : "Parkinson's"}
          subtitle={isHindi ? `${parkinsonTherapyCount} थेरेपी • ${parkinsonDetectionCount} टेस्ट` : `${parkinsonTherapyCount} therapy • ${parkinsonDetectionCount} detection`}
          onClick={() => togglePanel("parkinson")}
          active={openPanel === "parkinson"}
        />

        <Card
          title={isHindi ? "डिमेंशिया" : "Dementia"}
          subtitle={isHindi ? `${dementiaTherapyCount} थेरेपी • ${dementiaDetectionCount} टेस्ट` : `${dementiaTherapyCount} therapy • ${dementiaDetectionCount} detection`}
          onClick={() => togglePanel("dementia")}
          active={openPanel === "dementia"}
        />

        <Card
          title={isHindi ? "दृष्टि" : "Vision"}
          subtitle={isHindi ? `${visionTherapyCount} थेरेपी • ${visionDetectionCount} टेस्ट` : `${visionTherapyCount} therapy • ${visionDetectionCount} detection`}
          onClick={() => togglePanel("vision")}
          active={openPanel === "vision"}
        />

        <Card
          title={isHindi ? "प्रश्नावली" : "Questionnaire"}
          subtitle={isHindi ? `${questionnaireCount} प्रविष्टियाँ` : `${questionnaireCount} entries`}
          onClick={() => togglePanel("questionnaire")}
          active={openPanel === "questionnaire"}
        />
      </div>

      <div className="max-w-6xl mx-auto space-y-6">
        {openPanel === "parkinson" && (
          <div className="bg-blue-950 p-6 rounded-2xl shadow-lg">
            <h2 className="text-2xl font-semibold text-yellow-400 mb-4">{isHindi ? "पार्किंसंस — हाल के सत्र" : "Parkinson's — Recent Sessions"}</h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                {parkinsonChartTherapy.length > 0 ? (
                  <div className="bg-blue-900 p-4 rounded-lg">
                    <div className="text-gray-300 mb-2">{isHindi ? "थेरेपी — पिछले 5 सत्र (समय सेकंड में)" : "Therapy — Last 5 sessions (time in sec)"}</div>
                    <div className="w-full h-48">
                      <ResponsiveContainer>
                        <LineChart data={parkinsonChartTherapy}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis dataKey="name" stroke="#ffffff" />
                          <YAxis stroke="#ffffff" tickFormatter={(v) => v.toFixed(2)} domain={["auto", "auto"]} />
                          <Tooltip content={<CustomTooltip />} />
                          <Line type="monotone" dataKey="value" stroke="#facc15" strokeWidth={2} dot={{ r: 3, fill: "#facc15" }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-400">{isHindi ? "कोई थेरेपी सत्र नहीं।" : "No therapy sessions."}</div>
                )}
              </div>

              <div>
                {getDiseaseSessions("parkinson", "therapy").length > 0 && (
                  <>
                    <div className="text-gray-300 mb-2 font-semibold">{isHindi ? "थेरेपी सत्र" : "Therapy Sessions"}</div>
                    {getDiseaseSessions("parkinson", "therapy")
                      .slice()
                      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                      .slice(0, 5)
                      .map((s) => {
                        const metric = extractMetric(s, "parkinson", "therapy");
                        return (
                          <div key={s._id ?? s.createdAt} className="bg-blue-900 p-3 rounded-md mb-3 border border-white/10">
                            <div className="flex justify-between">
                              <div className="font-medium text-lg">{s.mode === "therapy" ? (isHindi ? "थेरेपी" : "Therapy") : (isHindi ? "परीक्षण" : "Detection")}</div>
                              <div className={`font-bold ${s.result === "Green" ? "text-green-400" : s.result === "Yellow" ? "text-yellow-400" : "text-red-400"}`}>
                                {isHindi ? (s.result === "Green" ? "सामान्य" : s.result === "Yellow" ? "मध्य" : "उच्च") : s.result}
                              </div>
                            </div>
                            <div className="text-gray-300 mt-1">🕒 {isHindi ? "समय" : "Time"}: {metric.value ?? 0} {metric.unit}</div>
                            {metric.extra && <div className="text-gray-300">🔲 {isHindi ? "ग्रिड/लेवल" : "Grid/Level"}: {metric.extra}</div>}
                            <div className="text-gray-300">📅 {formatDate(s.createdAt)}</div>
                          </div>
                        );
                      })}
                  </>
                )}

                {getDiseaseSessions("parkinson", "detection").length > 0 && (
                  <>
                    <div className="text-gray-300 mb-2 font-semibold mt-4">{isHindi ? "परीक्षण (Detection) सत्र" : "Detection Sessions"}</div>
                    {getDiseaseSessions("parkinson", "detection")
                      .slice()
                      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                      .slice(0, 10)
                      .map((s) => {
                        const metric = extractMetric(s, "parkinson", "detection");
                        return (
                          <div key={s._id ?? s.createdAt} className="bg-blue-900 p-3 rounded-md mb-3 border border-white/10">
                            <div className="flex justify-between">
                              <div className="font-medium text-lg">{isHindi ? "परीक्षण" : "Detection"}</div>
                              <div className={`font-bold ${s.result === "Green" ? "text-green-400" : s.result === "Yellow" ? "text-yellow-400" : "text-red-400"}`}>
                                {isHindi ? (s.result === "Green" ? "सामान्य" : s.result === "Yellow" ? "मध्य" : "उच्च") : s.result}
                              </div>
                            </div>
                            <div className="text-gray-300 mt-1">👆 {isHindi ? "सही टैप्स" : "Correct taps"}: {metric.value ?? 0} {metric.unit}</div>
                            {metric.extra && <div className="text-gray-300">⚡ {metric.extra}</div>}
                            <div className="text-gray-300">📅 {formatDate(s.createdAt)}</div>
                          </div>
                        );
                      })}
                  </>
                )}
              </div>
            </div>
            <div className="max-w-6xl mx-auto mt-10 text-center">
              <p className="text-gray-400 text-sm italic">
                {isHindi
                  ? "यह रिपोर्ट केवल एक प्रारंभिक मूल्यांकन है और इसे चिकित्सीय निदान नहीं माना जाना चाहिए। आगे की सिफारिशों के लिए कृपया किसी योग्य स्वास्थ्य विशेषज्ञ से परामर्श करें।"
                  : "This report is intended for preliminary assessment and should not be considered a medical diagnosis. Please consult a qualified healthcare professional for further recommendations."}
              </p>
            </div>
          </div>
        )}

        {openPanel === "dementia" && (
          <div className="bg-blue-950 p-6 rounded-2xl shadow-lg">
            <h2 className="text-2xl font-semibold text-yellow-400 mb-4">{isHindi ? "डिमेंशिया — हाल के सत्र" : "Dementia — Recent Sessions"}</h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                {dementiaChartTherapy.length > 0 ? (
                  <div className="bg-blue-900 p-4 rounded-lg">
                    <div className="text-gray-300 mb-2">{isHindi ? "थेरेपी — पिछले 5 सत्र (समय सेकंड में)" : "Therapy — Last 5 sessions (time in sec)"}</div>
                    <div className="w-full h-48">
                      <ResponsiveContainer>
                        <LineChart data={dementiaChartTherapy}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis dataKey="name" stroke="#ffffff" />
                          <YAxis stroke="#ffffff" tickFormatter={(v) => v.toFixed(2)} />
                          <Tooltip content={<CustomTooltip />} />
                          <Line type="monotone" dataKey="value" stroke="#facc15" strokeWidth={2} dot={{ r: 3, fill: "#facc15" }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-400">{isHindi ? "कोई थेरेपी सत्र नहीं।" : "No therapy sessions."}</div>
                )}
              </div>

              <div>
                {getDiseaseSessions("dementia", "therapy").length > 0 && (
                  <>
                    <div className="text-gray-300 mb-2 font-semibold">{isHindi ? "थेरेपी सत्र" : "Therapy Sessions"}</div>
                    {getDiseaseSessions("dementia", "therapy")
                      .slice()
                      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                      .slice(0, 5)
                      .map((s) => {
                        const metric = extractMetric(s, "dementia", "therapy");
                        return (
                          <div key={s._id ?? s.createdAt} className="bg-blue-900 p-3 rounded-md mb-3 border border-white/10">
                            <div className="flex justify-between">
                              <div className="font-medium text-lg">{s.mode === "therapy" ? (isHindi ? "थेरेपी" : "Therapy") : (isHindi ? "परीक्षण" : "Detection")}</div>
                              <div className={`font-bold ${s.result === "Green" ? "text-green-400" : s.result === "Yellow" ? "text-yellow-400" : "text-red-400"}`}>
                                {isHindi ? (s.result === "Green" ? "सामान्य" : s.result === "Yellow" ? "मध्य" : "उच्च") : s.result}
                              </div>
                            </div>
                            <div className="text-gray-300 mt-1">🕒 {isHindi ? "समय" : "Time"}: {metric.value ?? 0} {metric.unit}</div>
                            {metric.extra && <div className="text-gray-300">🔲 {isHindi ? "ग्रिड/लेवल" : "Grid/Level"}: {metric.extra}</div>}
                            <div className="text-gray-300">📅 {formatDate(s.createdAt)}</div>
                          </div>
                        );
                      })}
                  </>
                )}

                {getDiseaseSessions("dementia", "detection").length > 0 && (
                  <>
                    <div className="text-gray-300 mb-2 font-semibold mt-4">{isHindi ? "परीक्षण (Detection) सत्र" : "Detection Sessions"}</div>
                    {getDiseaseSessions("dementia", "detection")
                      .slice()
                      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                      .slice(0, 10)
                      .map((s) => {
                        const metric = extractMetric(s, "dementia", "detection");
                        return (
                          <div key={s._id ?? s.createdAt} className="bg-blue-900 p-3 rounded-md mb-3 border border-white/10">
                            <div className="flex justify-between">
                              <div className="font-medium text-lg">{isHindi ? "परीक्षण" : "Detection"}</div>
                              <div className={`font-bold ${s.result === "Green" ? "text-green-400" : s.result === "Yellow" ? "text-yellow-400" : "text-red-400"}`}>
                                {isHindi ? (s.result === "Green" ? "सामान्य" : s.result === "Yellow" ? "मध्य" : "उच्च") : s.result}
                              </div>
                            </div>
                            <div className="text-gray-300 mt-1">✅ {isHindi ? "सही उत्तर" : "Correct"}: {metric.value ?? 0} {metric.unit}</div>
                            {metric.extra && <div className="text-gray-300">🔢 {isHindi ? "ग्रिड/N-बैक" : "Grid/N-back"}: {metric.extra}</div>}
                            <div className="text-gray-300">📅 {formatDate(s.createdAt)}</div>
                          </div>
                        );
                      })}
                  </>
                )}
              </div>
            </div>
            <div className="max-w-6xl mx-auto mt-10 text-center">
              <p className="text-gray-400 text-sm italic">
                {isHindi
                  ? "यह रिपोर्ट केवल एक प्रारंभिक मूल्यांकन है और इसे चिकित्सीय निदान नहीं माना जाना चाहिए। आगे की सिफारिशों के लिए कृपया किसी योग्य स्वास्थ्य विशेषज्ञ से परामर्श करें।"
                  : "This report is intended for preliminary assessment and should not be considered a medical diagnosis. Please consult a qualified healthcare professional for further recommendations."}
              </p>
            </div>
          </div>
        )}

        {openPanel === "vision" && (
          <div className="bg-blue-950 p-6 rounded-2xl shadow-lg">
            <h2 className="text-2xl font-semibold text-yellow-400 mb-4">{isHindi ? "दृष्टि — हाल के सत्र" : "Vision — Recent Sessions"}</h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                {visionChartTherapy.length > 0 ? (
                  <div className="bg-blue-900 p-4 rounded-lg">
                    <div className="text-gray-300 mb-2">{isHindi ? "थेरेपी — पिछले 5 सत्र" : "Therapy — Last 5 sessions"}</div>
                    <div className="w-full h-48">
                      <ResponsiveContainer>
                        <LineChart data={visionChartTherapy}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis dataKey="name" stroke="#ffffff" />
                          <YAxis stroke="#ffffff" tickFormatter={(v) => v.toFixed(2)} />
                          <Tooltip content={<CustomTooltip />} />
                          <Line type="monotone" dataKey="value" stroke="#facc15" strokeWidth={2} dot={{ r: 3, fill: "#facc15" }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-400">{isHindi ? "कोई थेरेपी सत्र नहीं।" : "No therapy sessions."}</div>
                )}
              </div>

              <div>
                {getDiseaseSessions("vision", "therapy").length > 0 && (
                  <>
                    <div className="text-gray-300 mb-2 font-semibold">{isHindi ? "थेरेपी सत्र" : "Therapy Sessions"}</div>
                    {getDiseaseSessions("vision", "therapy")
                      .slice()
                      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                      .slice(0, 5)
                      .map((s) => {
                        const metric = extractMetric(s, "vision", "therapy");
                        return (
                          <div key={s._id ?? s.createdAt} className="bg-blue-900 p-3 rounded-md mb-3 border border-white/10">
                            <div className="flex justify-between">
                              <div className="font-medium text-lg">{s.mode === "therapy" ? (isHindi ? "थेरेपी" : "Therapy") : (isHindi ? "परीक्षण" : "Detection")}</div>
                              <div className={`font-bold ${s.result === "Green" ? "text-green-400" : s.result === "Yellow" ? "text-yellow-400" : "text-red-400"}`}>
                                {isHindi ? (s.result === "Green" ? "सामान्य" : s.result === "Yellow" ? "मध्य" : "उच्च") : s.result}
                              </div>
                            </div>
                            <div className="text-gray-300 mt-1">✅ {metric.unit.charAt(0).toUpperCase() + metric.unit.slice(1)}: {metric.value ?? 0}</div>

                            {metric.extra && <div className="text-gray-300">🔢 {metric.extra}</div>}
                            <div className="text-gray-300">📅 {formatDate(s.createdAt)}</div>
                          </div>
                        );
                      })}
                  </>
                )}

                {getDiseaseSessions("vision", "detection").length > 0 && (
                  <>
                    <div className="text-gray-300 mb-2 font-semibold mt-4">{isHindi ? "परीक्षण (Detection) सत्र" : "Detection Sessions"}</div>
                    {getDiseaseSessions("vision", "detection")
                      .slice()
                      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                      .slice(0, 10)
                      .map((s) => {
                        const metric = extractMetric(s, "vision", "detection");
                        return (
                          <div key={s._id ?? s.createdAt} className="bg-blue-900 p-3 rounded-md mb-3 border border-white/10">
                            <div className="flex justify-between">
                              <div className="font-medium text-lg">{isHindi ? "परीक्षण" : "Detection"}</div>
                              <div className={`font-bold ${s.result === "Green" ? "text-green-400" : s.result === "Yellow" ? "text-yellow-400" : "text-red-400"}`}>
                                {isHindi ? (s.result === "Green" ? "सामान्य" : s.result === "Yellow" ? "मध्य" : "उच्च") : s.result}
                              </div>
                            </div>
                            <div className="text-gray-300 mt-1">✅ {isHindi ? "सही उत्तर" : "Correct"}: {metric.value ?? 0} {metric.unit}</div>
                            {metric.extra && <div className="text-gray-300">🔢 {metric.extra}</div>}
                            <div className="text-gray-300">📅 {formatDate(s.createdAt)}</div>
                          </div>
                        );
                      })}
                  </>
                )}
              </div>
            </div>
            <div className="max-w-6xl mx-auto mt-10 text-center">
              <p className="text-gray-400 text-sm italic">
                {isHindi
                  ? "यह रिपोर्ट केवल एक प्रारंभिक मूल्यांकन है और इसे चिकित्सीय निदान नहीं माना जाना चाहिए। आगे की सिफारिशों के लिए कृपया किसी योग्य स्वास्थ्य विशेषज्ञ से परामर्श करें।"
                  : "This report is intended for preliminary assessment and should not be considered a medical diagnosis. Please consult a qualified healthcare professional for further recommendations."}
              </p>
            </div>
          </div>
        )}

        {openPanel === "questionnaire" && (
          <div className="bg-blue-950 p-6 rounded-2xl shadow-lg">
            <h2 className="text-2xl font-semibold text-yellow-400 mb-4">{isHindi ? "प्रश्नावली" : "Questionnaire"}</h2>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2 bg-blue-900 p-4 rounded-lg">
                {hasQuestionnaires ? (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="text-gray-300">{isHindi ? "नवीनतम प्रश्नावली" : "Latest Questionnaire"}</div>
                        <div className="text-2xl font-bold text-yellow-400">{selectedQuestionnaire?.bmi ?? "-"}</div>
                        <div className="text-gray-300">{selectedQuestionnaire?.bmiStatus ?? "-"}</div>
                      </div>
                      <div className="text-gray-300 text-sm">{selectedQuestionnaire?.createdAt ? formatDate(selectedQuestionnaire.createdAt) : "-"}</div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-gray-300">
                      <div>
                        <div className="text-sm text-gray-400">{isHindi ? "रक्तचाप" : "Blood Pressure"}</div>
                        <div className="font-medium">{selectedQuestionnaire?.bloodPressure ?? "-"}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">{isHindi ? "हृदय गति" : "Heart Rate"}</div>
                        <div className="font-medium">{selectedQuestionnaire?.heartRate ?? "-"}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">{isHindi ? "साँस/मिनट" : "Breaths/min"}</div>
                        <div className="font-medium">{selectedQuestionnaire?.breathsPerMin ?? "-"}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">{isHindi ? "नींद घंटे" : "Sleep Hours"}</div>
                        <div className="font-medium">{selectedQuestionnaire?.sleepHours ?? "-"}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">{isHindi ? "शारीरिक गतिविधि" : "Physical Activity"}</div>
                        <div className="font-medium">{selectedQuestionnaire?.physicalActivity ?? "-"}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">{isHindi ? "तनाव स्तर" : "Stress Level"}</div>
                        <div className="font-medium">{selectedQuestionnaire?.stressLevel ?? "-"}</div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-gray-400">{isHindi ? "कोई प्रश्नावली उपलब्ध नहीं।" : "No questionnaire available."}</div>
                )}
                
              </div>

              <div className="bg-blue-900 p-4 rounded-lg">
                <div className="text-gray-300 mb-3 font-semibold">{isHindi ? "सभी प्रश्नावली" : "All Questionnaires"}</div>
                {!hasQuestionnaires && <div className="text-gray-400">{isHindi ? "कोई प्रविष्टि नहीं" : "No entries"}</div>}

                {hasQuestionnaires && (
                  <div className="space-y-2 max-h-56 overflow-auto pr-2">
                    {questionnaires.map((q, idx) => (
                      <button
                        key={q._id ?? q.createdAt ?? idx}
                        onClick={() => setSelectedQuestionnaireIdx(idx)}
                        className={`w-full text-left p-2 rounded-md transition-colors ${idx === selectedQuestionnaireIdx ? "bg-white/5 border border-white/10" : "hover:bg-white/2"}`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="text-sm text-gray-300">{new Date(q.createdAt).toLocaleString(isHindi ? "hi-IN" : "en-US", { day: "numeric", month: "short", year: "numeric" })}</div>
                            <div className="text-sm font-medium">{q.bmi ? `${q.bmi} ${q.bmiStatus ? `(${q.bmiStatus})` : ""}` : "BMI -"} </div>
                          </div>
                          <div className="text-sm text-gray-400">{q.physicalActivity ?? "-"}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
            </div>
            <div className="max-w-6xl mx-auto mt-10 text-center">
              <p className="text-gray-400 text-sm italic">
                {isHindi
                  ? "यह रिपोर्ट केवल एक प्रारंभिक मूल्यांकन है और इसे चिकित्सीय निदान नहीं माना जाना चाहिए। आगे की सिफारिशों के लिए कृपया किसी योग्य स्वास्थ्य विशेषज्ञ से परामर्श करें।"
                  : "This report is intended for preliminary assessment and should not be considered a medical diagnosis. Please consult a qualified healthcare professional for further recommendations."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
