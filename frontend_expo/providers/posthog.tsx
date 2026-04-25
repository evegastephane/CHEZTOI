import { useEffect } from "react";
import { PostHogProvider, usePostHog } from "posthog-react-native";
import { useUser } from "@clerk/expo";

const API_KEY = process.env.EXPO_PUBLIC_POSTHOG_API_KEY ?? "";
const HOST    = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";

const isConfigured = API_KEY.startsWith("phc_") && !API_KEY.includes("REMPLACER");

// On rend toujours le provider (disabled quand non configuré)
// pour que usePostHog() ait toujours un contexte valide.
export function PostHogProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <PostHogProvider
      apiKey={isConfigured ? API_KEY : "phc_disabled"}
      options={{ host: HOST, disabled: !isConfigured }}
    >
      {children}
    </PostHogProvider>
  );
}

export function PostHogIdentifier() {
  const { user, isLoaded } = useUser();
  const posthog = usePostHog();

  useEffect(() => {
    if (!isLoaded || !posthog) return;
    if (user) {
      const props: Record<string, string> = {};
      if (user.primaryEmailAddress?.emailAddress) props.email     = user.primaryEmailAddress.emailAddress;
      if (user.firstName)                         props.firstName = user.firstName;
      if (user.lastName)                          props.lastName  = user.lastName;
      posthog.identify(user.id, props);
    } else {
      posthog.reset();
    }
  }, [user, isLoaded, posthog]);

  return null;
}