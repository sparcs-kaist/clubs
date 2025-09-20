import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

import { castProcessEnvToBool } from "@sparcs-clubs/web/utils/envUtil";
import logger from "@sparcs-clubs/web/utils/logger";

export const AvailableFeatureFlags = [
  "DEFAULT",
  "REGISTER_CLUB",
  "REGISTER_MEMBER",
  "NO_RELEASE",
] as const;

type AvailableFeatureFlagsState = {
  [key in (typeof AvailableFeatureFlags)[number]]: boolean;
};

interface FeatureFlagState {
  FLAGS: AvailableFeatureFlagsState;
  DEV_MODE: boolean;
  VERSION: string;
}

const envParseWithDevModeCheck = (env: string | undefined): boolean => {
  if (process.env.NEXT_PUBLIC_APP_MODE === "dev") return true;
  return castProcessEnvToBool(env);
};

export const parsedFeatureFlagState: FeatureFlagState = {
  FLAGS: {
    DEFAULT: true,
    REGISTER_CLUB: envParseWithDevModeCheck(
      process.env.NEXT_PUBLIC_FLAGS_REGISTER_CLUB,
    ),
    REGISTER_MEMBER: envParseWithDevModeCheck(
      process.env.NEXT_PUBLIC_FLAGS_REGISTER_MEMBER,
    ),
    NO_RELEASE: envParseWithDevModeCheck(
      process.env.NEXT_PUBLIC_FLAGS_NO_RELEASE,
    ),
  },
  DEV_MODE: castProcessEnvToBool(process.env.NEXT_PUBLIC_FLAGS_IN_DEV),
  VERSION: process.env.NEXT_PUBLIC_FLAGS_VERSION || "NOT-DEFINED",
};

logger.debug("Feature Flag State", parsedFeatureFlagState);

const useFeatureFlagStore = create(
  persist(
    immer<FeatureFlagState>(() => parsedFeatureFlagState),
    {
      name: "INTERNAL--feature-flag-state",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => state => {
        if (
          !state ||
          state.FLAGS.REGISTER_CLUB !==
            parsedFeatureFlagState.FLAGS.REGISTER_CLUB ||
          state.FLAGS.REGISTER_MEMBER !==
            parsedFeatureFlagState.FLAGS.REGISTER_MEMBER ||
          state.FLAGS.NO_RELEASE !== parsedFeatureFlagState.FLAGS.NO_RELEASE ||
          state.DEV_MODE !== parsedFeatureFlagState.DEV_MODE
        ) {
          logger.debug("Feature Flag values changed, clearing cache", {
            cached: state?.FLAGS,
            current: parsedFeatureFlagState.FLAGS,
          });
          return parsedFeatureFlagState;
        }
        return state;
      },
    },
  ),
);

export default useFeatureFlagStore;
