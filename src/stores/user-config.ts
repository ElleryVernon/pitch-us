/**
 * User configuration state management with persistence.
 *
 * This module provides a Zustand store for managing user-specific configuration,
 * particularly LLM API keys and settings. The store uses persistence middleware
 * to save configuration to localStorage, allowing settings to persist across
 * browser sessions.
 */

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

/**
 * LLM configuration structure.
 *
 * Flexible key-value structure for storing LLM-related configuration such as
 * API keys, model identifiers, and service settings. Keys are typically
 * environment variable names (e.g., "OPENROUTER_API_KEY", "OPENROUTER_MODEL").
 *
 * @remarks
 * This is an index signature type that allows any string key with optional
 * string values. Used for flexible configuration storage where the exact keys
 * may vary based on user needs or service availability.
 */
export interface LLMConfig {
  [key: string]: string | undefined;
}

/**
 * State interface for user configuration store.
 *
 * Manages user-specific settings that persist across sessions. Configuration
 * is stored in localStorage via Zustand's persist middleware.
 *
 * @property can_change_keys - Boolean flag indicating whether the user has
 *   permission to change API keys. Used for feature gating or access control.
 * @property llm_config - Object containing LLM-related configuration settings.
 *   Typically includes API keys and model identifiers. Persisted to localStorage.
 * @property setLLMConfig - Updates the LLM configuration object. Replaces the
 *   entire configuration.
 * @property setCanChangeKeys - Updates the permission flag for changing API keys.
 * @property reset - Resets all configuration to initial state (clears persisted data).
 */
interface UserConfigState {
  can_change_keys: boolean;
  llm_config: LLMConfig;

  // Actions
  setLLMConfig: (config: LLMConfig) => void;
  setCanChangeKeys: (can: boolean) => void;
  reset: () => void;
}

const initialState = {
  can_change_keys: false,
  llm_config: {},
};

export const useUserConfigStore = create<UserConfigState>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        setLLMConfig: (config) => set({ llm_config: config }),

        setCanChangeKeys: (can) => set({ can_change_keys: can }),

        reset: () => set(initialState),
      }),
      {
        name: "user-config-storage",
      }
    ),
    { name: "user-config" }
  )
);
