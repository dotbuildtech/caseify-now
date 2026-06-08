'use client';
import { useState } from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';
import { SITE } from '@/utils/constants';
import { useToast } from '@/components/ui/Toast';

export default function ContactPage() {
    const toast = useToast();
    const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
    const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

    const submit = (e) => {
        e.preventDefault();
        toast.success('Message sent! We will reply soon.');
        setForm({ name: '', email: '', subject: '', message: '' });
    };

    return (
        <div className="container-luxe py-12 md:py-20">
            <div className="mb-12">
                <span className="eyebrow">— Get in Touch</span>
                <h1 className="mt-4 font-display text-4xl leading-[1.05] tracking-editorial md:text-6xl">
                    Contact <span className="italic-display">Us</span>.
                </h1>
                <p className="mt-3 max-w-md text-sm text-text-light">
                    Have questions? We are here to help. Send us a message anytime.
                </p>
            </div>

            <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
                <form onSubmit={submit} className="space-y-5">
                    <div>
                        <label className="label-luxe">Full Name *</label>
                        <input required value={form.name} onChange={update('name')} className="input-luxe" />
                    </div>
                    <div>
                        <label className="label-luxe">Email Address *</label>
                        <input required type="email" value={form.email} onChange={update('email')} className="input-luxe" />
                    </div>
                    <div>
                        <label className="label-luxe">Subject</label>
                        <input value={form.subject} onChange={update('subject')} className="input-luxe" />
                    </div>
                    <div>
                        <label className="label-luxe">Your Message *</label>
                        <textarea required rows={6} value={form.message} onChange={update('message')} className="input-luxe resize-none" />
                    </div>
                    <button type="submit" className="btn-primary">Send Message</button>
                </form>

                <aside>
                    <h2 className="font-display text-2xl">Get in Touch</h2>
                    <p className="mt-3 text-sm text-text-light">Reach out through any channel. We respond within 24 hours.</p>
                    <ul className="mt-8 space-y-6 text-sm">
                        <li className="flex items-start gap-3">
                            <Phone className="mt-0.5 h-4 w-4 text-bronze" strokeWidth={1.5} />
                            <div>
                                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-text-light">Phone</p>
                                <p className="mt-1 font-medium">{SITE.contact.phone}</p>
                            </div>
                        </li>
                        <li className="flex items-start gap-3">
                            <Mail className="mt-0.5 h-4 w-4 text-bronze" strokeWidth={1.5} />
                            <div>
                                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-text-light">Email</p>
                                <p className="mt-1 font-medium">{SITE.contact.email}</p>
                            </div>
                        </li>
                        <li className="flex items-start gap-3">
                            <MapPin className="mt-0.5 h-4 w-4 text-bronze" strokeWidth={1.5} />
                            <div>
                                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-text-light">Address</p>
                                <p className="mt-1 font-medium">{SITE.contact.address}</p>
                            </div>
                        </li>
                    </ul>
                </aside>
            </div>
        </div>
    );
}
