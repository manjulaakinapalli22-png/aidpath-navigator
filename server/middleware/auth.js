import { inMemoryDb, supabase, isSupabaseConnected } from '../config/supabase.js';

/**
 * Authentication and Persona Resolution Middleware
 * Reads Authorization header (Bearer <id>) or X-User-Id header to identify active persona.
 * Defaults to visitor if no identity header provided.
 */
export async function resolveUser(req, res, next) {
  let userId = req.headers['x-user-id'];

  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    userId = authHeader.substring(7).trim();
  }

  if (userId) {
    if (isSupabaseConnected && supabase) {
      try {
        const { data: dbProfile } = await supabase
          .from('profiles')
          .select('*')
          .or(`id.eq.${userId},email.eq.${userId}`)
          .maybeSingle();

        if (dbProfile) {
          req.user = dbProfile;
          return next();
        }
      } catch (e) {
        // Fallback to inMemoryDb
      }
    }

    const profile = inMemoryDb.profiles.find((p) => p.id === userId || p.email === userId);
    if (profile) {
      req.user = profile;
      return next();
    }
  }

  // Fallback to visitor
  req.user = {
    id: 'visitor',
    full_name: 'Guest Visitor',
    role: 'visitor',
    email: 'visitor@aidpath.org',
  };
  next();
}

/**
 * Require authenticated user (student, operator, admin)
 */
export function requireAuth(req, res, next) {
  if (!req.user || req.user.role === 'visitor') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required. Please select or log into a student, operator, or administrator profile.',
      },
    });
  }
  next();
}

/**
 * Role-Based Access Control middleware
 * @param {Array<string>|string} allowedRoles
 */
export function requireRole(allowedRoles) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req, res, next) => {
    if (!req.user || req.user.role === 'visitor') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Access denied. You must be signed in to perform this action.',
        },
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Permission denied. Required role: [${roles.join(', ')}]. Current role: [${req.user.role}].`,
        },
      });
    }

    next();
  };
}
