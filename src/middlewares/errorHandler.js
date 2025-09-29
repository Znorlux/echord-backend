const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

  // Error de Prisma - Duplicado
  if (err.code === "P2002") {
    return res.status(409).json({
      error: "Recurso duplicado",
      message: "Ya existe un recurso con esos datos únicos",
    });
  }

  // Error de Prisma - No encontrado
  if (err.code === "P2025") {
    return res.status(404).json({
      error: "Recurso no encontrado",
      message: "El recurso solicitado no existe",
    });
  }

  // Error de Prisma - Variables de entorno o conexión
  if (err.name === "PrismaClientInitializationError") {
    if (err.message.includes("Environment variable not found: DATABASE_URL")) {
      return res.status(500).json({
        error: "Error de configuración",
        message:
          "Variable de entorno DATABASE_URL no configurada. Verifica tu archivo .env",
      });
    }

    return res.status(500).json({
      error: "Error de conexión a base de datos",
      message:
        "No se pudo conectar a la base de datos. Verifica la configuración de DATABASE_URL",
    });
  }

  // Error de validación
  if (err.name === "ValidationError") {
    return res.status(400).json({
      error: "Error de validación",
      message: err.message,
    });
  }

  // Error de solicitud HTTP (axios)
  if (err.response) {
    return res.status(err.response.status || 500).json({
      error: "Error en servicio externo",
      message: err.response.data?.error || "Error en la API de Shodan",
    });
  }

  // Error de variables de entorno faltantes
  if (err.message && err.message.includes("SHODAN_API_KEY")) {
    return res.status(500).json({
      error: "Error de configuración",
      message:
        "Variable de entorno SHODAN_API_KEY no configurada. Verifica tu archivo .env",
    });
  }

  // Error genérico del servidor
  res.status(500).json({
    error: "Error interno del servidor",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Ha ocurrido un error inesperado. Es posible que el servidor se haya apagado/reiniciado.",
  });
};

module.exports = errorHandler;
