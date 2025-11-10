import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useNews } from "./NewsContext";
import { useAuth } from "./AuthContext";

// 🧩 Interfaces
interface SocialPost {
  id: string;
  type: "news" | "user";
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

interface Comment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  timestamp: Date;
  likes: string[];
  replies?: Comment[];
}

interface SocialInteraction {
  postId: string;
  likes: string[];
  comments: Comment[];
  shares: number;
}

interface SocialFeedContextType {
  posts: SocialPost[];
  interactions: Map<string, SocialInteraction>;
  follows: Map<string, string[]>;
  likePost: (postId: string, userId: string) => void;
  unlikePost: (postId: string, userId: string) => void;
  addComment: (postId: string, userId: string, userName: string, userAvatar: string, content: string) => void;
  sharePost: (postId: string) => void;
  followUser: (userId: string, targetUserId: string) => void;
  unfollowUser: (userId: string, targetUserId: string) => void;
  isFollowing: (userId: string, targetUserId: string) => boolean;
  getPostInteractions: (postId: string) => SocialInteraction;
  getFollowedPosts: (userId: string) => SocialPost[];
  getUserPosts: (userId: string) => SocialPost[];
  addUserPost: (data: Omit<SocialPost, "id" | "type" | "publishedAt">) => void;
  getTrendingHashtags: () => { tag: string; count: number }[];
  refreshFeed: () => void;
  lastRefreshed: Date | null;
}

const SocialFeedContext = createContext<SocialFeedContextType | undefined>(undefined);

const STORAGE_KEYS = {
  INTERACTIONS: "cambliss_social_interactions",
  FOLLOWS: "cambliss_social_follows",
  USER_POSTS: "cambliss_user_posts",
};

