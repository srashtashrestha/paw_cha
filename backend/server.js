const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const nodemailer = require('nodemailer');

const app = express();

// ================= 1. MIDDLEWARE =================
app.use(cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

let verificationCodes = {}; 

// ================= 2. STORAGE SETUP =================
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}
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

// UPDATED INQUIRY SCHEMA
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

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

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

// ================= 5. AUTH & ROUTES =================

app.get("/", (req, res) => {
    res.send("Server is Live and Running!");
});

// --- HANDLE ADOPTION APPLICATION ---
app.post("/api/inquiries/apply", authenticate, async (req, res) => {
    try {
        const { petId, donorId, adopterName, adopterEmail, phone, motivation, additionalInfo } = req.body;
        
        if (!donorId) {
            return res.status(400).json({ success: false, message: "Donor ID is required." });
        }

        const newInquiry = new Inquiry({
            petId,
            donorId,
            adopterId: req.user.id, 
            adopterName,
            adopterEmail,
            phone,
            motivation,
            additionalInfo,
            status: 'pending'
        });

        await newInquiry.save();
        res.status(201).json({ success: true, message: "Application submitted successfully!" });
    } catch (error) {
        console.error("Inquiry Error:", error);
        res.status(500).json({ success: false, message: "Failed to submit application." });
    }
});

// --- LOGIN ROUTE ---
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
            { expiresIn: "1h" }
        );

        res.json({ 
            success: true, 
            token, 
            role: user.role, 
            fullName: user.fullName,
            email: user.email,
            id: user._id 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

app.post("/api/pets/list", authenticate, upload.array("petImages", 4), async (req, res) => {
    try {
        const { name, type, breed, age, weight, location, vaccinationStatus, neuteredStatus, vetFollowUp, personality, lovesLikes, reasonForAdoption } = req.body;
        const imageUrls = req.files ? req.files.map(file => file.filename) : [];
        const newPet = new Pet({ donorId: req.user.id, name, type, breed, age, weight, location, vaccinationStatus, neuteredStatus, vetFollowUp, personality, lovesLikes, reasonForAdoption, images: imageUrls });
        await newPet.save();
        res.status(201).json({ success: true, message: "Pet listed successfully!", pet: newPet });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to list pet." });
    }
});

// GET ALL PETS (ADMIN/EXPLORE)
app.get("/api/admin/all-pets", async (req, res) => {
    try {
        const pets = await Pet.find().populate('donorId', 'fullName email').sort({ createdAt: -1 });
        const formattedPets = pets.map(pet => {
            const petObj = pet.toObject();
            return {
                ...petObj,
                imagePath: pet.images && pet.images.length > 0 ? pet.images[0] : null
            };
        });
        res.json({ success: true, pets: formattedPets });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

// GET SINGLE PET BY ID
app.get("/api/pets/:id", async (req, res) => {
    try {
        const petId = req.params.id;
        const pet = await Pet.findById(petId).populate('donorId', 'fullName email');
        if (!pet) return res.status(404).json({ success: false, message: "Pet not found" });
        res.json({ success: true, pet });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// UPDATE PET LISTING
app.put("/api/pets/update/:id", authenticate, upload.array("petImages", 4), async (req, res) => {
    try {
        const petId = req.params.id;
        const donorId = req.user.id;
        const pet = await Pet.findOne({ _id: petId, donorId: donorId });
        if (!pet) return res.status(404).json({ success: false, message: "Unauthorized" });

        const updateFields = ['name', 'type', 'breed', 'age', 'weight', 'location', 'vaccinationStatus', 'neuteredStatus', 'vetFollowUp', 'personality', 'lovesLikes', 'reasonForAdoption'];
        updateFields.forEach(field => { if (req.body[field] !== undefined) pet[field] = req.body[field]; });

        if (req.files && req.files.length > 0) pet.images = req.files.map(file => file.filename);
        await pet.save();
        res.json({ success: true, message: "Updated!", pet });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed update" });
    }
});

// DELETE PET LISTING
app.delete("/api/pets/delete/:id", authenticate, async (req, res) => {
    try {
        const result = await Pet.findOneAndDelete({ _id: req.params.id, donorId: req.user.id });
        if (!result) return res.status(404).json({ success: false, message: "Unauthorized" });
        res.json({ success: true, message: "Deleted" });
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

// GET INQUIRIES FOR DONOR DASHBOARD
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

// === ADDED: UPDATE INQUIRY STATUS (APPROVE/REJECT) ===
app.put("/api/inquiries/status/:id", authenticate, async (req, res) => {
    try {
        const { status } = req.body;
        // Verify that the inquiry belongs to the donor who is logged in
        const inquiry = await Inquiry.findOneAndUpdate(
            { _id: req.params.id, donorId: req.user.id },
            { status: status },
            { new: true }
        );

        if (!inquiry) {
            return res.status(404).json({ success: false, message: "Inquiry not found or unauthorized" });
        }

        res.json({ success: true, message: `Application ${status} successfully!`, inquiry });
    } catch (error) {
        console.error("Status Update Error:", error);
        res.status(500).json({ success: false, message: "Server error during status update" });
    }
});

// PASSWORD RESET FLOW
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
        if (existingUser) return res.status(400).json({ success: false });
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