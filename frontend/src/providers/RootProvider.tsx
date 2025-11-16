"use client";
import { PrivyProvider, usePrivy } from "@privy-io/react-auth";
import { usePathname, useRouter } from "next/navigation";
import React, { JSX, useEffect, useRef } from "react";

interface RootProviderProps {
  children: React.ReactNode;
}

interface AuthRedirectProps {
  children: React.ReactNode;
}

function AuthRedirect({ children }: AuthRedirectProps): JSX.Element {
  const { ready, authenticated } = usePrivy();
  const router = useRouter();
  const pathname = usePathname();
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    if (!ready || !authenticated) return;
    if (hasRedirectedRef.current) return;
    if (pathname === "/inherit") return;

    hasRedirectedRef.current = true;
    router.push("/inherit");
  }, [ready, authenticated, pathname, router]);

  return <>{children}</>;
}

export default function RootProvider({ children }: RootProviderProps) {
  const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  if (!privyAppId) {
    throw new Error("Missing NEXT_PUBLIC_PRIVY_APP_ID env var");
  }

  return (
    <PrivyProvider
      appId={privyAppId}
      config={{
        loginMethods: ["email", "wallet"],
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
        appearance: {
          theme: "dark",
          accentColor: "#676FFF",
        },
      }}
    >
      <AuthRedirect>{children}</AuthRedirect>
    </PrivyProvider>
  );
}
