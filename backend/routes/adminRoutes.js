const express = require('express');
const { body } = require('express-validator');
const { getAdminDashboard } = require('../controllers/adminController');
const { getUsers, getUserById, setUserActive } = require('../controllers/adminUserController');
const { getProducts, deleteProduct } = require('../controllers/adminProductController');
const { deleteSeller } = require('../controllers/adminSellerController');
const { getOfficers, createOfficer, updateOfficer, setOfficerActive } = require('../controllers/adminOfficerController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect, authorize(['admin']));

router.get('/dashboard', getAdminDashboard);

router.get('/users', getUsers);
router.get('/users/:userId', getUserById);
router.put('/users/:userId/status', [body('isActive').isBoolean().withMessage('isActive must be true or false')], validate, setUserActive);

router.get('/products', getProducts);
router.delete('/products/:productId', deleteProduct);

router.delete('/sellers/:sellerId', deleteSeller);

router.get('/officers', getOfficers);
router.post(
  '/officers',
  [
    body('name').trim().isLength({ min: 2 }).withMessage('Name is required'),
    body('email').isEmail().withMessage('A valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('phone').optional().isString(),
    body('department').optional().isString(),
    body('designation').optional().isString(),
    body('officeLocation').optional().isString(),
  ],
  validate,
  createOfficer
);
router.put('/officers/:officerId', updateOfficer);
router.put(
  '/officers/:officerId/status',
  [body('isActive').isBoolean().withMessage('isActive must be true or false')],
  validate,
  setOfficerActive
);

module.exports = router;
