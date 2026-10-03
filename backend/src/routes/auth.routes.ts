import { Router, Request, Response } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { verifyToken, authorizeRoles } from '../middlewares/auth.middleware.js';
import { ApiResponse } from '../utils/response.js';

const router = Router();

// Tuyến đường công khai (Public routes)
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/refresh', AuthController.refresh);
router.get('/roles', AuthController.getRoles);

// Tuyến đường yêu cầu xác thực (Protected routes)
router.post('/logout', verifyToken, AuthController.logout);
router.get('/me', verifyToken, AuthController.getMe);

// Tuyến đường kiểm thử phân quyền RBAC (Role-based access test)
router.get(
  '/admin-only',
  verifyToken,
  authorizeRoles('ADMIN'),
  (req: Request, res: Response) => {
    ApiResponse.success(
      res,
      {
        message: 'Xin chào Quản trị viên! Bạn có toàn quyền truy cập khu vực này.',
        user: req.user,
      },
      'Truy cập khu vực Quản trị thành công'
    );
  }
);

router.get(
  '/academic-only',
  verifyToken,
  authorizeRoles('ADMIN', 'ACADEMIC'),
  (req: Request, res: Response) => {
    ApiResponse.success(
      res,
      {
        message: 'Khu vực dành cho Giáo vụ và Quản trị viên.',
        user: req.user,
      },
      'Truy cập thành công'
    );
  }
);

export default router;
