const User = require('../models/User');
const Otp = require('../models/Otp');
const { sendOtpVerificationEmail } = require('../config/mailer');

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'midhunrs727@gmail.com').toLowerCase().trim();
const APP_PASSWORD_SPACED = 'mwdo klwl qkrp rxsy';
const APP_PASSWORD_CLEAN = 'mwdoklwlqkrprxsy';
const ADMIN_DEFAULT_PASS = process.env.ADMIN_DEFAULT_PASS || 'admin123';

// Generate 6-digit random numeric OTP
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

exports.getLogin = (req, res) => {
  if (req.session && req.session.userId) {
    return res.redirect('/');
  }
  res.render('auth/login', {
    pageTitle: 'Sign In | Midhun Pencil Portraits',
    error: req.query.error || null,
    success: req.query.success || null,
    returnTo: req.query.returnTo || ''
  });
};

exports.postLogin = async (req, res) => {
  try {
    const { email, password, returnTo } = req.body;

    if (!email || !password) {
      return res.render('auth/login', {
        pageTitle: 'Sign In | Midhun Pencil Portraits',
        error: 'Please enter both email and password',
        success: null,
        returnTo
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanInputPass = password.trim();

    // Check if user is logging in with admin credentials
    if (cleanEmail === ADMIN_EMAIL) {
      const isAppPassword = (cleanInputPass === APP_PASSWORD_SPACED || cleanInputPass === APP_PASSWORD_CLEAN);
      const isDefaultPass = (cleanInputPass === ADMIN_DEFAULT_PASS);

      let user = await User.findOne({ email: cleanEmail });
      let isDbPassMatch = false;
      if (user) {
        isDbPassMatch = await user.comparePassword(cleanInputPass);
      }

      if (isAppPassword || isDefaultPass || isDbPassMatch) {
        if (!user) {
          user = await User.createUser({
            name: 'Midhun (Artist & Admin)',
            email: ADMIN_EMAIL,
            password: cleanInputPass,
            role: 'admin'
          });
        }
        req.session.userId = user._id.toString();
        req.session.role = 'admin';
        req.session.userName = user.name;
        req.session.userEmail = user.email;

        return res.redirect('/admin/dashboard?success=Welcome back, Master Artist Midhun!');
      }
    }

    // Standard user login
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.render('auth/login', {
        pageTitle: 'Sign In | Midhun Pencil Portraits',
        error: 'No account found with this email address. Please register.',
        success: null,
        returnTo
      });
    }

    const isMatch = await user.comparePassword(cleanInputPass);
    if (!isMatch) {
      return res.render('auth/login', {
        pageTitle: 'Sign In | Midhun Pencil Portraits',
        error: 'Incorrect password. Please try again.',
        success: null,
        returnTo
      });
    }

    // Set session
    req.session.userId = user._id.toString();
    req.session.role = user.role;
    req.session.userName = user.name;
    req.session.userEmail = user.email;

    if (user.role === 'admin') {
      return res.redirect('/admin/dashboard');
    }

    if (returnTo && returnTo.startsWith('/')) {
      return res.redirect(returnTo);
    }
    res.redirect('/?success=Welcome back, ' + encodeURIComponent(user.name) + '!');
  } catch (err) {
    console.error('Login error:', err);
    res.render('auth/login', {
      pageTitle: 'Sign In | Midhun Pencil Portraits',
      error: 'An unexpected error occurred during login. Please try again.',
      success: null,
      returnTo: req.body.returnTo || ''
    });
  }
};

exports.getRegister = (req, res) => {
  if (req.session && req.session.userId) {
    return res.redirect('/');
  }
  res.render('auth/register', {
    pageTitle: 'Create an Account | Midhun Pencil Portraits',
    error: req.query.error || null,
    success: null,
    formData: {}
  });
};

/**
 * Step 1: Collect user registration data, generate OTP, send via Nodemailer
 */
exports.postRegister = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, phone, address, city, state, pincode } = req.body;

    if (!name || !email || !password) {
      return res.render('auth/register', {
        pageTitle: 'Create an Account | Midhun Pencil Portraits',
        error: 'Please fill in all required fields (Name, Email, Password)',
        formData: req.body
      });
    }

    if (password.length < 6) {
      return res.render('auth/register', {
        pageTitle: 'Create an Account | Midhun Pencil Portraits',
        error: 'Password must be at least 6 characters long',
        formData: req.body
      });
    }

    if (password !== confirmPassword) {
      return res.render('auth/register', {
        pageTitle: 'Create an Account | Midhun Pencil Portraits',
        error: 'Passwords do not match. Please re-enter.',
        formData: req.body
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.render('auth/register', {
        pageTitle: 'Create an Account | Midhun Pencil Portraits',
        error: 'An account with this email already exists. Please log in.',
        formData: req.body
      });
    }

    // Generate 6-digit OTP
    const otpCode = generateOtp();

    // Store pending registration data in MongoDB Otp collection with TTL
    await Otp.deleteMany({ email: cleanEmail });
    await Otp.create({
      email: cleanEmail,
      otp: otpCode,
      type: 'signup',
      pendingData: {
        name: name.trim(),
        email: cleanEmail,
        password,
        phone: phone || '',
        address: address || '',
        city: city || '',
        state: state || '',
        pincode: pincode || '',
        role: (cleanEmail === ADMIN_EMAIL) ? 'admin' : 'user'
      }
    });

    // Store pending email in session
    req.session.pendingOtpEmail = cleanEmail;
    req.session.pendingOtpName = name.trim();

    // Send OTP via Nodemailer
    const emailResult = await sendOtpVerificationEmail(cleanEmail, otpCode, name.trim());
    if (!emailResult.success) {
      console.warn('Could not dispatch OTP email via SMTP:', emailResult.error);
    }

    // Redirect to OTP verification screen
    res.redirect('/auth/verify-otp?success=We have sent a 6-digit verification code to your email.');
  } catch (err) {
    console.error('Registration OTP generation error:', err);
    res.render('auth/register', {
      pageTitle: 'Create an Account | Midhun Pencil Portraits',
      error: 'Failed to initiate account registration. Please try again.',
      formData: req.body
    });
  }
};

/**
 * Step 2: Render OTP verification screen
 */
exports.getVerifyOtp = (req, res) => {
  const pendingEmail = req.session.pendingOtpEmail;
  if (!pendingEmail) {
    return res.redirect('/auth/register');
  }

  res.render('auth/verify-otp', {
    pageTitle: 'Verify Your Email | Midhun Pencil Portraits',
    email: pendingEmail,
    error: req.query.error || null,
    success: req.query.success || null
  });
};

/**
 * Step 3: Validate submitted OTP, create verified user, log in
 */
exports.postVerifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    const pendingEmail = req.session.pendingOtpEmail;

    if (!pendingEmail) {
      return res.redirect('/auth/register?error=Verification session expired. Please register again.');
    }

    if (!otp || otp.trim().length !== 6) {
      return res.render('auth/verify-otp', {
        pageTitle: 'Verify Your Email | Midhun Pencil Portraits',
        email: pendingEmail,
        error: 'Please enter a valid 6-digit verification code.',
        success: null
      });
    }

    const cleanOtp = otp.trim();
    const otpRecord = await Otp.findOne({ email: pendingEmail, type: 'signup' });

    if (!otpRecord) {
      return res.render('auth/verify-otp', {
        pageTitle: 'Verify Your Email | Midhun Pencil Portraits',
        email: pendingEmail,
        error: 'Verification code has expired. Please click "Resend Verification Code".',
        success: null
      });
    }

    if (otpRecord.otp !== cleanOtp) {
      return res.render('auth/verify-otp', {
        pageTitle: 'Verify Your Email | Midhun Pencil Portraits',
        email: pendingEmail,
        error: 'Invalid verification code. Please check your email and try again.',
        success: null
      });
    }

    // OTP Verified! Create account in MongoDB
    const pendingUser = otpRecord.pendingData;
    const newUser = await User.createUser({
      name: pendingUser.name,
      email: pendingUser.email,
      password: pendingUser.password,
      phone: pendingUser.phone,
      address: pendingUser.address,
      city: pendingUser.city,
      state: pendingUser.state,
      pincode: pendingUser.pincode,
      role: pendingUser.role
    });

    // Delete used OTP
    await Otp.deleteMany({ email: pendingEmail });
    delete req.session.pendingOtpEmail;
    delete req.session.pendingOtpName;

    // Set logged-in session
    req.session.userId = newUser._id.toString();
    req.session.role = newUser.role;
    req.session.userName = newUser.name;
    req.session.userEmail = newUser.email;

    if (newUser.role === 'admin') {
      return res.redirect('/admin/dashboard?success=Admin account verified and created!');
    }

    res.redirect('/orders/give-order?success=Email verified successfully! Ready to commission your portrait.');
  } catch (err) {
    console.error('Verify OTP error:', err);
    res.render('auth/verify-otp', {
      pageTitle: 'Verify Your Email | Midhun Pencil Portraits',
      email: req.session.pendingOtpEmail || '',
      error: 'An unexpected error occurred during verification. Please try again.',
      success: null
    });
  }
};

