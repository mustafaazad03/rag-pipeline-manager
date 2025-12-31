# RAG Pipeline Manager

A modern, full-stack application for managing document stores and performing intelligent retrieval-augmented generation (RAG) queries powered by Google's Gemini File Search API. Built with Next.js, TypeScript, and Supabase.

## 🚀 Features

### Document Management
- **Store Management**: Create, view, and delete document stores
- **Document Upload**: Upload multiple documents with drag-and-drop support
- **Document Status Tracking**: Real-time status updates (Pending, Processing, Active, Failed)
- **Document Organization**: Organize documents into named stores for better management

### Intelligent Chat Interface
- **RAG-powered Queries**: Ask questions and get answers grounded in your uploaded documents
- **Multi-Store Search**: Query across multiple document stores simultaneously
- **Citation Support**: View source documents and citations for each response
- **Chat History**: Maintain conversation context across sessions

### User Experience
- **Modern UI**: Beautiful, responsive interface with dark/light theme support
- **Real-time Updates**: Live status updates for document processing
- **Toast Notifications**: User-friendly feedback for all actions
- **Smooth Animations**: Polished UI with Framer Motion animations

### User Management
- **Authentication**: Secure sign-up and login with Supabase Auth
- **Profile Management**: Update display name and view account information
- **Settings Page**: Comprehensive settings with theme customization

## 🛠️ Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Utility-first styling
- **Framer Motion** - Smooth animations
- **React Query (TanStack Query)** - Server state management
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library
- **Sonner** - Toast notifications

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Prisma** - Type-safe database ORM
- **PostgreSQL** - Relational database
- **Supabase** - Authentication and database hosting

### Services
- **Google Gemini File Search API** - Document processing and RAG capabilities
- **Supabase Auth** - User authentication

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18+ and npm/pnpm/yarn
- **PostgreSQL** database (or Supabase project)
- **Google Cloud Account** with Gemini API access
- **Supabase Account** for authentication

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd rag-pipeline-manager
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   # or
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/rag_pipeline?schema=public"

   # Supabase
   NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

   # Gemini API
   GEMINI_API_KEY="your-gemini-api-key"
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma Client
   pnpm db:generate

   # Run migrations
   pnpm db:migrate
   ```

5. **Start the development server**
   ```bash
   pnpm dev
   ```

   The application will be available at [http://localhost:3000](http://localhost:3000)

## 🔐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (for admin operations) | Yes |
| `GEMINI_API_KEY` | Google Gemini API key | Yes |

## 📁 Project Structure

```
rag-pipeline-manager/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Database migrations
├── public/                     # Static assets
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/                # API routes
│   │   │   ├── chat/           # Chat endpoints
│   │   │   ├── stores/         # Store management
│   │   │   ├── upload/         # Document upload
│   │   │   └── user/           # User profile
│   │   ├── login/              # Login page
│   │   ├── signup/             # Signup page
│   │   ├── settings/           # Settings page
│   │   ├── upload/             # Upload page
│   │   └── page.tsx            # Home/Chat page
│   ├── components/              # React components
│   │   ├── auth/               # Authentication components
│   │   ├── chat/               # Chat interface components
│   │   ├── upload/             # Upload components
│   │   ├── ui/                 # Reusable UI components
│   │   └── providers/          # Context providers
│   └── lib/                    # Utility libraries
│       ├── hooks/              # React hooks
│       ├── server/              # Server-side utilities
│       ├── services/            # External service integrations
│       └── utils/               # Helper functions
└── package.json
```

## 🎯 Usage

### Getting Started

1. **Sign Up / Login**
   - Navigate to `/signup` to create an account
   - Or use `/login` if you already have an account

2. **Create a Store**
   - Go to the **Upload** page
   - Click "New Store" to create a document store
   - Give it a descriptive name

3. **Upload Documents**
   - Select a store from the sidebar
   - Drag and drop files or click to browse
   - Wait for documents to process (status will update automatically)

4. **Query Your Documents**
   - Go to the **Chat** page
   - Select one or more stores to search
   - Ask questions about your documents
   - View citations and source documents

5. **Manage Settings**
   - Visit the **Settings** page
   - Update your display name
   - Customize theme preferences
   - View account information

## 🔌 API Endpoints

### Stores
- `GET /api/stores` - List all stores for the authenticated user
- `POST /api/stores` - Create a new store
- `DELETE /api/stores?name=<storeName>` - Delete a store

### Documents
- `GET /api/stores/[storeId]/documents` - List documents in a store
- `DELETE /api/stores/[storeId]/documents?name=<docName>` - Delete a document

### Upload
- `POST /api/upload` - Upload documents to a store

### Chat
- `POST /api/chat` - Send a chat message and get RAG response
- `GET /api/chat/history` - Get chat history
- `DELETE /api/chat/history` - Clear chat history

### User
- `PATCH /api/user/profile` - Update user profile (display name)

## 🗄️ Database Schema

The application uses the following main models:

- **User**: User accounts and authentication
- **Store**: Document stores (collections)
- **Document**: Uploaded documents with status tracking
- **ChatSession**: Chat conversation sessions
- **ChatMessage**: Individual messages in conversations

See `prisma/schema.prisma` for the complete schema definition.

## 🧪 Development

### Available Scripts

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run linter
pnpm lint

# Generate Prisma Client
pnpm db:generate

# Run database migrations
pnpm db:migrate
```

### Code Style

The project uses:
- **ESLint** for code linting
- **TypeScript** for type safety
- **Prettier** (if configured) for code formatting

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub/GitLab
2. Import the project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Other Platforms

The application can be deployed to any platform that supports Next.js:
- **Netlify**
- **Railway**
- **AWS Amplify**
- **Self-hosted** with Node.js

Make sure to:
- Set all required environment variables
- Run database migrations before deployment
- Configure Supabase CORS settings if needed

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is private and proprietary.

## 🆘 Support

For issues, questions, or contributions, please open an issue on the repository.

## 🙏 Acknowledgments

- **Google Gemini** for the File Search API
- **Supabase** for authentication and database hosting
- **Next.js** team for the amazing framework
- **Vercel** for deployment platform

---

Built with ❤️ using Next.js and TypeScript

