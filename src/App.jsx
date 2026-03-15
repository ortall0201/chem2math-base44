import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';

import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import Domains from './pages/Domains';
import Dictionary from './pages/Dictionary';
import Agents from './pages/Agents';
import Mission from './pages/Mission';
import TeamCommunication from './pages/TeamCommunication';
import MathAnalysis from './pages/MathAnalysis';

function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/Dashboard" replace />} />
          <Route element={<AppLayout />}>
            <Route path="/Dashboard" element={<Dashboard />} />
            <Route path="/Domains" element={<Domains />} />
            <Route path="/Dictionary" element={<Dictionary />} />
            <Route path="/Agents" element={<Agents />} />
            <Route path="/Mission" element={<Mission />} />
            <Route path="/TeamCommunication" element={<TeamCommunication />} />
            <Route path="/MathAnalysis" element={<MathAnalysis />} />
          </Route>
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </Router>
      <Toaster />
    </QueryClientProvider>
  )
}

export default App
