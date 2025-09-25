import { Router } from "express";
import { AuthController } from "../controllers/authControllers";
import { authenticateToken } from "../middleware/auth";

const router = Router();

// Public routes
router.post("/signup", AuthController.signup);
router.post("/login", AuthController.login);

// Protected routes - Profile Management
router.get("/profile", authenticateToken, AuthController.getProfile);
router.put("/profile", authenticateToken, AuthController.updateProfile);
router.delete("/account", authenticateToken, AuthController.deleteAccount);
router.put("/change-password", authenticateToken, AuthController.changePassword);


// Protected routes - User Management (optional: admin only)
router.get("/users", authenticateToken, AuthController.getAllUsers);
router.put("/users/:id", authenticateToken, AuthController.updateUser);
router.delete("/users/:id", authenticateToken, AuthController.deleteUser);

export default router;
