# Meta Ads AI Analytics

Meta Ads AI Analytics is a powerful web application that helps businesses optimize their Meta (Facebook) advertising campaigns using AI-powered insights and analytics.

## Features

- 🤖 **AI-Powered Insights**: Get intelligent recommendations and insights for your campaigns
- 📊 **Real-time Analytics**: Monitor campaign performance with detailed metrics and visualizations
- 🎯 **Smart Optimization**: Automatically optimize campaigns based on AI-driven analysis
- 📑 **Custom Reports**: Generate comprehensive reports tailored to your needs
- 💰 **Budget Management**: Efficiently manage ad spend across multiple campaigns
- 🔄 **A/B Testing**: Test different ad variations to maximize ROI

## Tech Stack

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: For type-safe code
- **Tailwind CSS**: For styling and responsive design
- **React Hooks**: For state management and side effects

### Backend
- **Next.js API Routes**: For serverless API endpoints
- **Prisma**: ORM for database management
- **PostgreSQL**: Primary database
- **JWT**: For authentication and authorization

### APIs & Integration
- **Meta Marketing API**: For campaign management and insights
- **OpenAI API**: For AI-powered recommendations (coming soon)

### Development Tools
- **ESLint**: For code linting
- **Prettier**: For code formatting
- **Husky**: For pre-commit hooks

## Getting Started

### Prerequisites
- Node.js 18 or higher
- PostgreSQL database
- Meta Business Account and API access
- OpenAI API key (optional)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/meta-ads-ai-app.git
cd meta-ads-ai-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Fill in your environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: Random string for JWT encryption
- `NEXTAUTH_URL`: Your app's URL (http://localhost:3000 for development)
- `META_APP_ID`: Your Meta App ID
- `META_APP_SECRET`: Your Meta App Secret
- `OPENAI_API_KEY`: Your OpenAI API key (optional)

4. Run database migrations:
```bash
npx prisma migrate dev
```

5. Start the development server:
```bash
npm run dev
```

Visit http://localhost:3000 to see your app running.

## Project Structure

- `/src/app`: Next.js App Router pages and API routes
- `/src/components`: Reusable React components
- `/src/lib`: Utility functions and shared logic
- `/prisma`: Database schema and migrations
- `/public`: Static assets

## Meta API Integration

To use the Meta API features:

1. Create a Meta Business Account
2. Set up a System User in Business Settings
3. Generate an access token with required permissions:
   - ads_management
   - ads_read
   - business_management
   - campaign_management
4. Add the token in your app's Settings page

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@example.com or open an issue in the GitHub repository.
