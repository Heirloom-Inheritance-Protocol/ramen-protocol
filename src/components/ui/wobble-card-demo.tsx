"use client";

import Image from "next/image";

import { WobbleCard } from "./wobble-card";

export function WobbleCardDemo() {
  return (
    <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-4 lg:grid-cols-3">
      <WobbleCard containerClassName="relative col-span-1 min-h-[500px] bg-pink-800 lg:col-span-2 lg:min-h-[300px]">
        <div className="max-w-xs">
          <h2 className="text-balance text-left text-base font-semibold tracking-[-0.015em] text-white md:text-xl lg:text-3xl">
            Ramen Protocol stewards every generational legacy
          </h2>
          <p className="mt-4 text-left text-base/6 text-neutral-200">
            Encode family knowledge, digital assets, and living governance into
            an encrypted vault that stays resilient across decades.
          </p>
        </div>
        {/* <Image
          src="/linear.webp"
          width={500}
          height={500}
          alt="Ramen Protocol dashboard preview"
          className="absolute -bottom-10 -right-4 object-contain grayscale filter rounded-2xl lg:-right-[40%]"
        /> */}
      </WobbleCard>

      <WobbleCard containerClassName="relative col-span-1 min-h-[300px]">
        <h2 className="max-w-80 text-balance text-left text-base font-semibold tracking-[-0.015em] text-white md:text-xl lg:text-3xl">
          Guardianship rules that honor your intent
        </h2>
        <p className="mt-4 max-w-[26rem] text-left text-base/6 text-neutral-200">
          Design custom release conditions, trustee rotations, and on-chain
          attestations that adapt as your family evolves.
        </p>
      </WobbleCard>

      <WobbleCard containerClassName="relative col-span-1 min-h-[500px] bg-blue-900 lg:col-span-3 lg:min-h-[600px] xl:min-h-[300px]">
        <div className="max-w-sm">
          <h2 className="max-w-sm text-balance text-left text-base font-semibold tracking-[-0.015em] text-white md:max-w-lg md:text-xl lg:text-3xl">
            Launch your encrypted inheritance workflow today
          </h2>
          <p className="mt-4 max-w-[26rem] text-left text-base/6 text-neutral-200">
            Automate continuity checks, initiate zero-knowledge proofs, and give
            heirs clarity the moment activation thresholds are met.
          </p>
        </div>
        <Image
          src="/linear.webp"
          width={500}
          height={500}
          alt="Secure inheritance workflow preview"
          className="absolute -bottom-10 -right-10 object-contain rounded-2xl md:-right-[40%] lg:-right-[20%]"
        />
      </WobbleCard>
    </div>
  );
}
