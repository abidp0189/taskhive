import React, { useState, useEffect } from 'react';
import { Badge } from '../../components/common/Badge';
import { Bell, Check, CheckCheck } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications?limit=50');
      if (res.data?.success) setNotifications(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAllRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success('All marked as read');
    } catch (e) {
      toast.error('Failed to mark notifications read');
    }
  };

  return (
    <div className="py-8 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Notification Center
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            System updates, task approvals, referral credits, and payout notices.
          </p>
        </div>

        <button
          onClick={markAllRead}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-900 border border-gray-800 hover:bg-gray-800 text-xs font-semibold text-indigo-400"
        >
          <CheckCheck className="h-4 w-4" /> Mark All Read
        </button>
      </div>

      <div className="glass-panel rounded-3xl p-6 overflow-hidden border border-gray-800 space-y-3">
        {loading ? (
          <div className="py-16 text-center text-xs text-gray-500">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center text-xs text-gray-400">
            You don't have any notifications at the moment.
          </div>
        ) : (
          <div className="divide-y divide-gray-800/80">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`py-4 px-3 rounded-xl transition-colors flex items-start justify-between gap-4 ${
                  n.isRead ? 'opacity-70' : 'bg-indigo-950/20'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-white">{n.title}</h4>
                    <span className="text-[10px] text-gray-500">
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-300">{n.message}</p>
                </div>

                {!n.isRead && (
                  <span className="h-2 w-2 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