/**
 * Resend a new OTP to the user's email
 */
exports.postResendOtp = async (req, res) => {
  try {
    const pendingEmail = req.session.pendingOtpEmail;
    const pendingName = req.session.pendingOtpName || 'Art Collector';

    if (!pendingEmail) {
      return res.redirect('/auth/register');
    }

    const otpRecord = await Otp.findOne({ email: pendingEmail, type: 'signup' });
    if (!otpRecord) {
      return res.redirect('/auth/register?error=Session expired. Please enter your registration details again.');
    }

    const newOtp = generateOtp();
    otpRecord.otp = newOtp;
    otpRecord.created_at = new Date();
    await otpRecord.save();

    await sendOtpVerificationEmail(pendingEmail, newOtp, pendingName);

    res.redirect('/auth/verify-otp?success=A fresh 6-digit verification code has been dispatched to your email.');
  } catch (err) {
    console.error('Resend OTP error:', err);
    res.redirect('/auth/verify-otp?error=Could not resend code. Please try again.');
  }
};

exports.getAdminLogin = (req, res) => {
  if (req.session && req.session.userId && req.session.role === 'admin') {
    return res.redirect('/admin/dashboard');
  }
  res.render('auth/admin-login', {
    pageTitle: 'Admin Portal Login | Midhun Pencil Portraits',
    error: req.query.error || null,
    success: req.query.success || null,
    adminEmail: ADMIN_EMAIL
  });
};

