const express = require('express');
const { getProducts, getProductById, searchProducts, getSearchSuggestions } = require('../controllers/productController');

const router = express.Router();

router.get('/search', searchProducts);
router.get('/suggestions', getSearchSuggestions);
router.get('/:id', getProductById);
router.get('/', getProducts);

module.exports = router;
