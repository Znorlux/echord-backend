const app = require("./app");
const { PORT } = require("./config/env");

const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor Echord Backend ejecutándose en puerto ${PORT}`);
  console.log(`📖 Documentación disponible en: http://localhost:${PORT}`);
  console.log(`🏥 Health check en: http://localhost:${PORT}/api/v1/health`);
});

// Manejo graceful de cierre del servidor
process.on("SIGTERM", () => {
  console.log("💤 Recibida señal SIGTERM, cerrando servidor...");
  server.close(() => {
    console.log("✅ Servidor cerrado correctamente");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("💤 Recibida señal SIGINT, cerrando servidor...");
  server.close(() => {
    console.log("✅ Servidor cerrado correctamente");
    process.exit(0);
  });
});

// Manejo de errores no capturados
process.on("uncaughtException", (error) => {
  console.error("💥 Excepción no capturada:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error(
    "💥 Promesa rechazada no manejada en:",
    promise,
    "razón:",
    reason
  );
  process.exit(1);
});
