# Edlide IDE Website

Official website for Edlide IDE - The specialized IDE for Open Source AI model development.

## 🚀 About Edlide

Edlide is a specialized Integrated Development Environment built exclusively for working with Open Source AI models. Unlike general-purpose IDEs, Edlide provides native support for open source model development, training, and deployment.

### Key Features
- **Open Source First**: Exclusive focus on open source AI models
- **Local Development**: Work with models locally without cloud dependencies
- **Developer-Centric**: Built by developers, for developers
- **Performance Optimized**: Intelligent resource management and GPU acceleration

## 🛠 Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom purple theme
- **UI Components**: shadcn/ui + Radix UI primitives
- **Deployment**: Ready for Vercel/Cloudflare Pages

## 🎨 Design System

The site features a dark, premium aesthetic with:
- **Background**: Deep dark (#0d0f14)
- **Primary Color**: Soft purple (#9b88c8) - calm, intelligent, futuristic
- **Button Design**: White backgrounds with soft purple accents
- **Typography**: Clean, technical with excellent readability

## 🚀 Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open http://localhost:3000 in your browser

## 📁 Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── docs/           # Documentation pages
│   ├── download/       # Download section
│   └── account/        # User account
├── components/         # React components
│   ├── ui/            # Base UI primitives
│   ├── sections/      # Page sections
│   ├── Navbar.tsx     # Site navigation
│   └── Footer.tsx     # Site footer
└── lib/               # Utility functions
```

## 🌐 Site Sections

- **Home**: Landing page with hero section and features
- **Docs**: Technical documentation and guides
- **Download**: Model distributions and downloads
- **Account**: User dashboard and settings

## 🎯 Navigation Structure

The navigation bar follows the specified layout:
- Left: Logo
- Center: Home | Docs | Download
- Right: Account (avatar)

## 🔧 Configuration

Key configuration files:
- `tailwind.config.js` - Design system and colors
- `tsconfig.json` - TypeScript configuration
- `next.config.js` - Next.js settings

## 📝 License

This project is open source and available under the MIT License.

---

**built with Edlide IDE**