import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import Home from "./components/Home";
import Routines from "./components/Routines";
import Social from "./components/Social";
import Profile from "./components/Profile";
import Login from "./components/Login";
import WeeklyPlanner from "./components/WeeklyPlanner";
import Challenges from "./components/Challenges";
import Tracking from "./components/Tracking";

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tracking" element={<Tracking />} />
        <Route path="/routines" element={<Routines />} />
        <Route path="/weekly-planner" element={<WeeklyPlanner />} />
        <Route path="/challenges" element={<Challenges />} />
        <Route path="/social" element={<Social />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
