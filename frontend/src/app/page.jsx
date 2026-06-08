import HeroSlider from '@/components/home/HeroSlider';
import Marquee from '@/components/home/Marquee';
import CategoriesSection from '@/components/home/CategoriesSection';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import QuoteBlock from '@/components/home/QuoteBlock';
import ValuesGrid from '@/components/home/ValuesGrid';
import Testimonials from '@/components/home/Testimonials';
import CTABlock from '@/components/home/CTABlock';

export default function HomePage() {
    return (
        <>
            <HeroSlider />
            <Marquee />
            <CategoriesSection />
            <FeaturedProducts />
            <QuoteBlock />
            <ValuesGrid />
            <Testimonials />
            <CTABlock />
        </>
    );
}
