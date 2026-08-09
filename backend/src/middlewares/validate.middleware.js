import AppError from "../utils/AppError.js";

export const validate = (schema) => {
  return (req, res, next) => {
    try {
      // Validate the request object sections defined in the schema (e.g. body, query, params)
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params
      });

      // Replace with validated/parsed values (to handle type coercions)
      if (parsed.body) req.body = parsed.body;
      if (parsed.query) req.query = parsed.query;
      if (parsed.params) req.params = parsed.params;

      next();
    } catch (error) {
      if (error.errors) {
        const message = error.errors
          .map((err) => `${err.path.slice(1).join(".") || err.path[0]}: ${err.message}`)
          .join("; ");
        return next(new AppError(`Validation failed: ${message}`, 400));
      }
      next(error);
    }
  };
};
