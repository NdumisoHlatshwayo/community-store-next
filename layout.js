import "./globals.css";
export const metadata = { title: "Community Store", description: "Mobile-first campus and local community marketplace" };
export default function RootLayout({ children }) {
  return (<html lang="en"><head>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  </head><body>{children}</body></html>);
}
