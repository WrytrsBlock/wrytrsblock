"use client";

import { createContext, useContext, type ReactNode } from "react";

export type CurrentProfile = {
  name: string;
  handle: string;
  avatar: string;
  role: string;
};

const ProfileContext = createContext<CurrentProfile | null>(null);

// Provides the signed-in user's identity to always-present chrome (the TopBar)
// so "My Profile" is reachable in one click from any page.
export function ProfileProvider({
  value,
  children,
}: {
  value: CurrentProfile;
  children: ReactNode;
}) {
  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

export function useCurrentProfile() {
  return useContext(ProfileContext);
}
