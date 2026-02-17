import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';

// Placeholder - dodasz Stripe integration później
export async function createCheckout(req: AuthRequest, res: Response) {
  try {
    // TODO: Implement Stripe checkout
    res.json({
      data: null,
      error: null,
      message: 'Stripe checkout - to be implemented'
    });
  } catch (error: any) {
    res.status(400).json({
      data: null,
      error: { message: error.message },
      message: error.message
    });
  }
}

export async function handleWebhook(req: AuthRequest, res: Response) {
  try {
    // TODO: Implement Stripe webhook handler
    res.json({
      data: { received: true },
      error: null,
      message: null
    });
  } catch (error: any) {
    res.status(400).json({
      data: null,
      error: { message: error.message },
      message: error.message
    });
  }
}

export async function getPortal(req: AuthRequest, res: Response) {
  try {
    // TODO: Implement Stripe customer portal
    res.json({
      data: null,
      error: null,
      message: 'Customer portal - to be implemented'
    });
  } catch (error: any) {
    res.status(400).json({
      data: null,
      error: { message: error.message },
      message: error.message
    });
  }
}
