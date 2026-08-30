import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

export const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  const fetchUnread = async () => {
    try {
      const res = await api.get('/notifications/unread-count');
      if (res.data?.success) {
        setUnreadCount(res.data.data.count);
      }
    } catch {
      // ignore
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications?limit=6');
      if (res.data?.success) {
        setNotifications(res.data.data);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // ignore
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // ignore
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-xl p-2 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors focus:outline-none"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl bg-gray-900 border border-gray-800 shadow-2xl p-4 z-50">
          <div className="flex items-center justify-between border-b border-gray-800 pb-3">
            <h4 className="font-semibold text-white text-sm">Notifications</h4>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium"
              >
                <CheckCheck className="h-3.5 w-3.5" /> Mark all read
              </button>
            )}
          </div>

          <div className="divide-y divide-gray-800/60 max-h-80 overflow-y-auto my-2">
            {notifications.length === 0 ? (
              <p className="text-center text-xs text-gray-500 py-6">No notifications</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3 rounded-lg transition-colors flex items-start justify-between gap-2 ${
                    n.isRead ? 'opacity-70 hover:bg-gray-800/40' : 'bg-indigo-950/20 hover:bg-indigo-950/40'
                  }`}
                >
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-white">{n.title}</p>
                    <p className="text-[11px] text-gray-300 mt-0.5">{n.message}</p>
                    <span className="text-[10px] text-gray-500 mt-1 block">
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {!n.isRead && (
                    <button
                      onClick={() => markAsRead(n.id)}
                      className="text-gray-500 hover:text-indigo-400 p-1"
                      title="Mark as read"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="border-t border-gray-800 pt-2 text-center">
            <Link
              to="/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium block py-1"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
