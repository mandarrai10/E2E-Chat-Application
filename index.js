require("dotenv").config();
const app = require("./app");

const HOST = process.env.API_HOST || "localhost";  // Default to "localhost" if undefined
const PORT = process.env.API_PORT || 5000;        // Default to 5000 if undefined

// Server listening 
app.listen(PORT, HOST, () => {
    console.log(`Server is running on http://${HOST}:${PORT}`);
});
