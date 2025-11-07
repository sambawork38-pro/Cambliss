import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useNews } from '../context/NewsContext';
import { useAuth } from '../context/AuthContext';

interface AddNewsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddNewsModal: React.FC<AddNewsModalProps> = ({ isOpen, onClose }) => {
  const { addNewsArticle } = useNews();
  const { user } = useAuth();
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    category: 'breaking',
    title: '',
    summary: '',
    content: '',
    imageUrl: '',
    videoUrl: '',
    source: '',
    tags: ''
  });

  const categories = ['breaking', 'politics', 'india', 'world', 'business', 'technology', 'sports', 'entertainment', 'health'];

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.title.trim().length < 10) {
      newErrors.title = 'Title must be at least 10 characters';
    }
    if (formData.summary.trim().length < 20) {
      newErrors.summary = 'Summary must be at least 20 characters';
    }
    if (formData.content.trim().length < 100) {
      newErrors.content = 'Full content must be at least 100 characters';
    }
    if (!formData.imageUrl.trim()) {
      newErrors.imageUrl = 'Image URL is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePublish = () => {
    if (!validate() || !user) return;

    const tagsArray = formData.tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag);

    addNewsArticle({
      title: formData.title.trim(),
      summary: formData.summary.trim(),
      content: formData.content.trim(),
      imageUrl: formData.imageUrl.trim(),
      videoUrl: formData.videoUrl.trim() || undefined,
      author: user.fullName,
      category: formData.category,
      source: formData.source.trim() || 'User Post',
      tags: tagsArray,
      publishedAt: new Date(),
      localizedContent: undefined,
      culturalContext: undefined,
      regionalRelevance: undefined
    });

    setShowSuccess(true);
    setTimeout(() => {
      setFormData({
        category: 'breaking',
        title: '',
        summary: '',
        content: '',
        imageUrl: '',
        videoUrl: '',
        source: '',
        tags: ''
      });
      setErrors({});
      setShowSuccess(false);
      onClose();
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-2xl w-full max-w-2xl shadow-lg overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Publish News</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {showSuccess && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
            News published successfully!
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              placeholder="Enter article title (min 10 characters)"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.title && <p className="text-red-600 text-sm mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Summary *
            </label>
            <textarea
              placeholder="Enter article summary (min 20 characters)"
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              rows={2}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                errors.summary ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.summary && <p className="text-red-600 text-sm mt-1">{errors.summary}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Content *
            </label>
            <textarea
              placeholder="Enter full article content (min 100 characters)"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={4}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                errors.content ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.content && <p className="text-red-600 text-sm mt-1">{errors.content}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Image URL *
            </label>
            <input
              type="url"
              placeholder="https://example.com/image.jpg"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                errors.imageUrl ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.imageUrl && <p className="text-red-600 text-sm mt-1">{errors.imageUrl}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Video URL (Optional)
            </label>
            <input
              type="url"
              placeholder="https://example.com/video.mp4 or YouTube link"
              value={formData.videoUrl}
              onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Source (Optional)
            </label>
            <input
              type="text"
              placeholder="Source of the news"
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags (Comma-separated, Optional)
            </label>
            <input
              type="text"
              placeholder="tag1, tag2, tag3"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
            TODO: Future integration for AI-powered fake news detection
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handlePublish}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition font-medium"
          >
            Publish News
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddNewsModal;
