import React, { useState, useEffect } from 'react';
import { Camera, Video, Image as ImageIcon, Filter, TrendingUp, Users, Grid, Clock } from 'lucide-react';
import { useSocialFeed } from '../context/SocialFeedContext';
import { useAuth } from '../context/AuthContext';
import SocialPostCard from './SocialPostCard';

const SocialFeed: React.FC = () => {
  const { user } = useAuth();
  const {
    posts,
    addUserPost,
    getPostsByCategory,
    getUserPosts,
    getFollowedPosts,
    getTrendingHashtags,
    refreshFeed,
    lastRefreshed
  } = useSocialFeed();

  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    summary: '',
    content: '',
    category: 'breaking',
    imageUrl: '',
    videoUrl: '',
    tags: [] as string[],
    author: user?.fullName || 'Anonymous',
    authorAvatar: user?.avatar
  });
  const [tagInput, setTagInput] = useState('');
  const [showRefreshNotification, setShowRefreshNotification] = useState(false);

  const categories = [
    { id: 'all', name: 'All Posts', icon: Grid },
    { id: 'following', name: 'Following', icon: Users },
    { id: 'my-posts', name: 'My Posts', icon: Users },
    { id: 'breaking', name: 'Breaking', icon: TrendingUp },
    { id: 'politics', name: 'Politics', icon: Filter },
    { id: 'sports', name: 'Sports', icon: Filter },
    { id: 'technology', name: 'Technology', icon: Filter },
    { id: 'business', name: 'Business', icon: Filter },
    { id: 'entertainment', name: 'Entertainment', icon: Filter },
    { id: 'health', name: 'Health', icon: Filter },
    { id: 'world', name: 'World', icon: Filter },
    { id: 'india', name: 'India', icon: Filter }
  ];

  // Auto-refresh every 20 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      refreshFeed();
      setShowRefreshNotification(true);
      setTimeout(() => setShowRefreshNotification(false), 3000);
    }, 20 * 60 * 1000); // 20 minutes

    return () => clearInterval(interval);
  }, [refreshFeed]);

  const getFilteredPosts = () => {
    if (!user && (activeFilter === 'following' || activeFilter === 'my-posts')) {
      return [];
    }

    switch (activeFilter) {
      case 'following':
        return user ? getFollowedPosts(user.id) : [];
      case 'my-posts':
        return user ? getUserPosts(user.id) : [];
      case 'all':
        return posts;
      default:
        return getPostsByCategory(activeFilter);
    }
  };

  const handleCreatePost = () => {
    if (!user) {
      alert('Please login to create a post');
      return;
    }

    if (!newPost.title.trim() || !newPost.summary.trim()) {
      alert('Please fill in title and summary');
      return;
    }

    addUserPost({
      ...newPost,
      author: user.fullName,
      authorAvatar: user.avatar,
      userId: user.id
    });

    // Reset form
    setNewPost({
      title: '',
      summary: '',
      content: '',
      category: 'breaking',
      imageUrl: '',
      videoUrl: '',
      tags: [],
      author: user.fullName,
      authorAvatar: user.avatar
    });
    setTagInput('');
    setShowCreatePost(false);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !newPost.tags.includes(tagInput.trim())) {
      setNewPost(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setNewPost(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const trendingHashtags = getTrendingHashtags();
  const filteredPosts = getFilteredPosts();

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Refresh Notification */}
      {showRefreshNotification && (
        <div className="fixed top-24 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-slide-down">
          <Clock className="w-5 h-5" />
          <span className="font-medium">Feed refreshed with new posts!</span>
        </div>
      )}

      {/* Category Filters */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4" data-testid="category-filters">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 flex items-center">
            <Filter className="w-5 h-5 mr-2 text-red-600" />
            Filter Feed
          </h3>
          <span className="text-sm text-gray-500">{filteredPosts.length} posts</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveFilter(category.id)}
              disabled={!user && (category.id === 'following' || category.id === 'my-posts')}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeFilter === category.id
                  ? 'bg-red-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              data-testid={`filter-${category.id}`}
            >
              <category.icon className="w-4 h-4" />
              <span>{category.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Create Post Section */}
      {user && (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6" data-testid="create-post-section">
          <div className="flex items-center space-x-4 mb-4">
            <img
              src={user.avatar}
              alt={user.fullName}
              className="w-12 h-12 rounded-full object-cover"
            />
            <button
              onClick={() => setShowCreatePost(!showCreatePost)}
              className="flex-1 text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-500 transition-all font-medium"
              data-testid="create-post-button"
            >
              Share a story, news, or update...
            </button>
          </div>

          {showCreatePost && (
            <div className="space-y-4 pt-4 border-t border-gray-200">
              {/* Category Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={newPost.category}
                  onChange={(e) => setNewPost(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  data-testid="category-select"
                >
                  <option value="breaking">Breaking News</option>
                  <option value="politics">Politics</option>
                  <option value="sports">Sports</option>
                  <option value="technology">Technology</option>
                  <option value="business">Business</option>
                  <option value="entertainment">Entertainment</option>
                  <option value="health">Health</option>
                  <option value="world">World</option>
                  <option value="india">India</option>
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                <input
                  type="text"
                  value={newPost.title}
                  onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Give your post a compelling title..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  data-testid="post-title-input"
                />
              </div>

              {/* Summary */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Summary *</label>
                <input
                  type="text"
                  value={newPost.summary}
                  onChange={(e) => setNewPost(prev => ({ ...prev, summary: e.target.value }))}
                  placeholder="Brief summary or headline..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  data-testid="post-summary-input"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                <textarea
                  value={newPost.content}
                  onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Share the full story or details..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                  data-testid="post-content-input"
                />
              </div>

              {/* Media URLs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <ImageIcon className="w-4 h-4 mr-1" />
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={newPost.imageUrl}
                    onChange={(e) => setNewPost(prev => ({ ...prev, imageUrl: e.target.value }))}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    data-testid="post-image-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Video className="w-4 h-4 mr-1" />
                    Video URL
                  </label>
                  <input
                    type="url"
                    value={newPost.videoUrl}
                    onChange={(e) => setNewPost(prev => ({ ...prev, videoUrl: e.target.value }))}
                    placeholder="https://example.com/video.mp4"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    data-testid="post-video-input"
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tags (Hashtags)</label>
                <div className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    placeholder="Add tag (press Enter)"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    data-testid="tag-input"
                  />
                  <button
                    onClick={handleAddTag}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    Add
                  </button>
                </div>
                {newPost.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {newPost.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium"
                      >
                        #{tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-2 hover:text-red-900"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowCreatePost(false)}
                  className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePost}
                  className="px-6 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-medium hover:from-red-700 hover:to-red-800 transition-all shadow-md"
                  data-testid="submit-post-button"
                >
                  Post to Feed
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Trending Hashtags */}
      {trendingHashtags.length > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl shadow-md border border-red-100 p-6" data-testid="trending-hashtags">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-red-600" />
            Trending Topics
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {trendingHashtags.map((hashtag, index) => (
              <div
                key={index}
                className="bg-white rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer border border-gray-200"
              >
                <div className="text-red-600 font-bold text-sm mb-1">#{hashtag.tag}</div>
                <div className="text-gray-500 text-xs">{hashtag.count} posts</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Posts Feed */}
      <div className="space-y-6" data-testid="posts-feed">
        {filteredPosts.length > 0 ? (
          filteredPosts.map((post) => (
            <SocialPostCard key={post.id} post={post} />
          ))
        ) : (
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-12 text-center">
            <div className="text-gray-400 mb-4">
              <Filter className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No posts found</h3>
            <p className="text-gray-600">
              {activeFilter === 'following' && 'Follow users to see their posts here.'}
              {activeFilter === 'my-posts' && 'You haven\'t created any posts yet.'}
              {activeFilter !== 'following' && activeFilter !== 'my-posts' && 'No posts available in this category.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SocialFeed;
