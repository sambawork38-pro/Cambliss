import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Globe, Search, Menu, X, Clock, Radio, Zap, Users, Tv, User, LogOut, MessageSquare, Crown, Star, Plus } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useNews } from '../context/NewsContext';
import { useAuth } from '../context/AuthContext';
import LoginModal from './LoginModal';
import MyNewsModal from './MyNewsModal';
import AddNewsModal from './AddNewsModal';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMyNewsModal, setShowMyNewsModal] = useState(false);
  const [showAddNewsModal, setShowAddNewsModal] = useState(false);
  const [hasMyNewsPreferences, setHasMyNewsPreferences] = useState(false);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  const { currentLanguage, setLanguage, languages, translations } = useLanguage();
  const { lastUpdated, articles, refreshNews, personalizedArticles } = useNews();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const categories = [
    { name: 'Home', path: '/', key: 'home' },
    { name: 'Cambliss Social', path: '/social', key: 'social', icon: MessageSquare },
    { name: 'India', path: '/category/india', key: 'india' },
    { name: 'World', path: '/category/world', key: 'world' },
    { name: 'Business', path: '/category/business', key: 'business' },
    { name: 'Technology', path: '/category/technology', key: 'technology' },
    { name: 'Sports', path: '/category/sports', key: 'sports' },
    { name: 'Entertainment', path: '/category/entertainment', key: 'entertainment' },
    { name: 'Health', path: '/category/health', key: 'health' }
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/news/search?q=${encodeURIComponent(searchQuery)}&lang=${currentLanguage}&t=${Date.now()}`);
      setSearchQuery('');
      setIsMenuOpen(false);
    }
  };

  const formatLastUpdated = () => {
    if (!lastUpdated) return '';
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastUpdated.getTime()) / 1000);
    
    if (diff < 60) return `Updated ${diff}s ago`;
    if (diff < 120) return `Updated 1m ago`;
    if (diff < 3600) return `Updated ${Math.floor(diff / 60)}m ago`;
    return `Updated ${Math.floor(diff / 3600)}h ago`;
  };

  const isActivePath = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path === '/social' && location.pathname === '/social') return true;
    return location.pathname.startsWith(path) && path !== '/';
  };

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      const saved = localStorage.getItem(`myNewsCategories_${user.id}`);
      const hasSeenModal = localStorage.getItem(`myNewsModalSeen_${user.id}`);

      if (saved) {
        setHasMyNewsPreferences(true);
      } else {
        setHasMyNewsPreferences(false);
        if (!hasSeenModal) {
          setIsFirstTimeUser(true);
          setTimeout(() => {
            setShowMyNewsModal(true);
          }, 1000);
        }
      }
    } else {
      setHasMyNewsPreferences(false);
    }
  }, [user, isAuthenticated]);

  const handleMyNewsSave = (categories: string[]) => {
    if (user) {
      localStorage.setItem(`myNewsCategories_${user.id}`, JSON.stringify(categories));
      localStorage.setItem(`myNewsModalSeen_${user.id}`, 'true');
      setHasMyNewsPreferences(true);
      setIsFirstTimeUser(false);
      navigate('/my-news');
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bbc-header z-40">
      {/* Top News Bar */}
      <div className="bbc-breaking text-white py-2 relative">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between text-xs font-medium">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="bbc-live flex items-center space-x-2">
                  <Radio className="w-3 h-3 animate-pulse" />
                  <span>LIVE</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-1 bg-white/20 px-3 py-1">
                <Clock className="w-3 h-3" />
                <span>{formatLastUpdated()}</span>
              </div>
              
              <div className="flex items-center space-x-1 bg-white/20 px-3 py-1">
                <Users className="w-3 h-3" />
                <span>{articles.length}+ Articles</span>
              </div>
              
              <div className="flex items-center space-x-1 bg-white/20 px-3 py-1">
                <Radio className="w-3 h-3 animate-pulse" />
                <span>Live Updates</span>
              </div>
              
              <button
                onClick={refreshNews}
                className="bbc-button flex items-center space-x-1 px-3 py-1 text-white bg-white/20 hover:bg-white/30 transition-all"
              >
                <Zap className="w-3 h-3" />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={currentLanguage}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-white/20 text-white text-xs border-none outline-none cursor-pointer px-3 py-1"
              >
                {languages.map(lang => (
                  <option key={lang.code} value={lang.code} className="bg-black text-white">
                    {lang.nativeName}
                  </option>
                ))}
              </select>

              <Link
                to="/subscription"
                className="hidden md:flex items-center space-x-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 px-3 py-1 transition-all"
              >
                <Crown className="w-3 h-3" />
                <span className="text-xs font-bold">Premium</span>
              </Link>

              {isAuthenticated && user && (
                <div className="hidden md:flex items-center space-x-2 bg-white/20 px-3 py-1">
                  <User className="w-3 h-3" />
                  <span className="text-xs">{user.camblissPoints} pts</span>
                </div>
              )}

              <div className="hidden md:block bg-white/20 px-3 py-1">
                {new Date().toLocaleDateString(currentLanguage === 'hi' ? 'hi-IN' : currentLanguage === 'or' ? 'or-IN' : 'en-IN', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric'
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="bbc-nav">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link to="/" className="flex items-center space-x-3 group">
                <div className="relative">
                  <div className="bg-red-600 p-2">
                    <Tv className="w-8 h-8 text-white group-hover:text-red-200 transition-colors" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-red-600 animate-pulse"></div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bbc-heading text-black group-hover:text-red-600 transition-colors">
                    Cambliss
                  </h1>
                  <p className="text-xs bbc-text font-medium -mt-1 uppercase tracking-wider bbc-accent">
                    NEWS
                  </p>
                </div>
              </Link>

              <nav className="hidden lg:flex space-x-2">
                {categories.slice(0, 1).map(category => (
                  <Link
                    key={category.key}
                    to={category.path}
                    className={`bbc-nav-item px-5 py-2 text-sm font-medium transition-all duration-200 ${
                      isActivePath(category.path)
                        ? 'active'
                        : ''
                    }`}
                  >
                    {translations[category.key] || category.name}
                  </Link>
                ))}

                {hasMyNewsPreferences && isAuthenticated && (
                  <Link
                    to="/my-news"
                    className={`bbc-nav-item px-5 py-2 text-sm font-medium transition-all duration-200 flex items-center space-x-1 ${
                      location.pathname === '/my-news'
                        ? 'active'
                        : ''
                    }`}
                  >
                    <Star className="w-4 h-4" />
                    <span>My News</span>
                  </Link>
                )}

                {categories.slice(1).map(category => (
                  <Link
                    key={category.key}
                    to={category.path}
                    className={`bbc-nav-item px-5 py-2 text-sm font-medium transition-all duration-200 ${
                      isActivePath(category.path)
                        ? 'active'
                        : ''
                    }`}
                  >
                    {translations[category.key] || category.name}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="flex items-center space-x-3">
              <form onSubmit={handleSearch} className="hidden md:flex items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={translations.searchPlaceholder}
                    className="bbc-search pl-10 pr-4 py-2.5 w-56 transition-all"
                  />
                </div>
              </form>

              {/* Add News & User Posts Buttons */}
              {isAuthenticated && user && (
                <div className="flex items-center gap-2 hidden sm:flex">
                  <button
                    onClick={() => setShowAddNewsModal(true)}
                    className="flex items-center gap-1 bg-gradient-to-r from-blue-600 to-indigo-500 text-white px-3 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-600 transition font-medium text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Add News
                  </button>
                  <Link
                    to="/user-posts"
                    className="flex items-center gap-1 border border-indigo-500 text-indigo-600 px-3 py-2 rounded-lg hover:bg-indigo-50 transition font-medium text-sm"
                  >
                    <Users className="w-4 h-4" />
                    Posts
                  </Link>
                </div>
              )}

              {/* User Menu */}
              {isAuthenticated && user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 bbc-button p-2 transition-colors"
                  >
                    <img
                      src={user.avatar}
                      alt={user.fullName}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <span className="hidden md:inline text-sm font-medium">{user.username}</span>
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50">
                      <div className="px-4 py-3 border-b border-gray-200">
                        <p className="font-medium text-gray-900">{user.fullName}</p>
                        <p className="text-sm text-gray-600">@{user.username}</p>
                        <p className="text-xs text-red-600 mt-1">{user.camblissPoints} Cambliss Points</p>
                      </div>
                      
                      <Link
                        to="/dashboard"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <User className="w-4 h-4 mr-3" />
                        Dashboard
                      </Link>
                      
                      <Link
                        to="/dashboard"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <User className="w-4 h-4 mr-3" />
                        Dashboard
                      </Link>
                      
                      <button
                        to="/social"
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <MessageSquare className="w-4 h-4 mr-3" />
                        Social Feed
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="bbc-button-primary text-white px-4 py-2 font-medium text-sm"
                >
                  Sign In
                </button>
              )}

              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden bbc-button p-2 text-black transition-colors"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden bbc-nav border-t border-gray-200 shadow-lg">
            <div className="px-4 py-4">
              {/* Mobile Search */}
              <form onSubmit={handleSearch} className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={translations.searchPlaceholder}
                    className="bbc-search w-full pl-10 pr-4 py-2"
                  />
                </div>
              </form>
              
              {/* Mobile Navigation */}
              <nav className="space-y-1">
                {categories.slice(0, 1).map(category => (
                  <Link
                    key={category.key}
                    to={category.path}
                    className={`bbc-nav-item block px-3 py-2 text-base font-medium transition-colors mb-2 ${
                      isActivePath(category.path)
                        ? 'active'
                        : ''
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {translations[category.key] || category.name}
                  </Link>
                ))}

                {hasMyNewsPreferences && isAuthenticated && (
                  <Link
                    to="/my-news"
                    className={`bbc-nav-item block px-3 py-2 text-base font-medium transition-colors mb-2 flex items-center space-x-2 ${
                      location.pathname === '/my-news'
                        ? 'active'
                        : ''
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Star className="w-4 h-4" />
                    <span>My News</span>
                  </Link>
                )}

                {categories.slice(1).map(category => (
                  <Link
                    key={category.key}
                    to={category.path}
                    className={`bbc-nav-item block px-3 py-2 text-base font-medium transition-colors mb-2 ${
                      isActivePath(category.path)
                        ? 'active'
                        : ''
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {translations[category.key] || category.name}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        )}
      </div>
      </header>

      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
      <MyNewsModal
        isOpen={showMyNewsModal}
        onClose={() => {
          setShowMyNewsModal(false);
          if (isFirstTimeUser && user) {
            localStorage.setItem(`myNewsModalSeen_${user.id}`, 'true');
          }
        }}
        onSave={handleMyNewsSave}
        initialCategories={[]}
        isFirstTime={isFirstTimeUser}
      />
      <AddNewsModal
        isOpen={showAddNewsModal}
        onClose={() => setShowAddNewsModal(false)}
      />
    </>
  );
};

export default Header;