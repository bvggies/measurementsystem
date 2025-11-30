# Import Scripts

## Import Excel Measurements

This script clears all existing measurements and imports data from the Excel file.

### Usage

1. Make sure you have a `.env` file with `DATABASE_URL` set
2. Run the script:
   ```bash
   node scripts/import-excel.js
   ```

### What it does

- Clears all existing measurements from the database
- Reads the Excel file from `assets/measurements-2024-06-14.xlsx`
- Maps Excel columns to database fields
- Creates or updates customers based on phone/email
- Imports all measurements with proper relationships

### Excel Column Mapping

- `Client Information (Name (Reference))` → client_name
- `Client Information (Phone Number)` or `Phone` → client_phone
- `Across Back` → across_back
- `Chest` → chest
- `Sleeve Lenght` → sleeve_length (note: typo in Excel)
- `Around Arm` → around_arm
- `Neck` → neck
- `Top Length` → top_length
- `Wrist` → wrist
- `Waist` → trouser_waist
- `Thigh` → trouser_thigh
- `Knee` → trouser_knee
- `Trouser Length` → trouser_length
- `Bars` → trouser_bars
- `Entry Id` → entry_id
- `Additional Info` → additional_info

