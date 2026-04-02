const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const nodemailer = require('nodemailer');

const app = express();
const Notification = require("./models/Notifications");
// ================= 1. MIDDLEWARE =================
app.use(cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let verificationCodes = {}; 

// ================= 2. STORAGE & STATIC FILES =================
// Use path.resolve to ensure the 'uploads' folder is reached correctly
const uploadDir = path.resolve(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}
// This serves your images to http://localhost:5000/uploads/filename.jpg
app.use("/uploads", express.static(uploadDir));

const SECRET_KEY = "your_secret_key_here";

// ================= 3. DATABASE =================
mongoose.connect("mongodb+srv://srashtashr06:FBviKZs8IZgDGtsP@petadoptionportal.59hlh2j.mongodb.net/PetPortal")
    .then(() => console.log("DB Connected Successfully"))
    .catch((err) => console.log("DB Connection Failed", err));

// ================= 4. MODELS =================
const UserSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: "donor" },
    profilePic: { type: [String], default: [] },
    idCardPath: { type: String },
    isVerified: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model("User", UserSchema);

const PetSchema = new mongoose.Schema({
    donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    type: { type: String, required: true },
    images: [String],
    breed: { type: String },
    age: { type: String, required: true },
    weight: { type: String },
    location: { type: String, required: true },
    vaccinationStatus: { type: String, required: true },
    neuteredStatus: { type: String, required: true },
    vetFollowUp: { type: String },
    personality: { type: String },
    lovesLikes: { type: String },
    reasonForAdoption: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});
const Pet = mongoose.model("Pet", PetSchema);

const InquirySchema = new mongoose.Schema({
    petId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet', required: true },
    donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    adopterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, 
    adopterName: { type: String, required: true },
    adopterEmail: { type: String, required: true },
    phone: { type: String },
    motivation: { type: String },
    additionalInfo: { type: String },
    status: { type: String, default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});
const Inquiry = mongoose.model("Inquiry", InquirySchema);

// Multer Setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

// Auth Middleware
const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ success: false, message: "Access denied" });
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ success: false, message: "Invalid token" });
    }
};


// ================= 5. USER SETTINGS ROUTES =================

// Update Profile Info (Name & Email)
app.put("/api/user/update-profile", authenticate, async (req, res) => {
    try {
        const { name, email } = req.body;
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { fullName: name, email: email },
            { new: true }
        ).select("-password");

        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        
        // Return updated user including existing profilePic
        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

app.put("/api/user/update-pfp", authenticate, upload.single("profilePic"), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: "No image uploaded" });
        
        const user = await User.findByIdAndUpdate(
            req.user.id,
            // We save it as [filename] to match your Pet image structure
            { profilePic: [req.file.filename] }, 
            { new: true }
        ).select("-password");

        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, message: "Database update failed" });
    }
});

