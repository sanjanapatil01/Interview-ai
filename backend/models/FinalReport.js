import mongoose from "mongoose";
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
    resumeUrl: { type: String, default: null },
    summary: { type: String, default: null },
    preferredDomain: { type: String, default: null },
    yearOfStudy: { type: String, default: null }
  },

  overall_performance: {
    score: { type: Number, default: null },
    performance_level: { type: String, default: null },
    summary: { type: String, default: null }
  },

  strengths: { type: [String], default: [] },
  weaknesses: { type: [String], default: [] },

  section_wise_evaluation: {
    general: { 
      score: { type: Number, default: null },
      feedback: { type: String, default: null }
     },
    hr: { 
       score: { type: Number, default: null },
      feedback: { type: String, default: null }
     },
    technical: { 
       score: { type: Number, default: null },
      feedback: { type: String, default: null }
     }
  },

  final_recommendation: {
    type: new mongoose.Schema({
      decision: { type: String, default: null },
      justification: { type: String, default: null }
    }, { _id: false }),
    default: { decision: null, justification: null }
  },
 decision_status :{
    type: String,
    enum: ['pending','selected','rejected'],
    default: 'pending'
  },
  company_name:{
    type: String,
    default: null
  },
  decision_date: {
    type: Date,
    default: null
  },
  decided_by:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  }



}, { timestamps: true });

// Prevent Mongo errors when updating nested fields if final_recommendation is null in existing docs.
// Convert dotted updates like { $set: { "final_recommendation.decision": "yes" } }
// into a single $set of the whole final_recommendation object.
FinalReportSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  if (!update) return next();

  // work with $set if present, otherwise top-level update
  const setContainer = update.$set ? update.$set : update;
  const dottedKeys = Object.keys(setContainer).filter(k => k.startsWith('final_recommendation.'));

  if (dottedKeys.length === 0) return next();

  const fr = {};
  dottedKeys.forEach(key => {
    const subKey = key.replace('final_recommendation.', '');
    fr[subKey] = setContainer[key];
    // remove the dotted key from the original update location
    if (update.$set) {
      delete update.$set[key];
    } else {
      delete update[key];
    }
  });

  // ensure $set exists and set the whole object
  update.$set = update.$set || {};
  update.$set.final_recommendation = fr;

  this.setUpdate(update);
  next();
});

module.exports = mongoose.model("FinalReport", FinalReportSchema);
