import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./theme.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Seismic Simulation & Analysis",
  description: "3D visualization and analysis of seismic activity",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/earthquake.svg" type="image/svg+xml" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // WebGL polyfill and detection
              (function() {
                // Add WebGL detection
                window.hasWebGL = (function() {
                  try {
                    var canvas = document.createElement('canvas');
                    return !!(
                      window.WebGLRenderingContext && 
                      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
                    );
                  } catch(e) {
                    return false;
                  }
                })();
                
                // Warn about WebGL requirement
                if (!window.hasWebGL) {
                  console.warn('WebGL is not available on this device. 3D visualization may not work properly.');
                }
                
                // Force hardware acceleration if possible
                var style = document.createElement('style');
                style.textContent = 
                  'canvas { transform: translateZ(0); will-change: transform; }' +
                  '.force-gpu { transform: translate3d(0,0,0); backface-visibility: hidden; perspective: 1000; }';
                document.head.appendChild(style);
              })();
            `,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}