// Change Password
app.put("/api/user/change-password", authenticate, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        if (user.password !== currentPassword) {
            return res.status(400).json({ success: false, message: "Incorrect current password" });
        }

        user.password = newPassword;
        await user.save();
        res.json({ success: true, message: "Password updated successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// ================= 6. AUTH & MAIN ROUTES =================

app.get("/", (req, res) => {
    res.send("Server is Live and Running!");
});

app.post("/api/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email, password });
        
        if (!user) return res.status(401).json({ success: false, message: "Invalid credentials" });
        
        if (user.role === 'donor' && !user.isVerified) {
            return res.status(403).json({ success: false, message: "Account pending admin approval." });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role, email: user.email }, 
            SECRET_KEY, 
            { expiresIn: "7d" } 
        );

        res.json({ 
            success: true, 
            token, 
            role: user.role, 
            fullName: user.fullName,
            email: user.email,
            id: user._id,
            profilePic: user.profilePic || null // Ensures frontend doesn't get empty string
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
});
app.post("/api/inquiries/apply", authenticate, async (req, res) => {
    try {
        const { petId, donorId, adopterName, adopterEmail, phone, motivation, additionalInfo } = req.body;
        
        // CRITICAL FIX: Always use the ID from the authenticated token (req.user.id)
        // This prevents users from spoofing other IDs or sending undefined values
        const userId = req.user.id; 

        // 1. Search for an existing application using the authenticated User ID
        const existingInquiry = await Inquiry.findOne({ 
            petId: petId, 
            adopterId: userId 
        });

        if (existingInquiry) {
            return res.status(400).json({ 
                success: false, 
                message: "You have already applied for this pet." 
            });
        }

        // 2. Create the new inquiry
        const newInquiry = new Inquiry({
            petId,
            donorId,
            adopterId: userId, // Ensure consistency here
            adopterName,
            adopterEmail,
            phone,
            motivation,
            additionalInfo,
            status: 'pending'
        });

        await newInquiry.save();
        
        res.status(201).json({ 
            success: true, 
            message: "Application submitted successfully!" 
        });
    } catch (error) {
        console.error("Apply Error:", error); // Good for debugging
        res.status(500).json({ 
            success: false, 
            message: "Internal server error" 
        });
    }
});

app.post("/api/pets/list", authenticate, upload.array("petImages", 4), async (req, res) => {
    try {
        const imageUrls = req.files ? req.files.map(file => file.filename) : [];
        const newPet = new Pet({ ...req.body, donorId: req.user.id, images: imageUrls });
        await newPet.save();
        res.status(201).json({ success: true, pet: newPet });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

app.get("/api/admin/all-pets", async (req, res) => {
    try {
        const pets = await Pet.find().populate('donorId', 'fullName email').sort({ createdAt: -1 });
        res.json({ success: true, pets });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

app.get("/api/pets/:id", async (req, res) => {
    try {
        const pet = await Pet.findById(req.params.id).populate('donorId', 'fullName email');
        if (!pet) return res.status(404).json({ success: false, message: "Pet not found" });
        res.json({ success: true, pet });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

app.get("/api/adopter/my-inquiries", authenticate, async (req, res) => {
    try {
        const inquiries = await Inquiry.find({ adopterId: req.user.id }).populate('petId').sort({ createdAt: -1 });
        res.json({ success: true, inquiries });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

app.get("/api/donor/my-pets", authenticate, async (req, res) => {
    try {
        const pets = await Pet.find({ donorId: req.user.id }).sort({ createdAt: -1 });
        res.json({ success: true, pets });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

app.get("/api/donor/inquiries", authenticate, async (req, res) => {
    try {
        const inquiries = await Inquiry.find({ donorId: req.user.id })
            .populate('petId', 'name images')
            .populate('adopterId', 'fullName email')
            .sort({ createdAt: -1 });
        res.json({ success: true, inquiries });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

// app.put("/api/inquiries/status/:id", authenticate, async (req, res) => {
//     try {
//         const inquiry = await Inquiry.findOneAndUpdate(
//             { _id: req.params.id, donorId: req.user.id },
//             { status: req.body.status },
//             { new: true }
//         );
//         res.json({ success: true, inquiry });
//     } catch (error) {
//         res.status(500).json({ success: false });
//     }
// });

app.put("/api/inquiries/status/:id", authenticate, async (req, res) => {
    try {
        const { status } = req.body;

        // 1. Update the status and populate pet details for the notification/email
        const inquiry = await Inquiry.findOneAndUpdate(
            { _id: req.params.id, donorId: req.user.id },
            { status: status },
            { new: true }
        ).populate('petId', 'name'); // We need the pet's name for the message

        if (!inquiry) {
            return res.status(404).json({ success: false, message: "Inquiry not found" });
        }

        // 2. Only trigger notifications if the status is changed to 'approved'
        if (status === 'approved') {
            // A. Create a Database Notification for the Adopter
            const newNotif = new Notification({
                recipient: inquiry.adopterId,
                type: 'approval',
                message: `Congratulations! Your application for ${inquiry.petId.name} has been approved. You can now start a chat with the donor.`,
                petId: inquiry.petId._id
            });
            await newNotif.save();

            // B. Send the Email via Nodemailer
            let transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: { 
                    user: 'srashtashr06@gmail.com', 
                    pass: 'khsm tcbb ykov enzk' 
                }
            });

            const emailHtml = `
                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #7c4dff;">Application Approved! 🐾</h2>
                    <p>Hi <b>${inquiry.adopterName}</b>,</p>
                    <p>Great news! The donor has approved your request to adopt <b>${inquiry.petId.name}</b>.</p>
                    <p>They are looking forward to hearing from you. Log in to your dashboard to start the conversation.</p>
                    <div style="margin-top: 25px;">
                        <a href="http://localhost:3000/adopter-dashboard" 
                           style="background-color: #7c4dff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                           Chat with Donor
                        </a>
                    </div>
                    <p style="margin-top: 30px; font-size: 0.8em; color: #666;">This is an automated message from PawCha.</p>
                </div>
            `;

            await transporter.sendMail({
                from: '"PawCha Support" <srashtashr06@gmail.com>',
                to: inquiry.adopterEmail,
                subject: `Your application for ${inquiry.petId.name} was approved!`,
                html: emailHtml
            });
        }

        res.json({ success: true, inquiry });
    } catch (error) {
        console.error("Status Update Error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

// Get notifications for the logged-in user
app.get("/api/notifications", authenticate, async (req, res) => {
    try {
        const notifications = await Notification.find({ recipient: req.user.id })
            .sort({ createdAt: -1 })
            .limit(20);
        res.json({ success: true, notifications });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

// Mark notification as read
app.put("/api/notifications/read/:id", authenticate, async (req, res) => {
    try {
        await Notification.findByIdAndUpdate(req.params.id, { read: true });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

// --- PASSWORD RESET ---

app.post('/api/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ success: false, message: "Email not found" });
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        verificationCodes[email] = code; 
        setTimeout(() => { delete verificationCodes[email]; }, 600000);
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: 'srashtashr06@gmail.com', pass: 'khsm tcbb ykov enzk' }
        });
        await transporter.sendMail({
            from: '"PawCha Support" <srashtashr06@gmail.com>',
            to: email,
            subject: "Your Password Reset Code",
            text: `Your verification code is: ${code}.`
        });
        res.json({ success: true, message: "Code sent!" });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

app.post('/api/verify-code', (req, res) => {
    const { email, code } = req.body;
    if (verificationCodes[email] === code) res.json({ success: true });
    else res.status(400).json({ success: false, message: "Invalid code" });
});

app.post('/api/reset-password', async (req, res) => {
    const { email, newPassword } = req.body;
    try {
        await User.findOneAndUpdate({ email }, { password: newPassword });
        delete verificationCodes[email]; 
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

// --- ADMIN ---

app.post("/api/admin-login", (req, res) => {
    const { email, password } = req.body;
    if (email === "admin@petportal.com" && password === "admin123") {
        const token = jwt.sign({ role: "admin" }, SECRET_KEY, { expiresIn: "2h" });
        return res.json({ success: true, token });
    }
    return res.status(401).json({ success: false });
});

app.post("/api/register-adopter", async (req, res) => {
    try {
        const { fullName, email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ success: false });
        const newUser = new User({ fullName, email, password, role: "adopter", isVerified: true });
        await newUser.save();
        res.status(201).json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

app.post("/api/register-donor", upload.single("idCard"), async (req, res) => {
    try {
        const { fullName, email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                message: "This email is already registered. Please login or use a different email." 
            });
        }

        const newUser = new User({
            fullName, email, password,
            idCardPath: req.file ? req.file.filename : null,
            isVerified: false 
        });
        await newUser.save();
        res.status(201).json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

app.get("/api/admin/donors", async (req, res) => {
    const donors = await User.find({ role: "donor" }).sort({ createdAt: -1 });
    res.json({ success: true, donors });
});

app.get("/api/admin/adopters", async (req, res) => {
    const adopters = await User.find({ role: "adopter" }).sort({ createdAt: -1 });
    res.json({ success: true, adopters });
});

app.put("/api/admin/verify-donor/:id", async (req, res) => {
    await User.findByIdAndUpdate(req.params.id, { isVerified: true });
    res.json({ success: true });
});

app.delete("/api/admin/reject-donor/:id", async (req, res) => {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});

app.listen(5000, () => {
    console.log("Server running on http://localhost:5000"); 
});