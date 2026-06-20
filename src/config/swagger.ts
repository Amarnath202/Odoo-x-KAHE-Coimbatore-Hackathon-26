import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Shiv Furniture Works — Mini ERP API',
      version: '1.0.0',
      description: `
## 🏭 Mini ERP Backend for Shiv Furniture Works

A production-style ERP system covering:
- **Authentication** — JWT Access + Refresh Tokens, RBAC
- **Inventory Engine** — Per-warehouse stock with reservation logic
- **Sales Management** — Orders, confirmation, delivery
- **Purchase Management** — Vendors, POs, goods receipt
- **Manufacturing** — BoM, Work Orders, component consumption
- **Procurement Automation** — Auto PO/MO generation on shortage
- **Stock Ledger** — Immutable movement history
- **Audit Logs** — Full traceability

### Authentication
All endpoints (except /auth/login) require Bearer token:
\`Authorization: Bearer <access_token>\`
      `,
      contact: {
        name: 'Shiv Furniture Works ERP',
        email: 'admin@shivfurniture.com',
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}/api/v1`,
        description: 'Local Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT access token',
        },
      },
      schemas: {
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: { type: 'object' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            errors: { type: 'array', items: { type: 'object' } },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            total: { type: 'integer' },
            page: { type: 'integer' },
            limit: { type: 'integer' },
            totalPages: { type: 'integer' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/modules/**/*.routes.ts', './src/docs/*.yaml'],
};

export const swaggerSpec = swaggerJsdoc(options);
