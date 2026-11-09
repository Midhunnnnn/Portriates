const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    default: ''
  },
  city: {
    type: String,
    default: ''
  },
  state: {
    type: String,
    default: ''
  },
  pincode: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Instance method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Static method to create user with hashed password
userSchema.statics.createUser = async function (userData) {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(userData.password, salt);
  
  const user = new this({
    ...userData,
    email: userData.email.toLowerCase().trim(),
    password: hashedPassword
  });

  return await user.save();
};

// Static method to seed default admin
userSchema.statics.seedAdmin = async function (adminEmail = 'midhunrs727@gmail.com', defaultPass = 'admin123', appPass = 'mwdo klwl qkrp rxsy') {
  const cleanEmail = adminEmail.toLowerCase().trim();
  const existing = await this.findOne({ email: cleanEmail });

  if (!existing) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(defaultPass, salt);

    await this.create({
      name: 'Midhun (Artist & Admin)',
      email: cleanEmail,
      password: hashedPassword,
      phone: '+91 9876543210',
      address: 'Studio Art Lane, Gallery District',
      city: 'Ernakulam',
      state: 'Kerala',
      pincode: '682001',
      role: 'admin'
    });
    console.log(`Admin account seeded in MongoDB: ${cleanEmail} (Role: admin)`);
  } else if (existing.role !== 'admin') {
    existing.role = 'admin';
    await existing.save();
    console.log(`Updated user ${cleanEmail} to admin role in MongoDB.`);
  }
};

const User = mongoose.model('User', userSchema);
module.exports = User;
