'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';

export default function AdminAnalyticsPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Trigger a custom event to refresh analytics data
    window.dispatchEvent(new CustomEvent('refreshAnalytics'));
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-gray-700/50"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Admin Analytics Dashboard</h1>
            <p className="text-gray-400">Real-time analytics & insights</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="bg-primary/20 hover:bg-primary/30 p-3 rounded-xl transition-colors disabled:opacity-50"
              title="Refresh Data"
            >
              <RefreshCw
                size={20}
                className={`text-primary ${isRefreshing ? 'animate-spin' : ''}`}
              />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Analytics Dashboard */}
      <AnalyticsDashboard />
    </div>
  );
}

