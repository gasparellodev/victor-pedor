# Layout Components — SpeakChuk Video

## Proposito
Componentes de layout compartilhados: TopNavbar e Sidebar, seguindo o design system Stitch/Lumen Edit.

## Componentes

### `TopNavbar`
- Header sticky 64px com glass-blur background
- Logo "SpeakChuk Video" em Manrope bold
- Nav links: Projects, Assets (futuro)
- Botoes: notifications, help, Export, Upgrade (futuro)
- Responsivo: links hidden em mobile

### `Sidebar`
- Width 256px, sticky abaixo do navbar
- Workspace info (logo + nome + plan badge)
- Nav items com Material Symbols icons: Projects, Assets, Templates, Settings
- Active state: bg-blue-500/10, text-blue-300, border-left accent
- Botao "New Project" com brand-gradient
- Help Center link no footer
- Hidden em mobile (usa bottom navbar)

### `MobileBottomNav`
- Fixed bottom navbar para mobile (md:hidden)
- Icons: Projects, Assets, FAB central (+), Templates, Settings

## Design Tokens
- Fonts: Manrope (logo, headings), Inter (nav items, labels)
- Colors: Material Design 3 dark theme (surface, primary, outline-variant)
- Glass panel: rgba(50, 53, 60, 0.6) + backdrop-blur(12px)
- Brand gradient: linear-gradient(135deg, #adc6ff, #4d8eff)

## Dependencias
- Google Material Symbols (via CDN ou local)
- Next.js Link + usePathname para active state

## Testes
- Renderiza logo e nav links
- Active state correto baseado em pathname
- Sidebar hidden em mobile viewport
- Bottom nav visible em mobile viewport
