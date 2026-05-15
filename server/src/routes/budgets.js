const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getBudgets, createBudget, updateBudget, deleteBudget } = require('../controllers/budgetController');

router.use(auth);
router.get('/', getBudgets);
router.post('/', createBudget);
router.put('/:id', updateBudget);
router.delete('/:id', deleteBudget);

module.exports = router;
