import React, { createContext, useContext } from "react";

interface AuthContextType {
  isSignedIn: boolean;
  isLoaded: boolean;
  userId: string | null;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType>({
  isSignedIn: false,
  isLoaded: true,
  userId: null,
  getToken: async () => null,
});

export function ClerkProvider({ children }: { children: React.ReactNode }) {
  return (
    <AuthContext.Provider
      value={{
        isSignedIn: false,
        isLoaded: true,
        userId: null,
        getToken: async () => null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function useUser() {
  return {
    isLoaded: true,
    isSignedIn: false,
    user: null,
  };
}

export function Show({
  when,
  children,
}: {
  when: "signed-in" | "signed-out";
  children: React.ReactNode;
}) {
  if (when === "signed-out") return <>{children}</>;
  return null;
}

export function SignInButton({
  children,
}: {
  children?: React.ReactNode;
  mode?: string;
}) {
  return (
    <div
      onClick={() => {
        alert("Customer accounts & sign-in are optional. You can order on WhatsApp or proceed to checkout directly!");
      }}
      className="cursor-pointer inline-flex items-center"
    >
      {children}
    </div>
  );
}

export function UserButton({ afterSignOutUrl }: { afterSignOutUrl?: string }) {
  return null;
}
