import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import FirstPage from "./form/FirstPage.jsx"
import OtpPage from "./form/OtpPage.jsx";
import LoginPage from "./form/LoginPage.jsx";
import RegistrationPage from "./form/RegistrationPage.jsx";
import Home from "./Home/Home.jsx";
import UserForm from "./form/UserForm.jsx";
import UserInterviewRoom from "./Home/UserInterviewRoom.jsx";
import "./App.css"
import "./Home/Home.css"
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<FirstPage />} />
        <Route path="/user" element={<UserForm />} />
        <Route path="/interviewroom" element={<UserInterviewRoom />} />
        <Route path="/otp" element={<OtpPage />} />
        <Route path="/login" element={<LoginPage/>} />
        <Route path="/register" element={<RegistrationPage />} />
        < Route path="/home" element={<Home/>}/>
       
      </Routes>
    </Router>
  );
}

export default App;
