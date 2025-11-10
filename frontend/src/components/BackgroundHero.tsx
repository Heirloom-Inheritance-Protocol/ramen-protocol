"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";

import { BackgroundLines } from "@/components/ui/background-lines";
import { TextGenerateEffect } from "./ui/text-generate-effect";
import ConnectWallet from "./ui/ConnectWallet";
import { GlowButton } from "./ui/glow-button";

export function BackgroundLinesHero() {
  const router = useRouter();
  const { ready, authenticated } = usePrivy();

  function handleNavigateDashboard(): void {
    router.push("/dashboard");
  }

  return (
    <BackgroundLines className="flex items-center justify-center w-full flex-col px-4">
      {/* <h2 className="bg-clip-text text-transparent text-center bg-gradient-to-b from-neutral-900 to-neutral-700 dark:from-neutral-600 dark:to-white text-2xl md:text-4xl lg:text-7xl font-sans py-2 md:py-10 relative z-20 font-bold tracking-tight">
        Inheritance knowledge, <br /> Heirloom Protocol.
        </h2> */}
      <TextGenerateEffect
        words="Inheritance knowledge Heirloom Protocol."
        className="text-center text-[40px] md:text-5xl lg:text-6xl mb-8 w-1/2"
      />
      <p className="max-w-xl mx-auto text-sm md:text-lg text-neutral-700 dark:text-neutral-400 text-center pb-6">
        Heirloom Inheritance Protocol is a protocol for inheriting assets from
        your ancestors, and the knowledge of your ancestors.
      </p>

      {ready && authenticated ? (
        <GlowButton
          label="Dashboard"
          onClick={handleNavigateDashboard}
          className="w-full sm:w-auto"
        />
      ) : (
        <ConnectWallet />
      )}
    </BackgroundLines>
  );
}
