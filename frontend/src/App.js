import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import LoginForm from './Components/LoginForm'; 
import DonorRegister from './Components/DonorRegister'; 
import AdminLogin from './Components/AdminLogin';
import AdminDashboard from './Components/AdminDashboard';
import AdopterRegister from './Components/AdopterRegistration';
import ForgotPassword from './Components/ForgotPassword';
import VerifyCode from './Components/VerifyCode';
import ResetPassword from './Components/ResetPassword';
import LandingPage from './Components/LandingPage';
import PetListing from './Components/PetListing';
import DonorDashboard from './Components/DonorDashboard';
import AdopterDashboard from './Components/AdopterDashboard';
import AdopterPetProfile from './Components/AdopterPetProfile';
import MyApplications from './Components/MyApplications';
import Favourites from './Components/Favourites';
import Settings from './Components/Settings';
import ExplorePets from './Components/ExplorePets';
import Messages from './Components/Messages';
import PetCare from './Components/PetCare';
import Services from './Components/Services';
import ContactUs from './Components/ContactUs';

const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/home" />, 
  },
  {
    path: "/home",
    element: <LandingPage />, 
  },
  {
    path: "/pet-listing",
    element: <PetListing/>
  },
  {
    path: "/login",
    element: <LoginForm />,
  },
  { 
    path: "/register-donor", 
    element: <DonorRegister /> 
  },
  {
    path: "/admin-login",
    element: <AdminLogin />
  },
  {
    path: "/admin-dashboard",
    element: <AdminDashboard/>
  },
  {
    path: "/register-adopter", 
    element: <AdopterRegister/>
  },
  {
    path: "/forgot-password",
    element: <ForgotPassword/>
  },
  {
    path: "/verify-code",
    element: <VerifyCode/>
  },
  {
    path: "/reset-password",
    element: <ResetPassword/>
  },
  {
    path: "/landing-page",
    element: <LandingPage/>
  },
  {
    path: "/donor-dashboard",
    element: <DonorDashboard/>
  },
  {
    path: "/adopter-dashboard",
    element: <AdopterDashboard/>
  },
  {
    path: "/pet-profile/:id",
    element: <AdopterPetProfile />
  },
  {
    path: "/my-inquiries",
    element: <MyApplications/>
  },
  {
    path: "/favourites",
    element: <Favourites/>
  },
  {
    path: "/settings",
    element: <Settings/>
  },
  {
    path: "/explore-pets",
    element: <ExplorePets/>
  },
  {
    path: "/messages",
    element: <Messages/>
  },
  {
    path: "/pet-care",
    element: <PetCare/>
  },
  {
    path: "/services",
    element: <Services/>
  },
  {
    path: "/contact-us",
    element: <ContactUs/>
  }
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
