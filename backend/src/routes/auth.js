const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/send-otp
router.post('/send-otp', async (req, res) => {
    try {
        const { phone } = req.body;
        if (!phone) return res.status(400).json({ error: 'Phone number is required' });

        let user = await User.findOne({ phone });
        if (!user) {
            user = new User({ phone });
        }

        // Generate OTP (use DEV_OTP in development)
        const otp = process.env.DEV_OTP || Math.floor(1000 + Math.random() * 9000).toString();
        user.otp = otp;
        user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        await user.save();

        // In production, send OTP via SMS/Email service
        console.log(`📱 OTP for ${phone}: ${otp}`);

        res.json({ message: 'OTP sent successfully', phone });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
    try {
        const { phone, otp } = req.body;
        if (!phone || !otp) return res.status(400).json({ error: 'Phone and OTP are required' });

        const user = await User.findOne({ phone });
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Check OTP
        const validOtp = user.otp === otp && user.otpExpiresAt > new Date();
        const devMode = process.env.DEV_OTP && otp === process.env.DEV_OTP;

        if (!validOtp && !devMode) {
            return res.status(401).json({ error: 'Invalid or expired OTP' });
        }

        // Clear OTP
        user.otp = '';
        user.otpExpiresAt = undefined;
        await user.save();

        // Generate JWT
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.json({
            token,
            user: {
                _id: user._id,
                name: user.name,
                phone: user.phone,
                email: user.email,
                avatar: user.avatar,
                role: user.role,
            },
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/auth/profile
router.put('/profile', auth, async (req, res) => {
    try {
        const { name, email, avatar, expoPushToken } = req.body;
        const updates = {};
        if (name !== undefined) updates.name = name;
        if (email !== undefined) updates.email = email;
        if (avatar !== undefined) updates.avatar = avatar;
        if (expoPushToken !== undefined) updates.expoPushToken = expoPushToken;

        const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true })
            .select('-otp -otpExpiresAt');

        res.json({ user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
    res.json({ user: req.user });
});

module.exports = router;
