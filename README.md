# Meta Ads AI Analytics with HubSpot Integration

A powerful web application that combines Meta (Facebook) advertising analytics with HubSpot CRM integration for comprehensive marketing insights and campaign optimization.

## Features

### Analytics & Reporting
- 📊 **Comprehensive Analytics Dashboard**
  - Revenue tracking and visualization
  - Campaign performance metrics
  - Deal pipeline analysis
  - Contact source attribution

- 📈 **Interactive Charts**
  - Revenue over time (Line, Bar, Area charts)
  - Campaign performance trends
  - Deal stage distribution
  - ROI analysis

- 🎯 **Custom Dashboards**
  - Drag-and-drop widgets
  - Customizable layouts
  - Real-time updates
  - Multiple data sources

### HubSpot Integration
- 🤝 **CRM Sync**
  - Contact management
  - Deal tracking
  - Campaign attribution
  - Revenue analytics

- 📑 **Performance Reports**
  - Combined Meta Ads & HubSpot data
  - Customizable date ranges
  - Multiple export formats
  - Automated reporting

### Campaign Management
- 💰 **Budget Optimization**
  - Spend tracking
  - ROI analysis
  - Performance forecasting
  - Budget recommendations

- 🎯 **Targeting & Optimization**
  - Audience insights
  - Performance metrics
  - A/B testing
  - Automated optimization

## Tech Stack

### Frontend
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Recharts
- React DnD

### Backend
- Next.js API Routes
- Prisma ORM
- PostgreSQL
- JWT Authentication

### Integrations
- Meta Marketing API
- HubSpot API
- OpenAI API (coming soon)

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL
- Meta Business Account
- HubSpot Account

### Installation

1. Clone and install:
```bash
git clone https://github.com/yourusername/meta-ads-ai-app.git
cd meta-ads-ai-app
npm install
```

2. Configure environment:
```bash
cp .env.example .env
```

Required variables:
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/meta-ads-ai

# Authentication
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# Meta API
META_APP_ID=your-app-id
META_APP_SECRET=your-app-secret

# HubSpot API
HUBSPOT_CLIENT_ID=your-client-id
HUBSPOT_CLIENT_SECRET=your-client-secret

# Optional
OPENAI_API_KEY=your-openai-key
```

3. Initialize database:
```bash
npx prisma migrate dev
```

4. Start development:
```bash
npm run dev
```

## Documentation

### API Endpoints

#### Meta Analytics
- `/api/meta/campaigns`: Campaign data
- `/api/meta/analytics`: Performance metrics
- `/api/meta/insights`: AI-powered insights

#### HubSpot Integration
- `/api/hubspot/contacts`: Contact management
- `/api/hubspot/deals`: Deal tracking
- `/api/hubspot/analytics`: CRM analytics
  - `/revenue`: Revenue analytics
  - `/pipeline`: Deal pipeline analytics
  - `/campaigns`: Campaign performance
  - `/reports`: Custom reports
  - `/dashboards`: Dashboard data

### Project Structure

```
src/
├── app/
│   ├── (dashboard)/
│   │   ├── hubspot/
│   │   │   ├── analytics/
│   │   │   ├── contacts/
│   │   │   ├── deals/
│   │   │   └── automation/
│   │   └── campaigns/
│   ├── api/
│   │   ├── hubspot/
│   │   └── meta/
│   └── auth/
├── components/
├── lib/
│   ├── hubspot-api.ts
│   ├── meta-api.ts
│   └── utils/
└── types/
```

## Features in Detail

### Analytics Dashboard
- Real-time performance metrics
- Custom date range selection
- Multiple visualization options
- Export capabilities

### HubSpot Integration
- Seamless data synchronization
- Automated contact and deal tracking
- Campaign attribution
- Revenue analytics

### Custom Reports
- Flexible report builder
- Multiple data sources
- Scheduled reports
- Export to CSV/PDF

### Performance Optimization
- AI-powered recommendations
- A/B testing tools
- Budget optimization
- Audience insights

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

- Documentation: [docs.example.com](https://docs.example.com)
- Issues: [GitHub Issues](https://github.com/yourusername/meta-ads-ai-app/issues)
- Email: support@example.com
