/**
 * Valida si una cadena es una dirección IP válida (IPv4 o IPv6)
 * @param {string} ip - IP a validar
 * @returns {boolean} - true si es válida
 */
const isValidIP = (ip) => {
  if (!ip || typeof ip !== "string") return false;

  // IPv4 regex
  const ipv4Regex =
    /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

  // IPv6 regex (simplificado)
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/;

  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
};

/**
 * Valida si una cadena es un hostname válido
 * @param {string} hostname - Hostname a validar
 * @returns {boolean} - true si es válido
 */
const isValidHostname = (hostname) => {
  if (!hostname || typeof hostname !== "string") return false;

  // Hostname regex (permite dominios y subdominios)
  const hostnameRegex =
    /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  return hostnameRegex.test(hostname) && hostname.length <= 253;
};

/**
 * Valida si una cadena es una IP válida o un hostname válido
 * @param {string} target - IP o hostname a validar
 * @returns {boolean} - true si es válido
 */
const isValidIPOrHostname = (target) => {
  return isValidIP(target) || isValidHostname(target);
};

/**
 * Valida si una cadena no está vacía
 * @param {string} str - Cadena a validar
 * @returns {boolean} - true si no está vacía
 */
const isNotEmpty = (str) => {
  return str && typeof str === "string" && str.trim().length > 0;
};

/**
 * Valida si un array contiene solo strings
 * @param {Array} arr - Array a validar
 * @returns {boolean} - true si es válido
 */
const isStringArray = (arr) => {
  return Array.isArray(arr) && arr.every((item) => typeof item === "string");
};

/**
 * Crea un error de validación
 * @param {string} message - Mensaje de error
 * @returns {Error} - Error con name ValidationError
 */
const createValidationError = (message) => {
  const error = new Error(message);
  error.name = "ValidationError";
  return error;
};

/**
 * Valida datos para crear/actualizar favorito
 * @param {object} data - Datos a validar
 * @param {boolean} isUpdate - Si es actualización (campos opcionales)
 * @returns {object} - Datos validados
 */
const validateFavoriteData = (data, isUpdate = false) => {
  const { ip, alias, notes, tags } = data;

  // Validaciones para creación
  if (!isUpdate) {
    if (!isNotEmpty(ip)) {
      throw createValidationError("El campo ip es obligatorio");
    }
    if (!isValidIP(ip)) {
      throw createValidationError(
        "El campo ip debe ser una dirección IP válida"
      );
    }
    if (!isNotEmpty(alias)) {
      throw createValidationError("El campo alias es obligatorio");
    }
  }

  // Validaciones para actualización
  if (isUpdate) {
    if (ip !== undefined && (!isNotEmpty(ip) || !isValidIP(ip))) {
      throw createValidationError(
        "El campo ip debe ser una dirección IP válida"
      );
    }
    if (alias !== undefined && !isNotEmpty(alias)) {
      throw createValidationError("El campo alias no puede estar vacío");
    }
  }

  // Validar tags si está presente
  if (tags !== undefined && !isStringArray(tags)) {
    throw createValidationError("El campo tags debe ser un array de strings");
  }

  return {
    ...(ip !== undefined && { ip }),
    ...(alias !== undefined && { alias }),
    ...(notes !== undefined && { notes }),
    ...(tags !== undefined && { tags }),
  };
};

module.exports = {
  isValidIP,
  isValidHostname,
  isValidIPOrHostname,
  isNotEmpty,
  isStringArray,
  createValidationError,
  validateFavoriteData,
};
