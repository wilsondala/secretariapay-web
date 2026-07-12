import { Route, Routes } from 'react-router-dom';
import ProtectedRoute from './shared/routes/ProtectedRoute.jsx';
import RoleRoute from './shared/routes/RoleRoute.jsx';
import AppLayout from './layouts/AppLayout.jsx';
import PublicHomePage from './pages/PublicHomePage.jsx';
import PublicGuidePage from './pages/PublicGuidePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import StudentsPage from './pages/StudentsPageFinanceSimple.jsx';
import ChargesPage from './pages/ChargesPageV2.jsx';
import ProofsPage from './pages/ProofsPage.jsx';
import ReceiptsPage from './pages/ReceiptsPage.jsx';
import WhatsappPage from './pages/WhatsappPage.jsx';
import ImportsPage from './pages/ImportsPage.jsx';
import AcademicCatalogPage from './pages/AcademicCatalogPage.jsx';
import AcademicServicesPage from './pages/AcademicServicesPage.jsx';
import AdminUsersPage from './pages/AdminUsersPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import OperationsPage from './pages/OperationsPage.jsx';
import DemoChecklistPage from './pages/DemoChecklistPage.jsx';
import AboutPage from './pages/AboutPage.jsx';
import PublicDemoCarouselPage from './pages/PublicDemoCarouselPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

const secured = (path, element) => <RoleRoute path={path}>{element}</RoleRoute>;

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicHomePage />} />
      <Route path="/guias/:guideCode" element={<PublicGuidePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/apresentacao" element={<PublicDemoCarouselPage />} />
      <Route path="/demo-publica" element={<PublicDemoCarouselPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={secured('/dashboard', <DashboardPage />)} />
          <Route path="/students" element={secured('/students', <StudentsPage />)} />
          <Route path="/charges" element={secured('/charges', <ChargesPage />)} />
          <Route path="/proofs" element={secured('/proofs', <ProofsPage />)} />
          <Route path="/receipts" element={secured('/receipts', <ReceiptsPage />)} />
          <Route path="/academic-services" element={secured('/academic-services', <AcademicServicesPage />)} />
          <Route path="/whatsapp" element={secured('/whatsapp', <WhatsappPage />)} />
          <Route path="/operations" element={secured('/operations', <OperationsPage />)} />
          <Route path="/imports" element={secured('/imports', <ImportsPage />)} />
          <Route path="/academic-catalog" element={secured('/academic-catalog', <AcademicCatalogPage />)} />
          <Route path="/admin-users" element={secured('/admin-users', <AdminUsersPage />)} />
          <Route path="/settings" element={secured('/settings', <SettingsPage />)} />
          <Route path="/reports" element={secured('/reports', <ReportsPage />)} />
          <Route path="/demo" element={<DemoChecklistPage />} />
          <Route path="/about" element={<AboutPage />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
