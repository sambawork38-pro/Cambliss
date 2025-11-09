import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNews } from './NewsContext';
import { useAuth } from './AuthContext';

interface SocialPost {
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
}

interface SocialInteraction {
  postId: string;
  likes: string[]; // user IDs who liked
  comments: Comment[];
  shares: number;
}

interface Comment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  timestamp: Date;
  likes: string[];
  replies?: Comment[]; // For threaded replies
}

interface UserFollow {
  userId: string;
  following: string[]; // user IDs being followed
}

interface SocialFeedContextType {
  posts: SocialPost[];
  interactions: Map<string, SocialInteraction>;
  follows: Map<string, string[]>;
  likePost: (postId: string, userId: string) => void;
  unlikePost: (postId: string, userId: string) => void;
  addComment: (postId: string, userId: string, userName: string, userAvatar: string, content: string) => void;
  likeComment: (commentId: string, userId: string) => void;
  sharePost: (postId: string) => void;
  followUser: (userId: string, targetUserId: string) => void;
  unfollowUser: (userId: string, targetUserId: string) => void;
  isFollowing: (userId: string, targetUserId: string) => boolean;
  getPostInteractions: (postId: string) => SocialInteraction;
  getTrendingHashtags: () => { tag: string; count: number }[];
  getFollowedPosts: (userId: string) => SocialPost[];
  getUserPosts: (userId: string) => SocialPost[];
  getPostsByCategory: (category: string) => SocialPost[];
  addUserPost: (post: Omit<SocialPost, 'id' | 'type' | 'publishedAt'>) => void;
  refreshFeed: () => void;
  lastRefreshed: Date | null;
}

const SocialFeedContext = createContext<SocialFeedContextType | undefined>(undefined);

const STORAGE_KEY_INTERACTIONS = 'cambliss_social_interactions';
const STORAGE_KEY_FOLLOWS = 'cambliss_social_follows';
const STORAGE_KEY_USER_POSTS = 'cambliss_user_posts';

