require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const nodemailer = require('nodemailer');
const http = require('http');
const Message = require("./models/Messages"); 
const Chat = require("./models/Chat");
const { Server } = require('socket.io');

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
let verifiedPasswordResets = {};

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
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Pet' }],
    idCardPath: { type: String },
    isVerified: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model("User", UserSchema);

const PetSchema = new mongoose.Schema({
    donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    adoptedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reservedFor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    name: { type: String, required: true },
    type: { type: String, required: true },
    images: [String],
    clinicalVerificationImage: { type: String },
    isClinicallyApproved: { type: Boolean, default: false },
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
    status: { type: String, default: "available" },
    vaccinationHistory: [{
        date: { type: Date, required: true },
        vaccineName: { type: String, required: true }
    }],
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
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });
const petUpload = upload.fields([
    { name: "petImages", maxCount: 4 },
    { name: "clinicalVerificationImage", maxCount: 1 }
]);

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

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "http://localhost:3000" }
});

const resolveChatId = (payload = {}) => payload.chatId || payload.inquiryId;
const getUserRoom = (userId) => `user:${String(userId)}`;
const emitNotificationToRecipient = (notificationDoc) => {
    if (!notificationDoc?.recipient) return;
    io.to(getUserRoom(notificationDoc.recipient)).emit("notification_created", notificationDoc);
};

io.on('connection', (socket) => {
    try {
        const token = socket.handshake.auth?.token;
        if (token) {
            const decoded = jwt.verify(token, SECRET_KEY);
            if (decoded?.id) {
                socket.join(getUserRoom(decoded.id));
            }
        }
    } catch (error) {
        console.error("Socket auth failed:", error.message);
    }

    socket.on('join_chat', (chatId) => {
        const room = String(chatId);
        socket.join(room);
        console.log(`User joined room: ${room}`);
    });

    socket.on('send_message', (data) => {
        const chatId = resolveChatId(data);
        if (!chatId) return;

        const room = String(chatId);
        io.to(room).emit('receive_message', {
            ...data,
            chatId,
            createdAt: new Date() 
        });
    });
});

server.listen(5000, () => console.log("Server running on port 5000"));

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

        const pet = await Pet.findById(petId).select("status reservedFor name");
        if (!pet) {
            return res.status(404).json({
                success: false,
                message: "Pet not found"
            });
        }

        if (pet.status === "adopted") {
            return res.status(400).json({
                success: false,
                message: "This pet has already been adopted."
            });
        }

        if (
            pet.status === "reserved" &&
            String(pet.reservedFor || "") !== String(userId)
        ) {
            return res.status(400).json({
                success: false,
                message: "This pet is currently reserved for another adopter."
            });
        }

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

        const donorNotification = await Notification.create({
            recipient: newInquiry.donorId,
            type: "message",
            message: `${adopterName} sent an adoption inquiry for ${pet.name}.`,
            petId
        });
        emitNotificationToRecipient(donorNotification.toObject());
        
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

