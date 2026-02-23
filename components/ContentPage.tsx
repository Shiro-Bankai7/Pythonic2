import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getContentById, getContentByType } from './content';
import SEO from './SEO';

interface ContentPageProps {
  type: 'guide' | 'tutorial' | 'article';
  list?: boolean;
}

const ContentPage: React.FC<ContentPageProps> = ({ type, list }) => {
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id, list]);

  if (list) {
    const items = getContentByType(type);
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <SEO
          title={type.charAt(0).toUpperCase() + type.slice(1) + "s"}
          description={`Browse our collection of Python ${type}s and improve your programming skills.`}
          canonical={`/${type}s`}
        />
        <h1 className="text-4xl font-bold mb-8 capitalize">Python {type}s</h1>
        <div className="grid gap-6">
          {items.map(item => (
            <Link
              key={item.id}
              to={`/${type}s/${item.id}`}
              className="block p-6 bg-slate-900 border border-slate-800 rounded-xl hover:border-blue-500 transition-colors"
            >
              <h2 className="text-2xl font-bold text-white mb-2">{item.title}</h2>
              <div className="flex items-center gap-4 text-sm text-slate-400">
                <span>By {item.author}</span>
                <span>•</span>
                <span>{item.date}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  const content = id ? getContentById(id) : null;

  if (!content) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <h1 className="text-4xl font-bold mb-4">Content Not Found</h1>
        <p className="mb-8">Sorry, the page you are looking for does not exist.</p>
        <Link to="/" className="text-blue-400 hover:underline">Return Home</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <SEO
        title={content.title}
        description={content.title + ". Learn more about Python on Pythonic Journey."}
        canonical={`/${type}s/${id}`}
        ogType="article"
      />

      <nav className="mb-8 text-sm text-slate-400 flex items-center gap-2">
        <Link to="/" className="hover:text-blue-400">Home</Link>
        <span>/</span>
        <Link to={`/${type}s`} className="hover:text-blue-400 capitalize">{type}s</Link>
        <span>/</span>
        <span className="text-slate-200 truncate">{content.title}</span>
      </nav>

      <article>
        <h1 className="text-4xl md:text-5xl font-extrabold mb-6 text-white leading-tight">
          {content.title}
        </h1>

        <div className="flex items-center gap-4 text-sm text-slate-400 mb-8 pb-8 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
              {content.author.charAt(0)}
            </div>
            <span className="font-medium text-slate-200">{content.author}</span>
          </div>
          <span>•</span>
          <span>{content.date}</span>
          <span>•</span>
          <span className="bg-slate-800 px-2 py-0.5 rounded text-xs uppercase tracking-wide">
            {type}
          </span>
        </div>

        <div
          className="prose prose-invert prose-blue max-w-none
            prose-headings:text-white prose-headings:font-bold
            prose-p:text-slate-300 prose-p:leading-relaxed
            prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
            prose-strong:text-white prose-code:text-blue-200
            prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-800"
          dangerouslySetInnerHTML={{ __html: content.content }}
        />
      </article>

      <div className="mt-16 p-8 bg-slate-900 border border-slate-800 rounded-2xl">
        <h3 className="text-xl font-bold text-white mb-2">Want to master Python?</h3>
        <p className="text-slate-400 mb-6">
          Join Pythonic Journey today and solve interactive challenges directly in your browser.
          No setup, just pure learning.
        </p>
        <Link
          to="/app"
          className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-lg transition-colors"
        >
          Launch Interactive IDE
        </Link>
      </div>
    </div>
  );
};

export default ContentPage;
