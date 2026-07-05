import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './shared/routes/ProtectedRoute.jsx';
import AppLayout from './layouts/AppLayout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import StudentsPage from './pages/StudentsPage.jsx';
import ChargesPage from './pages/ChargesPage.jsx';
import ProofsPage from './pages/ProofsPage.jsx';
import ReceiptsPage from './pages/ReceiptsPage.jsx';
import WhatsappPage from './pages/WhatsappPage.jsx';
import ImportsPage from './pages/ImportsPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import DemoChecklistPage from './pages/DemoChecklistPage.jsx';
import AboutPage from './pages/AboutPage.jsx';
import PublicDemoCarouselPage from './pages/PublicDemoCarouselPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import PlaceholderPage from './pages/PlaceholderPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/apresentacao" element={<PublicDemoCarouselPage />} />
      <Route path="/demo-publica" element={<PublicDemoCarouselPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/students" element={<StudentsPage />} />
          <Route path="/charges" element={<ChargesPage />} />
          <Route path="/proofs" element={<ProofsPage />} />
          <Route path="/receipts" element={<ReceiptsPage />} />
          <Route path="/whatsapp" element={<WhatsappPage />} />
          <Route path="/imports" element={<ImportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/demo" element={<DemoChecklistPage />} />
          <Route path="/about" element={<AboutPage />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
