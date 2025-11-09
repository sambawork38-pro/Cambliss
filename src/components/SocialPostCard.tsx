import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, UserPlus, UserMinus, Play, Clock, TrendingUp } from 'lucide-react';
import { useSocialFeed } from '../context/SocialFeedContext';
import { useAuth } from '../context/AuthContext';

interface SocialPostCardProps {
  post: {
    id: string;
    type: 'news' | 'user';
    title: string;
    summary: string;
    content: string;
    imageUrl?: string;
    videoUrl?: string;
    author: string;
    authorAvatar?: string;
    publishedAt: Date;
    category: string;
    tags: string[];
    isUserGenerated?: boolean;
    userId?: string;
  };
}

const SocialPostCard: React.FC<SocialPostCardProps> = ({ post }) => {
  const { user } = useAuth();
  const {
    likePost,
    unlikePost,
    addComment,
    sharePost,
    followUser,
    unfollowUser,
    isFollowing,
    getPostInteractions
  } = useSocialFeed();

  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSharing, setIsSharing] = useState(false);

  const interactions = getPostInteractions(post.id);
  const isLiked = user ? interactions.likes.includes(user.id) : false;
  const isUserFollowing = user && post.userId ? isFollowing(user.id, post.userId) : false;

  const handleLike = () => {
    if (!user) return;
    if (isLiked) {
      unlikePost(post.id, user.id);
    } else {
      likePost(post.id, user.id);
    }
  };

  const handleComment = () => {
    if (!user || !commentText.trim()) return;
    addComment(post.id, user.id, user.fullName, user.avatar, commentText);
    setCommentText('');
  };

  const handleShare = async () => {
    sharePost(post.id);
    setIsSharing(true);

    // Web Share API
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.summary,
          url: window.location.href
        });
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          copyToClipboard();
        }
      }
    } else {
      copyToClipboard();
    }

    setTimeout(() => setIsSharing(false), 2000);
  };

  const copyToClipboard = () => {
    const url = `${window.location.origin}/social?post=${post.id}`;
    navigator.clipboard.writeText(url);
    alert('Link copied to clipboard!');
  };

  const handleFollow = () => {
    if (!user || !post.userId) return;
    if (isUserFollowing) {
      unfollowUser(user.id, post.userId);
    } else {
      followUser(user.id, post.userId);
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      politics: 'bg-red-100 text-red-800',
      sports: 'bg-green-100 text-green-800',
      technology: 'bg-blue-100 text-blue-800',
      entertainment: 'bg-purple-100 text-purple-800',
      business: 'bg-orange-100 text-orange-800',
      health: 'bg-pink-100 text-pink-800',
      world: 'bg-indigo-100 text-indigo-800',
      india: 'bg-yellow-100 text-yellow-800',
      breaking: 'bg-red-600 text-white'
    };
    return colors[category.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow" data-testid={`social-post-card-${post.id}`}>
      {/* Post Image/Video */}
      {post.imageUrl && (
        <div className="relative aspect-video w-full overflow-hidden bg-gray-100">
          <img
            src={post.imageUrl}
            alt={post.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {post.videoUrl && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
              <button className="bg-white rounded-full p-4 hover:bg-gray-100 transition-colors">
                <Play className="w-8 h-8 text-red-600" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Post Content */}
      <div className="p-4 sm:p-6">
        {/* Category Badge */}
        <div className="flex items-center justify-between mb-3">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(post.category)}`}>
            {post.category.toUpperCase()}
          </span>
          {post.type === 'news' && post.isUserGenerated && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              <TrendingUp className="w-3 h-3 mr-1" />
              User Generated
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 line-clamp-2 hover:text-red-600 cursor-pointer transition-colors" data-testid="post-title">
          {post.title}
        </h3>

        {/* Summary */}
        <p className="text-gray-600 text-sm sm:text-base mb-4 line-clamp-3" data-testid="post-summary">
          {post.summary}
        </p>

        {/* Author & Time */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            {post.authorAvatar && (
              <img
                src={post.authorAvatar}
                alt={post.author}
                className="w-10 h-10 rounded-full object-cover"
              />
            )}
            <div>
              <p className="font-semibold text-gray-900 text-sm" data-testid="post-author">{post.author}</p>
              <div className="flex items-center text-xs text-gray-500">
                <Clock className="w-3 h-3 mr-1" />
                <span data-testid="post-time">{formatTimeAgo(post.publishedAt)}</span>
              </div>
            </div>
          </div>

          {/* Follow Button */}
          {user && post.userId && user.id !== post.userId && (
            <button
              onClick={handleFollow}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isUserFollowing
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
              data-testid="follow-button"
            >
              {isUserFollowing ? (
                <>
                  <UserMinus className="w-4 h-4" />
                  <span className="hidden sm:inline">Following</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span className="hidden sm:inline">Follow</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.slice(0, 5).map((tag, index) => (
              <span
                key={index}
                className="text-xs text-red-600 hover:text-red-700 cursor-pointer font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center space-x-4 sm:space-x-6">
            {/* Like Button */}
            <button
              onClick={handleLike}
              disabled={!user}
              className={`flex items-center space-x-1.5 transition-colors ${
                isLiked ? 'text-red-600' : 'text-gray-600 hover:text-red-600'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              data-testid="like-button"
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              <span className="font-medium text-sm">{interactions.likes.length}</span>
            </button>

            {/* Comment Button */}
            <button
              onClick={() => setShowComments(!showComments)}
              disabled={!user}
              className="flex items-center space-x-1.5 text-gray-600 hover:text-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="comment-button"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="font-medium text-sm">{interactions.comments.length}</span>
            </button>

            {/* Share Button */}
            <button
              onClick={handleShare}
              className={`flex items-center space-x-1.5 transition-colors ${
                isSharing ? 'text-green-600' : 'text-gray-600 hover:text-green-600'
              }`}
              data-testid="share-button"
            >
              <Share2 className="w-5 h-5" />
              <span className="font-medium text-sm">{interactions.shares}</span>
            </button>
          </div>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-4 pt-4 border-t border-gray-100" data-testid="comments-section">
            {user && (
              <div className="mb-4">
                <div className="flex space-x-2">
                  <img
                    src={user.avatar}
                    alt={user.fullName}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Write a comment..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                      onKeyPress={(e) => e.key === 'Enter' && handleComment()}
                      data-testid="comment-input"
                    />
                    <button
                      onClick={handleComment}
                      disabled={!commentText.trim()}
                      className="mt-2 px-4 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      data-testid="comment-submit-button"
                    >
                      Post Comment
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-3">
              {interactions.comments.map((comment) => (
                <div key={comment.id} className="flex space-x-2" data-testid="comment-item">
                  <img
                    src={comment.userAvatar}
                    alt={comment.userName}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div className="flex-1 bg-gray-50 rounded-lg px-3 py-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm text-gray-900">{comment.userName}</span>
                      <span className="text-xs text-gray-500">{formatTimeAgo(comment.timestamp)}</span>
                    </div>
                    <p className="text-sm text-gray-700">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SocialPostCard;
