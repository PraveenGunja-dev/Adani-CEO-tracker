This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## SQLite Database

This project uses SQLite for data storage, which is automatically initialized when the application starts. The database file is located at `data/adani-excel.db`.

No additional setup is required - the application will automatically create the database and tables when needed.

## Data Import

To import the default data into the database, use the following API endpoint:

```bash
curl -X POST http://localhost:3000/api/import-default-data
```

This will import data for all fiscal years (FY_23, FY_24, FY_25) from the JSON files in the components directory.

## DataTable Component

This project includes two implementations of the DataTable component:

1. `DataTable` - The original implementation
2. `NewDataTable` - A completely rewritten implementation with improved features

Both components can be used to display tabular data with filtering capabilities. The new implementation includes:

- Better loading states and error handling
- Enhanced filtering capabilities
- Improved responsive design
- Data summary and totals row
- Proper TypeScript support

## Test Pages

To test the DataTable components, visit:

- [http://localhost:3000/datatable-test](http://localhost:3000/datatable-test) - Compare old and new implementations
- [http://localhost:3000/new-datatable-test](http://localhost:3000/new-datatable-test) - Test the new implementation

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.