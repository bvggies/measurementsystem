# API Documentation

## Base URL

- **Development**: `http://localhost:3000`
- **Production**: Your Vercel deployment URL

## Authentication

All API endpoints (except login) require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### Authentication

#### POST /api/auth/login

Login and receive JWT token.

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "admin@example.com",
    "name": "Admin User",
    "role": "admin"
  }
}
```

### Measurements

#### GET /api/measurements

List measurements with pagination and filters.

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 20) - Items per page
- `search` (string) - Search by name, phone, or entry ID
- `branch` (string) - Filter by branch
- `unit` (string) - Filter by unit (cm/in)
- `tailor` (string) - Filter by tailor ID
- `fromDate` (string) - Filter from date (ISO format)
- `toDate` (string) - Filter to date (ISO format)

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "entry_id": "ENT-001",
      "customer_name": "John Doe",
      "customer_phone": "+1234567890",
      "units": "cm",
      "chest": 100,
      "sleeve_length": 60,
      "created_at": "2024-01-01T10:00:00Z",
      "created_by_name": "Admin User"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

#### GET /api/measurements/:id

Get a single measurement by ID.

**Response:**
```json
{
  "id": "uuid",
  "entry_id": "ENT-001",
  "customer_id": "uuid",
  "customer_name": "John Doe",
  "customer_phone": "+1234567890",
  "customer_email": "john@example.com",
  "units": "cm",
  "across_back": 40,
  "chest": 100,
  "sleeve_length": 60,
  "around_arm": 30,
  "neck": 38,
  "top_length": 75,
  "wrist": 15,
  "trouser_waist": 34,
  "trouser_thigh": 60,
  "trouser_knee": 40,
  "trouser_length": 100,
  "trouser_bars": 2,
  "additional_info": "Customer prefers slim fit",
  "branch": "Downtown",
  "created_at": "2024-01-01T10:00:00Z",
  "updated_at": "2024-01-01T10:00:00Z"
}
```

#### POST /api/measurements

Create a new measurement.

**Request Body:**
```json
{
  "client_name": "John Doe",
  "client_phone": "+1234567890",
  "client_email": "john@example.com",
  "client_address": "123 Main St",
  "units": "cm",
  "across_back": 40,
  "chest": 100,
  "sleeve_length": 60,
  "around_arm": 30,
  "neck": 38,
  "top_length": 75,
  "wrist": 15,
  "trouser_waist": 34,
  "trouser_thigh": 60,
  "trouser_knee": 40,
  "trouser_length": 100,
  "trouser_bars": 2,
  "additional_info": "Customer prefers slim fit",
  "branch": "Downtown"
}
```

**Response:**
```json
{
  "id": "uuid",
  "entry_id": "ENT-001",
  "message": "Measurement created successfully"
}
```

#### PUT /api/measurements/:id

Update an existing measurement.

**Request Body:** Same as POST, all fields optional.

**Response:**
```json
{
  "message": "Measurement updated successfully"
}
```

#### DELETE /api/measurements/:id

Delete a measurement (admin only).

**Response:**
```json
{
  "message": "Measurement deleted successfully"
}
```

#### GET /api/measurements/history/:id

Get measurement change history.

**Response:**
```json
{
  "measurementId": "uuid",
  "history": [
    {
      "history_id": "uuid",
      "changed_by": "uuid",
      "changed_by_name": "Admin User",
      "changed_at": "2024-01-02T10:00:00Z",
      "version": 2,
      "change_diff": {
        "old": { "chest": 100 },
        "new": { "chest": 105 }
      }
    }
  ]
}
```

### Import/Export

#### POST /api/measurements/import

Upload and preview CSV/Excel file.

**Request Body:**
```json
{
  "fileData": "base64-encoded-file-data",
  "fileName": "measurements.csv",
  "fileType": "text/csv",
  "defaultUnit": "cm"
}
```

**Response:**
```json
{
  "importId": "import-1234567890-abc123",
  "fileName": "measurements.csv",
  "preview": {
    "rows": [
      {
        "rowNumber": 1,
        "data": { "client_name": "John Doe", "chest": 100 },
        "errors": [],
        "isValid": true
      }
    ],
    "headers": ["client_name", "chest"],
    "totalRows": 100
  },
  "statistics": {
    "totalRows": 100,
    "validRows": 95,
    "invalidRows": 5
  },
  "columnMapping": {
    "Client Name": "client_name",
    "Chest": "chest"
  },
  "headers": ["Client Name", "Chest"]
}
```

#### POST /api/measurements/import/commit

Commit validated import rows.

**Request Body:**
```json
{
  "importId": "import-1234567890-abc123",
  "rows": [
    {
      "client_name": "John Doe",
      "client_phone": "+1234567890",
      "units": "cm",
      "chest": 100
    }
  ],
  "columnMapping": {
    "Client Name": "client_name",
    "Chest": "chest"
  },
  "fileName": "measurements.csv",
  "defaultUnit": "cm"
}
```

**Response:**
```json
{
  "importId": "uuid",
  "successCount": 95,
  "failedCount": 5,
  "errors": [
    {
      "rowNumber": 10,
      "errors": ["Chest must be between 50 and 200 cm"]
    }
  ]
}
```

### Reports

#### GET /api/reports/summary

Get dashboard statistics.

**Response:**
```json
{
  "totalCustomers": 150,
  "totalMeasurements": 500,
  "newEntries": 25,
  "pendingFittings": 10,
  "recentActivity": 15
}
```

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message description"
}
```

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `405` - Method Not Allowed
- `500` - Internal Server Error

## Rate Limiting

Currently no rate limiting is implemented. For production, consider:
- Vercel's built-in rate limiting
- Upstash Redis for distributed rate limiting
- API gateway rate limiting

## File Upload Limits

- Maximum file size: 10MB
- Supported formats: CSV, XLSX, XLS
- Maximum rows per import: No hard limit (but consider performance)

## Validation Rules

### Measurement Fields

- **Required**: Client name OR phone number, at least one measurement field
- **Numeric ranges** (cm):
  - Across Back: 20-80
  - Chest: 50-200
  - Sleeve Length: 20-100
  - Around Arm: 15-80
  - Neck: 20-60
  - Top Length: 30-150
  - Wrist: 10-40
  - Trouser Waist: 50-200
  - Trouser Thigh: 30-100
  - Trouser Knee: 20-80
  - Trouser Length: 50-150
  - Trouser Bars: 5-30

- **Numeric ranges** (inches): Converted from cm ranges

## Pagination

All list endpoints support pagination:
- Default page size: 20
- Maximum page size: 100
- Page numbers start at 1

## Filtering

Filters can be combined:
- Search: Searches across name, phone, and entry ID
- Date range: ISO 8601 format (YYYY-MM-DD or full timestamp)
- Multiple filters: Combined with AND logic

