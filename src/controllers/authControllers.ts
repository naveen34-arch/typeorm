import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { signupSchema, loginSchema, updateProfileSchema } from '../validation/schemas';
import { AuthenticatedRequest } from '../middleware/auth';
import { generateToken } from '../utils/jwt';

export class AuthController {
  // ===================== SIGNUP =====================
  static async signup(req: Request, res: Response) {
    try {
      const { error, value } = signupSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map(d => d.message),
        });
      }

      const { name, age, email, password, phoneNum, course, city } = value;
      const userRepository = AppDataSource.getRepository(User);

      const existingUser = await userRepository.findOne({ where: { email } });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User with this email already exists',
        });
      }

      const user = userRepository.create({
        name,
        age,
        email,
        password,
        phoneNum,
        course,
        city,
      });

      await userRepository.save(user);
      // const token = generateToken({ userId: user.id });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user: user.toJSON(),
        // token,
      });
    } catch (err) {
      console.error('Signup error:', err);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  // ===================== LOGIN =====================
  static async login(req: Request, res: Response) {
    try {
      const { error, value } = loginSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map(d => d.message),
        });
      }

      const { email, password } = value;
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({ where: { email } });

      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      const token = generateToken({ userId: user.id });

      res.status(200).json({
        success: true,
        message: 'Login successful',
        user: user.toJSON(),
        token,
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  // ===================== PROFILE =====================
  static async getProfile(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      res.status(200).json({
        success: true,
        message: 'User profile retrieved successfully',
        user: req.user.toJSON(),
      });
    } catch (err) {
      console.error('Get profile error:', err);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  // ===================== ALL USERS =====================
  static async getAllUsers(req: AuthenticatedRequest, res: Response) {
    try {
      const userRepository = AppDataSource.getRepository(User);
      const users = await userRepository.find({
        select: ['id', 'name', 'age', 'email', 'phoneNum', 'course', 'city', 'createdAt', 'updatedAt'],
      });

      res.status(200).json({
        success: true,
        message: 'Users retrieved successfully',
        users,
        count: users.length,
      });
    } catch (err) {
      console.error('Get all users error:', err);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  // ===================== UPDATE PROFILE =====================
  static async updateProfile(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'User not authenticated' });
      }

      const { error, value } = updateProfileSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map(d => d.message),
        });
      }

      const userRepository = AppDataSource.getRepository(User);
      const userId = req.user.id;

      if (value.email && value.email !== req.user.email) {
        const existing = await userRepository.findOne({ where: { email: value.email } });
        if (existing) {
          return res.status(409).json({ success: false, message: 'Email is already taken' });
        }
      }

      await userRepository.update(userId, value);
      const updatedUser = await userRepository.findOne({ where: { id: userId } });

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        user: updatedUser?.toJSON(),
      });
    } catch (err) {
      console.error('Update profile error:', err);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  // ===================== UPDATE USER (Admin) =====================
  static async updateUser(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = parseInt(req.params.id);
      if (!userId || isNaN(userId)) {
        return res.status(400).json({ success: false, message: 'Invalid user ID' });
      }

      const { error, value } = updateProfileSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map(d => d.message),
        });
      }

      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({ where: { id: userId } });

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      if (value.email && value.email !== user.email) {
        const taken = await userRepository.findOne({ where: { email: value.email } });
        if (taken && taken.id !== userId) {
          return res.status(409).json({ success: false, message: 'Email is already taken' });
        }
      }

      await userRepository.update(userId, value);
      const updatedUser = await userRepository.findOne({ where: { id: userId } });

      res.status(200).json({
        success: true,
        message: 'User updated successfully',
        user: updatedUser?.toJSON(),
      });
    } catch (err) {
      console.error('Update user error:', err);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

 // ===================== change password =====================
static async changePassword(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Both old and new passwords are required" });
    }

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: req.user.id } });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Check old password
    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Old password is incorrect" });
    }

    // Update password (hook will hash automatically)
    user.password = newPassword;
    await userRepository.save(user);

    return res.status(200).json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    console.error("Change password error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}





  // ===================== DELETE USER (Admin) =====================
  static async deleteUser(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = parseInt(req.params.id);
      if (!userId || isNaN(userId)) {
        return res.status(400).json({ success: false, message: 'Invalid user ID' });
      }

      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({ where: { id: userId } });

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      if (req.user && req.user.id === userId) {
        return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
      }

      await userRepository.delete(userId);
      res.status(200).json({ success: true, message: 'User deleted successfully', deletedUserId: userId });
    } catch (err) {
      console.error('Delete user error:', err);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  // ===================== DELETE ACCOUNT (Self) =====================
  static async deleteAccount(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'User not authenticated' });
      }

      const userRepository = AppDataSource.getRepository(User);
      await userRepository.delete(req.user.id);

      res.status(200).json({ success: true, message: 'Account deleted successfully' });
    } catch (err) {
      console.error('Delete account error:', err);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
}
