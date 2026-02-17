import bcrypt from 'bcryptjs';
import User from '../models/User.model';
import RefreshToken from '../models/RefreshToken.model';
import { generateAccessToken, generateRefreshToken, getRefreshTokenExpiry } from '../utils/jwt.util';

export async function registerUser(email: string, password: string, name: string) {
  // Check if user exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error('User already exists');
  }
  
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // Create user
  const user = await User.create({
    email,
    password: hashedPassword,
    name
  });
  
  // Generate tokens
  const accessToken = generateAccessToken({
    userId: user._id.toString(),
    email: user.email,
    tier: user.tier
  });
  
  const refreshTokenValue = generateRefreshToken();
  
  await RefreshToken.create({
    userId: user._id,
    token: refreshTokenValue,
    expiresAt: getRefreshTokenExpiry(),
    createdByIp: '0.0.0.0'
  });
  
  return { user, accessToken, refreshToken: refreshTokenValue };
}

export async function loginUser(email: string, password: string) {
  // Find user
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('Invalid credentials');
  }
  
  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    throw new Error('Invalid credentials');
  }
  
  // Update last login
  user.lastLoginAt = new Date();
  await user.save();
  
  // Generate tokens
  const accessToken = generateAccessToken({
    userId: user._id.toString(),
    email: user.email,
    tier: user.tier
  });
  
  const refreshTokenValue = generateRefreshToken();
  
  await RefreshToken.create({
    userId: user._id,
    token: refreshTokenValue,
    expiresAt: getRefreshTokenExpiry(),
    createdByIp: '0.0.0.0'
  });
  
  return { user, accessToken, refreshToken: refreshTokenValue };
}

export async function refreshAccessToken(refreshTokenValue: string) {
  const refreshToken = await RefreshToken.findOne({
    token: refreshTokenValue,
    revokedAt: null
  });
  
  if (!refreshToken || refreshToken.expiresAt < new Date()) {
    throw new Error('Invalid or expired refresh token');
  }
  
  const user = await User.findById(refreshToken.userId);
  if (!user) {
    throw new Error('User not found');
  }
  
  // Generate new access token
  const accessToken = generateAccessToken({
    userId: user._id.toString(),
    email: user.email,
    tier: user.tier
  });
  
  // Optional: Rotate refresh token
  const newRefreshTokenValue = generateRefreshToken();
  
  refreshToken.revokedAt = new Date();
  refreshToken.replacedByToken = newRefreshTokenValue;
  await refreshToken.save();
  
  await RefreshToken.create({
    userId: user._id,
    token: newRefreshTokenValue,
    expiresAt: getRefreshTokenExpiry(),
    createdByIp: '0.0.0.0'
  });
  
  return { accessToken, refreshToken: newRefreshTokenValue };
}

export async function logoutUser(refreshTokenValue: string) {
  const refreshToken = await RefreshToken.findOne({ token: refreshTokenValue });
  
  if (refreshToken) {
    refreshToken.revokedAt = new Date();
    await refreshToken.save();
  }
}
