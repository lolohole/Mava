// routes/products.js

const express = require('express');
const router = express.Router();
const User = require('../models/User');

// مثال: المستخدم مسجل دخوله والـ req.user موجود فيه بياناته
router.post('/add-product', async (req, res) => {
    const { name, image, price, description, contactLink } = req.body;

    try {
        const user = await User.findById(req.user._id);
        if (!user || !user.isCompany) return res.status(403).send("Not authorized");

        user.products.push({ name, image, price, description, contactLink });
        await user.save();

        res.redirect('/profile/' + user.username);
    } catch (err) {
        res.status(500).send("Error adding product");
    }
});

module.exports = router;
