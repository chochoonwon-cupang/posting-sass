"use client";

import { HeroSection } from "@/components/landing/HeroSection";
import { PainSection } from "@/components/landing/PainSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { HappyHourSection } from "@/components/landing/HappyHourSection";
import { ChargingSection } from "@/components/landing/ChargingSection";
import { RefundNotice } from "@/components/landing/RefundNotice";
import { FinalCTA } from "@/components/landing/FinalCTA";

export default function DashboardHome() {
  return (
    <div className="landing-bg min-h-[calc(100vh-64px)]">
      <div className="py-8 md:py-12">
        <HeroSection />

        <PainSection />

        <HowItWorksSection />

        <HappyHourSection />

        <ChargingSection />

        <RefundNotice />

        <FinalCTA />
      </div>
    </div>
  );
}
