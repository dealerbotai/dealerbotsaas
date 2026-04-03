import swaggerJSDoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Dealerbot API',
      version: '1.0.0',
      description: 'API Documentation for Dealerbot Backend',
      contact: {
        name: 'Dealerbot Team'
      }
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Servidor Local',
      },
      {
        url: 'https://dealerbot-api.example.com',
        description: 'Servidor de Producción',
      },
    ],
    components: {
      securitySchemes: {
        WorkspaceIdAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-workspace-id',
          description: 'ID del Espacio de Trabajo en Supabase',
        },
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./index.js', './routes/*.js'], // Aseguramos que lea las anotaciones
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
