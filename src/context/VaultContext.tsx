"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface VaultContextType {
  selectedVaultId: string | null;
  setSelectedVaultId: (vaultId: string | null) => void;
}

const VaultContext = createContext<VaultContextType | null>(null);

interface VaultProviderProps {
  children: ReactNode;
}

export function VaultProvider({ children }: VaultProviderProps) {
  const [selectedVaultId, setSelectedVaultIdState] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("selectedVaultId");
      if (stored) {
        setSelectedVaultIdState(stored);
      }
    }
  }, []);

  // Persist to localStorage when changed
  const setSelectedVaultId = (vaultId: string | null) => {
    setSelectedVaultIdState(vaultId);
    if (typeof window !== "undefined") {
      if (vaultId) {
        localStorage.setItem("selectedVaultId", vaultId);
      } else {
        localStorage.removeItem("selectedVaultId");
      }
    }
  };

  return (
    <VaultContext.Provider value={{ selectedVaultId, setSelectedVaultId }}>
      {children}
    </VaultContext.Provider>
  );
}

export function useVault(): VaultContextType {
  const context = useContext(VaultContext);
  if (context === null) {
    throw new Error("useVault must be used within a VaultProvider");
  }
  return context;
}

