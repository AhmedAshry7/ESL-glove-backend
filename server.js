const express = require("express");
const cors = require("cors");
require("dotenv").config();

const submissionsRoutes = require("./routes/submissionsRoutes");
const modelsRoutes = require("./routes/modelsRoutes");
const profileRoutes = require("./routes/profileRoutes");
const languageRoutes = require("./routes/languageRoutes");
const roomRoutes = require("./routes/roomsRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/submissions", submissionsRoutes);
app.use("/api/models", modelsRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/languages", languageRoutes);
app.use("/api/rooms", roomRoutes);
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});