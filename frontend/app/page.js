import HeroSection from '@/components/home/HeroSection';
import EcommerceGovernanceSection from '@/components/home/EcommerceGovernanceSection';
import FeaturesSection from '@/components/home/FeaturesSection';
import LocalProductsSection from '@/components/home/LocalProductsSection';
import VerifiedSellersSection from '@/components/home/VerifiedSellersSection';
import CitizenServicesSection from '@/components/home/CitizenServicesSection';
import HowItWorksSection from '@/components/home/HowItWorksSection';
import MarketTransparencySection from '@/components/home/MarketTransparencySection';
import FinalCtaSection from '@/components/home/FinalCtaSection';
import GovernmentThread from '@/components/motion/GovernmentThread';

export default function Home() {
  return (
    <div className="relative">
      <GovernmentThread />
      <HeroSection />
      <EcommerceGovernanceSection />
      <FeaturesSection />
      <LocalProductsSection />
      <VerifiedSellersSection />
      <CitizenServicesSection />
      <HowItWorksSection />
      <MarketTransparencySection />
      <FinalCtaSection />
    </div>
  );
}