export const SocialFeedProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { articles } = useNews();
  const { user } = useAuth();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [interactions, setInteractions] = useState<Map<string, SocialInteraction>>(new Map());
  const [follows, setFollows] = useState<Map<string, string[]>>(new Map());
  const [userPosts, setUserPosts] = useState<SocialPost[]>([]);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const savedInteractions = localStorage.getItem(STORAGE_KEY_INTERACTIONS);
    const savedFollows = localStorage.getItem(STORAGE_KEY_FOLLOWS);
    const savedUserPosts = localStorage.getItem(STORAGE_KEY_USER_POSTS);

    if (savedInteractions) {
      try {
        const parsed = JSON.parse(savedInteractions);
        setInteractions(new Map(Object.entries(parsed)));
      } catch (e) {
        console.error('Error loading interactions:', e);
      }
    }

    if (savedFollows) {
      try {
        const parsed = JSON.parse(savedFollows);
        setFollows(new Map(Object.entries(parsed)));
      } catch (e) {
        console.error('Error loading follows:', e);
      }
    }

    if (savedUserPosts) {
      try {
        const parsed = JSON.parse(savedUserPosts);
        setUserPosts(parsed.map((p: any) => ({
          ...p,
          publishedAt: new Date(p.publishedAt)
        })));
      } catch (e) {
        console.error('Error loading user posts:', e);
      }
    }
  }, []);

  // Save interactions to localStorage
  useEffect(() => {
    const interactionsObj = Object.fromEntries(interactions);
    localStorage.setItem(STORAGE_KEY_INTERACTIONS, JSON.stringify(interactionsObj));
  }, [interactions]);

  // Save follows to localStorage
  useEffect(() => {
    const followsObj = Object.fromEntries(follows);
    localStorage.setItem(STORAGE_KEY_FOLLOWS, JSON.stringify(followsObj));
  }, [follows]);

  // Save user posts to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_USER_POSTS, JSON.stringify(userPosts));
  }, [userPosts]);

  // Transform news articles to social posts and merge with user posts
  useEffect(() => {
    const newsPosts: SocialPost[] = articles.map(article => ({
      id: article.id,
      type: 'news' as const,
      title: article.title,
      summary: article.summary,
      content: article.content,
      imageUrl: article.imageUrl,
      videoUrl: article.videoUrl,
      author: article.author,
      publishedAt: new Date(article.publishedAt),
      category: article.category,
      tags: article.tags,
      isUserGenerated: article.isUserGenerated
    }));

    // Merge and sort by date
    const allPosts = [...userPosts, ...newsPosts].sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    setPosts(allPosts);
    setLastRefreshed(new Date());
  }, [articles, userPosts]);

  const refreshFeed = () => {
    setLastRefreshed(new Date());
  };

  const likePost = (postId: string, userId: string) => {
    setInteractions(prev => {
      const newMap = new Map(prev);
      const interaction = newMap.get(postId) || { postId, likes: [], comments: [], shares: 0 };
      if (!interaction.likes.includes(userId)) {
        interaction.likes.push(userId);
      }
      newMap.set(postId, interaction);
      return newMap;
    });
  };

  const unlikePost = (postId: string, userId: string) => {
    setInteractions(prev => {
      const newMap = new Map(prev);
      const interaction = newMap.get(postId);
      if (interaction) {
        interaction.likes = interaction.likes.filter(id => id !== userId);
        newMap.set(postId, interaction);
      }
      return newMap;
    });
  };

  const addComment = (postId: string, userId: string, userName: string, userAvatar: string, content: string) => {
    setInteractions(prev => {
      const newMap = new Map(prev);
      const interaction = newMap.get(postId) || { postId, likes: [], comments: [], shares: 0 };
      const newComment: Comment = {
        id: `comment_${Date.now()}_${Math.random()}`,
        postId,
        userId,
        userName,
        userAvatar,
        content,
        timestamp: new Date(),
        likes: [],
        replies: [] // Ready for threaded replies
      };
      interaction.comments.push(newComment);
      newMap.set(postId, interaction);
      return newMap;
    });
  };

  const likeComment = (commentId: string, userId: string) => {
    setInteractions(prev => {
      const newMap = new Map(prev);
      newMap.forEach((interaction, postId) => {
        interaction.comments = interaction.comments.map(comment => {
          if (comment.id === commentId) {
            if (!comment.likes.includes(userId)) {
              comment.likes.push(userId);
            }
          }
          return comment;
        });
      });
      return new Map(newMap);
    });
  };

  const sharePost = (postId: string) => {
    setInteractions(prev => {
      const newMap = new Map(prev);
      const interaction = newMap.get(postId) || { postId, likes: [], comments: [], shares: 0 };
      interaction.shares++;
      newMap.set(postId, interaction);
      return newMap;
    });
  };

  const followUser = (userId: string, targetUserId: string) => {
    setFollows(prev => {
      const newMap = new Map(prev);
      const userFollows = newMap.get(userId) || [];
      if (!userFollows.includes(targetUserId)) {
        userFollows.push(targetUserId);
      }
      newMap.set(userId, userFollows);
      return newMap;
    });
  };

  const unfollowUser = (userId: string, targetUserId: string) => {
    setFollows(prev => {
      const newMap = new Map(prev);
      const userFollows = newMap.get(userId) || [];
      newMap.set(userId, userFollows.filter(id => id !== targetUserId));
      return newMap;
    });
  };

  const isFollowing = (userId: string, targetUserId: string): boolean => {
    const userFollows = follows.get(userId) || [];
    return userFollows.includes(targetUserId);
  };

  const getPostInteractions = (postId: string): SocialInteraction => {
    return interactions.get(postId) || { postId, likes: [], comments: [], shares: 0 };
  };

  const getTrendingHashtags = (): { tag: string; count: number }[] => {
    const hashtagCount = new Map<string, number>();

    posts.forEach(post => {
      post.tags.forEach(tag => {
        hashtagCount.set(tag, (hashtagCount.get(tag) || 0) + 1);
      });
    });

    return Array.from(hashtagCount.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  };

  const getFollowedPosts = (userId: string): SocialPost[] => {
    const following = follows.get(userId) || [];
    return posts.filter(post => {
      // For news posts, check if user follows the author (by author name)
      // For user posts, check userId
      if (post.type === 'user' && post.userId) {
        return following.includes(post.userId);
      }
      return false;
    });
  };

  const getUserPosts = (userId: string): SocialPost[] => {
    return posts.filter(post => post.userId === userId || post.author === userId);
  };

  const getPostsByCategory = (category: string): SocialPost[] => {
    if (category === 'all') return posts;
    return posts.filter(post => post.category.toLowerCase() === category.toLowerCase());
  };

  const addUserPost = (postData: Omit<SocialPost, 'id' | 'type' | 'publishedAt'>) => {
    const newPost: SocialPost = {
      ...postData,
      id: `user_post_${Date.now()}_${Math.random()}`,
      type: 'user',
      publishedAt: new Date(),
      userId: user?.id || 'anonymous'
    };
    setUserPosts(prev => [newPost, ...prev]);
  };

  const value: SocialFeedContextType = {
    posts,
    interactions,
    follows,
    likePost,
    unlikePost,
    addComment,
    likeComment,
    sharePost,
    followUser,
    unfollowUser,
    isFollowing,
    getPostInteractions,
    getTrendingHashtags,
    getFollowedPosts,
    getUserPosts,
    getPostsByCategory,
    addUserPost,
    refreshFeed,
    lastRefreshed
  };

  return <SocialFeedContext.Provider value={value}>{children}</SocialFeedContext.Provider>;
};

export const useSocialFeed = () => {
  const context = useContext(SocialFeedContext);
  if (context === undefined) {
    throw new Error('useSocialFeed must be used within a SocialFeedProvider');
  }
  return context;
};
