const mongoose = require("mongoose");

const FinalReportSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "InterviewSchedule",
    required: true
  },
  interviewerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  

  candidate_overview: {
    name: { type: String },
    email: { type: String },
    resumeUrl: { type: String, default: null }
  },

  overall_performance: {
    score: { type: Number, default: null },
    feedback: { type: String, default: null }
  },

  strengths: { type: [String], default: [] },
  weaknesses: { type: [String], default: [] },

  section_wise_evaluation: {
    technical: { type: Object, default: null },
    communication: { type: Object, default: null },
    behavioral: { type: Object, default: null }
  },

  final_recommendation: {
    type: String,
    default: null
  }

}, { timestamps: true });

module.exports = mongoose.model("FinalReport", FinalReportSchema);
