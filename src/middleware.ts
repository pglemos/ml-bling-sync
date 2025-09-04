import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { canAccessAdminPanel, getRoleByEmail } from '@/shared/utils/user-roles';

// Extract tenant from request
function getTenantFromRequest(req: NextRequest): string | null {
  // Try to get tenant from subdomain
  const hostname = req.headers.get('host') || '';
  const subdomain = hostname.split('.')[0];
  
  // Skip common subdomains
  if (['www', 'api', 'admin', 'app'].includes(subdomain)) {
    return null;
  }
  
  // Check if it's a valid tenant subdomain (not localhost or IP)
  if (subdomain && !hostname.includes('localhost') && !hostname.match(/^\d+\.\d+\.\d+\.\d+/)) {
    return subdomain;
  }
  
  // Try to get tenant from X-Tenant-ID header
  const tenantHeader = req.headers.get('x-tenant-id');
  if (tenantHeader) {
    return tenantHeader;
  }
  
  // Try to get tenant from query parameter (for development)
  const tenantParam = req.nextUrl.searchParams.get('tenant');
  if (tenantParam) {
    return tenantParam;
  }
  
  return null;
}

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });
  
  // Create Supabase client for middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            req.cookies.set(name, value)
          );
          response = NextResponse.next({
            request: req,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );
  
  // Refresh the auth session
  const { data: { user }, error } = await supabase.auth.getUser();
  
  // Check if this is an admin route that needs protection
  if (req.nextUrl.pathname.startsWith('/admin')) {
    if (error || !user) {
      // No valid session, redirect to login
      return NextResponse.redirect(new URL('/login', req.url));
    }
    
    // Check if user has admin permissions
    const userProfile = {
      id: user.id,
      email: user.email!,
      role: user.user_metadata?.role || 
            user.app_metadata?.role || 
            getRoleByEmail(user.email!)
    };
    
    if (!canAccessAdminPanel(userProfile)) {
      // User doesn't have admin permissions, redirect to dashboard
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }
  
  // Extract tenant information
  const tenantId = getTenantFromRequest(req);
  
  // Add tenant ID to headers for API routes and pages
  if (tenantId) {
    response.headers.set('x-tenant-id', tenantId);
    
    // For API routes, also add to request headers
    if (req.nextUrl.pathname.startsWith('/api/')) {
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set('x-tenant-id', tenantId);
      
      return NextResponse.rewrite(req.nextUrl, {
        request: {
          headers: requestHeaders,
        },
      });
    }
  }
  
  // Handle tenant discovery for public routes
  if (req.nextUrl.pathname.startsWith('/api/v1/tenants/discover')) {
    return response;
  }
  
  // For admin routes, ensure tenant context is available
  if (req.nextUrl.pathname.startsWith('/admin/tenant')) {
    // Add tenant context header
    response.headers.set('x-tenant-context', 'admin');
  }
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
