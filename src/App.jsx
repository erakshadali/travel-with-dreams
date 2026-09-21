import { Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import { useTilt } from './hooks/useTilt';
import Home from './pages/Home';
import Trips from './pages/Trips';
import TripDetails from './pages/TripDetails';
import Booking from './pages/Booking';
import Unexplored from './pages/Unexplored';
import About from './pages/About';
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';
import './styles/App.css';
import './styles/Sections.css';

function App() {
  const { pathname } = useLocation();
  useTilt();

  return (
    <div className={`app${pathname === '/' ? ' is-home' : ''}`}>
      <ScrollToTop />
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Navbar />
      <main id="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/trips" element={<Trips />} />
          <Route path="/trips/:slug" element={<TripDetails />} />
          <Route path="/book/:slug" element={<Booking />} />
          <Route path="/unexplored" element={<Unexplored />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
