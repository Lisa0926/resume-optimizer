import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import ResumesPage from './pages/ResumeList';
import OptimizePage from './pages/OptimizePage';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/resumes" element={<ResumesPage />} />
            <Route path="/optimize" element={<OptimizePage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
