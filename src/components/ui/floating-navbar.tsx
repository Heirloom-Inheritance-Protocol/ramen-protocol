"use client";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
} from "framer-motion";
import { usePrivy } from "@privy-io/react-auth";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { JSX, useState } from "react";
import { Menu, X } from "lucide-react";
import type { NavItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import ConnectWallet from "./ConnectWallet";

export const FloatingNav = ({
  navItems,
  className,
}: {
  navItems: Array<NavItem & { icon?: JSX.Element }>;
  className?: string;
}) => {
  const { ready, authenticated, user } = usePrivy();
  const { scrollYProgress } = useScroll();
  const pathname = usePathname();

  const [visible, setVisible] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isWalletConnected =
    ready && authenticated && Boolean(user?.wallet?.address);

  const restrictedLinks = ["/inherit", "/received-vault", "/dashboard"];

  useMotionValueEvent(scrollYProgress, "change", (current) => {
    // Check if current is not undefined and is a number
    if (typeof current === "number") {
      const direction = current! - scrollYProgress.getPrevious()!;

      if (scrollYProgress.get() < 0.05) {
        setVisible(false);
      } else {
        if (direction < 0) {
          setVisible(true);
        } else {
          setVisible(false);
        }
      }
    }
  });

  return (
    <AnimatePresence mode="wait">
      <motion.div
        className={cn(
          "relative flex w-[calc(100%-2rem)] max-w-4xl fixed top-10 left-1/2 -translate-x-1/2 sm:left-auto sm:right-auto sm:translate-x-0 sm:inset-x-0 sm:mx-auto sm:w-full border border-transparent dark:border-white/[0.2] rounded-full dark:bg-black bg-white shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] z-5000 px-6 py-2 items-center justify-between",
          className,
        )}
        style={{
          backdropFilter: "blur(6px) saturate(180%)",
          backgroundColor: "rgba(17, 25, 40, 0.5)",
          borderRadius: "9999px",
        }}
      >
        <span className="sm:hidden pointer-events-none absolute left-1/2 -translate-x-1/2 text-sm font-medium text-neutral-900 dark:text-neutral-50">
          Ramen Protocol
        </span>
        <div className="flex items-center gap-3">
          <img src="/heritage-tr.png" alt="" className="h-12 w-12 shrink-0" />
          <span className="hidden text-sm font-medium text-neutral-900 dark:text-neutral-50 sm:block">
            Ramen Protocol
          </span>
        </div>
        <nav className="hidden sm:flex items-center gap-4">
          {navItems.map((navItem, idx: number) => {
            const isActive = pathname === navItem.link;
            const isRestricted = restrictedLinks.includes(navItem.link);
            const isDisabled = isRestricted && !isWalletConnected;

            if (isDisabled) {
              return (
                <span
                  key={`link-disabled=${idx}`}
                  aria-disabled="true"
                  className={cn(
                    "relative items-center flex space-x-1 pb-1 border-b-2 border-transparent text-neutral-400 cursor-not-allowed select-none",
                    "dark:text-neutral-500",
                  )}
                >
                  <span className="text-sm">{navItem.name}</span>
                </span>
              );
            }

            return (
              <Link
                key={`link=${idx}`}
                href={navItem.link}
                className={cn(
                  "relative dark:text-neutral-50 items-center flex space-x-1 text-neutral-600 dark:hover:text-neutral-300 hover:text-neutral-500 pb-1 border-b-2 transition-colors",
                  isActive
                    ? "border-blue-500 dark:border-blue-400 text-neutral-900 dark:text-white"
                    : "border-transparent",
                )}
              >
                <span className="text-sm">{navItem.name}</span>
              </Link>
            );
          })}
        </nav>
        <div className="hidden sm:block">
          <ConnectWallet />
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="sm:hidden p-2 text-neutral-600 dark:text-neutral-50 hover:text-neutral-900 dark:hover:text-neutral-300 transition-colors cursor-pointer"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 right-0 mt-2 mx-4 sm:hidden bg-white dark:bg-black border border-transparent dark:border-white/[0.2] rounded-2xl shadow-lg overflow-hidden"
              style={{
                backdropFilter: "blur(6px) saturate(180%)",
                backgroundColor: "rgba(17, 25, 40, 0.95)",
              }}
            >
              <nav className="flex flex-col p-4 gap-2">
                {navItems.map((navItem, idx: number) => {
                  const isActive = pathname === navItem.link;
                  const isRestricted = restrictedLinks.includes(navItem.link);
                  const isDisabled = isRestricted && !isWalletConnected;

                  if (isDisabled) {
                    return (
                      <span
                        key={`mobile-link-disabled=${idx}`}
                        aria-disabled="true"
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-lg text-neutral-500 dark:text-neutral-500 cursor-not-allowed select-none",
                        )}
                      >
                        {navItem.icon && (
                          <span className="shrink-0">{navItem.icon}</span>
                        )}
                        <span className="text-sm font-medium">
                          {navItem.name}
                        </span>
                      </span>
                    );
                  }

                  return (
                    <Link
                      key={`mobile-link=${idx}`}
                      href={navItem.link}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-lg text-neutral-600 dark:text-neutral-50 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors",
                        isActive &&
                          "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
                      )}
                    >
                      {navItem.icon && (
                        <span className="shrink-0">{navItem.icon}</span>
                      )}
                      <span className="text-sm font-medium">
                        {navItem.name}
                      </span>
                    </Link>
                  );
                })}
                <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800">
                  <ConnectWallet />
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};
