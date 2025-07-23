



const express = require('express');
const router = express.Router();
const { sendMessage } = require('../controllers/contactController');

// GET route to render the contact form
router.get('/', (req, res) => {
  res.render('contact'); // Assuming your form is rendered by the contact.ejs view
});

// POST route to handle the form submission
router.post('/', sendMessage);

module.exports = router;
