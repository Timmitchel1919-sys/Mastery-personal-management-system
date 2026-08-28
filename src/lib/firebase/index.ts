// Client- and server-safe helpers only. Import the SDK singletons directly:
//   client → `@/lib/firebase/client`   (browser)
//   admin  → `@/lib/firebase/admin`    (server only; guarded by `server-only`)
export {
  EMULATOR_CONFIG,
  getFirebaseClientConfig,
  useFirebaseEmulators,
  type FirebaseClientConfig,
} from "./config";
export { makeConverter } from "./converters";
export { normalizeTimestamps } from "./timestamps";
