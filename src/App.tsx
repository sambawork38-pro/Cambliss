import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import MyNewsPage from './pages/MyNewsPage';
import CategoryPage from './pages/CategoryPage';
import SearchPage from './pages/SearchPage';
import SocialPage from './pages/SocialPage';
import UserDashboard from './components/UserDashboard';
import FullArticle from './components/FullArticle';
import Chatbot from './components/Chatbot';
import VoiceReader from './components/VoiceReader';
import UserPosts from './pages/UserPosts';
import { NewsProvider } from './context/NewsContext';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import { SubscriptionProvider } from './context/SubscriptionContext';
import { SocialFeedProvider } from './context/SocialFeedContext';
import SubscriptionPage from './pages/SubscriptionPage';
import SubscriptionSuccess from './pages/SubscriptionSuccess';

function App() {
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [showFullArticle, setShowFullArticle] = useState(false);

  return (
    <AuthProvider>
      <SubscriptionProvider>
        <NewsProvider>
          <SocialFeedProvider>
            <LanguageProvider>
              <Router>
            <div className="min-h-screen bg-gray-50">
              <Header />
              <main className="pt-20">
                <Routes>
                  <Route path="/" element={<HomePage onArticleClick={(article) => {
                    setSelectedArticle(article);
                    setShowFullArticle(true);
                  }} />} />
                  <Route path="/my-news" element={<MyNewsPage onArticleClick={(article) => {
                    setSelectedArticle(article);
                    setShowFullArticle(true);
                  }} />} />
                  <Route path="/user-posts" element={<UserPosts />} />
                  <Route path="/social" element={<SocialPage />} />
                  <Route path="/dashboard" element={<UserDashboard />} />
                  <Route path="/category/:categoryName" element={<CategoryPage onArticleClick={(article) => {
                    setSelectedArticle(article);
                    setShowFullArticle(true);
                  }} />} />
                  <Route path="/news/:type" element={<SearchPage onArticleClick={(article) => {
                    setSelectedArticle(article);
                    setShowFullArticle(true);
                  }} />} />
                  <Route path="/subscription" element={<SubscriptionPage />} />
                  <Route path="/subscription/success" element={<SubscriptionSuccess />} />
                </Routes>
              </main>
              
              <Footer />
              
              {showFullArticle && selectedArticle && (
                <FullArticle 
                  article={selectedArticle}
                  onClose={() => setShowFullArticle(false)}
                />
              )}
              
              <VoiceReader />
              <Chatbot />
            </div>
            </Router>
          </LanguageProvider>
        </NewsProvider>
      </SubscriptionProvider>
    </AuthProvider>
  );
}

export default App;