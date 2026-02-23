import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SEO from './SEO';
import { RocketIcon } from './icons';

interface LandingPageProps {
  onEnter: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const charset = 'PYTHONICJOURNEY010110CODING';
    const chars = charset.split('');
    const fontSize = 14;
    const columns = Math.ceil(canvas.width / fontSize);
    const drops = Array.from({ length: columns }, () => 1);
    let frameId = 0;

    const draw = () => {
      ctx.fillStyle = 'rgba(2, 6, 23, 0.08)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#3b82f6';
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i += 1) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i] += 1;
      }

      frameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(frameId);
    };
  }, []);

  const beginEnter = () => {
    if (isFadingOut) return;
    setIsFadingOut(true);
    setTimeout(() => {
      onEnter();
      navigate('/app');
    }, 220);
  };

  useEffect(() => {
    // Disable auto-redirect for SEO/Landing page purposes
    // if (isFadingOut) return;
    // const timer = setTimeout(() => {
    //   beginEnter();
    // }, 1800);
    // return () => clearTimeout(timer);
  }, [isFadingOut, onEnter]);

  return (
    <div className={`relative min-h-[calc(100vh-80px)] overflow-hidden bg-slate-950 transition-opacity duration-200 ${isFadingOut ? 'opacity-0' : 'opacity-100'}`}>
      <SEO
        title="Home"
        description="Master Python with Pythonic Journey. Interactive coding challenges, AI-powered feedback, and structured learning tracks."
        canonical="/"
      />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      <div className="h-full flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 relative z-10 p-8">
          <RocketIcon className="w-10 h-10 text-blue-400" />
          <h1 className="mt-4 text-3xl font-semibold text-white">Pythonic</h1>
          <p className="mt-2 text-slate-300">
            An interactive odyssey to master Python. Solve challenges, run code directly in your browser, and watch your skills ascend.
          </p>
          <Link
            to="/app"
            onClick={(e) => {
              e.preventDefault();
              beginEnter();
            }}
            className="mt-6 block text-center w-full rounded-md bg-blue-600 py-2.5 text-white font-semibold hover:bg-blue-500"
          >
            Enter Now
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
