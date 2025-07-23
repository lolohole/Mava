const session = require('express-session');

module.exports = session({
    secret: 'mysecretkey',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }  // يمكنك تغيير `secure` لاحقًا عند استخدام https
});
