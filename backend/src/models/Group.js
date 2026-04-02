const mongoose = require('mongoose');

const monthlyConfigSchema = new mongoose.Schema({
    month: { type: Number, required: true },
    potAmount: { type: Number, required: true },
    emiAmount: { type: Number, required: true },
    reducedEmi: { type: Number, required: true },
}, { _id: false });

const groupSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, default: '' },
    potAmount: { type: Number, required: true },      // default pot
    emiAmount: { type: Number, required: true },       // default EMI
    reducedEmi: { type: Number, required: true },      // default reduced
    monthlyConfig: [monthlyConfigSchema],               // per-month overrides
    minMembers: { type: Number, default: 20, min: 20 },
    maxMembers: { type: Number, default: 100, max: 100 },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    currentMonth: { type: Number, default: 0 },
    totalMonths: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'active', 'completed', 'paused'], default: 'pending' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    startDate: { type: Date },
}, { timestamps: true });

// Get config for a specific month (falls back to group defaults)
groupSchema.methods.getMonthConfig = function (month) {
    const custom = this.monthlyConfig.find(c => c.month === month);
    return {
        month,
        potAmount: custom?.potAmount ?? this.potAmount,
        emiAmount: custom?.emiAmount ?? this.emiAmount,
        reducedEmi: custom?.reducedEmi ?? this.reducedEmi,
    };
};

module.exports = mongoose.model('Group', groupSchema);
