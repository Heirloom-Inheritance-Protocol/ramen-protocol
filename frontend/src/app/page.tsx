import { BackgroundLinesHero } from "@/components/BackgroundHero";
import { FloatingNav } from "@/components/ui/floating-navbar";
import { ScrollIndicator } from "@/components/ui/scroll-indicator";

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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="p-6 rounded-lg bg-neutral-50 dark:bg-neutral-800">
              <div className="w-12 h-12 bg-linear-to-br from-blue-500 to-purple-600 rounded-lg mb-4 flex items-center justify-center text-white font-bold text-xl">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2 text-neutral-900 dark:text-white">
                Create Your Legacy
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400">
                Document your knowledge, assets, and wisdom for future
                generations.
              </p>
            </div>
            <div className="p-6 rounded-lg bg-neutral-50 dark:bg-neutral-800">
              <div className="w-12 h-12 bg-linear-to-br from-purple-500 to-pink-600 rounded-lg mb-4 flex items-center justify-center text-white font-bold text-xl">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2 text-neutral-900 dark:text-white">
                Secure Storage
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400">
                Your heirloom data is encrypted and stored securely on-chain.
              </p>
            </div>
            <div className="p-6 rounded-lg bg-neutral-50 dark:bg-neutral-800">
              <div className="w-12 h-12 bg-linear-to-br from-pink-500 to-red-600 rounded-lg mb-4 flex items-center justify-center text-white font-bold text-xl">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2 text-neutral-900 dark:text-white">
                Pass It On
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400">
                Your descendants can access their inheritance when the time is
                right.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
