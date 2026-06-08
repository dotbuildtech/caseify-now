'use client';
import { useState } from 'react';
import Image from 'next/image';

const FALLBACK = 'https://images.unsplash.com/photo-1526738549149-8e07ead6a224?auto=format&fit=crop&w=600&q=70';

export default function SmartImage({
    src,
    alt = '',
    className = '',
    fill = false,
    width,
    height,
    sizes,
    priority = false,
    quality = 70,
    ...rest
}) {
    const [errored, setErrored] = useState(false);
    const finalSrc = !src || errored ? FALLBACK : src;
    const isDataUrl = finalSrc.startsWith('data:');
    const isUnsplash = finalSrc.includes('images.unsplash.com');

    if (fill) {
        return (
            <Image
                src={finalSrc}
                alt={alt}
                fill
                sizes={sizes || '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw'}
                quality={quality}
                priority={priority}
                unoptimized={isUnsplash || isDataUrl}
                onError={() => setErrored(true)}
                className={className}
                {...rest}
            />
        );
    }

    return (
        <Image
            src={finalSrc}
            alt={alt}
            width={width || 600}
            height={height || 800}
            sizes={sizes || '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw'}
            quality={quality}
            priority={priority}
            unoptimized={isUnsplash || isDataUrl}
            onError={() => setErrored(true)}
            className={className}
            {...rest}
        />
    );
}
