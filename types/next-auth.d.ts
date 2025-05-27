import "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    refreshToken?: string;
    isPermanent?: boolean;
    isManualSignOut?: boolean;
    signOut?: boolean;
  }

  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    isPermanent?: boolean;
    isManualSignOut?: boolean;
    userId?: string;
    expiresAt?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    isPermanent?: boolean;
    isManualSignOut?: boolean;
    userId?: string;
    expiresAt?: number;
  }
}
