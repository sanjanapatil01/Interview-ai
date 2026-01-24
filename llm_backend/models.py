from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()



class Candidate(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    resume_text = db.Column(db.Text, nullable=False)
    resume_path = db.Column(db.String(255), nullable=False) 
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    reports = db.relationship("FinalReport", backref="user", lazy=True)

    def __repr__(self):
        return f"<User {self.name} - {self.email}>"


class FinalReport(db.Model):
    __tablename__ = "final_reports"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    report_text = db.Column(db.Text, nullable=False)  
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<FinalReport for User {self.user_id}>"
