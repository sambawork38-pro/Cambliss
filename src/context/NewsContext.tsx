import React, { createContext, useContext, useState, useEffect } from 'react';
import { generateNewsArticles, generateArticlesByCategory } from '../utils/newsGenerator';
import { useLanguage } from './LanguageContext';

interface Article {
  id: string;
  title: string;
  summary: string;
  content: string;
  imageUrl: string;
  author: string;
  publishedAt: Date;
  category: string;
  source: string;
  readTime: number;
  tags: string[];
  isPremium: boolean;
  language: string;
  localizedContent?: Record<string, { title: string; summary: string; content: string }>;
  culturalContext?: string;
  regionalRelevance?: string[];
  videoUrl?: string;
  isUserGenerated?: boolean;
}

interface NewsContextType {
  articles: Article[];
  lastUpdated: Date | null;
  isLoading: boolean;
  refreshNews: () => void;
  getArticlesByCategory: (category: string) => Article[];
  searchArticles: (query: string) => Article[];
  getLocalizedArticles: (language: string) => Article[];
  translateArticle: (article: Article, targetLanguage: string) => Article;
  personalizedArticles: Article[];
  refreshPersonalizedNews: () => void;
  addNewsArticle: (article: Omit<Article, 'id' | 'readTime' | 'isPremium' | 'language'>) => void;
  getUserArticles: (author: string) => Article[];
}

const NewsContext = createContext<NewsContextType | undefined>(undefined);

