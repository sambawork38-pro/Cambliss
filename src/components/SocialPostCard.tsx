import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, UserPlus, UserMinus, Clock } from 'lucide-react';
import { useSocialFeed } from '../context/SocialFeedContext';
import { useAuth } from '../context/AuthContext';

const SocialPostCard = ({ post }: any) => {
  const { user } = useAuth();
  const {
    likePost,
    unlikePost,
    addComment,
    sharePost,
    followUser,
    unfollowUser,
    isFollowing,
    getPostInteractions,
  } = useSocialFeed();

  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isUserFollowing, setIsUserFollowing] = useState(false);

  const interactions = getPostInteractions(post.id);
  const isLiked = user && interactions.likes.includes(user.id);

  // ✅ Load follow state from context/localStorage when UI mounts
  useEffect(() => {
    if (user && post.userId) {
      setIsUserFollowing(isFollowing(user.id, post.userId));
    }
  }, [user, post.userId, isFollowing]);

  const handleFollow = () => {
    if (!user || !post.userId) return;
    if (isUserFollowing) {
      unfollowUser(user.id, post.userId);
      setIsUserFollowing(false);
    } else {
      followUser(user.id, post.userId);
      setIsUserFollowing(true);
    }
  };

  const handleLike = () => {
    if (!user) return;
    isLiked ? unlikePost(post.id, user.id) : likePost(post.id, user.id);
  };

  const handleComment = () => {
    if (!user || !commentText.trim()) return;
    addComment(post.id, user.id, user.fullName, user.avatar, commentText);
    setCommentText('');
  };

  const formatTime = (date: Date) => {
    const diff = (Date.now() - new Date(date).getTime()) / 1000;
    if (diff < 60) return `${Math.floor(diff)}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300">
      {/* Media */}
      {post.imageUrl && (
        <div className="relative w-full h-64 sm:h-72 md:h-80 overflow-hidden bg-gray-100 rounded-t-2xl">
          <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Content */}
      <div className="p-5">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{post.title}</h3>
        <p className="text-sm text-gray-600 mb-3">{post.summary}</p>

        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center space-x-2">
            {post.authorAvatar && (
              <img src={post.authorAvatar} alt={post.author} className="w-9 h-9 rounded-full object-cover" />
            )}
            <div>
              <p className="text-sm font-medium text-gray-900">{post.author}</p>
              <p className="text-xs text-gray-500 flex items-center">
                <Clock className="w-3 h-3 mr-1" /> {formatTime(post.publishedAt)}
              </p>
            </div>
          </div>

          {/* Follow Button */}
          {user && post.userId && user.id !== post.userId && (
            <button
              onClick={handleFollow}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                isUserFollowing
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              {isUserFollowing ? <UserMinus size={16} /> : <UserPlus size={16} />}
              <span>{isUserFollowing ? 'Following' : 'Follow'}</span>
            </button>
          )}
        </div>

        {/* Post Actions */}
        <div className="flex items-center space-x-4 pt-3 border-t border-gray-100">
          <button
            onClick={handleLike}
            className={`flex items-center space-x-1 text-sm font-medium ${
              isLiked ? 'text-red-600' : 'text-gray-600 hover:text-red-600'
            }`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
            <span>{interactions.likes.length}</span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center space-x-1 text-sm text-gray-600 hover:text-blue-600"
          >
            <MessageCircle className="w-5 h-5" />
            <span>{interactions.comments.length}</span>
          </button>

          <button
            onClick={() => sharePost(post.id)}
            className="flex items-center space-x-1 text-sm text-gray-600 hover:text-green-600"
          >
            <Share2 className="w-5 h-5" />
            <span>{interactions.shares}</span>
          </button>
        </div>

        {/* Comments */}
        {showComments && (
          <div className="mt-4 space-y-2">
            {user && (
              <div className="flex items-center space-x-2">
                <img src={user.avatar} alt={user.fullName} className="w-8 h-8 rounded-full" />
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-red-500"
                  onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                />
              </div>
            )}
            {interactions.comments.map((c) => (
              <div key={c.id} className="flex space-x-2">
                <img src={c.userAvatar} alt={c.userName} className="w-8 h-8 rounded-full" />
                <div className="bg-gray-50 px-3 py-2 rounded-lg flex-1">
                  <p className="text-sm font-semibold">{c.userName}</p>
                  <p className="text-sm text-gray-700">{c.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SocialPostCard;
