// Centralized error handling middleware
export const errorHandler = (err, req, res, next) => {
  console.error("[Global Error]", err);

  // Handle CORS errors specifically
  if (err.message?.startsWith("CORS:")) {
    return res.status(403).json({ success: false, error: err.message });
  }

  // Determine status code (default to 500)
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    error: message,
  });
};
