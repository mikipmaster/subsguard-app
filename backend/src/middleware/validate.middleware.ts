import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export function validateRequest(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req.body);
      (req as any).body = parsed;
      next();
    } catch (error: any) {
      return res.status(400).json({
        data: null,
        error: {
          message: 'Validation failed',
          details: error.errors
        },
        message: 'Validation failed'
      });
    }
  };
}
