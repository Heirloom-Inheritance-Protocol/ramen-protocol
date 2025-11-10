import { Suspense } from "react";

import Link from "next/link";

import { BackgroundLinesHero } from "@/components/BackgroundHero";
import { FloatingNav } from "@/components/ui/floating-navbar";
import { ScrollIndicator } from "@/components/ui/scroll-indicator";
import { WobbleCardDemo } from "@/components/ui/wobble-card-demo";

interface FooterLink {
  href: string;
  label: string;
}

interface Highlight {
  title: string;
  description: string;
}

const footerLinks: FooterLink[] = [
  { href: "#about", label: "About" },
  { href: "#content", label: "How It Works" },
  { href: "#contact", label: "Contact" },
];

const safeguardHighlights: Highlight[] = [
  {
    title: "Adaptive Guardianship",
    description:
      "Define time-locked release rules and dynamic trustees to fit evolving family structures.",
  },
  {
    title: "Zero-Knowledge Escrow",
    description:
      "Keep private data opaque while still proving eligibility conditions on-chain.",
  },
  {
    title: "Continuity Alerts",
    description:
      "Receive proactive check-ins that ensure heirs are ready when activation thresholds are met.",
  },
  {
    title: "Multi-Asset Coverage",
    description:
      "Orchestrate digital, legal, and sentimental assets from one resilient protocol dashboard.",
  },
];

interface HighlightCardProps {
  highlight: Highlight;
}

function HighlightCard({ highlight }: HighlightCardProps) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-900/40">
      <p className="text-lg font-semibold text-neutral-900 dark:text-white">
        {highlight.title}
      </p>
      <p className="mt-2 text-neutral-600 dark:text-neutral-400">
        {highlight.description}
      </p>
    </div>
  );
}

function Footer() {
  return (
    <footer className="bg-neutral-900 text-neutral-200">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-12 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-lg font-semibold">Heirloom Inheritance Protocol</p>
          <p className="mt-2 text-sm text-neutral-400">
            Preserving legacies with encrypted, on-chain stewardship.
          </p>
        </div>
        <nav className="flex flex-wrap items-center gap-4 text-sm text-neutral-300">
          {footerLinks.map((link) => (
            <a key={link.href} href={link.href} className="hover:text-white">
              {link.label}
            </a>
          ))}
        </nav>
      </div>
      <div className="border-t border-neutral-800">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-neutral-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {new Date().getFullYear()} Invisible Garden. All rights
            reserved.
          </p>
          <p>Crafted with security, continuity, and care.</p>
        </div>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <>
      <FloatingNav
        navItems={[
          { name: "Home", link: "#" },
          { name: "About", link: "#about" },
          { name: "Contact", link: "#contact" },
        ]}
      />
      <div className="relative min-h-screen">
        <BackgroundLinesHero />
        <ScrollIndicator targetId="content" />
      </div>

      {/* Content section to scroll to */}
      <section
        id="content"
        className="min-h-screen bg-white dark:bg-neutral-900 py-20 px-4"
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-8 text-neutral-900 dark:text-white">
            How It Works
          </h2>
          <p className="mx-auto max-w-2xl text-center text-lg text-neutral-600 dark:text-neutral-400">
            The Heirloom Inheritance Protocol guides each family through secure
            stewardship, transforming private knowledge into an enduring digital
            legacy.
          </p>
          <div className="mt-16">
            <Suspense
              fallback={
                <div className="h-[600px] w-full animate-pulse rounded-3xl bg-neutral-200/40 dark:bg-neutral-800/40" />
              }
            >
              <WobbleCardDemo />
            </Suspense>
          </div>
          <div className="mt-20 grid gap-12 md:grid-cols-12">
            <div className="space-y-6 md:col-span-5">
              <h3 className="text-2xl font-semibold text-neutral-900 dark:text-white">
                Built for continuity and clarity
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400">
                Each vault is calibrated for transparency with the right people
                at the right time. We orchestrate cryptographic handshakes,
                regulatory readiness, and real-world triggers so your intent is
                never lost.
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3 text-neutral-700 dark:text-neutral-300">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-500" />
                  <p>
                    Model contingency plans with scenario testing and smart
                    probate simulations.
                  </p>
                </div>
                <div className="flex items-start gap-3 text-neutral-700 dark:text-neutral-300">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-purple-500" />
                  <p>
                    Link legal counsel, executors, and custodians inside a
                    unified coordination layer.
                  </p>
                </div>
              </div>
              <Link
                href="#contact"
                className="inline-flex items-center justify-center rounded-full bg-neutral-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
              >
                Talk to a protocol advisor
              </Link>
            </div>
            <div className="grid gap-6 md:col-span-7 md:grid-cols-2">
              {safeguardHighlights.map((highlight) => (
                <HighlightCard key={highlight.title} highlight={highlight} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
