const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Helper to generate JWT Token
const generateToken = (user) => {
  const secret = process.env.JWT_SECRET || 'globetrotter_super_secret_jwt_key_2026';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    secret,
    { expiresIn }
  );
};

// Helper to sanitize user object (strip passwordHash)
const sanitizeUser = (user) => {
  const { passwordHash, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

// Email validation helper
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phoneNumber,
      city,
      country,
      additionalInfo,
      profilePhotoUrl
    } = req.body;

    // Validation checks
    if (!firstName || !firstName.trim()) {
      return res.status(400).json({ success: false, message: 'First name is required.' });
    }
    if (!lastName || !lastName.trim()) {
      return res.status(400).json({ success: false, message: 'Last name is required.' });
    }
    if (!email || !isValidEmail(email.trim())) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }
    if (!password || password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long.' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists. Please login instead.'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: normalizedEmail,
        passwordHash,
        phoneNumber: phoneNumber ? phoneNumber.trim() : null,
        city: city ? city.trim() : null,
        country: country ? country.trim() : null,
        additionalInfo: additionalInfo ? additionalInfo.trim() : null,
        profilePhotoUrl: profilePhotoUrl ? profilePhotoUrl.trim() : null
      }
    });

    // Generate JWT token
    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: sanitizeUser(newUser)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & return JWT token
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }
    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Validate password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Generate token
    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: 'Logged in successfully!',
      token,
      user: sanitizeUser(user)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user profile
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.status(200).json({
      success: true,
      user: sanitizeUser(user)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/users/me
 * @desc    Update current user profile
 * @access  Private
 */
const updateMe = async (req, res, next) => {
  try {
    const { firstName, lastName, email, city, country, additionalInfo, profilePhotoUrl } = req.body;

    const updateData = {
      firstName: firstName && firstName.trim() ? firstName.trim() : undefined,
      lastName: lastName && lastName.trim() ? lastName.trim() : undefined,
      email: email && email.trim() ? email.trim().toLowerCase() : undefined,
      city: city && city.trim() ? city.trim() : undefined,
      country: country && country.trim() ? country.trim() : undefined,
      additionalInfo: additionalInfo && additionalInfo.trim() ? additionalInfo.trim() : undefined,
      profilePhotoUrl: profilePhotoUrl && profilePhotoUrl.trim() ? profilePhotoUrl.trim() : undefined,
    };

    // Remove undefined values so Prisma only updates provided fields
    const filteredUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, v]) => v !== undefined)
    );

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: filteredUpdateData
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully!',
      user: sanitizeUser(user)
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateMe
};
