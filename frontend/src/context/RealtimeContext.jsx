import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Bell, CheckCircle2, AlertTriangle, ArrowRight, X } from 'lucide-react';
import { useAuth } from './AuthContext';

const RealtimeContext = createContext(null);

export const RealtimeProvider = ({ children }) => {
  const { user, refreshWallet } = useAuth();
  const navigate = useNavigate();
  const esRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!user || !token) {
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
      return;
    }

    let isSubscribed = true;

    const connectSSE = () => {
      if (!isSubscribed) return;
      const currentToken = localStorage.getItem('token');
      if (!currentToken) return;

      const baseUrl = import.meta.env.VITE_API_URL || '/api';
      const streamUrl = `${baseUrl}/notifications/stream?token=${encodeURIComponent(currentToken)}`;

      if (esRef.current) {
        esRef.current.close();
      }

      const es = new EventSource(streamUrl);
      esRef.current = es;

      es.addEventListener('connected', (e) => {
        // Connection established
      });

      es.addEventListener('ping', () => {
        // Heartbeat received
      });

      es.addEventListener('notification:new', (e) => {
        try {
          const notif = JSON.parse(e.data);
          
          // Show interactive toast
          toast.custom((t) => (
            <div
              className={`${
                t.visible ? 'animate-enter' : 'animate-leave'
              } max-w-md w-full bg-gray-900 border border-purple-500/40 shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black/20 p-4 transition-all duration-200`}
            >
              <div className="flex-1 w-0 flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Bell className="h-5 w-5 text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-white">
                    {notif.title || 'New Notification'}
                  </p>
                  <p className="mt-1 text-xs text-gray-300 leading-relaxed line-clamp-2">
                    {notif.message}
                  </p>
                  {notif.link && (
                    <button
                      onClick={() => {
                        toast.dismiss(t.id);
                        navigate(notif.link);
                      }}
                      className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      View Details <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 ml-2">
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="rounded-lg p-1 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ), { duration: 6000 });

          // Dispatch window event so components like NotificationDropdown can react instantly
          window.dispatchEvent(new CustomEvent('tk:notification-new', { detail: notif }));
        } catch (parseErr) {
          console.error('[SSE] Failed to parse notification:new', parseErr);
        }
      });

      // Domain Events
      const handleDomainEvent = (eventName, windowEventName) => {
        es.addEventListener(eventName, (e) => {
          try {
            const data = e.data ? JSON.parse(e.data) : {};
            window.dispatchEvent(new CustomEvent(windowEventName, { detail: data }));
            
            // If wallet-relevant, refresh wallet
            if (eventName === 'wallet:updated' || eventName === 'submission:approved') {
              refreshWallet?.();
            }
          } catch (err) {
            console.error(`[SSE] Error processing ${eventName}:`, err);
          }
        });
      };

      handleDomainEvent('job:created', 'tk:job-created');
      handleDomainEvent('job:updated', 'tk:job-updated');
      handleDomainEvent('job:approved', 'tk:job-approved');
      handleDomainEvent('job:rejected', 'tk:job-rejected');
      handleDomainEvent('job:paused', 'tk:job-paused');
      handleDomainEvent('job:resumed', 'tk:job-resumed');
      handleDomainEvent('submission:created', 'tk:submission-created');
      handleDomainEvent('submission:approved', 'tk:submission-approved');
      handleDomainEvent('submission:rejected', 'tk:submission-rejected');
      handleDomainEvent('submission:resubmit_required', 'tk:submission-resubmit-required');
      handleDomainEvent('wallet:updated', 'tk:wallet-updated');
      handleDomainEvent('announcement:updated', 'tk:announcement-updated');
      handleDomainEvent('announcement:deleted', 'tk:announcement-deleted');
      handleDomainEvent('advertisement:updated', 'tk:advertisement-updated');
      handleDomainEvent('advertisement:deleted', 'tk:advertisement-deleted');

      es.onerror = () => {
        // SSE handles reconnection automatically, but if closed, reconnect after delay
        if (es.readyState === EventSource.CLOSED && isSubscribed) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connectSSE();
          }, 5000);
        }
      };
    };

    connectSSE();

    return () => {
      isSubscribed = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
    };
  }, [user]);

  return (
    <RealtimeContext.Provider value={{}}>
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = () => useContext(RealtimeContext);
