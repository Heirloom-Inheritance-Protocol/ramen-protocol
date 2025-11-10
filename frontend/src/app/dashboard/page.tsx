import type { JSX } from "react";

import Link from "next/link";

interface DashboardShortcut {
  href: string;
  label: string;
  description: string;
}

const shortcuts: DashboardShortcut[] = [
  {
    href: "/",
    label: "Return Home",
    description: "Head back to the landing page to explore the protocol overview.",
  },
  {
    href: "/vaults",
    label: "Manage Vaults",
    description: "Organize inheritance vaults and review current activation rules.",
  },
  {
    href: "/guardians",
    label: "Guardian Network",
    description: "Invite guardians and confirm contingency contacts for your heirs.",
  },
  {
    href: "/settings",
    label: "Account Settings",
    description: "Update personal details, recovery preferences, and notification cadence.",
  },
];

export default function DashboardPage(): JSX.Element {
  return (
    <main className="min-h-screen bg-white px-4 py-16 dark:bg-neutral-950">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-12">
        <header className="space-y-4">
          <p className="text-sm font-medium uppercase tracking-widest text-blue-600 dark:text-blue-400">
            Dashboard
          </p>
          <h1 className="text-3xl font-semibold text-neutral-900 dark:text-white md:text-4xl">
            Welcome back to your inheritance command center.
          </h1>
          <p className="max-w-2xl text-base text-neutral-600 dark:text-neutral-400">
            This early preview surfaces the core areas you will use to steward your family legacy.
            Pick a destination below to continue your setup or review existing plans.
          </p>
        </header>

        <section className="grid gap-6 md:grid-cols-2">
          {shortcuts.map((shortcut) => (
            <Link
              key={shortcut.href}
              href={shortcut.href}
              className="group flex flex-col rounded-2xl border border-neutral-200 bg-white p-6 transition hover:border-neutral-300 hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700"
            >
              <span className="text-lg font-semibold text-neutral-900 transition group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                {shortcut.label}
              </span>
              <span className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                {shortcut.description}
              </span>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-600 transition group-hover:translate-x-1 dark:text-blue-400">
                View
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="h-4 w-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5.25 12h13.5m0 0l-4.5-4.5m4.5 4.5l-4.5 4.5"
                  />
                </svg>
              </span>
            </Link>
          ))}
        </section>

        <footer className="rounded-2xl border border-dashed border-neutral-300 p-6 text-sm text-neutral-600 dark:border-neutral-700 dark:text-neutral-400">
          Future releases will surface live vault metrics, guardian acknowledgements, and automated
          readiness alerts—stay tuned.
        </footer>
      </div>
    </main>
  );
}
