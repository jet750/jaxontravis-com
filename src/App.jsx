import { BrowserRouter, Routes, Route } from 'react-router-dom';
import RootLayout      from './layouts/RootLayout';
import HomePage        from './pages/HomePage';
import AIInterviewPage from './pages/AIInterviewPage';
import PerennialPage   from './pages/PerennialPage';
import BazaarBlendsPage from './pages/BazaarBlendsPage';
import AboutPage       from './pages/AboutPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<RootLayout />}>
          <Route path="/"              element={<HomePage />} />
          <Route path="/interview"     element={<AIInterviewPage />} />
          <Route path="/perennial"     element={<PerennialPage />} />
          <Route path="/bazaar-blends" element={<BazaarBlendsPage />} />
          <Route path="/about"         element={<AboutPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
