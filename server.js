const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');


const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname)); // Serve HTML/CSS/JS files from this folder
// In-memory database (simulating a real database)
let users = [];
let allChats = {}; // Stores chats: { "user_identifier": [chat_objects] }

// Middleware to check admin password
const adminPassword = "23122011";
const checkAdminPassword = (req, res, next) => {
    const password = req.headers['admin-password'];
    if (password === adminPassword) {
        next();
    } else {
        res.status(401).json({ error: "Unauthorized" });
    }
};

// Apply password protection to admin endpoints
app.use(['/api/users', '/api/sync-chats', '/api/all-chats', '/api/delete-user', '/api/delete-chats'], checkAdminPassword);

// Serve static files (including admin.html)
app.use(express.static(__dirname));


// Sign Up Endpoint
app.post('/api/signup', (req, res) => {




    const user = req.body;
    
    // Basic validation
    if (!user.fname || !user.lname || !user.password) {
        return res.status(400).json({ error: "Missing mandatory fields" });
    }

    // Check if user already exists (optional check)
    const exists = users.find(u => u.email === user.email && user.email !== "" || u.phone === user.phone && u.phone !== "");
    if (exists) {
        return res.status(400).json({ error: "User with this email already exists" });
    }

    // Save user with an ID
    user.id = Date.now();
    users.push(user);
    
    console.log("User Registered:", user.fullname);

    res.status(201).json({ message: "User registered successfully", user });
});

// Login Endpoint
app.post('/api/login', (req, res) => {
    const { email, phone, password } = req.body;
    
    // Find user by Email OR Phone
        const user = users.find(u => ((email && u.email === email) || (phone && u.phone === phone)) && u.password === password);

    if (user) {
        console.log("User Logged In:", user.fullname);
        res.json({ message: "Login successful", user });
    } else {
        res.status(401).json({ error: "Invalid credentials or user not found" });
    }
});


// Endpoint to get all users (Admin view)
app.get('/api/users', (req, res) => {
    res.json(users);
});

// Endpoint to sync chats from client
app.post('/api/sync-chats', (req, res) => {
    const { identifier, chats } = req.body;
    if (!identifier) return res.status(400).json({ error: "No identifier provided" });
    
    allChats[identifier] = chats;
    res.json({ message: "Chats synced successfully" });
});

// Allow viewing chats on this URL too if accessed via browser (GET)
app.get('/api/sync-chats', (req, res) => {
    res.json(allChats);
});

// Endpoint to get all chats (Admin view)
app.get('/api/all-chats', (req, res) => {
    res.json(allChats);
});

// Endpoint to delete a specific user
app.post('/api/delete-user', (req, res) => {



    const { identifier } = req.body;
    
    const initialLength = users.length;
    users = users.filter(u => u.email !== identifier && u.phone !== identifier);
    
    if (users.length < initialLength) {


        delete allChats[identifier];
        res.json({ message: "User deleted successfully" });
    } else {
        res.status(404).json({ error: "User not found" });
    }
});

// Ban User Endpoint
app.post('/api/ban-user', (req, res) => {
    const { identifier } = req.body;
    const user = users.find(u => u.email === identifier || u.phone === identifier);
    if (user) {
        delete allChats[identifier];
        res.json({ message: "User deleted successfully" });
    } else {
        res.status(404).json({ error: "User not found" });
    }
});

// Endpoint to delete all chats (Admin view)
app.post('/api/delete-chats', (req, res) => {
    allChats = {};
    res.json({ message: "All chats deleted successfully" });
});




// Delete All Endpoint (Clears Database as requested)

app.post('/api/delete-all', (req, res) => {
    users = []; // Wipes all data
    allChats = {};
    console.log("Database cleared (Delete Account pressed).");
    res.json({ message: "All data removed from database" });
});


// 404 Route
app.use((req, res) => {
    res.status(404).sendFile(__dirname + '/404.html');
});



// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});