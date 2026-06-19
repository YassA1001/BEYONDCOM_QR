// Generic validation middleware factory.
// Pass a Joi schema and it validates req.body (by default) and attaches errors as flash.
// On failure, returns the user to the form with old inputs + errors, or calls next on JSON requests.

function validate(schema, source = 'body') {
  return (req, res, next) => {
    const data = req[source] || {};
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: false,
    });

    if (error) {
      const errors = {};
      error.details.forEach((d) => {
        const key = d.path.join('.');
        if (!errors[key]) errors[key] = d.message;
      });

      const back = req.get('Referer') || req.originalUrl;

      // For form posts: stash errors + old input and redirect back.
      if (req.method === 'POST' && req.accepts('html')) {
        req.flash('errors', JSON.stringify(errors));
        req.flash('old', JSON.stringify(req.body || {}));
        return res.redirect(back);
      }

      // For API-ish requests: JSON error.
      return res.status(422).json({ errors });
    }

    req[source] = value; // sanitized
    res.locals.errors = res.locals.errors || {};
    next();
  };
}

// Helper usable in views: pop stashed errors + old input from flash into locals.
function loadFlashLocals(req, res, next) {
  res.locals.errors = {};
  res.locals.old = {};

  const errorFlash = req.flash('errors');
  if (errorFlash.length > 0) {
    try { res.locals.errors = JSON.parse(errorFlash[0]); } catch { /* noop */ }
  }
  const oldFlash = req.flash('old');
  if (oldFlash.length > 0) {
    try { res.locals.old = JSON.parse(oldFlash[0]); } catch { /* noop */ }
  }
  next();
}

module.exports = { validate, loadFlashLocals };
