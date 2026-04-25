import { BrowserRouter as Router, Routes, Route } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Notes from "./pages/Notes/Notes";
import Home from "./pages/Dashboard/Home";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import { AuthProvider } from "./context/AuthContext";
import GoogleCallback from "./pages/AuthPages/google-callback";
import ApprovalPending from "./pages/OtherPage/ApprovalPending";
import AppBootstrap from "./components/common/AppBootstrap";
import AdminPage from "./pages/Admin/AdminPage";
import RequireRole from "./components/auth/RequireRole";
import AttendancePage from "./pages/Attendance/AttendancePage";
import SchedulePage from "./pages/Schedule/SchedulePage";
import AcademyGallery from "./pages/AcademyGallery/AcademyGallery";
import { ToastProvider } from "./context/ToastContext";
import ToastContainer from "./components/ui/Toast";
import ReferralGraph from "./pages/Admin/ReferralGraph";

export default function App() {
  return (
    <>
      <Router>
        <ToastProvider>
          <AuthProvider>
            <ScrollToTop />
            <AppBootstrap>
              <Routes>
                {/* Dashboard Layout */}
                <Route element={<AppLayout />}>

                  <Route index path="/" element={<Home />} />
                  <Route path="/profile" element={<UserProfiles />} />

                  {/* Notes */}
                  <Route path="/notes" element={<Notes />} />

                  {/* Academy Gallery */}
                  <Route path="/academy-gallery" element={<AcademyGallery />} />

                  {/* Admin */}
                  <Route
                    path="/admin"
                    element={
                      <RequireRole allowedRoles={["admin"]}>
                        <AdminPage />
                      </RequireRole>
                    }
                  />

                  {/* Referral Graph */}
                  +                  <Route path="/referral-graph" element={<RequireRole allowedRoles={["admin"]}>
                    <ReferralGraph />
                  </RequireRole>} />

                  {/* Attendance */}
                  <Route
                    path="/attendance"
                    element={
                      <RequireRole allowedRoles={["admin", "mentor", "coach"]}>
                        <AttendancePage />
                      </RequireRole>
                    }
                  />
                {/* Schedule */}
                <Route
                  path="/schedule"
                  element={
                    <RequireRole allowedRoles={["admin", "mentor", "coach"]}>
                      <SchedulePage />
                    </RequireRole>
                  }
                />

              </Route>

                {/* Auth Layout */}
                <Route path="/signin" element={<SignIn />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/oauth/google-callback" element={<GoogleCallback />} />
                <Route path="/pending-approval" element={<ApprovalPending />} />

                {/* Fallback Route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AppBootstrap>
          </AuthProvider>
          <ToastContainer />
        </ToastProvider>
      </Router>
    </>
  );
}
