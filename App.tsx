import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import LandingPage from './components/LandingPage';
import { RocketIcon } from './components/icons';
import IDE from './IDE';
import Privacy from './components/Privacy';
import Terms from './components/Terms';
import About from './components/About';
import Contact from './components/Contact';
import ContentPage from './components/ContentPage';
import { Analytics } from '@vercel/analytics/react';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { pathname } = useLocation();
  const isApp = pathname.startsWith('/app');

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {!isApp && (
        <header className="border-b border-slate-800 bg-slate-950 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <RocketIcon className="w-8 h-8 text-blue-400" />
              <span className="text-blue-400 text-2xl font-bold">Pythonic</span>
            </Link>
            <nav className="flex items-center gap-6">
              <Link to="/guides" className="hover:text-blue-400 transition-colors">Guides</Link>
              <Link to="/tutorials" className="hover:text-blue-400 transition-colors">Tutorials</Link>
              <Link to="/articles" className="hover:text-blue-400 transition-colors">Articles</Link>
              <Link to="/app" className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-md font-semibold transition-colors">
                Launch App
              </Link>
            </nav>
          </div>
        </header>
      )}

      <main className="flex-grow">
        {children}
      </main>

      {!isApp && (
        <footer className="border-t border-slate-800 bg-slate-950 py-12">
          <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-blue-400 font-bold mb-4">Pythonic</h3>
              <p className="text-slate-400 text-sm">
                The interactive odyssey to master Python programming.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link to="/guides" className="hover:text-white">Guides</Link></li>
                <li><Link to="/tutorials" className="hover:text-white">Tutorials</Link></li>
                <li><Link to="/articles" className="hover:text-white">Articles</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link to="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-white">Terms of Service</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link to="/about" className="hover:text-white">About Us</Link></li>
                <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
              </ul>
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-4 mt-12 pt-8 border-t border-slate-800 text-center text-slate-500 text-sm">
            &copy; {new Date().getFullYear()} Pythonic Journey. All rights reserved.
          </div>
        </footer>
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<LandingPage onEnter={() => {}} />} />
            <Route path="/app/*" element={<IDE />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/guides/:id" element={<ContentPage type="guide" />} />
            <Route path="/tutorials/:id" element={<ContentPage type="tutorial" />} />
            <Route path="/articles/:id" element={<ContentPage type="article" />} />
            <Route path="/guides" element={<ContentPage type="guide" list />} />
            <Route path="/tutorials" element={<ContentPage type="tutorial" list />} />
            <Route path="/articles" element={<ContentPage type="article" list />} />
          </Routes>
        </Layout>
        <Analytics />
      </BrowserRouter>
    </HelmetProvider>
  );
};

export default App;
