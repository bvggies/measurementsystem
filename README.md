# Tailor Measurement System

A production-ready web-based tailoring measurement & order management system built with Create React App, TypeScript, Tailwind CSS, and Neon Postgres.

## Features

- **Measurement Management**: Create, read, update, and delete measurement records
- **CSV/Excel Import**: Bulk import measurements with preview and validation
- **Unit Conversion**: Seamless conversion between centimeters and inches
- **Role-Based Access**: Admin, Tailor, and Customer roles with appropriate permissions
- **Audit History**: Complete audit trail for all measurement changes
- **Search & Filter**: Advanced search and filtering capabilities
- **Responsive UI**: Modern, beautiful UI with animations (AOS + Framer Motion)
- **Dashboard**: Real-time statistics and quick actions

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Animations**: AOS (scroll animations), Framer Motion (component transitions)
- **Backend**: Vercel Serverless Functions (Node.js)
- **Database**: Neon Postgres
- **File Processing**: PapaParse (CSV), XLSX (Excel)
- **Authentication**: JWT-based authentication
- **Testing**: Jest + React Testing Library

## Prerequisites

- Node.js 16+ and npm
- Neon Postgres database account
- Vercel account (for deployment)

## Local Development Setup

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd measurementsytem
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the root directory:

```env
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
JWT_SECRET=your-super-secret-jwt-key-change-in-production
REACT_APP_API_URL=http://localhost:3000
```

### 4. Set up the database

1. Create a new Neon Postgres database at [neon.tech](https://neon.tech)
2. Copy your connection string to `DATABASE_URL` in `.env`
3. Run the schema SQL:

```bash
psql $DATABASE_URL -f database/schema.sql
```

Or use the Neon console to run the SQL from `database/schema.sql`

### 5. Seed the database

Import the sample CSV data:

```bash
npm run seed
```

This will:
- Create an admin user (email: `admin@example.com`, password: `admin123`)
- Import all measurements from `assets/measurements-2024-06-14 - measurements-2024-06-14.csv`

### 6. Start the development server

```bash
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000)

## Project Structure

```
measurementsytem/
├── api/                    # Vercel serverless functions
│   ├── auth/
│   ├── measurements/
│   └── reports/
├── database/
│   └── schema.sql          # Database schema
├── public/
│   └── index.html
├── scripts/
│   └── seed.ts             # Database seeding script
├── src/
│   ├── components/         # React components
│   ├── contexts/           # React contexts (Auth)
│   ├── pages/              # Page components
│   ├── utils/              # Utility functions
│   │   ├── __tests__/      # Unit tests
│   │   ├── auth.ts
│   │   ├── db.ts
│   │   ├── importParser.ts
│   │   ├── unitConversion.ts
│   │   └── validation.ts
│   ├── App.tsx
│   ├── index.tsx
│   └── index.css
├── assets/                 # Sample CSV files
├── package.json
├── tailwind.config.js
└── vercel.json
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login and get JWT token

### Measurements
- `GET /api/measurements` - List measurements (with pagination, search, filters)
- `GET /api/measurements/:id` - Get single measurement
- `POST /api/measurements` - Create new measurement
- `PUT /api/measurements/:id` - Update measurement
- `DELETE /api/measurements/:id` - Delete measurement
- `GET /api/measurements/history/:id` - Get measurement history

### Import/Export
- `POST /api/measurements/import` - Upload and preview CSV/Excel file
- `POST /api/measurements/import/commit` - Commit validated import rows

### Reports
- `GET /api/reports/summary` - Get dashboard statistics

## Default Users

After seeding, you can login with:

- **Admin**: `admin@example.com` / `admin123`
- Create additional users through the admin panel or directly in the database

## Deployment to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 2. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Configure environment variables:
   - `DATABASE_URL` - Your Neon Postgres connection string
   - `JWT_SECRET` - A secure random string for JWT signing
5. Click "Deploy"

### 3. Set up Neon Database

1. Create a Neon project at [neon.tech](https://neon.tech)
2. Run the schema SQL from `database/schema.sql` in the Neon SQL editor
3. Update `DATABASE_URL` in Vercel environment variables
4. Run the seed script locally or manually create an admin user

## Environment Variables

### Required

- `DATABASE_URL` - Neon Postgres connection string
- `JWT_SECRET` - Secret key for JWT token signing

### Optional

- `REACT_APP_API_URL` - API base URL (defaults to current origin)

## Testing

Run unit tests:

```bash
npm test
```

Run tests in watch mode:

```bash
npm test -- --watch
```

## CSV/Excel Import Format

The system accepts CSV or Excel files with the following columns (case-insensitive):

**Required Headers:**
- Client Name (or Client Phone)
- At least one measurement field

**Supported Headers:**
- Entry Id, Entry Date, Date Updated, Created By
- Client Name, Client Phone, Client Email, Client Address
- Branch, Units (cm/in)
- Across Back, Chest, Sleeve Length, Around Arm, Neck, Top Length, Wrist
- Trouser Waist, Trouser Thigh, Trouser Knee, Trouser Length, Trouser Bars
- Additional Info

**Sample CSV:**
```csv
Entry Id,Entry Date,Client Name,Client Phone,Units,Chest,Sleeve Length,Trouser Waist
ENT-001,2024-01-01,John Doe,+1234567890,cm,100,60,80
```

## Database Schema

See `database/schema.sql` for the complete schema. Main tables:

- `users` - System users (admin, tailor, customer)
- `customers` - Customer information
- `measurements` - Measurement records
- `measurement_history` - Audit trail for measurements
- `orders` - Tailoring orders
- `fittings` - Fitting appointments
- `imports` - Import operation records
- `audit_logs` - System-wide audit log

## Security

- JWT-based authentication
- Role-based access control (RBAC)
- Parameterized SQL queries (SQL injection prevention)
- File size limits for imports (10MB)
- Input validation on all endpoints

## Performance

- Server-side pagination
- Database indexes on frequently queried fields
- Efficient CSV/Excel parsing
- Optimized database queries

## Troubleshooting

### Database Connection Issues

- Verify `DATABASE_URL` is correct
- Ensure SSL mode is enabled for Neon
- Check firewall settings

### Import Fails

- Verify file format (CSV or Excel)
- Check file size (max 10MB)
- Ensure required columns are present
- Review validation errors in preview

### Authentication Issues

- Verify JWT_SECRET is set
- Check token expiration
- Clear browser localStorage and re-login

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions, please open an issue on GitHub.

## Roadmap

- [ ] Complete customer management UI
- [ ] Order management system
- [ ] Calendar/fitting scheduling UI
- [ ] PDF export for measurement sheets
- [ ] SMS/Email notifications
- [ ] QR code generation for garments
- [ ] Mobile app (React Native)
- [ ] Advanced analytics and reports

