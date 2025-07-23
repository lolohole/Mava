const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const mongoose = require('mongoose');

function isAuthenticated(req, res, next) {
  if (req.user) return next();
  res.redirect('/login');
}

router.post('/', async (req, res) => {
  const { sellerId, sellerUsername, productName, productDescription, proposedBudget } = req.body;

  // تأكد من أن المستخدم متصل
  if (!req.user) {
    return res.status(401).json({ error: 'You must be logged in to submit your application..' });
  }

  const buyerId = req.user._id;
  const buyerUsername = req.user.username;

  console.log('Received data:', req.body);  // سجّل البيانات التي وصلت من الـ Frontend

  if (!productDescription || !productDescription.trim()) {
    return res.status(400).json({ error: 'Please enter order details.' });
  }

  if (isNaN(proposedBudget) || proposedBudget <= 0) {
    return res.status(400).json({ error: 'Please enter a valid budget..' });
  }

  try {
    const order = new Order({
      buyerId,
      buyerUsername,
      sellerId,
      sellerUsername,
      productName,
      productDescription,
      proposedBudget
    });

    console.log('Order object to be saved:', order);  // سجّل كائن الطلب الذي سيُحفظ

    await order.save();

    res.status(201).json({ message: 'The request has been sent successfully.' });
  } catch (error) {
    console.error('Error saving order:', error);  // سجل الخطأ في حال حدوثه
    res.status(500).json({ error: 'An error occurred while submitting the request..' });
  }
});

router.get('/', isAuthenticated, async (req, res) => {
  const orders = await Order.find({ sellerId: req.user._id }).populate('buyerId');
  res.render('orders', { orders });
});

module.exports = router;
