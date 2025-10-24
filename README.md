# cReate - AI-Driven R Data Visualization Assistant

![cReate Logo](https://via.placeholder.com/800x200/276DC3/FFFFFF?text=cReate)

Turn your research questions into R code and visuals instantly.

## 🌟 Features

- **AI-Powered Code Generation**: Ask questions in plain English and get R code suggestions
- **Interactive Code Editor**: Monaco editor with R syntax highlighting
- **Real-time Plot Generation**: See your visualizations instantly
- **CSV Upload Support**: Upload your datasets and start analyzing
- **Dark Mode**: Beautiful light and dark themes
- **Secure Authentication**: Powered by Supabase Auth

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/pnpm
- Supabase account (for authentication and database)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd cReate
```

2. Install dependencies:
```bash
npm install
# or
pnpm install
```

3. **Set up Supabase** (IMPORTANT):
   - Follow the complete setup guide in [SETUP.md](./SETUP.md)
   - Run the SQL schema in your Supabase project
   - Configure your `.env.local` file

### Running the Development Server

```bash
npm run dev
# or
pnpm dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

## 📁 Project Structure

```
cReate/
├── app/
│   ├── page.tsx              # Landing page
│   ├── login/page.tsx        # Login page
│   ├── signup/page.tsx       # Signup page
│   ├── workspace/page.tsx    # Main workspace
│   └── api/
│       ├── chat/route.ts     # AI chat endpoint
│       ├── execute/route.ts  # R code execution
│       └── upload/route.ts   # CSV upload handler
├── components/
│   ├── ui/                   # shadcn/ui components
│   ├── Header.tsx
│   ├── Layout.tsx
│   ├── LoginForm.tsx
│   ├── SignupForm.tsx
│   ├── ChatBox.tsx
│   ├── CodeEditor.tsx
│   ├── PlotViewer.tsx
│   ├── UploadPanel.tsx
│   └── ThemeToggle.tsx
├── lib/
│   ├── utils.ts
│   └── supabaseClient.ts
└── store/
    └── useSessionStore.ts    # Zustand state management
```

## 🎨 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Components**: shadcn/ui
- **Code Editor**: Monaco Editor
- **Authentication**: Supabase Auth
- **State Management**: Zustand

## 🔧 Configuration

### Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings > API
3. Copy your project URL and anon/public key
4. Add them to `.env.local`

### Backend Integration

The frontend is ready to integrate with your R execution backend. Update these API endpoints:

- `/api/chat/route.ts`: Connect to your AI service
- `/api/execute/route.ts`: Connect to your R execution service
- `/api/upload/route.ts`: Handle CSV storage

## 🎨 Customization

### Colors

The app uses the RStudio blue (#276DC3) for branding. Customize in `tailwind.config.ts`:

```typescript
colors: {
  rstudio: '#276DC3',
  background: '#F5F5F5',
  darktext: '#1E293B',
}
```

### Theme

Toggle between light and dark modes using the theme toggle in the header.

## 📝 TODO

- [ ] Integrate with AI backend for code generation
- [ ] Set up R execution environment
- [ ] Implement CSV parsing and data preview
- [ ] Add user dashboard for saved projects
- [ ] Export functionality for plots and code
- [ ] Advanced plot customization options

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- R Logo color from RStudio
- Icons from Lucide React
- UI components from shadcn/ui

---

Built with ❤️ for researchers

