import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { UIProvider } from './context/UIContext';
import { ThemeProvider } from './context/ThemeContext';
import { ProtectedRoute, PublicOnlyRoute } from './components/common/ProtectedRoute';
import { AdminLayout } from './components/layout/AdminLayout';
import { LoginPage } from './pages/LoginPage';
import { WelcomePage } from './pages/WelcomePage';
import { DashboardPage } from './pages/DashboardPage';
import { MembersPage } from './pages/members/MembersPage';
import { CoachesPage } from './pages/coaches/CoachesPage';
import { EmployeesPage } from './pages/employees/EmployeesPage';
import { OfferingsPage } from './pages/offerings/OfferingsPage';
import { PricesPage } from './pages/prices/PricesPage';
import { CoursesPage } from './pages/courses/CoursesPage';
import { AttendancePage } from './pages/attendance/AttendancePage';
import { FinancePage } from './pages/finance/FinancePage';
import { SessionsPage } from './pages/sessions/SessionsPage';
import { TicketsPage } from './pages/tickets/TicketsPage';
import { AuditLogsPage } from './pages/audit/AuditLogsPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { GuidePage } from './pages/GuidePage';
import { PrivacyPage } from './pages/PrivacyPage';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <UIProvider>
          <HashRouter>
            <Routes>
              <Route path="/welcome" element={<PublicOnlyRoute><WelcomePage /></PublicOnlyRoute>} />
              <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
              <Route element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/members" element={<MembersPage />} />
                <Route path="/coaches" element={<CoachesPage />} />
                <Route path="/employees" element={<EmployeesPage />} />
                <Route path="/offerings" element={<OfferingsPage />} />
                <Route path="/prices" element={<PricesPage />} />
                <Route path="/courses" element={<CoursesPage />} />
                <Route path="/attendance" element={<AttendancePage />} />
                <Route path="/sessions" element={<SessionsPage />} />
                <Route path="/finance" element={<FinancePage />} />
                <Route path="/finance/transactions" element={<FinancePage />} />
                <Route path="/finance/payments" element={<FinancePage />} />
                <Route path="/finance/refunds" element={<FinancePage />} />
                <Route path="/finance/reports" element={<FinancePage />} />
                <Route path="/tickets" element={<TicketsPage />} />
                <Route path="/audit" element={<AuditLogsPage />} />
                <Route path="/audit-logs" element={<AuditLogsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/guide" element={<GuidePage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Route>
            </Routes>
          </HashRouter>
        </UIProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
