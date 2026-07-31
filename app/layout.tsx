import "./globals.css";

export const metadata = {
  title: "Factoryfeed · Daily Ops Sheet",
  description: "Daily and weekly content & app ops checklist for Factoryfeed"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
