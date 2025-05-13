# ClickClickJob.com Frontend

This is the frontend application for ClickClickJob.com, a platform for finding verified remote jobs.

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Axios for API requests

## Development Setup

### Prerequisites

- Node.js (v16.x or later)
- npm (v8.x or later)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/clickclickjob.git
   cd clickclickjob/frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the frontend directory with the following variables:
   ```
   API_URL=http://localhost:3001/api
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
frontend/
├── build/              # Production build output
├── public/             # Static assets
├── src/
│   ├── components/     # Reusable UI components
│   │   ├── common/     # Shared components (buttons, cards, etc.)
│   │   ├── engagement/ # User engagement components
│   │   └── layout/     # Layout components
│   ├── mocks/          # Mock data for development
│   ├── pages/          # Next.js pages
│   ├── services/       # API services
│   ├── styles/         # Global styles
│   └── types/          # TypeScript type definitions
├── .env.local          # Environment variables (not in repository)
├── deploy.sh           # Deployment script
├── next.config.js      # Next.js configuration
├── package.json        # Project dependencies
├── postcss.config.js   # PostCSS configuration
├── tailwind.config.js  # Tailwind CSS configuration
└── tsconfig.json       # TypeScript configuration
```

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm start` - Start the production server
- `npm run lint` - Run ESLint
- `./deploy.sh` - Run the deployment script

## API Integration

The frontend uses the API client in `src/services/api.ts` to communicate with the backend. In development mode, it falls back to mock data if the API is not available.

## Deployment

### Production Build

To create a production build:

```bash
npm run build
```

This will create a production-ready build in the `build` directory.

### Deployment Script

We've included a deployment script that handles:

1. Installing dependencies
2. Building for production
3. Running tests (if available)
4. Creating a deployment package

To use it:

```bash
./deploy.sh
```

### Hosting Options

This frontend can be deployed to various hosting providers:

#### Vercel (Recommended for Next.js)

```bash
npm install -g vercel
vercel --prod
```

#### Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod
```

#### AWS S3 + CloudFront

```bash
aws s3 sync ./build s3://your-bucket-name/ --delete
```

## Production Considerations

1. Set up proper environment variables on your hosting platform
2. Configure caching and CDN for optimal performance
3. Set up monitoring and error reporting
4. Configure CI/CD for automated deployments

## Browser Support

This application supports:
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

## Contributing

Please follow our coding conventions and commit message format when contributing to this project.

## License

This project is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited. 