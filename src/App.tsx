import { BrowserRouter as Router, Routes, Route } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Notes from "./pages/Notes/Notes";
import StudentsList from "./pages/Students/StudentsList";
import Home from "./pages/Dashboard/Home";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import { AuthProvider } from "./context/AuthContext";
import GoogleCallback from "./pages/AuthPages/google-callback";
import ApprovalPending from "./pages/OtherPage/ApprovalPending";
import AppBootstrap from "./components/common/AppBootstrap";

export default function App() {
  return (
    <>
      <AuthProvider>
        <Router>
          <ScrollToTop />
          <AppBootstrap>
            <Routes>
              {/* Dashboard Layout */}
              <Route element={<AppLayout />}>
                {/* Dashboard is the main page */}
                <Route index path="/" element={<Home />} />
                <Route path="/profile" element={<UserProfiles />} />

                {/* Notes */}
                <Route path="/notes" element={<Notes />} />

                {/* Students */}
                <Route path="/students" element={<StudentsList />} />
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

        </Router>
      </AuthProvider>

    </>
  );
}