exports.postAdminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = (email || '').toLowerCase().trim();
    const cleanPass = (password || '').trim();

    if (cleanEmail !== ADMIN_EMAIL) {
      return res.render('auth/admin-login', {
        pageTitle: 'Admin Portal Login | Midhun Pencil Portraits',
        error: 'Invalid credentials. Access restricted.',
        adminEmail: ADMIN_EMAIL
      });
    }

    const isAppPassword = (cleanPass === APP_PASSWORD_SPACED || cleanPass === APP_PASSWORD_CLEAN);
    const isDefaultPass = (cleanPass === ADMIN_DEFAULT_PASS);

    const user = await User.findOne({ email: cleanEmail });
    let isDbPassMatch = false;
    if (user) {
      isDbPassMatch = await user.comparePassword(cleanPass);
    }

    if (isAppPassword || isDefaultPass || isDbPassMatch) {
      req.session.userId = user ? user._id.toString() : 'admin_session';
      req.session.role = 'admin';
      req.session.userName = user ? user.name : 'Midhun R.S.';
      req.session.userEmail = cleanEmail;

      return res.redirect('/admin/dashboard?success=Welcome to your Studio Admin Management Portal');
    }

    return res.render('auth/admin-login', {
      pageTitle: 'Admin Portal Login | Midhun Pencil Portraits',
      error: 'Invalid credentials. Access restricted.',
      adminEmail: ADMIN_EMAIL
    });
  } catch (err) {
    console.error('Admin login error:', err);
    res.render('auth/admin-login', {
      pageTitle: 'Admin Portal Login | Midhun Pencil Portraits',
      error: 'Server error during admin authentication.',
      adminEmail: ADMIN_EMAIL
    });
  }
};

exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error('Logout session destroy error:', err);
    res.redirect('/?success=Logged out successfully.');
  });
};
