import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Admin routes require admin:view permission
    if (pathname.startsWith("/admin")) {
      if (!token?.permissions?.includes("admin:view")) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    // Admin sub-sections have more granular checks
    if (pathname.startsWith("/admin/users") && !token?.permissions?.includes("admin:users")) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    if (pathname.startsWith("/admin/roles") && !token?.permissions?.includes("admin:roles")) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    if (pathname.startsWith("/admin/sso") && !token?.permissions?.includes("admin:sso")) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    if (pathname.startsWith("/admin/notifications") && !token?.permissions?.includes("admin:notifications")) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }

    // Policy write operations require appropriate permissions
    if (pathname.startsWith("/policies/new") && !token?.permissions?.includes("policies:create")) {
      return NextResponse.redirect(new URL("/policies", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/policies/:path*",
    "/admin/:path*",
    "/api/policies/:path*",
    "/api/admin/:path*",
  ],
};
