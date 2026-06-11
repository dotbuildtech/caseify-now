'use client';
import { useEffect, useRef } from 'react';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
let gisInitialized = false;

export default function GoogleSignInButton({ onSuccess, onError, text = 'continue_with' }) {
    const btnRef = useRef(null);

    useEffect(() => {
        if (!GOOGLE_CLIENT_ID) {
            console.error('NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set');
            return;
        }

        const handleCredentialResponse = (response) => {
            if (response?.credential) {
                onSuccess?.(response.credential);
            } else {
                onError?.(response?.error || 'Google sign-in failed');
            }
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

            if (btnRef.current && !btnRef.current.hasChildNodes()) {
                window.google.accounts.id.renderButton(btnRef.current, {
                    type: 'standard',
                    shape: 'rectangular',
                    theme: 'outline',
                    text,
                    size: 'large',
                    width: btnRef.current.clientWidth || '100%',
                    logo_alignment: 'left'
                });
            }
        };

        const existing = document.querySelector(
            'script[src="https://accounts.google.com/gsi/client"]'
        );
        if (existing && window.google?.accounts) {
            initGIS();
            return;
        }
        if (existing) {
            existing.addEventListener('load', initGIS, { once: true });
            return () => existing.removeEventListener('load', initGIS);
        }

        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = initGIS;
        document.body.appendChild(script);
    }, []);

    return <div ref={btnRef} className="w-full min-h-[40px]" />;
}
