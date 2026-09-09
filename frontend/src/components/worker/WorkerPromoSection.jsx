import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { WorkerAnnouncementBanner } from './WorkerAnnouncementBanner';
import { WorkerAdvertisementBanner } from './WorkerAdvertisementBanner';

export const WorkerPromoSection = () => {
  const [promotions, setPromotions] = useState({ announcement: null, advertisement: null });
  const [loading, setLoading] = useState(true);

  const fetchActivePromotions = async () => {
    try {
      const res = await api.get('/promotions/active');
      if (res.data?.success) {
        setPromotions(res.data.data || { announcement: null, advertisement: null });
      }
    } catch (err) {
      console.error('[WorkerPromoSection] Failed to load active promotions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivePromotions();

    const handleAnnouncementUpdated = (e) => {
      const updated = e.detail;
      setPromotions((prev) => ({
        ...prev,
        announcement: updated && updated.isActive ? updated : null,
      }));
    };

    const handleAnnouncementDeleted = () => {
      setPromotions((prev) => ({ ...prev, announcement: null }));
    };

    const handleAdvertisementUpdated = (e) => {
      const updated = e.detail;
      setPromotions((prev) => ({
        ...prev,
        advertisement: updated && updated.isActive ? updated : null,
      }));
    };

    const handleAdvertisementDeleted = () => {
      setPromotions((prev) => ({ ...prev, advertisement: null }));
    };

    window.addEventListener('tk:announcement-updated', handleAnnouncementUpdated);
    window.addEventListener('tk:announcement-deleted', handleAnnouncementDeleted);
    window.addEventListener('tk:advertisement-updated', handleAdvertisementUpdated);
    window.addEventListener('tk:advertisement-deleted', handleAdvertisementDeleted);

    return () => {
      window.removeEventListener('tk:announcement-updated', handleAnnouncementUpdated);
      window.removeEventListener('tk:announcement-deleted', handleAnnouncementDeleted);
      window.removeEventListener('tk:advertisement-updated', handleAdvertisementUpdated);
      window.removeEventListener('tk:advertisement-deleted', handleAdvertisementDeleted);
    };
  }, []);

  const hasAnnouncement = Boolean(promotions.announcement && promotions.announcement.isActive);
  const hasAdvertisement = Boolean(promotions.advertisement && promotions.advertisement.isActive);

  if (!hasAnnouncement && !hasAdvertisement) {
    return null;
  }

  return (
    <section className="space-y-4" aria-label="Announcements and Advertisements">
      <WorkerAnnouncementBanner announcement={promotions.announcement} />
      <WorkerAdvertisementBanner advertisement={promotions.advertisement} />
    </section>
  );
};
