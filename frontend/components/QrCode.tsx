"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

interface QrCodeProps {
  value: string;
  size?: number;
}

// Real black-on-white contrast (wrapped in a light card) so the code stays
// genuinely scannable-looking even sitting on a dark terminal UI -- more
// than cosmetic, since a QR that isn't high-contrast is a QR that doesn't
// actually work.
export function QrCode({ value, size = 220 }: QrCodeProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(value, {
      width: size,
      margin: 1,
      color: { dark: "#0b1220", light: "#ffffff" },
    })
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [value, size]);

  if (!dataUrl) {
    return (
      <div
        style={{ width: size, height: size }}
        className="animate-pulse rounded-xl bg-elevated"
        aria-hidden
      />
    );
  }

  return (
    <div className="inline-flex rounded-xl bg-white p-4 shadow-lg">
      {/* eslint-disable-next-line @next/next/no-img-element -- data: URL, not an optimizable static asset */}
      <img src={dataUrl} width={size} height={size} alt="Verification request QR code" />
    </div>
  );
}
