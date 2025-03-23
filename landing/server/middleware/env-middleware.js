// server/middleware/env-middleware.js
// Enhanced middleware to inject environment variables securely

/**
 * Sanitize content for safe HTML attribute injection
 * @param {string} value - The value to sanitize
 * @returns {string} Sanitized string
 */
function sanitize(value) {
  if (value === undefined || value === null) {
    return '';
  }
  
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/'/g, '&#39;');
}

/**
 * Filter environment variables to only expose approved ones
 * @param {Object} env - Environment variables
 * @returns {Object} Filtered environment variables
 */
function filterEnvVars(env) {
  // Define allowed prefixes for environment variables
  const allowedPrefixes = ['VITE_', 'PUBLIC_', 'TWITCH_CLIENT_ID'];
  // Define explicitly allowed variables
  const allowedVars = ['NODE_ENV'];
  
  return Object.fromEntries(
    Object.entries(env)
      .filter(([key, val]) => 
        // Keep only defined values
        val !== undefined && val !== null &&
        // Keep only allowed variables
        (allowedPrefixes.some(prefix => key.startsWith(prefix)) || 
         allowedVars.includes(key))
      )
      // Filter out sensitive values
      .filter(([key]) => !key.includes('SECRET') && !key.includes('PASSWORD'))
  );
}

/**
 * Generate meta tags from filtered environment variables
 * @param {Object} env - Environment variables
 * @returns {string} HTML meta tags
 */
function generateMetaTags(env) {
  const filteredEnv = filterEnvVars(env);
  
  return Object.entries(filteredEnv)
    .map(([key, val]) => {
      const safeKey = sanitize(key);
      const safeVal = sanitize(val);
      return `<meta name="env-${safeKey}" content="${safeVal}">`;
    })
    .join('\n');
}

/**
 * Create middleware to inject environment variables as meta tags
 * @param {Object} options - Configuration options
 * @param {Object} options.env - Environment variables
 * @returns {Function} Express middleware
 */
export function createEnvMiddleware({ env = {} } = {}) {
  // Generate meta tags once at startup
  const metaTags = generateMetaTags(env);
  console.log(`Generated ${metaTags.split('\n').length} environment meta tags`);

  return function envMiddleware(req, res, next) {
    // Replace the response.send method to inject meta tags
    const originalSend = res.send;

    res.send = function(body) {
      // Only modify HTML responses that have a <head> tag
      if (
        typeof body === 'string' &&
        body.includes('<head>') &&
        (res.get('Content-Type') || '').includes('text/html')
      ) {
        // Insert meta tags after the <head> tag
        body = body.replace('<head>', `<head>\n${metaTags}`);
      }

      // Call the original send method
      return originalSend.call(this, body);
    };

    next();
  };
}

export default createEnvMiddleware;