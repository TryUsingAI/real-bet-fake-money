// src/app/layout.tsx
import "./globals.css";
import Script from "next/script";

export const metadata = {
  title: "Real Bets Fake Money",
  description: "Real betting, no risk, compete against others",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const ga = process.env.NEXT_PUBLIC_GA_ID;
  return (
    <html lang="en">
      <body className="bg-[#0b0f1a] text-white">
        {children}
        {ga && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga}`} strategy="afterInteractive" />
            <Script id="ga" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${ga}');
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
