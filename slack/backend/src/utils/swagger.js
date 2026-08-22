import swaggerJsdoc from 'swagger-jsdoc';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Slackr API',
            version: '1.0.0',
            description: 'API documentation for the Slackr backend',
            contact: {
                name: 'API Support',
                email: 'support@slackr.com'
            }
        },
        servers: [
            {
                url: 'http://localhost:8000/api/v1',
                description: 'Development Server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        },
        security: [
            {
                bearerAuth: []
            }
        ]
    },
    // Paths to files containing OpenAPI definitions
    apis: ['./src/routes/*.js', './src/models/*.js']
};

export const swaggerSpec = swaggerJsdoc(options);
