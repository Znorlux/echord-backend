const dotenv = require("dotenv");

// Cargar variables de entorno
dotenv.config();

// Validar variables de entorno críticas
const requiredEnvVars = ["DATABASE_URL", "SHODAN_API_KEY"];
const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
  console.error("❌ Error: Variables de entorno faltantes:");
  missingVars.forEach((varName) => {
    console.error(`   - ${varName}`);
  });
  console.error(
    "\n💡 Asegúrate de configurar el archivo .env con todas las variables requeridas."
  );
  console.error("   Puedes usar env.example como referencia.\n");
  process.exit(1);
}

module.exports = {
  PORT: process.env.PORT || 4000,
  DATABASE_URL: process.env.DATABASE_URL,
  SHODAN_API_KEY: process.env.SHODAN_API_KEY,
  NODE_ENV: process.env.NODE_ENV || "development",
};
