import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';

export const WorkerAdvertisementBanner = ({ advertisement }) => {
  const [imageError, setImageError] = useState(false);

  if (!advertisement || !advertisement.isActive || !advertisement.imageUrl || imageError) {
    return null;
  }

  const isExternal = /^https?:\/\//i.test(advertisement.destinationUrl);
  const title = advertisement.title?.trim() || 'Paid';

  const Content = (
    <div className="relative overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-md group transition-all duration-300 hover:shadow-xl hover:border-purple-500/40">
      {/* Banner Image */}
      <img
        src={advertisement.imageUrl}
        alt={title}
        onError={() => setImageError(true)}
        className="w-full h-36 sm:h-48 md:h-56 object-cover object-center group-hover:scale-[1.015] transition-transform duration-500"
      />

      {/* Subtle overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10 pointer-events-none" />

      {/* Badge / Label Overlay (Bottom-left or top-right) */}
      <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 flex items-center gap-2 pointer-events-none">
        <span className="px-3 py-1 rounded-xl text-[11px] font-black uppercase tracking-wider bg-black/70 backdrop-blur-md text-white border border-white/20 shadow-md">
          {title}
        </span>
      </div>

      {/* External Link Hint (Bottom-right) */}
      <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-md text-[11px] font-semibold text-white/90 border border-white/20 opacity-90 group-hover:opacity-100 transition-opacity">
        <span className="text-[10px] hidden sm:inline font-medium">Visit</span>
        <ExternalLink className="h-3 w-3" />
      </div>
    </div>
  );

  if (isExternal) {
    return (
      <a
        id="worker-advertisement-banner"
        href={advertisement.destinationUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-3xl"
      >
        {Content}
      </a>
    );
  }

  return (
    <Link
      id="worker-advertisement-banner"
      to={advertisement.destinationUrl || '/'}
      className="block cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-3xl"
    >
      {Content}
    </Link>
  );
};
