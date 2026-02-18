"use client";

import Link from "next/link";
import { EventBanner } from "@/components/landing/EventBanner";
import { HeroSection } from "@/components/landing/HeroSection";
import { PainSection } from "@/components/landing/PainSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { HappyHourSection } from "@/components/landing/HappyHourSection";
import { ChargingSection } from "@/components/landing/ChargingSection";
import { RefundNotice } from "@/components/landing/RefundNotice";
import { FinalCTA } from "@/components/landing/FinalCTA";

interface DashboardHomeProps {
  isLoggedIn?: boolean;
}

export default function DashboardHome({ isLoggedIn = false }: DashboardHomeProps) {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#1e1b4b]">
      <div className="space-y-16 py-8 md:space-y-20 md:py-12">
        <div className="flex justify-end gap-2">
          {isLoggedIn ? (
            <Link
              href="/settings"
              prefetch={false}
              className="rounded-xl border border-white/30 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
            >
              내정보
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                prefetch={false}
                className="rounded-xl border border-white/30 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
              >
                로그인
              </Link>
              <Link
                href="/signup"
                prefetch={false}
                className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-600"
              >
                회원가입
              </Link>
            </>
          )}
        </div>
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
