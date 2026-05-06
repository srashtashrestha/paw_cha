// routes/chatRoutes.js
router.post('/initialize', authenticate, async (req, res) => {
    const { adopterId, petId } = req.body;
    const donorId = req.user.id;

    try {
        // 1. Check if chat already exists
        let chat = await Chat.findOne({ adopterId, donorId, petId });

        if (!chat) {
            // 2. Create new chat room
            chat = new Chat({ adopterId, donorId, petId });
            await chat.save();

            // 3. Create the first automated message
            const firstMsg = new Message({
                chatId: chat._id,
                senderId: donorId,
                text: "Hi! I've reviewed your application for pet adoption. Let's discuss further!"
            });
            await firstMsg.save();
        }

        res.status(200).json({ success: true, chatId: chat._id });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
});