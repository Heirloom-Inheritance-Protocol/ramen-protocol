import { Suspense } from "react";

import Link from "next/link";

import { BackgroundLinesHero } from "@/components/BackgroundHero";
import { FloatingNav } from "@/components/ui/floating-navbar";
import { ScrollIndicator } from "@/components/ui/scroll-indicator";
import { WobbleCardDemo } from "@/components/ui/wobble-card-demo";
import { Card } from "@/components/ui/card";
// import { TestArkivButton } from "@/components/ui/test-arkiv-button";
// import { TestMerkleTreeButton } from "@/components/ui/test-merkle-tree-button";
import { MAIN_NAV_ITEMS } from "@/lib/navigation";

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
          <p className="text-lg font-semibold">Ramen Protocol</p>
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
      {/* <TestArkivButton />
      <TestMerkleTreeButton /> */}
      <FloatingNav navItems={MAIN_NAV_ITEMS} />
      <div className="relative bg-white dark:bg-neutral-900 sm:min-h-screen">
        <BackgroundLinesHero />
        <ScrollIndicator targetId="content" />
      </div>

      {/* Content section to scroll to */}
      <section
        id="content"
        className="min-h-screen bg-white dark:bg-neutral-900 pt-0 pb-20 sm:py-20 px-4"
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-8 text-neutral-900 dark:text-white">
            How It Works
          </h2>
          <p className="mx-auto max-w-2xl text-center text-lg text-neutral-600 dark:text-neutral-400">
            Record who passed knowledge to whom on-chain, preserving verifiable
            lineage. Encrypt content client-side and store on IPFS, enabling
            preservation of private cultural assets without forcing public
            disclosure.
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
                Traditional craftsmanship disappears because knowledge
                transmission is invisible to institutions. Anchoring successions
                on-chain with auditable records makes cultural inheritance
                visible and preservable, protecting historically sensitive
                knowledge from censorship or alteration.
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

      {/* Use Cases Section */}
      <section className="bg-white dark:bg-neutral-900 py-20 px-4">
        <div className="max-w-6xl mx-auto space-y-8">
          <h2 className="text-3xl md:text-5xl font-bold text-center text-neutral-900 dark:text-white">
            Heritage in Practice
          </h2>
          <p className="text-center text-lg md:text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
            Documented knowledge inheritance across cultures
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <Card className="overflow-hidden bg-white dark:bg-neutral-900/50 border-neutral-200 dark:border-neutral-800">
              <div className="aspect-4/3 bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1758874960025-85d40fde6252?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYW1pbHklMjByZWNpcGUlMjBncmFuZG1vdGhlciUyMGNvb2tpbmd8ZW58MXx8fHwxNzYzMDY2NTA0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="Family recipe tradition"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6 space-y-3">
                <div className="text-4xl mb-2">🍲</div>
                <h3 className="text-xl md:text-2xl font-semibold text-neutral-900 dark:text-white">
                  Heritage Recipe Documents
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Secret family recipes documented with precise measurements and
                  techniques, passed down through encrypted files while
                  preserving culinary heritage.
                </p>
                <div className="pt-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                    <span>Written ingredient formulas</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                    <span>Step-by-step preparation docs</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                    <span>Verifiable family lineage</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="overflow-hidden bg-white dark:bg-neutral-900/50 border-neutral-200 dark:border-neutral-800">
              <div className="aspect-4/3 bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1575804428466-7a663f99bb81?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpZ2Vub3VzJTIwb3JhbCUyMHRyYWRpdGlvbiUyMHN0b3J5dGVsbGluZ3xlbnwxfHx8fDE3NjMwNjY1MDV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="Indigenous oral traditions"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6 space-y-3">
                <div className="text-4xl mb-2">📜</div>
                <h3 className="text-xl md:text-2xl font-semibold text-neutral-900 dark:text-white">
                  LATAM Traditional Knowledge
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Indigenous communities document ancestral stories, medicinal
                  formulas, and ceremonial practices in written form for secure
                  transmission to next generations.
                </p>
                <div className="pt-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                    <span>Transcribed sacred texts</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                    <span>Written medicinal recipes</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                    <span>Elder-to-youth documentation</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="overflow-hidden bg-white dark:bg-neutral-900/50 border-neutral-200 dark:border-neutral-800">
              <div className="aspect-4/3 bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1759340946094-62603dedcac1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjdWx0dXJhbCUyMGhlcml0YWdlJTIwYXJ0aWZhY3RzJTIwbXVzZXVtfGVufDF8fHx8MTc2MzA2NjUwNXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="Cultural artifacts and heritage"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6 space-y-3">
                <div className="text-4xl mb-2">📚</div>
                <h3 className="text-xl md:text-2xl font-semibold text-neutral-900 dark:text-white">
                  Cultural Asset Documentation
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Museums preserve restoration manuals, provenance records, and
                  traditional technique documentation through verifiable
                  custodian succession chains.
                </p>
                <div className="pt-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                    <span>Restoration procedure manuals</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                    <span>Technique instruction documents</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                    <span>Recorded curator knowledge</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-6 bg-linear-to-r from-neutral-100 to-neutral-50 dark:from-neutral-800/50 dark:to-neutral-900/50 border-neutral-200 dark:border-neutral-800 mt-8">
            <p className="text-center text-base md:text-lg text-neutral-700 dark:text-neutral-300">
              All knowledge is{" "}
              <strong className="text-neutral-900 dark:text-white">
                documented in encrypted files
              </strong>{" "}
              with{" "}
              <strong className="text-neutral-900 dark:text-white">
                verifiable lineage
              </strong>
              , enabling sustainable cultural preservation through written
              records
            </p>
          </Card>
        </div>
      </section>

      <Footer />
    </>
  );
}
