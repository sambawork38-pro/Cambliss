import React from 'react';
import { Share2 } from 'lucide-react';
import { useNews } from '../context/NewsContext';
import { useAuth } from '../context/AuthContext';

const UserPosts: React.FC = () => {
  const { articles } = useNews();
  const { user } = useAuth();

  const userArticles = articles.filter(a => a.isUserGenerated);

  const handleShare = (article: any) => {
    const shareText = `${article.title}\n${article.summary}\n`;

    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.summary,
        url: window.location.href,
      }).catch(() => {
        navigator.clipboard.writeText(shareText);
      });
    } else {
      navigator.clipboard.writeText(shareText);
      alert('Link copied to clipboard!');
    }
  };

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center py-20">
          <p className="text-gray-600 text-lg">Please log in to view user posts</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">User Posts</h1>

      {userArticles.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-lg">
          <p className="text-gray-600 text-lg">No news articles available yet.</p>
          <p className="text-gray-500 mt-2">Start by publishing your first news article!</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {userArticles.map(article => (
            <div
              key={article.id}
              className={`border-2 rounded-lg p-6 shadow-sm hover:shadow-md transition ${
                article.author === user?.fullName
                  ? 'border-blue-500 bg-blue-50/30'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <img
                src={article.imageUrl}
                alt={article.title}
                className="rounded-lg mb-4 w-full object-cover h-64"
              />

              {article.videoUrl && (
                <video
                  src={article.videoUrl}
                  controls
                  className="rounded-lg mb-4 w-full max-h-80"
                />
              )}

              <div className="flex items-start justify-between mb-2">
                <h2 className="font-semibold text-xl text-gray-900 flex-1">{article.title}</h2>
                {article.author === user?.fullName && (
                  <span className="inline-block ml-4 px-2 py-1 text-xs text-blue-600 font-medium bg-blue-100 rounded">
                    Your Post
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-500 mb-2">by {article.author}</p>
              <p className="text-sm text-gray-600 mb-1">
                <span className="font-medium text-gray-700">Category:</span> {article.category}
              </p>

              <p className="text-gray-700 mb-3 line-clamp-3">{article.summary}</p>

              <p className="text-xs text-gray-400 mb-3">
                {new Date(article.publishedAt).toLocaleString()}
              </p>

              {article.tags && article.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {article.tags.map(tag => (
                    <span key={tag} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <button
                onClick={() => handleShare(article)}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 hover:underline transition font-medium"
              >
                <Share2 className="w-4 h-4" />
                Share Post
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserPosts;
