import type { Role } from "@/types/roles";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id:             string;
      name:           string;
      email?:         string;
      phone:          string;
      role:           Role;
      teacherId:      string | null;
      organizationId: string | null;
      orgSubdomain:   string | null;
    };
  }

  interface User {
    phone:          string;
    role:           Role;
    teacherId:      string | null;
    organizationId: string | null;
    orgSubdomain:   string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id:                 string;
    phone:              string;
    role:               Role;
    teacherId:          string | null;
    organizationId:     string | null;
    orgSubdomain:       string | null;
    // Backend tokenlari (faqat server tomonda, BFF proxy uchun)
    accessToken?:       string;
    refreshToken?:      string;
    accessTokenExpires?: number;
    error?:             string;
  }
}
