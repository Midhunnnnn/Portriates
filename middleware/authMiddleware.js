const User = require('../models/User');
const mongoose = require('mongoose');

const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }
  req.session.returnTo = req.originalUrl;
  return res.redirect('/auth/login?error=Please log in to continue');
};

const isAdmin = (req, res, next) => {
  if (req.session && req.session.userId && req.session.role === 'admin') {
    return next();
  }
  return res.status(403).render('auth/admin-login', {
    pageTitle: 'Admin Portal Access',
    errorMessage: 'Access restricted to studio administrator. Please sign in.'
  });
};

const setUserContext = async (req, res, next) => {
  res.locals.currentUser = null;
  res.locals.isAdmin = false;
  res.locals.path = req.path;
  res.locals.successMessage = req.query.success || null;
  res.locals.errorMessage = req.query.error || null;

  if (req.session && req.session.userId) {
    try {
      if (mongoose.Types.ObjectId.isValid(req.session.userId)) {
        const user = await User.findById(req.session.userId);
        if (user) {
          res.locals.currentUser = user;
          res.locals.isAdmin = user.role === 'admin';
          req.session.role = user.role;
        }
      } else if (req.session.role === 'admin') {
        res.locals.isAdmin = true;
        res.locals.currentUser = {
          name: req.session.userName || 'Midhun R.S.',
          email: req.session.userEmail || 'midhunrs727@gmail.com',
          role: 'admin'
        };
      }
    } catch (err) {
      console.error('Error in setUserContext middleware:', err);
    }
  }
  next();
};

module.exports = {
  isAuthenticated,
  isAdmin,
  setUserContext
};
