import User from '../models/User.js';
import { supabase } from '../config/database.js';
import jwt from 'jsonwebtoken';

const DEFAULT_MEMBER_PASSWORD = 'password123';

const isValidEmail = (value = '') => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());

// Generate JWT Token
const generateToken = (id, role, teamId) => {
  return jwt.sign(
    { id, role, team_id: teamId ?? null },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// @route   POST /api/auth/register
// @desc    Register a user
// @access  Public
export const register = async (req, res) => {
  try {
    const { studentNumber, password, fullName, username, instituteEmail, personalEmail, birthday } = req.body;

    // Validate input
    if (!studentNumber || !password || !fullName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide student number, password, and full name'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ studentNumber });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Student number already registered'
      });
    }

    // Create user
    const user = await User.create({
      studentNumber,
      password,
      fullName,
      username: username || studentNumber,
      instituteEmail,
      personalEmail,
      birthday: birthday || null,
      role: 'USER',
      isFirstLogin: true
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please login to continue.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @route   POST /api/auth/login
// @desc    Login user and return token
// @access  Public
export const login = async (req, res) => {
  try {
    const { studentNumber, password } = req.body;

    // Validate input
    if (!studentNumber || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide student number and password'
      });
    }

    // Check for user
    const user = await User.findOne({ studentNumber });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated'
      });
    }

    // Check password
    const isMatch = await User.comparePassword(user.password, password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // CRITICAL BUSINESS LOGIC: Check if this is first login
    if (user.isFirstLogin) {
      // Generate temporary token for password change flow
      const tempToken = jwt.sign(
        { id: user.id, role: user.role, requiresPasswordChange: true },
        process.env.JWT_SECRET,
        { expiresIn: '15m' } // Short lived token for password reset
      );

      return res.status(403).json({
        success: false,
        message: 'First login detected. You must change your password before proceeding.',
        requiresPasswordChange: true,
        tempToken: tempToken,
        user: user.getPublicProfile()
      });
    }

    // Generate token
    const token = generateToken(user.id, user.role, user.teamId);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: user.getPublicProfile()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @route   POST /api/auth/change-password
// @desc    Change password on first login
// @access  Private (requires tempToken from login)
export const changePassword = async (req, res) => {
  try {
    const { newPassword, confirmPassword } = req.body;

    // Validate input
    if (!newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide new password and confirmation'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Get user from token
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update password and set isFirstLogin to false
    const updatedUser = await User.updateOne(
      { id: userId },
      { password: newPassword, isFirstLogin: false }
    );

    // Generate token
    const token = generateToken(updatedUser.id, updatedUser.role, updatedUser.teamId);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully. You can now access the dashboard.',
      token,
      user: updatedUser.getPublicProfile()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @route   GET /api/auth/me
// @desc    Get current logged in user
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      user: user.getPublicProfile()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @route   PUT /api/auth/profile
// @desc    Update user profile (profile picture, etc)
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const { profile_picture } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!profile_picture) {
      return res.status(400).json({
        success: false,
        message: 'No profile picture provided'
      });
    }

    // Find user and get current profile picture
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // The old profile picture will be overwritten automatically
    // Update profile picture directly in database
    const { error: updateError } = await supabase
      .from('users')
      .update({ profile_picture })
      .eq('id', userId);

    if (updateError) {
      throw updateError;
    }

    // Fetch updated user
    const updatedUser = await User.findById(userId);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: updatedUser.getPublicProfile()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @route   GET /api/auth/users
// @desc    Get all team members
// @access  Private
export const getUsers = async (req, res) => {
  try {
    let query = supabase
      .from('users')
      .select('id, full_name, student_number, username, institute_email, personal_email, role, profile_picture, is_active, created_at')
      .order('full_name');

    if (req.user.team_id) {
      query = query.eq('team_id', req.user.team_id);
    }

    const { data, error } = await query;

    if (error) throw error;

    const users = data.map(u => ({
      id: u.id,
      fullName: u.full_name,
      studentNumber: u.student_number,
      username: u.username,
      instituteEmail: u.institute_email,
      personalEmail: u.personal_email,
      role: u.role,
      profilePicture: u.profile_picture,
      isActive: u.is_active,
      createdAt: u.created_at
    }));

    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   POST /api/auth/users
// @desc    Create a member for the current admin's team
// @access  Private/Admin
export const createMember = async (req, res) => {
  try {
    const {
      fullName,
      username,
      studentNumber,
      instituteEmail,
      personalEmail
    } = req.body;

    if (!fullName || !username || !studentNumber || !instituteEmail || !personalEmail) {
      return res.status(400).json({
        success: false,
        message: 'Full name, nickname, student number, institute email, and personal email are required'
      });
    }

    if (!isValidEmail(instituteEmail) || !isValidEmail(personalEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid institute and personal email addresses'
      });
    }

    const trimmedFullName = String(fullName).trim();
    const trimmedUsername = String(username).trim();
    const trimmedStudentNumber = String(studentNumber).trim();
    const trimmedInstituteEmail = String(instituteEmail).trim().toLowerCase();
    const trimmedPersonalEmail = String(personalEmail).trim().toLowerCase();

    const existingUser = await User.findOne({ studentNumber: trimmedStudentNumber });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Student number already registered'
      });
    }

    const [
      existingUsernameResult,
      existingInstituteEmailResult,
      existingPersonalEmailResult
    ] = await Promise.all([
      supabase.from('users').select('id').eq('username', trimmedUsername).limit(1).maybeSingle(),
      supabase.from('users').select('id').eq('institute_email', trimmedInstituteEmail).limit(1).maybeSingle(),
      supabase.from('users').select('id').eq('personal_email', trimmedPersonalEmail).limit(1).maybeSingle()
    ]);

    const duplicateContactError =
      existingUsernameResult.error ||
      existingInstituteEmailResult.error ||
      existingPersonalEmailResult.error;

    if (duplicateContactError) {
      throw duplicateContactError;
    }

    if (
      existingUsernameResult.data ||
      existingInstituteEmailResult.data ||
      existingPersonalEmailResult.data
    ) {
      return res.status(400).json({
        success: false,
        message: 'Nickname or email is already in use'
      });
    }

    const user = await User.create({
      fullName: trimmedFullName,
      username: trimmedUsername,
      studentNumber: trimmedStudentNumber,
      instituteEmail: trimmedInstituteEmail,
      personalEmail: trimmedPersonalEmail,
      password: DEFAULT_MEMBER_PASSWORD,
      role: 'USER',
      isFirstLogin: true,
      teamId: req.user.team_id ?? null
    });

    res.status(201).json({
      success: true,
      message: 'Member created successfully',
      data: {
        user: user.getPublicProfile(),
        temporaryPassword: DEFAULT_MEMBER_PASSWORD
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

