const Contact = require('../models/Contact');

// Handle the form submission
exports.sendMessage = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Save the contact message to the database (if required)
    const contactMessage = new Contact({
      name,
      email,
      message,
    });

    await contactMessage.save();

    // You can also send an email or trigger any other notifications here

    res.status(200).send('Message sent successfully!'); // You can change the response as needed
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).send('There was an error sending your message. Please try again later.');
  }
};
