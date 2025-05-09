import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { ReportFileProvider } from '@/ReportFileContext';

// Pages this is route for the app
import Index from '@/pages/Index';
import Results from '@/pages/Results';
import Reports from '@/pages/Reports';
import Profile from '@/pages/Profile';
import Settings from '@/pages/Settings';
import Chat from '@/pages/Chat';
import NotFound from '@/pages/NotFound';

function App() {
  return (
    <ReportFileProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/results" element={<Results />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </Router>
    </ReportFileProvider>
  );
}

export default App;
