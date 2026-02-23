import React from 'react';
import SEO from './SEO';

const About: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 prose prose-invert">
      <SEO
        title="About Us"
        description="Learn more about Pythonic Journey, our mission, and the team behind the interactive Python learning platform."
        canonical="/about"
      />
      <h1 className="text-4xl font-bold mb-8">About Pythonic Journey</h1>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
        <p className="text-lg text-slate-300 leading-relaxed">
          Pythonic Journey was founded with a single goal: to make mastering Python accessible, interactive, and genuinely engaging. We believe that the best way to learn programming is not just by reading, but by <strong>doing</strong>. Our platform provides a seamless environment where you can solve real-world challenges, run code instantly, and receive AI-powered feedback in seconds.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Why Pythonic?</h2>
        <div className="grid md:grid-cols-2 gap-8 mt-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
            <h3 className="text-blue-400 font-bold mb-2">Interactive IDE</h3>
            <p className="text-sm text-slate-400">
              Run Python directly in your browser using Pyodide technology. No complex setup required—just pure coding.
            </p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
            <h3 className="text-blue-400 font-bold mb-2">AI Mentorship</h3>
            <p className="text-sm text-slate-400">
              Integrated with Google Gemini AI to provide context-aware hints and detailed code reviews.
            </p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
            <h3 className="text-blue-400 font-bold mb-2">Gamified Learning</h3>
            <p className="text-sm text-slate-400">
              Earn XP, collect coins, and maintain your streak. Turn the learning process into a rewarding journey.
            </p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
            <h3 className="text-blue-400 font-bold mb-2">Structured Tracks</h3>
            <p className="text-sm text-slate-400">
              From DSA basics to automation and AI, our tracks are designed to build your skills step-by-step.
            </p>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">The Team</h2>
        <p className="mb-6">
          Pythonic Journey is led by a dedicated expert in software engineering and project management, committed to delivering high-quality educational experiences.
        </p>
        <div className="flex items-center gap-6 p-6 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-2xl font-bold">O</div>
          <div>
            <h3 className="text-xl font-bold">OLUDIMU JOSHUA OLAYIWOLA</h3>
            <p className="text-blue-400">Project Manager | Technical Project Coordinator | Software Engineer</p>
            <p className="text-sm text-slate-400 mt-2">
              Expert Software Engineer and Technical Project Coordinator with a focus on interactive educational tools and developer experience.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Our Technology</h2>
        <p>
          We leverage cutting-edge technologies like <strong>React</strong>, <strong>Vite</strong>, <strong>Supabase</strong>, and <strong>WebAssembly (Pyodide)</strong> to deliver a high-performance, secure, and modern learning environment.
        </p>
      </section>
    </div>
  );
};

export default About;
