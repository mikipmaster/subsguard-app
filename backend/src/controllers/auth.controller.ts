import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as authService from '../services/auth.service';

export async function register(req: AuthRequest, res: Response) {
  try {
    const { email, password, name } = req.body;
    const result = await authService.registerUser(email, password, name);
    
    res.status(201).json({
      data: {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken
      },
      error: null,
      message: 'User registered successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      data: null,
      error: { message: error.message },
      message: error.message
    });
  }
}

export async function login(req: AuthRequest, res: Response) {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser(email, password);
    
    res.json({
      data: {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken
      },
      error: null,
      message: 'Login successful'
    });
  } catch (error: any) {
    res.status(401).json({
      data: null,
      error: { message: error.message },
      message: error.message
    });
  }
}

export async function refreshToken(req: AuthRequest, res: Response) {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refreshAccessToken(refreshToken);
    
    res.json({
      data: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken
      },
      error: null,
      message: 'Token refreshed successfully'
    });
  } catch (error: any) {
    res.status(401).json({
      data: null,
      error: { message: error.message },
      message: error.message
    });
  }
}

export async function logout(req: AuthRequest, res: Response) {
  try {
    const { refreshToken } = req.body;
    await authService.logoutUser(refreshToken);
    
    res.json({
      data: null,
      error: null,
      message: 'Logout successful'
    });
  } catch (error: any) {
    res.status(400).json({
      data: null,
      error: { message: error.message },
      message: error.message
    });
  }
}

export async function getMe(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const User = (await import('../models/User.model')).default;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        data: null,
        error: { message: 'User not found' },
        message: 'User not found'
      });
    }
    
    res.json({
      data: user,
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
