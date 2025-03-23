// Middleware to inject selected environment variables into HTML head as meta tags

/**
 * Sanitize content for safe HTML attribute injection
 * @param {string} value - The value to sanitize
 * @returns {string}
 */
function sanitize(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Generate meta tags from selected env variables
 * @param {Object} env
 * @returns {string}
 */
function generateMetaTags(env) {
  return Object.entries(env)
    .filter(([key, val]) => val !== undefined && val !== null)
    .filter(([key]) => key.startsWith('VITE_') || key.startsWith('TWITCH_') || key.startsWith('PUBLIC_'))
    .map(([key, val]) => {
      const safeKey = sanitize(key);
      const safeVal = sanitize(val);
      return `<meta name="env-${safeKey}" content="${safeVal}">`;
    })
    .join('\n');
}

/**
 * Create a middleware to inject meta tags with env variables into HTML responses
 * @param {Object} options
 * @param {Object} options.env
 * @returns {Function} Express middleware
 */
export function createEnvMiddleware({ env = {} } = {}) {
  const metaTags = generateMetaTags(env);

  return function (req, res, next) {
    const originalSend = res.send;

    res.send = function (body) {
      if (
        typeof body === 'string' &&
        body.includes('<head>') &&
        (res.get('Content-Type') || '').includes('text/html')
      ) {
        body = body.replace('<head>', `<head>\n${metaTags}`);
      }

      return originalSend.call(this, body);
    };

    next();
  };
}

export default createEnvMiddleware;
