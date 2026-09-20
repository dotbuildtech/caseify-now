'use client';
import { useEffect, useRef } from 'react';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
let gisInitialized = false;

export default function GoogleSignInButton({ onSuccess, onError, text = 'continue_with' }) {
    const btnRef = useRef(null);

    useEffect(() => {
        if (!GOOGLE_CLIENT_ID) {
            console.warn('NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set; Google Sign-In is disabled.');
            return;
        }

        const handleCredentialResponse = (response) => {
            if (response?.credential) {
                onSuccess?.(response.credential);
            } else {
                onError?.(response?.error || 'Google sign-in failed');
            }
        };

        const renderButton = () => {
            if (!btnRef.current || !window.google?.accounts?.id) return;

            // Measure actual container width, clamped between 200px and 400px (Google's strict limits)
            const measured = btnRef.current.clientWidth || btnRef.current.parentElement?.clientWidth || 400;
            const targetWidth = Math.min(400, Math.max(200, Math.floor(measured)));

            btnRef.current.innerHTML = '';
            window.google.accounts.id.renderButton(btnRef.current, {
                type: 'standard',
                shape: 'rectangular',
                theme: 'outline',
                text,
                size: 'large',
                width: targetWidth,
                logo_alignment: 'left'
            });
        };

        const initGIS = () => {
            if (!window.google?.accounts) return;

            if (!gisInitialized) {
                window.google.accounts.id.initialize({
                    client_id: GOOGLE_CLIENT_ID,
                    callback: handleCredentialResponse,
                    cancel_on_tap_outside: false
                });
                gisInitialized = true;
            }

            renderButton();
        };

        const existing = document.querySelector(
            'script[src="https://accounts.google.com/gsi/client"]'
        );
        if (existing && window.google?.accounts) {
            initGIS();
        } else if (existing) {
            existing.addEventListener('load', initGIS, { once: true });
        } else {
            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            script.onload = initGIS;
            script.onerror = () => {
                console.error('Failed to load Google Sign-In script');
                onError?.('Google Sign-In is currently unavailable');
            };
            document.body.appendChild(script);
        }

        let resizeObserver = null;
        if (typeof ResizeObserver !== 'undefined' && btnRef.current) {
            let lastWidth = 0;
            resizeObserver = new ResizeObserver((entries) => {
                for (const entry of entries) {
                    const currentWidth = Math.floor(entry.contentRect.width);
                    if (currentWidth > 0 && Math.abs(currentWidth - lastWidth) >= 4) {
                        lastWidth = currentWidth;
                        renderButton();
                    }
                }
            });
            resizeObserver.observe(btnRef.current);
        }

        const handleResize = () => {
            if (window.google?.accounts?.id) {
                renderButton();
            }
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (resizeObserver) resizeObserver.disconnect();
        };
    }, [onSuccess, onError, text]);

    return (
        <div className="w-full flex justify-center items-center">
            <div
                ref={btnRef}
                className="w-full max-w-[400px] flex justify-center items-center min-h-[44px]"
            />
        </div>
    );
}
