import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { DataProvider } from './context/DataContext';

import Landing from './pages/Landing';
import DashboardOverview from './pages/DashboardOverview';
import UploadData from './pages/UploadData';
import Unfollowers from './pages/Unfollowers';
import Fans from './pages/Fans';
import Mutuals from './pages/Mutuals';
import Analytics from './pages/Analytics';

function App() {
  return (
    <DataProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardOverview />} />
            <Route path="upload" element={<UploadData />} />
            <Route path="unfollowers" element={<Unfollowers />} />
            <Route path="fans" element={<Fans />} />
            <Route path="mutuals" element={<Mutuals />} />
            <Route path="analytics" element={<Analytics />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </DataProvider>
  );
}

export default App;

