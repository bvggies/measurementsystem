# How to Seed the Database

The dashboard is showing 0 for all statistics because the database hasn't been seeded with data yet.

## Option 1: Seed Locally (Recommended)

1. **Set up your environment:**
   ```bash
   # Create a .env file in the project root
   DATABASE_URL=postgresql://neondb_owner:npg_RmuGETi0g3wU@ep-sweet-wind-ahq3i2eq-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
   JWT_SECRET=your-secret-key-here
   ```

2. **Run the database setup:**
   ```bash
   npm run setup-db
   ```
   This creates all the necessary tables.

3. **Seed the database with CSV data:**
   ```bash
   npm run seed
   ```
   This imports the CSV file from `assets/measurements-2024-06-14 - measurements-2024-06-14.csv`

## Option 2: Seed via Vercel CLI

If you want to seed directly to your production database:

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Set environment variables:**
   ```bash
   vercel env add DATABASE_URL
   # Paste your database URL when prompted
   ```

3. **Run seed script with Vercel environment:**
   ```bash
   vercel env pull .env.local
   npm run seed
   ```

## Option 3: Manual SQL Insert

You can also manually insert data using SQL:

```sql
-- Insert a test customer
INSERT INTO customers (name, phone, email) 
VALUES ('Test Customer', '+1234567890', 'test@example.com');

-- Insert a test measurement
INSERT INTO measurements (
  customer_id, entry_id, units, chest, across_back, 
  sleeve_length, around_arm, neck, top_length, wrist,
  trouser_waist, trouser_thigh, trouser_knee, trouser_length, trouser_bars
) VALUES (
  (SELECT id FROM customers LIMIT 1),
  'ENT-001',
  'cm',
  100, 40, 60, 30, 38, 75, 15,
  34, 60, 40, 100, 2
);
```

## Verify Data

After seeding, check your dashboard. You should see:
- Total Customers > 0
- Total Measurements > 0
- New Entries (30d) > 0 (if data was created recently)

## Troubleshooting

### "DATABASE_URL is not set"
- Make sure you have a `.env` file with `DATABASE_URL`
- Or set it as an environment variable: `export DATABASE_URL=...`

### "Table does not exist"
- Run `npm run setup-db` first to create tables

### "CSV file not found"
- Make sure the CSV file exists at: `assets/measurements-2024-06-14 - measurements-2024-06-14.csv`

### Still showing 0 after seeding?
1. Check browser console for API errors
2. Verify the API endpoint `/api/reports/summary` is working
3. Check Vercel function logs for database connection errors
4. Verify `DATABASE_URL` is set correctly in Vercel environment variables

