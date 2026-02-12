import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Navbar from "./components/Navbar";

// Common pages
import LandingPage from "./pages/HomePage";
import NotFound from "./pages/NotFound";

// Recruiter pages
import RecruiterLogin from "./pages/recruiter/RecruiterLogin";
import RecruiterRegister from "./pages/recruiter/RecruiterRegister";
import RecruiterDashboardNew from "./pages/recruiter/RecruiterDashboardNew";
import PostJobPage from "./pages/recruiter/PostJobPage";
import CandidateRankingPage from "./pages/recruiter/CandidateRankingPage";
import JobApplicationsPage from "./pages/recruiter/JobApplicationsPage";

// Student pages
import StudentLogin from "./pages/student/StudentLogin";
import StudentRegister from "./pages/student/StudentRegister";
import StudentDashboardNew from "./pages/student/StudentDashboardNew";
import ProfileSetupPage from "./pages/student/ProfileSetupPage";
import JobListingsPage from "./pages/student/JobListingsPage";
import JobDetailPage from "./pages/student/JobDetailPage";
import ApplicationsPage from "./pages/student/ApplicationsPage";
import EligibilityCheckPage from "./pages/EligibilityCheckPage";
import StudentIntelligencePage from "./pages/student/StudentIntelligencePage";
import StudentProfilePage from "./pages/student/StudentProfilePage";
import RoadmapViewerPage from "./pages/RoadmapViewerPage";

// Legacy pages (for skill gap and eligibility - reused)
import SkillGapAnalyzer from "./pages/SkillGapAnalyzer";
import StudentDashboard from "./pages/StudentDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="min-h-screen bg-background">
            <Navbar />
            <Routes>
              {/* Landing Page */}
              <Route path="/" element={<LandingPage />} />

              {/* Recruiter Routes */}
              <Route path="/recruiter/login" element={<RecruiterLogin />} />
              <Route path="/recruiter/register" element={<RecruiterRegister />} />
              <Route path="/recruiter/dashboard" element={<RecruiterDashboardNew />} />
              <Route path="/recruiter/post-job" element={<PostJobPage />} />
              <Route path="/recruiter/jobs/:jobId/rank" element={<CandidateRankingPage />} />
              <Route path="/recruiter/jobs/:jobId/applications" element={<JobApplicationsPage />} />

              {/* Student Routes */}
              <Route path="/student/login" element={<StudentLogin />} />
              <Route path="/student/register" element={<StudentRegister />} />
              <Route path="/student/dashboard" element={<StudentDashboardNew />} />
              <Route path="/student/profile-setup" element={<ProfileSetupPage />} />
              <Route path="/student/jobs" element={<JobListingsPage />} />
              <Route path="/student/jobs/:jobId" element={<JobDetailPage />} />
              <Route path="/student/jobs/:jobId/eligibility" element={<EligibilityCheckPage />} />
              <Route path="/student/jobs/:jobId/roadmap" element={<RoadmapViewerPage />} />
              <Route path="/student/applications" element={<ApplicationsPage />} />
              <Route path="/student/skill-gap" element={<SkillGapAnalyzer />} />
              <Route path="/student/intelligence" element={<StudentIntelligencePage />} />
              <Route path="/student/profile" element={<StudentProfilePage />} />

              {/* Legacy redirects */}
              <Route path="/recruiter" element={<Navigate to="/recruiter/login" replace />} />
              <Route path="/student" element={<Navigate to="/student/login" replace />} />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
