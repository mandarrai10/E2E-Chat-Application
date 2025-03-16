const app = require("./app");
require("dotenv").config();

const HOST = process.env.API_HOST;
const PORT = process.env.API_PORT;

// Server listening
app.listen(PORT, HOST, () => {
    console.log(`Server is running on http://${HOST}:${PORT}`);
});