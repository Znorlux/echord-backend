/**
 * Calcula la paginación para queries
 * @param {number} page - Número de página (1-based)
 * @param {number} size - Tamaño de página
 * @returns {object} - Objeto con skip y take para Prisma
 */
const getPagination = (page = 1, size = 20) => {
  const pageNum = Math.max(1, parseInt(page) || 1);
  const sizeNum = Math.min(100, Math.max(1, parseInt(size) || 20)); // Max 100 items por página

  const skip = (pageNum - 1) * sizeNum;
  const take = sizeNum;

  return { skip, take, page: pageNum, size: sizeNum };
};

/**
 * Crea respuesta paginada
 * @param {Array} data - Datos de la página
 * @param {number} total - Total de registros
 * @param {number} page - Página actual
 * @param {number} size - Tamaño de página
 * @returns {object} - Respuesta paginada
 */
const createPaginatedResponse = (data, total, page, size) => {
  const totalPages = Math.ceil(total / size);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    data,
    pagination: {
      page,
      size,
      total,
      totalPages,
      hasNext,
      hasPrev,
    },
  };
};

module.exports = {
  getPagination,
  createPaginatedResponse,
};
