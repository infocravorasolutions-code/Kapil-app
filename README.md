# KAPIL SONI APK - Offline Invoice Generator

A React Native application for generating jewellery invoices offline with PDF download functionality and local database storage.

## Features

- ✅ **Offline First**: Works completely offline, no internet required
- ✅ **PDF Generation**: Creates professional invoice cards as PDF files
- ✅ **Local Database**: SQLite database for storing invoice data
- ✅ **Form Validation**: Input validation for all required fields
- ✅ **Auto Download**: PDFs are automatically generated and saved locally

## Installation

1. Install dependencies:
```bash
npm install
```

2. For Android, you may need to link native dependencies:
```bash
npx react-native link react-native-fs
npx react-native link react-native-html-to-pdf
npx react-native link react-native-sqlite-storage
```

3. Run the app:
```bash
# For Android
npm run android

# For iOS
npm run ios
```

## Usage

1. **Fill the Form**: Enter customer details, jewellery information, weights, and gold purity
2. **Generate Card**: Tap "Generate Card & Download PDF" button
3. **PDF Created**: The invoice PDF is automatically generated and saved to device storage
4. **Data Stored**: All invoice data is saved in local SQLite database

## Project Structure

```
src/
├── database/
│   └── db.ts              # SQLite database operations
├── screens/
│   └── FormScreen.tsx     # Main form interface
└── utils/
    └── pdfGenerator.ts    # PDF generation utilities
```

## Database Schema

The app uses SQLite with the following table structure:

| Field | Type | Description |
|-------|------|-------------|
| id | INTEGER | Primary key (auto-increment) |
| customer_name | TEXT | Customer name |
| jewellery_details | TEXT | Type of jewellery |
| gross_weight | REAL | Gross weight in grams |
| net_weight | REAL | Net weight in grams |
| gold_purity | TEXT | Gold purity (e.g., 22K) |
| pdf_path | TEXT | Path to generated PDF file |
| created_at | TEXT | Timestamp |

## Dependencies

- `react-native-fs`: File system operations
- `react-native-html-to-pdf`: PDF generation from HTML
- `react-native-sqlite-storage`: Local SQLite database
- `react-native-paper`: UI components
- `react-native-vector-icons`: Icons

## Build APK

To build the APK for distribution:

```bash
cd android
./gradlew assembleRelease
```

The APK will be generated in `android/app/build/outputs/apk/release/`

## Notes

- All data is stored locally on the device
- PDFs are saved in the device's Documents folder
- No internet connection required for any functionality
- Database and PDF files persist between app sessions