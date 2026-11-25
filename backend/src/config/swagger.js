/**
 * @file config/swagger.js
 * @description Genera y exporta la especificación OpenAPI 3.0 de la API.
 *
 * Swagger / OpenAPI es un estándar para documentar APIs REST.
 * swagger-jsdoc lee los comentarios JSDoc de los archivos de rutas (src/routes/*.js)
 * y los convierte en un objeto JSON con la especificación completa.
 * swagger-ui-express (montado en index.js) expone esa especificación como una interfaz
 * web interactiva en /api-docs, donde se puede ver y probar cada endpoint sin necesidad
 * de herramientas externas como Postman.
 *
 * Conexiones:
 *  - Lee los comentarios @swagger de todos los archivos en ./src/routes/*.js
 *  - Exportado a index.js, que lo monta en /api-docs con swagger-ui-express
 */

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    // Versión del estándar OpenAPI que se utiliza
    openapi: '3.0.0',
    info: {
      // Nombre visible de la API en la interfaz de Swagger UI
      title: 'BackWeb API',
      // Versión de la API; útil para gestionar cambios breaking
      version: '1.0.0',
      // Descripción corta que aparece en la cabecera de la documentación
      description: 'API REST con Express y PostgreSQL',
    },
    servers: [
      {
        // URL base del servidor; Swagger UI usará esto para construir las peticiones de prueba.
        // Toma el puerto de la variable de entorno o usa 3000 por defecto.
        url: `http://localhost:${process.env.PORT || 3000}`,
        // Etiqueta descriptiva del servidor mostrada en el selector de Swagger UI
        description: 'Servidor local',
      },
    ],
  },
  // Rutas donde swagger-jsdoc buscará comentarios @swagger para generar la documentación.
  // El patrón glob incluye todos los archivos .js dentro de src/routes/
  apis: ['./src/routes/*.js'],
};

// Genera el objeto de especificación OpenAPI a partir de las opciones definidas arriba
const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
