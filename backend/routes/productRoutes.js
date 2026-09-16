const express = require('express');
const { getProducts, getProductById, searchProducts } = require('../controllers/productController');

const router = express.Router();

router.get('/search', searchProducts);
router.get('/:id', getProductById);
router.get('/', getProducts);

module.exports = router;
