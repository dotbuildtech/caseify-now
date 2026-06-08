import './globals.css';
import { Outfit, Fraunces, DM_Mono } from 'next/font/google';
import AnnouncementBar from '@/components/layout/AnnouncementBar';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { ToastProvider } from '@/components/ui/Toast';

const outfit = Outfit({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-display', display: 'swap', axes: ['opsz'] });
const dmMono = DM_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap', weight: ['400', '500'] });

export const metadata = {
    title: 'DotBuild — Premium Phone Cases & Accessories',
    description: 'Premium phone cases and accessories for every device. Quality, style, protection.'
};

export default function RootLayout({ children }) {
    return (
        <html lang="en" className={`${outfit.variable} ${fraunces.variable} ${dmMono.variable}`}>
            <body className="min-h-screen bg-background text-text">
                <AuthProvider>
                    <CartProvider>
                        <ToastProvider>
                            <AnnouncementBar />
                            <Header />
                            <main className="min-h-[60vh]">{children}</main>
                            <Footer />
                        </ToastProvider>
                    </CartProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
