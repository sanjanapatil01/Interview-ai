import mongoose from "mongoose";
const interviewScheduleSchema = new mongoose.Schema({
    interviewerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    scheduledDate: {
        type: Date,
        required: true
    },
    startTime: {
        type: String,
        required: true
    },

    candidateEmails: [{
        type: String,
        required: true,
        trim: true,
        lowercase: true
    }],
    status: {
        type: String,
        enum: ['Scheduled', 'Completed', 'Cancelled'],
        default: 'Scheduled'
    }
}, {
    timestamps: true
});

module.exports= mongoose.model('InterviewSchedule', interviewScheduleSchema);