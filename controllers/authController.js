import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export const register = async (req, res) => {
  const { name, email, password, role, secretKey } = req.body;

  try {
    // 1. If trying to register as owner, check secret key
    if (role === 'owner') {
      if (secretKey !== process.env.OWNER_SECRET_KEY) {
        return res.status(403).json({ message: "Invalid Owner Secret Key" });
      }
      
      // Optional: check if an owner already exists
      const existingOwner = await User.findOne({ role: 'owner' });
      if (existingOwner) {
        return res.status(400).json({ message: "Owner already registered" });
      }
    }

    // 2. Check if email already exists
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "User already exists" });

    // 3. Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Create User
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'staff'
    });

    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, profilePicture: user.profilePicture }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getStaff = async (req, res) => {
  try {
    const staff = await User.find({ role: 'staff' }).select('-password');
    res.status(200).json(staff);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateProfile = async (req, res) => {
  const { name, email, profilePicture } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check if new email is already in use by another user
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) return res.status(400).json({ message: "Email already in use" });
      user.email = email;
    }

    if (name) user.name = name;
    if (profilePicture !== undefined) user.profilePicture = profilePicture;

    await user.save();

    res.json({
      message: "Profile updated successfully",
      user: { id: user._id, name: user.name, email: user.email, role: user.role, profilePicture: user.profilePicture }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateStaffProfile = async (req, res) => {
  const { id } = req.params;
  const { name, email, role } = req.body;
  
  try {
    const staff = await User.findById(id);
    if (!staff) return res.status(404).json({ message: "Staff not found" });

    if (email && email !== staff.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) return res.status(400).json({ message: "Email already in use" });
      staff.email = email;
    }

    if (name) staff.name = name;
    if (role) staff.role = role;
    if (req.body.profilePicture !== undefined) staff.profilePicture = req.body.profilePicture;

    await staff.save();

    res.json({
      message: "Staff profile updated successfully",
      staff: { id: staff._id, name: staff.name, email: staff.email, role: staff.role, profilePicture: staff.profilePicture }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};