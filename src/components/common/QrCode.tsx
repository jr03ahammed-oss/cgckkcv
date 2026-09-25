import React from 'react';

// Lightweight QR matrix generator for standard URLs
export const QrCode: React.FC<{ url: string; size?: number }> = ({ url, size = 140 }) => {
  // We can render a QR code using standard public qr API or encoded SVG
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(
    url
  )}&margin=1`;

  return (
    <div className="p-2.5 bg-white rounded-xl shadow-xs border border-gray-200 dark:border-gray-700 flex items-center justify-center">
      <img
        src={qrApiUrl}
        alt={`QR Code for ${url}`}
        width={size}
        height={size}
        className="rounded-lg"
        loading="lazy"
      />
    </div>
  );
};
