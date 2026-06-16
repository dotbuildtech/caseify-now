'use client';
import Link from 'next/link';
import { Instagram, Twitter, Facebook, Mail, Phone, MapPin } from 'lucide-react';
import { SITE } from '@/utils/constants';
import { useState, useEffect } from 'react';

export default function Footer() {
    const [year, setYear] = useState(null);

    useEffect(() => {
        setYear(new Date().getFullYear());
    }, []);

    return (
        <footer className="bg-ink text-cream">
            <div className="container-luxe grid gap-10 py-16 md:grid-cols-4">
                <div className="md:col-span-1">
                    <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center bg-cream text-ink">
                            <span className="font-display text-lg font-bold">D</span>
                        </div>
                        <span className="font-display text-2xl font-semibold tracking-editorial">{SITE.name}</span>
                    </div>
                    <p className="mt-4 text-sm text-cream/70">
                        Premium phone cases and accessories for every device. Quality, style, protection.
                    </p>
                    <div className="mt-6 flex items-center gap-3">
                        <a href={SITE.social.instagram || '#'} className="flex h-9 w-9 items-center justify-center border border-cream/20 transition-colors hover:border-bronze hover:text-bronze"><Instagram className="h-4 w-4" /></a>
                        <a href={SITE.social.twitter || '#'} className="flex h-9 w-9 items-center justify-center border border-cream/20 transition-colors hover:border-bronze hover:text-bronze"><Twitter className="h-4 w-4" /></a>
                        <a href={SITE.social.facebook || '#'} className="flex h-9 w-9 items-center justify-center border border-cream/20 transition-colors hover:border-bronze hover:text-bronze"><Facebook className="h-4 w-4" /></a>
                    </div>
                </div>

                <div>
                    <h3 className="text-[10px] font-medium uppercase tracking-[0.32em] text-cream/60">Shop</h3>
                    <ul className="mt-6 space-y-3 text-sm">
                        <li><Link href="/shop" className="text-cream/80 hover:text-bronze">All Products</Link></li>
                        <li><Link href="/shop?category=iPhone%20Cases" className="text-cream/80 hover:text-bronze">iPhone Cases</Link></li>
                        <li><Link href="/shop?category=Android%20Cases" className="text-cream/80 hover:text-bronze">Android Cases</Link></li>
                        <li><Link href="/shop?category=Accessories" className="text-cream/80 hover:text-bronze">Accessories</Link></li>
                    </ul>
                </div>

                <div>
                    <h3 className="text-[10px] font-medium uppercase tracking-[0.32em] text-cream/60">Company</h3>
                    <ul className="mt-6 space-y-3 text-sm">
                        <li><a className="text-cream/80 hover:text-bronze" href="#">About Us</a></li>
                        <li><a className="text-cream/80 hover:text-bronze" href="#">Blog</a></li>
                        <li><a className="text-cream/80 hover:text-bronze" href="#">Sustainability</a></li>
                        <li><a className="text-cream/80 hover:text-bronze" href="#">Careers</a></li>
                        <li><a className="text-cream/80 hover:text-bronze" href="#">Press</a></li>
                    </ul>
                </div>

                <div>
                    <h3 className="text-[10px] font-medium uppercase tracking-[0.32em] text-cream/60">Contact</h3>
                    <ul className="mt-6 space-y-3 text-sm">
                        <li className="flex items-start gap-2 text-cream/80">
                            <Phone className="mt-0.5 h-3.5 w-3.5 text-bronze" />
                            <span>{SITE.contact.phone}</span>
                        </li>
                        <li className="flex items-start gap-2 text-cream/80">
                            <Mail className="mt-0.5 h-3.5 w-3.5 text-bronze" />
                            <span>{SITE.contact.email}</span>
                        </li>
                        <li className="flex items-start gap-2 text-cream/80">
                            <MapPin className="mt-0.5 h-3.5 w-3.5 text-bronze" />
                            <span>{SITE.contact.address}</span>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="border-t border-cream/10">
                <div className="container-luxe flex flex-col items-center justify-between gap-3 py-6 sm:flex-row">
                    <p className="text-[10px] uppercase tracking-[0.32em] text-cream/50">© {year} {SITE.name}. All rights reserved.</p>
                    <div className="flex items-center gap-4 text-[10px] uppercase tracking-[0.32em] text-cream/50">
                        <a href="#" className="hover:text-cream">Privacy</a>
                        <a href="#" className="hover:text-cream">Terms</a>
                        <a href="#" className="hover:text-cream">Cookies</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
