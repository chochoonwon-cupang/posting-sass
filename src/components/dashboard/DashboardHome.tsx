"use client";

import { EventBanner } from "@/components/landing/EventBanner";
import { HeroSection } from "@/components/landing/HeroSection";
import { PainSection } from "@/components/landing/PainSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { HappyHourSection } from "@/components/landing/HappyHourSection";
import { ChargingSection } from "@/components/landing/ChargingSection";
import { RefundNotice } from "@/components/landing/RefundNotice";
import { FinalCTA } from "@/components/landing/FinalCTA";

export default function DashboardHome() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#F5F6F8]">
      <div className="space-y-16 py-8 md:space-y-20 md:py-12">
        <EventBanner />
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