// 🧠 Provider
export const SocialFeedProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { articles } = useNews();
  const { user } = useAuth();

  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [interactions, setInteractions] = useState<Map<string, SocialInteraction>>(new Map());
  const [follows, setFollows] = useState<Map<string, string[]>>(new Map());
  const [userPosts, setUserPosts] = useState<SocialPost[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  // ✅ Load from localStorage (with full rehydration)
  useEffect(() => {
    const loadInteractions = (): Map<string, SocialInteraction> => {
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.INTERACTIONS);
        if (!raw) return new Map();

        const parsed = JSON.parse(raw);
        const map = new Map<string, SocialInteraction>();

        Object.entries(parsed).forEach(([postId, val]) => {
          const v = val as any;
          map.set(postId, {
            postId,
            likes: Array.isArray(v.likes) ? v.likes : [],
            comments: Array.isArray(v.comments)
              ? v.comments.map((c: any) => ({
                  ...c,
                  timestamp: new Date(c.timestamp),
                  likes: Array.isArray(c.likes) ? c.likes : [],
                  replies: Array.isArray(c.replies)
                    ? c.replies.map((r: any) => ({
                        ...r,
                        timestamp: new Date(r.timestamp),
                        likes: Array.isArray(r.likes) ? r.likes : [],
                      }))
                    : [],
                }))
              : [],
            shares: typeof v.shares === "number" ? v.shares : 0,
          });
        });

        return map;
      } catch (err) {
        console.error("Error loading interactions:", err);
        return new Map();
      }
    };

    const loadMap = (key: string): Map<string, string[]> => {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) return new Map();
        const parsed = JSON.parse(raw);
        return new Map(Object.entries(parsed));
      } catch {
        return new Map();
      }
    };

    setInteractions(loadInteractions());
    setFollows(loadMap(STORAGE_KEYS.FOLLOWS));

    const userPostsRaw = localStorage.getItem(STORAGE_KEYS.USER_POSTS);
    if (userPostsRaw) {
      try {
        const parsed = JSON.parse(userPostsRaw);
        setUserPosts(
          parsed.map((p: any) => ({
            ...p,
            publishedAt: new Date(p.publishedAt),
          }))
        );
      } catch (e) {
        console.error("Error loading user posts:", e);
      }
    }

    setIsLoaded(true);
  }, []);

  // ✅ Persist back to localStorage
  useEffect(() => {
    if (isLoaded)
      localStorage.setItem(STORAGE_KEYS.INTERACTIONS, JSON.stringify(Object.fromEntries(interactions)));
  }, [interactions, isLoaded]);

  useEffect(() => {
    if (isLoaded)
      localStorage.setItem(STORAGE_KEYS.FOLLOWS, JSON.stringify(Object.fromEntries(follows)));
  }, [follows, isLoaded]);

  useEffect(() => {
    if (isLoaded)
      localStorage.setItem(STORAGE_KEYS.USER_POSTS, JSON.stringify(userPosts));
  }, [userPosts, isLoaded]);

  // ✅ Combine news + user posts
  useEffect(() => {
    if (!isLoaded) return;

    const newsPosts: SocialPost[] = articles.map((a) => ({
      id: a.id,
      type: "news" as const,
      title: a.title,
      summary: a.summary,
      content: a.content,
      imageUrl: a.imageUrl,
      videoUrl: a.videoUrl,
      author: a.author,
      authorAvatar: `https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(a.author || "guest")}`,
      publishedAt: new Date(a.publishedAt),
      category: a.category,
      tags: a.tags || [],
      userId: `author_${a.author.replace(/\s+/g, "_").toLowerCase()}`,
    }));

    const all = [...userPosts, ...newsPosts].sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    setPosts(all);
    setLastRefreshed(new Date());
  }, [articles, userPosts, isLoaded]);

  const refreshFeed = () => setLastRefreshed(new Date());

  // ✅ Likes / Comments / Shares
  const likePost = (postId: string, userId: string) => {
    setInteractions((prev) => {
      const m = new Map(prev);
      const post = m.get(postId) || { postId, likes: [], comments: [], shares: 0 };
      if (!post.likes.includes(userId)) post.likes.push(userId);
      m.set(postId, post);
      return m;
    });
  };

  const unlikePost = (postId: string, userId: string) => {
    setInteractions((prev) => {
      const m = new Map(prev);
      const post = m.get(postId);
      if (post) post.likes = post.likes.filter((id) => id !== userId);
      if (post) m.set(postId, post);
      return m;
    });
  };

  const addComment = (postId: string, userId: string, userName: string, userAvatar: string, content: string) => {
    setInteractions((prev) => {
      const m = new Map(prev);
      const post = m.get(postId) || { postId, likes: [], comments: [], shares: 0 };
      post.comments.push({
        id: `comment_${Date.now()}`,
        postId,
        userId,
        userName,
        userAvatar,
        content,
        timestamp: new Date(),
        likes: [],
      });
      m.set(postId, post);
      return m;
    });
  };

  const sharePost = (postId: string) => {
    setInteractions((prev) => {
      const m = new Map(prev);
      const post = m.get(postId) || { postId, likes: [], comments: [], shares: 0 };
      post.shares++;
      m.set(postId, post);
      return m;
    });
  };

  // ✅ Follow / Unfollow
  const followUser = (userId: string, targetUserId: string) => {
    setFollows((prev) => {
      const m = new Map(prev);
      const list = m.get(userId) || [];
      if (!list.includes(targetUserId)) {
        m.set(userId, [...list, targetUserId]);
        localStorage.setItem(STORAGE_KEYS.FOLLOWS, JSON.stringify(Object.fromEntries(m)));
      }
      return m;
    });
  };

  const unfollowUser = (userId: string, targetUserId: string) => {
    setFollows((prev) => {
      const m = new Map(prev);
      const list = m.get(userId) || [];
      const updated = list.filter((id) => id !== targetUserId);
      m.set(userId, updated);
      localStorage.setItem(STORAGE_KEYS.FOLLOWS, JSON.stringify(Object.fromEntries(m)));
      return m;
    });
  };

  const isFollowing = (userId: string, targetUserId: string) => {
    const list = follows.get(userId) || [];
    return list.includes(targetUserId);
  };

  // ✅ Getters
  const getPostInteractions = (id: string) =>
    interactions.get(id) || { postId: id, likes: [], comments: [], shares: 0 };

  const getFollowedPosts = (userId: string) => {
    const list = follows.get(userId) || [];
    return posts.filter((p) => p.userId && list.includes(p.userId));
  };

  const getUserPosts = (userId: string) => userPosts.filter((p) => p.userId === userId);

  const addUserPost = (data: Omit<SocialPost, "id" | "type" | "publishedAt">) => {
    const newPost: SocialPost = {
      ...data,
      id: `user_post_${Date.now()}`,
      type: "user",
      publishedAt: new Date(),
      userId: user?.id || "anon",
    };
    setUserPosts((prev) => [newPost, ...prev]);
  };

  const getTrendingHashtags = (): { tag: string; count: number }[] => {
    const tagCounts = new Map<string, number>();
    posts.forEach((p) => p.tags?.forEach((tag) => tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)));
    return Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  };

  return (
    <SocialFeedContext.Provider
      value={{
        posts,
        interactions,
        follows,
        likePost,
        unlikePost,
        addComment,
        sharePost,
        followUser,
        unfollowUser,
        isFollowing,
        getPostInteractions,
        getFollowedPosts,
        getUserPosts,
        addUserPost,
        getTrendingHashtags,
        refreshFeed,
        lastRefreshed,
      }}
    >
      {children}
    </SocialFeedContext.Provider>
  );
};

// ✅ Hook
export const useSocialFeed = () => {
  const context = useContext(SocialFeedContext);
  if (!context) throw new Error("useSocialFeed must be used within a SocialFeedProvider");
  return context;
};
