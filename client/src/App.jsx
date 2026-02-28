import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useAppContext } from "./context/AppContext";
import FullScreenLoader from "./components/FullScreenLoader.jsx";
import Navbar from "./components/Navbar.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import Signup from "./pages/Signup.jsx";
import Login from "./pages/Login.jsx";
import TestSelection from "./pages/TestSelection.jsx";
import TherapyPage from "./pages/TherapyPage.jsx";
import TestRouter from "./pages/TestRouter.jsx";
import CaregiverLogin from "./pages/CaregiverLogin.jsx";
import CaregiverDashboard from "./pages/CaregiverDashboard.jsx";
import UserReport from "./pages/UserReport.jsx";
import Questionnaire from "./pages/Questionnaire.jsx"; // ✅ New import

export default function App() {
  const { initialized, reloading } = useAppContext();

  if (reloading || !initialized) {
    return <FullScreenLoader />;
  }

  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/test" element={<TestSelection />} />
        <Route path="/test/:disease" element={<TestRouter />} />
        <Route path="/therapy/:disease" element={<TherapyPage />} />
        <Route path="/caregiver/login" element={<CaregiverLogin />} />
        <Route path="/caregiver/dashboard" element={<CaregiverDashboard />} />
        <Route path="/caregiver/report/:id" element={<UserReport />} />
        <Route path="/questionnaire" element={<Questionnaire />} />
      </Routes>
    </Router>
  );
}
