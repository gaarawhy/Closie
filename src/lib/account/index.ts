// Tudo o que as telas usam da conta passa por aqui. Para trocar a persistência local por
// uma API, mude storage.ts (ou service.ts) mantendo estas assinaturas.
export {
  checkUsernamesAvailable,
  completeOnboarding,
  getSession,
  isOnboarded,
  signIn,
  signOut,
  signUp,
  updateProfile,
} from "./service";
export { useSession } from "./useSession";
export type {
  OnboardingField,
  OnboardingInput,
  OnboardingResult,
  OnboardingStep,
  Profile,
  ProfileUpdateResult,
  Session,
  SignUpField,
  SignUpInput,
  SignUpResult,
} from "./types";
