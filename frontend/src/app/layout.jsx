import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/cart/CartDrawer';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { ToastProvider } from '@/components/ui/Toast';

export const metadata = {
    title: 'Caseify Now — Premium Phone Cases & Accessories',
    description: 'Premium phone cases and accessories for every device. Quality, style, protection.'
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body className="min-h-screen bg-background text-text">
                <AuthProvider>
                    <CartProvider>
                        <ToastProvider>
                            <Header />
                            <main className="min-h-[60vh]">{children}</main>
                            <Footer />
                            <CartDrawer />
                        </ToastProvider>
                    </CartProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
