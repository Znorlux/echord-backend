const cors = require("cors");

const corsOptions = {
  origin: "*", // Permitir todos los orígenes para simplicidad
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false,
};

module.exports = cors(corsOptions);
