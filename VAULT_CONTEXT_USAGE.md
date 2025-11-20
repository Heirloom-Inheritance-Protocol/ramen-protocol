# Global Vault Context Usage Guide

## Overview

The application now has a **global vault context** that manages the selected vault ID across all components. This allows users to select a vault once, and that selection persists throughout their session and across different pages.

## Architecture

### VaultContext (`src/context/VaultContext.tsx`)

The context provides:
- `selectedVaultId`: The currently selected vault ID (string | null)
- `setSelectedVaultId`: Function to update the selected vault ID
- Automatic localStorage persistence

### Integration

The `VaultProvider` is wrapped around the entire app in `RootProvider.tsx`:

```tsx
<PrivyProvider>
  <VaultProvider>
    {children}
  </VaultProvider>
</PrivyProvider>
```

## Usage in Components

### 1. GetVaults Component

The `GetVaults` component automatically uses the global context:

```tsx
import { useVault } from "@/context/VaultContext";

const { selectedVaultId, setSelectedVaultId } = useVault();
```

When a user selects a vault from the dropdown:
- The selection is saved to the global context
- The vault ID and index are persisted to localStorage
- All other components can access the selected vault

### 2. AddBeneficiary Component

The `AddBeneficiary` component uses the global vault context as a fallback:

```tsx
import { useVault } from "@/context/VaultContext";

const { selectedVaultId } = useVault();

// Use prop vaultId if provided, otherwise fall back to global context
const activeVaultId = vaultId ?? (selectedVaultId ? parseInt(selectedVaultId) : null);
```

**Benefits:**
- If a `vaultId` prop is explicitly passed, it takes precedence
- If no `vaultId` prop is provided, it automatically uses the globally selected vault
- User-friendly error message if no vault is selected

### 3. Any Other Component

To use the vault context in any component:

```tsx
import { useVault } from "@/context/VaultContext";

function MyComponent() {
  const { selectedVaultId, setSelectedVaultId } = useVault();

  // Use selectedVaultId for operations
  // Call setSelectedVaultId to update the selection
}
```

## User Flow

1. **User navigates to Received/Vault page**
   - Sees the vault selector (GetVaults component)
   - Selects a vault from the dropdown

2. **Vault selection is persisted**
   - Saved to React context (immediate access)
   - Saved to localStorage (persists across page refreshes)

3. **User navigates to another page/section**
   - The selected vault ID remains available
   - Any component using `useVault()` can access it

4. **User adds a beneficiary**
   - AddBeneficiary component automatically uses the selected vault
   - No need to manually pass vault ID as prop
   - Clear error message if no vault is selected

## Implementation Details

### localStorage Keys

- `selectedVaultId`: The vault ID (string)
- `selectedVaultIndex`: The vault index (string)

### Error Handling

If a user tries to add a member without selecting a vault:

```
Error: Vault ID is required to add a member. Please select a vault first.
```

### Type Safety

The context is fully typed with TypeScript:

```typescript
interface VaultContextType {
  selectedVaultId: string | null;
  setSelectedVaultId: (vaultId: string | null) => void;
}
```

## Future Enhancements

Potential improvements:
1. Add vault metadata to context (name, member count, etc.)
2. Add validation to ensure selected vault still exists
3. Add multi-vault selection support
4. Add vault switching notifications/confirmations

## Testing

To test the global vault context:

1. Select a vault in the GetVaults component
2. Refresh the page - selection should persist
3. Navigate to a different component that uses the vault
4. Verify the selected vault ID is available
5. Try adding a beneficiary without selecting a vault (should show error)
6. Select a vault and try again (should work)

## Troubleshooting

**Context error: "useVault must be used within a VaultProvider"**
- Ensure VaultProvider is wrapping your component tree
- Check that RootProvider includes VaultProvider

**Selected vault not persisting**
- Check browser localStorage for `selectedVaultId` key
- Verify localStorage is not being cleared

**Wrong vault ID being used**
- Check if component is receiving a `vaultId` prop that overrides global context
- Verify the correct vault was selected in GetVaults