export const NewsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [localizedArticles, setLocalizedArticles] = useState<Record<string, Article[]>>({});
  const [personalizedArticles, setPersonalizedArticles] = useState<Article[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('user_articles');
    if (stored) {
      try {
        const userArticles = JSON.parse(stored);
        setArticles(prev => [...userArticles, ...prev]);
      } catch (e) {
        console.error('Error loading user articles from localStorage:', e);
      }
    }
  }, []);

  const categories = ['breaking', 'politics', 'india', 'world', 'business', 'technology', 'sports', 'entertainment', 'health'];
  const supportedLanguages = ['en', 'hi', 'or', 'bn', 'ta', 'te', 'gu', 'mr', 'kn', 'pa'];

  const refreshNews = async (language: string = 'en') => {
    setIsLoading(true);
    try {
      const allArticles: Article[] = [];
      const allLocalizedArticles: Record<string, Article[]> = {};
      
      // Generate 100+ articles per category for comprehensive coverage
      for (const category of categories) {
        // Generate 100+ English articles per category
        const englishArticles = generateArticlesByCategory(category, 100, 'en');
        allArticles.push(...englishArticles);
        
        // Generate localized articles for each supported language
        for (const lang of supportedLanguages) {
          if (lang !== 'en') {
            if (!allLocalizedArticles[lang]) {
              allLocalizedArticles[lang] = [];
            }
            const localizedCategoryArticles = generateArticlesByCategory(category, 100, lang);
            allLocalizedArticles[lang].push(...localizedCategoryArticles);
          }
        }
      }
      
      // Sort all articles by publish time (newest first)
      allArticles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
      
      // Sort localized articles
      Object.keys(allLocalizedArticles).forEach(lang => {
        allLocalizedArticles[lang].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
      });
      
      setArticles(allArticles);
      setLocalizedArticles(allLocalizedArticles);
      setLastUpdated(new Date());
      
      console.log(`News refreshed: ${allArticles.length} total articles across ${categories.length} categories`);
    } catch (error) {
      console.error('Error refreshing news:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshPersonalizedNews = async () => {
    try {
      // Generate personalized content mix
      const personalizedContent: Article[] = [];
      
      // Mix of trending topics and user interests
      const trendingCategories = ['breaking', 'politics', 'technology', 'business'];
      for (const category of trendingCategories) {
        const categoryArticles = generateArticlesByCategory(category, 25, 'en');
        personalizedContent.push(...categoryArticles);
      }
      
      // Sort by relevance and recency
      personalizedContent.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
      
      setPersonalizedArticles(personalizedContent.slice(0, 50));
      console.log('Personalized news refreshed: 50 articles');
    } catch (error) {
      console.error('Error refreshing personalized news:', error);
    }
  };
  const getLocalizedArticles = (language: string): Article[] => {
    if (language === 'en') {
      return articles;
    }
    return localizedArticles[language] || articles;
  };

  const translateArticle = (article: Article, targetLanguage: string): Article => {
    if (targetLanguage === 'en') {
      return article;
    }
    
    // In a real implementation, this would call a translation API
    // For now, return the localized version if available
    const localizedVersions = localizedArticles[targetLanguage] || [];
    const matchingArticle = localizedVersions.find(a => 
      a.category === article.category && 
      Math.abs(new Date(a.publishedAt).getTime() - new Date(article.publishedAt).getTime()) < 3600000
    );
    
    return matchingArticle || article;
  };
  const getArticlesByCategory = (category: string): Article[] => {
    if (category === 'home' || category === 'breaking') {
      // Return mix of latest articles from all categories, prioritizing breaking news
      const breakingArticles = articles.filter(article => article.category === 'breaking').slice(0, 10);
      const otherArticles = articles.filter(article => article.category !== 'breaking').slice(0, 25);
      return [...breakingArticles, ...otherArticles];
    }
    
    const categoryArticles = articles.filter(article => 
      article.category.toLowerCase() === category.toLowerCase()
    );
    
    // Return up to 100 articles per category
    return categoryArticles.slice(0, 100);
  };

  const searchArticles = (query: string): Article[] => {
    const searchTerm = query.toLowerCase();
    const results = articles.filter(article =>
      article.title.toLowerCase().includes(searchTerm) ||
      article.summary.toLowerCase().includes(searchTerm) ||
      article.content.toLowerCase().includes(searchTerm) ||
      article.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
      article.author.toLowerCase().includes(searchTerm) ||
      article.source.toLowerCase().includes(searchTerm)
    );
    
    // Return top 50 most relevant results
    return results.slice(0, 50);
  };

  useEffect(() => {
    refreshNews();
    refreshPersonalizedNews();
    
    // Real-time updates every 2 minutes (120,000ms)
    const newsInterval = setInterval(() => {
      refreshNews();
    }, 120000);
    
    // Personalized news updates every 10 minutes (600,000ms)
    const personalizedInterval = setInterval(() => {
      refreshPersonalizedNews();
    }, 600000);
    
    return () => {
      clearInterval(newsInterval);
      clearInterval(personalizedInterval);
    };
  }, []);

  const addNewsArticle = (articleData: Omit<Article, 'id' | 'readTime' | 'isPremium' | 'language'>) => {
    const newArticle: Article = {
      ...articleData,
      id: `user_${Date.now()}_${Math.random()}`,
      readTime: Math.ceil(articleData.content.split(' ').length / 200),
      isPremium: false,
      language: 'en',
      isUserGenerated: true
    };

    const updated = [newArticle, ...articles];
    setArticles(updated);

    const userArticles = updated.filter(a => a.isUserGenerated);
    localStorage.setItem('user_articles', JSON.stringify(userArticles));
  };

  const getUserArticles = (author: string): Article[] => {
    return articles.filter(article => article.author === author && article.isUserGenerated);
  };

  const value = {
    articles,
    personalizedArticles,
    lastUpdated,
    isLoading,
    refreshNews,
    refreshPersonalizedNews,
    getArticlesByCategory,
    searchArticles,
    getLocalizedArticles,
    translateArticle,
    addNewsArticle,
    getUserArticles
  };

  return <NewsContext.Provider value={value}>{children}</NewsContext.Provider>;
};

export const useNews = () => {
  const context = useContext(NewsContext);
  if (context === undefined) {
    throw new Error('useNews must be used within a NewsProvider');
  }
  return context;
};