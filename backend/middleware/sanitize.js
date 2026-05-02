export const sanitizeInputs = (req, res, next) => {
  const sanitize = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === "string") {
        // Very basic XSS prevention: remove < and > characters
        obj[key] = obj[key].replace(/</g, "&lt;").replace(/>/g, "&gt;");
      } else if (typeof obj[key] === "object" && obj[key] !== null) {
        sanitize(obj[key]);
      }
    }
  };

  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);

  next();
};
