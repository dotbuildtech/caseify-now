import HeroSlider from '@/components/home/HeroSlider';
import Marquee from '@/components/home/Marquee';
import CategoryShowcase from '@/components/home/CategoryShowcase';
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
            <CategoryShowcase />
            <FeaturedProducts />
            <QuoteBlock />
            <ValuesGrid />
            <Testimonials />
            <CTABlock />
        </>
    );
}
