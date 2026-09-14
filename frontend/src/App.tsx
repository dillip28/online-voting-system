import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from '@/components/ui/toast';
import ProtectedRoute from '@/layouts/protected-route';
import PublicLayout from '@/layouts/public-layout';
import AuthLayout from '@/layouts/auth-layout';
import ErrorBoundary from '@/components/error-boundary';

const LandingPage = lazy(() => import('@/pages/public/landing-page'));
const LoginPage = lazy(() => import('@/pages/auth/login-page'));
const RegisterPage = lazy(() => import('@/pages/auth/register-page'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/forgot-password-page'));
const ResetPasswordPage = lazy(() => import('@/pages/auth/reset-password-page'));

const VoterDashboard = lazy(() => import('@/pages/voter/dashboard-page'));
const VoterElections = lazy(() => import('@/pages/voter/elections-page'));
const VoterElectionDetail = lazy(() => import('@/pages/voter/election-detail-page'));
const VoterVotePage = lazy(() => import('@/pages/voter/vote-page'));
const VoterVoteHistory = lazy(() => import('@/pages/voter/vote-history-page'));
const VoterProfile = lazy(() => import('@/pages/voter/profile-page'));
const VoterNotifications = lazy(() => import('@/pages/voter/notifications-page'));
const VoterHelp = lazy(() => import('@/pages/voter/help-page'));

const AdminDashboard = lazy(() => import('@/pages/admin/dashboard-page'));
const AdminElectionsList = lazy(() => import('@/pages/admin/elections-list-page'));
const AdminElectionCreate = lazy(() => import('@/pages/admin/election-create-page'));
const AdminElectionDetail = lazy(() => import('@/pages/admin/election-detail-page'));
const AdminElectionEdit = lazy(() => import('@/pages/admin/election-edit-page'));
const AdminCandidates = lazy(() => import('@/pages/admin/candidates-page'));
const AdminVoters = lazy(() => import('@/pages/admin/voters-page'));
const AdminResults = lazy(() => import('@/pages/admin/results-page'));
const AdminAuditLogs = lazy(() => import('@/pages/admin/audit-logs-page'));
const AdminSettings = lazy(() => import('@/pages/admin/settings-page'));

const SuperAdminAdmins = lazy(() => import('@/pages/super-admin/admins-page'));
const SuperAdminSettings = lazy(() => import('@/pages/super-admin/system-settings-page'));

function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
        <p className="text-sm text-surface-500">Loading...</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Routes>
            {/* Public routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/about" element={<LandingPage />} />
              <Route path="/how-it-works" element={<LandingPage />} />
              <Route path="/security" element={<LandingPage />} />
              <Route path="/contact" element={<LandingPage />} />
            </Route>

            {/* Auth routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
            </Route>

            {/* Voter routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={['voter']}>
                  <VoterDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/elections"
              element={
                <ProtectedRoute allowedRoles={['voter']}>
                  <VoterElections />
                </ProtectedRoute>
              }
            />
            <Route
              path="/elections/:id"
              element={
                <ProtectedRoute allowedRoles={['voter']}>
                  <VoterElectionDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/elections/:id/vote"
              element={
                <ProtectedRoute allowedRoles={['voter']}>
                  <VoterVotePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/history"
              element={
                <ProtectedRoute allowedRoles={['voter']}>
                  <VoterVoteHistory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/profile"
              element={
                <ProtectedRoute allowedRoles={['voter']}>
                  <VoterProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/notifications"
              element={
                <ProtectedRoute allowedRoles={['voter']}>
                  <VoterNotifications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/help"
              element={
                <ProtectedRoute allowedRoles={['voter']}>
                  <VoterHelp />
                </ProtectedRoute>
              }
            />

            {/* Admin routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/elections"
              element={
                <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                  <AdminElectionsList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/elections/create"
              element={
                <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                  <AdminElectionCreate />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/elections/:id"
              element={
                <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                  <AdminElectionDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/elections/:id/edit"
              element={
                <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                  <AdminElectionEdit />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/candidates"
              element={
                <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                  <AdminCandidates />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/voters"
              element={
                <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                  <AdminVoters />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/results"
              element={
                <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                  <AdminResults />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/audit-logs"
              element={
                <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                  <AdminAuditLogs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                  <AdminSettings />
                </ProtectedRoute>
              }
            />

            {/* Super Admin routes */}
            <Route
              path="/admin/super-admins"
              element={
                <ProtectedRoute allowedRoles={['super_admin']}>
                  <SuperAdminAdmins />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/system-settings"
              element={
                <ProtectedRoute allowedRoles={['super_admin']}>
                  <SuperAdminSettings />
                </ProtectedRoute>
              }
            />

            {/* Catch-all redirect */}
            <Route path="*" element={<LandingPage />} />
          </Routes>
        </Suspense>
        </ErrorBoundary>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