app.post("/api/pets/list", authenticate, petUpload, async (req, res) => {
    try {
        const petImages = req.files?.petImages || [];
        const imageUrls = petImages.map((file) => file.filename);
        const clinicalVerificationImage = req.files?.clinicalVerificationImage?.[0]?.filename;
        const newPet = new Pet({
            ...req.body,
            donorId: req.user.id,
            images: imageUrls,
            ...(clinicalVerificationImage ? { clinicalVerificationImage } : {})
        });
        await newPet.save();
        res.status(201).json({ success: true, pet: newPet });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

app.get("/api/admin/all-pets", async (req, res) => {
    try {
        res.set("Cache-Control", "no-store");
        const pets = await Pet.find().populate('donorId', 'fullName email').sort({ createdAt: -1 });
        res.json({ success: true, pets });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

app.get("/api/pets", async (req, res) => {
    try {
        res.set("Cache-Control", "no-store");
        const pets = await Pet.find({
            status: { $ne: "adopted" }
        }).populate('donorId', 'fullName email').sort({ createdAt: -1 });
        res.json({ success: true, pets });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

app.get("/api/pets/my-adoptions", authenticate, async (req, res) => {
    try {
        const pets = await Pet.find({
            adoptedBy: req.user.id,
            status: "adopted"
        })
            .populate("donorId", "fullName email profilePic")
            .sort({ createdAt: -1 });

        res.json({ success: true, pets });
    } catch (error) {
        console.error("Fetch adopted pets error:", error);
        res.status(500).json({ success: false, message: "Failed to load adopted pets" });
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

app.post("/api/pets/:id/vaccinate", authenticate, async (req, res) => {
    try {
        const { date, vaccineName } = req.body;

        if (!date || !vaccineName?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Vaccine name and date are required"
            });
        }

        const pet = await Pet.findOne({
            _id: req.params.id,
            adoptedBy: req.user.id
        }).populate("donorId", "fullName email profilePic");

        if (!pet) {
            return res.status(404).json({
                success: false,
                message: "Adopted pet not found"
            });
        }

        pet.vaccinationHistory.push({
            date: new Date(date),
            vaccineName: vaccineName.trim()
        });

        await pet.save();

        res.json({ success: true, pet });
    } catch (error) {
        console.error("Vaccination log error:", error);
        res.status(500).json({ success: false, message: "Failed to log vaccination" });
    }
});

// Update an existing pet listing
app.put("/api/pets/update/:id", authenticate, petUpload, async (req, res) => {
    try {
        const petId = req.params.id;
        const updates = { ...req.body };
        const petImages = req.files?.petImages || [];
        const clinicalVerificationImage = req.files?.clinicalVerificationImage?.[0]?.filename;

        // If new images are uploaded, update the images array
        if (petImages.length > 0) {
            updates.images = petImages.map((file) => file.filename);
        }

        if (clinicalVerificationImage) {
            updates.clinicalVerificationImage = clinicalVerificationImage;
        }

        const updatedPet = await Pet.findOneAndUpdate(
            { _id: petId, donorId: req.user.id }, // Security: Ensure only the owner can edit
            updates,
            { new: true }
        );

        if (!updatedPet) {
            return res.status(404).json({ success: false, message: "Pet not found or unauthorized" });
        }

        res.json({ success: true, pet: updatedPet });
    } catch (error) {
        console.error("Update Pet Error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

app.delete("/api/pets/delete/:id", authenticate, async (req, res) => {
    try {
        const pet = await Pet.findOneAndDelete({ _id: req.params.id, donorId: req.user.id });
        if (!pet) return res.status(404).json({ success: false, message: "Pet not found" });
        
        res.json({ success: true, message: "Listing deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

app.get("/api/adopter/my-inquiries", authenticate, async (req, res) => {
    try {
        const inquiries = await Inquiry.find({ adopterId: req.user.id })
            .populate('petId')
            .populate('donorId', 'fullName email profilePic')
            .populate('adopterId', 'fullName email profilePic')
            .sort({ createdAt: -1 });
        res.json({ success: true, inquiries });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

app.get("/api/adopter/favorites", authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('favorites');
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.json({
            success: true,
            favorites: (user.favorites || []).map((petId) => petId.toString())
        });
    } catch (error) {
        console.error("Fetch favorites error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

app.post("/api/adopter/favorites", authenticate, async (req, res) => {
    try {
        const { petId } = req.body;

        if (!petId) {
            return res.status(400).json({ success: false, message: "petId is required" });
        }

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $addToSet: { favorites: petId } },
            { new: true }
        ).select('favorites');

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.json({
            success: true,
            favorites: (user.favorites || []).map((favoriteId) => favoriteId.toString())
        });
    } catch (error) {
        console.error("Add favorite error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

app.delete("/api/adopter/favorites/:petId", authenticate, async (req, res) => {
    try {
        const { petId } = req.params;

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $pull: { favorites: petId } },
            { new: true }
        ).select('favorites');

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.json({
            success: true,
            favorites: (user.favorites || []).map((favoriteId) => favoriteId.toString())
        });
    } catch (error) {
        console.error("Remove favorite error:", error);
        res.status(500).json({ success: false, message: "Server error" });
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
            .populate('petId', 'name images status reservedFor adoptedBy')
            .populate('adopterId', 'fullName email profilePic')
            .sort({ createdAt: -1 });
        res.json({ success: true, inquiries });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

// Example Express Backend Route
app.post('/api/contact', async (req, res) => {
    const { fullName, email, phone, subject, message } = req.body;
    
    try {
        // Save to database or send an email via Nodemailer
        // await ContactQuery.create({ fullName, email, phone, subject, message });
        
        res.status(200).json({ success: true, message: 'Message received!' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.put("/api/inquiries/status/:id", authenticate, async (req, res) => {
    try {
        const { status } = req.body;
        const inquiryId = req.params.id;
        const inquiry = await Inquiry.findOne({
            _id: req.params.id,
            donorId: req.user.id
        }).populate('petId', 'name status reservedFor adoptedBy');

        if (!inquiry) {
            return res.status(404).json({ success: false, message: "Inquiry not found" });
        }

        const pet = await Pet.findById(inquiry.petId._id);
        if (!pet) {
            return res.status(404).json({ success: false, message: "Pet not found" });
        }

        const currentStatus = inquiry.status;

        if (status === "approved") {
            if (pet.status === "adopted") {
                return res.status(400).json({
                    success: false,
                    message: "This pet has already been adopted."
                });
            }

            if (
                pet.status === "reserved" &&
                String(pet.reservedFor || "") !== String(inquiry.adopterId)
            ) {
                return res.status(400).json({
                    success: false,
                    message: "This pet is currently reserved for another adopter."
                });
            }

            inquiry.status = "approved";
            await inquiry.save();

            pet.status = "reserved";
            pet.reservedFor = inquiry.adopterId;
            pet.adoptedBy = null;
            await pet.save();
        } else if (status === "finalized") {
            if (currentStatus !== "approved") {
                return res.status(400).json({
                    success: false,
                    message: "Only reserved inquiries can be finalized."
                });
            }

            const reservedForCurrentAdopter =
                String(pet.reservedFor || "") === String(inquiry.adopterId);

            if (pet.status === "adopted") {
                return res.status(400).json({
                    success: false,
                    message: "This pet has already been adopted."
                });
            }

            // Recover legacy approved inquiries that were saved before the
            // reserved-phase fields were fully synchronized on the pet record.
            if (
                currentStatus === "approved" &&
                pet.status === "available" &&
                !pet.reservedFor
            ) {
                pet.status = "reserved";
                pet.reservedFor = inquiry.adopterId;
                await pet.save();
            }

            if (
                pet.status !== "reserved" ||
                String(pet.reservedFor || "") !== String(inquiry.adopterId)
            ) {
                return res.status(400).json({
                    success: false,
                    message: "This pet is not reserved for this adopter anymore."
                });
            }

            inquiry.status = "adopted";
            await inquiry.save();

            pet.status = "adopted";
            pet.adoptedBy = inquiry.adopterId;
            pet.reservedFor = null;
            await pet.save();

            await Inquiry.updateMany(
                {
                    petId: inquiry.petId._id,
                    _id: { $ne: inquiry._id },
                    status: { $in: ["pending", "approved"] }
                },
                { $set: { status: "closed" } }
            );
        } else if (status === "declined") {
            if (currentStatus !== "approved") {
                return res.status(400).json({
                    success: false,
                    message: "Only reserved inquiries can be declined from verification."
                });
            }

            if (
                pet.status !== "reserved" ||
                String(pet.reservedFor || "") !== String(inquiry.adopterId)
            ) {
                return res.status(400).json({
                    success: false,
                    message: "This pet is not reserved for this adopter anymore."
                });
            }

            inquiry.status = "rejected";
            await inquiry.save();

            if (
                pet.status === "reserved" &&
                String(pet.reservedFor || "") === String(inquiry.adopterId)
            ) {
                pet.status = "available";
                pet.reservedFor = null;
                pet.adoptedBy = null;
                await pet.save();
            }
        } else {
            inquiry.status = status;
            await inquiry.save();

            if (status === "rejected") {
                if (
                    pet.status === "reserved" &&
                    String(pet.reservedFor || "") === String(inquiry.adopterId)
                ) {
                    pet.status = "available";
                    pet.reservedFor = null;
                    pet.adoptedBy = null;
                    await pet.save();
                }
            }
        }

        if (status === 'approved' && currentStatus !== 'approved') {
            const autoMsgText = `Hi ${inquiry.adopterName}! I have approved your application for ${inquiry.petId.name}. Let's chat!`;
            const autoMessage = new Message({
                chatId: inquiryId,
                senderId: req.user.id, 
                text: autoMsgText
            });
            await autoMessage.save();
            
            const populatedAutoMessage = await Message.findById(autoMessage._id)
                .populate('senderId', 'fullName profilePic');

            io.to(inquiryId.toString()).emit('receive_message', populatedAutoMessage);
        }

        if (status === 'approved' || status === 'rejected' || status === 'declined') {
            const notificationStatus = status === "declined" ? "rejected" : status;
            const newNotif = new Notification({
                recipient: inquiry.adopterId,
                type: notificationStatus === 'approved' ? 'approval' : 'rejection',
                message: notificationStatus === 'approved' 
                    ? `Congratulations! Your application for ${inquiry.petId.name} was approved.`
                    : `Update: Your application for ${inquiry.petId.name} was not accepted.`,
                petId: inquiry.petId._id
            });
            await newNotif.save();
            emitNotificationToRecipient(newNotif.toObject());

            let transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: { 
                    user: process.env.GMAIL_USER, 
                    pass: process.env.GMAIL_PASS 
                }
            });

            // Dynamic content based on status
            const isApproved = notificationStatus === 'approved';
            const emailHtml = `
                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: ${isApproved ? '#7c4dff' : '#d32f2f'};">
                        Application ${isApproved ? 'Approved! 🐾' : 'Update'}
                    </h2>
                    <p>Hi <b>${inquiry.adopterName}</b>,</p>
                    <p>${isApproved 
                        ? `Great news! The donor has approved your request to adopt <b>${inquiry.petId.name}</b>.` 
                        : `Thank you for your interest in <b>${inquiry.petId.name}</b>. Unfortunately, the donor has decided to move forward with another applicant at this time.`
                    }</p>
                    ${isApproved ? `
                    <div style="margin-top: 25px;">
                        <a href="http://localhost:3000/adopter-dashboard" 
                           style="background-color: #7c4dff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                           Chat with Donor
                        </a>
                    </div>` : ''}
                    <p style="margin-top: 30px; font-size: 0.8em; color: #666;">This is an automated message from PawCha.</p>
                </div>
            `;

            try {
                await transporter.sendMail({
                    from: `"PawCha Support" <${process.env.GMAIL_USER}>`,
                    to: inquiry.adopterEmail,
                    subject: isApproved 
                        ? `Your application for ${inquiry.petId.name} was approved!` 
                        : `Update regarding your application for ${inquiry.petId.name}`,
                    html: emailHtml
                });
            } catch (mailError) {
                console.error("Inquiry status email send failed:", mailError);
            }
        }

        const refreshedInquiry = await Inquiry.findById(inquiry._id)
            .populate('petId', 'name images status reservedFor adoptedBy')
            .populate('adopterId', 'fullName email profilePic');

        res.json({ success: true, inquiry: refreshedInquiry });
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

// Add this to server.js
app.post("/api/messages/send", authenticate, async (req, res) => {
    try {
        const { chatId: incomingChatId, inquiryId, text } = req.body;
        const chatId = resolveChatId({ chatId: incomingChatId, inquiryId });

        if (!chatId || !text?.trim()) {
            return res.status(400).json({ success: false, message: "chatId and text are required" });
        }

        const newMessage = new Message({
            chatId,
            senderId: req.user.id,
            text: text.trim()
        });

        await newMessage.save();

        const populatedMsg = await Message.findById(newMessage._id)
            .populate('senderId', 'fullName profilePic');

        io.to(chatId.toString()).emit('receive_message', populatedMsg);

        const relatedInquiry = await Inquiry.findById(chatId).populate('petId', 'name');
        if (
            relatedInquiry &&
            String(req.user.id) === String(relatedInquiry.adopterId)
        ) {
            const donorNotification = await Notification.create({
                recipient: relatedInquiry.donorId,
                type: "message",
                message: `${populatedMsg.senderId?.fullName || "An adopter"} sent a new message about ${relatedInquiry.petId?.name || "your pet"}.`,
                petId: relatedInquiry.petId?._id || relatedInquiry.petId
            });
            emitNotificationToRecipient(donorNotification.toObject());
        }

        res.json({ success: true, newMessage: populatedMsg });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

app.get("/api/messages/:chatId", authenticate, async (req, res) => {
    try {
        // We add .populate('senderId') so the frontend gets an object with an _id
        const messages = await Message.find({ chatId: req.params.chatId })
            .populate('senderId', 'fullName profilePic') 
            .sort({ createdAt: 1 });
            
        res.json({ success: true, messages });
    } catch (error) {
        console.error("Fetch Messages Error:", error);
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

// Mark ALL notifications as read for the logged-in user
app.put("/api/notifications/mark-all-read", authenticate, async (req, res) => {
    try {
        await Notification.updateMany(
            { recipient: req.user.id, read: false },
            { read: true }
        );
        res.json({ success: true, message: "All notifications marked as read" });
    } catch (error) {
        console.error("Mark all read error:", error);
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
        delete verifiedPasswordResets[email];
        setTimeout(() => {
            delete verificationCodes[email];
            delete verifiedPasswordResets[email];
        }, 600000);
        const mailUser = process.env.GMAIL_USER;
        const mailPass = process.env.GMAIL_PASS;

        if (!mailUser || !mailPass) {
            const missingConfigError = new Error("Missing GMAIL_USER or GMAIL_PASS environment variable");
            console.error("Forgot password email send failed:", missingConfigError);
            return res.status(500).json({
                success: false,
                message: "Failed to send reset email. Please try again later."
            });
        }

        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: mailUser,
                pass: mailPass
            }
        });
        try {
            await transporter.sendMail({
                from: `"PawCha Support" <${mailUser}>`,
                to: email,
                subject: "Your Password Reset Code",
                text: `Your verification code is: ${code}.`
            });
            res.json({ success: true, message: "Code sent!" });
        } catch (mailError) {
            console.error("Forgot password email send failed:", mailError);
            return res.status(500).json({
                success: false,
                message: "Failed to send reset email. Please try again later."
            });
        }
    } catch (error) {
        console.error("Forgot password route failed:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error while preparing password reset."
        });
    }
});

app.post('/api/verify-code', (req, res) => {
    const { email, code } = req.body;
    if (!email || !code) {
        return res.status(400).json({ success: false, message: "Email and code are required" });
    }

    if (verificationCodes[email] === code) {
        verifiedPasswordResets[email] = true;
        const resetToken = jwt.sign(
            { email, purpose: "password_reset" },
            SECRET_KEY,
            { expiresIn: "10m" }
        );
        return res.json({ success: true, resetToken });
    }

    res.status(400).json({ success: false, message: "Invalid code" });
});

app.post('/api/reset-password', async (req, res) => {
    const { email, newPassword, resetToken } = req.body;
    try {
        if (!email || !newPassword) {
            return res.status(400).json({ success: false, message: "Email and new password are required" });
        }

        let hasVerifiedReset = Boolean(verifiedPasswordResets[email]);

        if (resetToken) {
            try {
                const decoded = jwt.verify(resetToken, SECRET_KEY);
                hasVerifiedReset = decoded?.purpose === "password_reset" && decoded?.email === email;
            } catch (error) {
                hasVerifiedReset = false;
            }
        }

        if (!hasVerifiedReset) {
            return res.status(403).json({ success: false, message: "Please verify your reset code first" });
        }

        const updatedUser = await User.findOneAndUpdate({ email }, { password: newPassword });
        if (!updatedUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        delete verificationCodes[email]; 
        delete verifiedPasswordResets[email];
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
        return res.json({ success: true, token }); // Fixed: added success: true
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

app.put("/api/admin/approve-pet/:id", async (req, res) => {
    try {
        const { isClinicallyApproved = false } = req.body;
        const pet = await Pet.findByIdAndUpdate(
            req.params.id,
            { isClinicallyApproved: Boolean(isClinicallyApproved) },
            { new: true }
        );

        if (!pet) {
            return res.status(404).json({ success: false, message: "Pet not found" });
        }

        res.json({ success: true, pet });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to update pet approval" });
    }
});

app.delete("/api/admin/delete-pet/:id", async (req, res) => {
    try {
        const petId = req.params.id;
        const pet = await Pet.findByIdAndDelete(petId);

        if (!pet) {
            return res.status(404).json({ success: false, message: "Pet not found" });
        }

        const relatedInquiries = await Inquiry.find({ petId }).select("_id");
        const inquiryIds = relatedInquiries.map((inquiry) => inquiry._id);

        if (inquiryIds.length > 0) {
            await Message.deleteMany({ chatId: { $in: inquiryIds } });
            await Inquiry.deleteMany({ _id: { $in: inquiryIds } });
        }

        res.json({ success: true, message: "Pet listing removed successfully" });
    } catch (error) {
        console.error("Admin pet delete error:", error);
        res.status(500).json({ success: false, message: "Failed to remove pet listing" });
    }
});

app.put("/api/admin/verify-donor/:id", async (req, res) => {
    await User.findByIdAndUpdate(req.params.id, { isVerified: true });
    res.json({ success: true });
});

app.delete("/api/admin/reject-donor/:id", async (req, res) => {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});

// app.listen(5000, () => {
//     console.log("Server running on http://localhost:5000"); 
// });
