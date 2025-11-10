"use client";

import type { JSX } from "react";

import { usePrivy } from "@privy-io/react-auth";

import { GlowButton } from "./glow-button";

const CONNECT_WALLET_LABEL = "Connect Wallet";

function ConnectWallet(): JSX.Element {
  const { ready, authenticated, user, logout, login } = usePrivy();

  function handleLogout(): void {
    localStorage.clear();
    sessionStorage.clear();
    logout();
  }

  function handleClick(): void {
    if (!ready) {
      return;
    }

    if (authenticated) {
      handleLogout();
    } else {
      login();
    }
  }

  const buttonLabel = user?.wallet?.address
    ? `${user.wallet.address.slice(0, 6)}...${user.wallet.address.slice(-4)}`
    : CONNECT_WALLET_LABEL;

  return (
    <GlowButton
      label={buttonLabel}
      onClick={handleClick}
      isDisabled={!ready}
      className="w-full sm:w-auto"
    />
  );
}

export default ConnectWallet;
