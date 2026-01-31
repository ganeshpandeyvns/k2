# K2 UX/UI System Specification

## 1. Design Philosophy

### Core Principles

1. **Speed First** - Every interaction optimized for minimum taps/clicks
2. **Trust Through Transparency** - Always show where money lives and flows
3. **Progressive Disclosure** - Simple by default, powerful when needed
4. **Platform Native** - Respect iOS/Android patterns while maintaining brand
5. **Accessibility** - WCAG 2.1 AA compliance minimum

### Design Language: "Confident Minimal"

- Clean, high-contrast interfaces
- Bold typography for key numbers
- Subtle animations that convey state, never distract
- Green/red for gains/losses (with secondary indicators for colorblind users)

---

## 2. Information Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        K2 APP                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    TAB BAR (Bottom)                      │   │
│  │  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐          │   │
│  │  │Home │  │Trade│  │Events│ │Watch│  │More │          │   │
│  │  └─────┘  └─────┘  └─────┘  └─────┘  └─────┘          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  HOME (Dashboard)                                               │
│  ├── Portfolio Summary Card                                     │
│  ├── Quick Actions (Buy/Sell/Deposit)                          │
│  ├── Positions List (Crypto + Events)                          │
│  ├── Watchlist Preview                                         │
│  └── Recent Activity                                           │
│                                                                 │
│  TRADE (Crypto Markets)                                         │
│  ├── Market List (sortable, searchable)                        │
│  ├── Asset Detail                                              │
│  │   ├── Price Chart                                           │
│  │   ├── Order Book (collapsed by default)                     │
│  │   ├── Trade Ticket (bottom sheet)                           │
│  │   └── Trade History                                         │
│  └── Open Orders                                               │
│                                                                 │
│  EVENTS (Prediction Markets)                                    │
│  ├── Category Browser                                          │
│  ├── Featured/Trending Events                                  │
│  ├── Event Detail                                              │
│  │   ├── Market Info & Rules                                   │
│  │   ├── Yes/No Prices                                         │
│  │   ├── Trade Ticket                                          │
│  │   └── Position (if held)                                    │
│  └── My Event Positions                                        │
│                                                                 │
│  WATCHLIST                                                      │
│  ├── Custom Lists                                              │
│  ├── Quick Add                                                 │
│  └── Price Alerts                                              │
│                                                                 │
│  MORE (Settings & Account)                                      │
│  ├── Account Settings                                          │
│  ├── Linked Exchanges                                          │
│  ├── Security (2FA, Sessions)                                  │
│  ├── Notifications                                             │
│  ├── Trade History Export                                      │
│  ├── Help & Support                                            │
│  └── Legal/Disclosures                                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Key Screens

### 3.1 Dashboard (Home Tab)

```
┌─────────────────────────────────────────┐
│ K2                              ⚙️  🔔  │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐   │
│  │     TOTAL PORTFOLIO VALUE       │   │
│  │                                 │   │
│  │        $47,832.50              │   │
│  │        ▲ $1,247.30 (2.68%)     │   │
│  │                                 │   │
│  │  Crypto: $35,420    Events: $12,412│
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │  Buy    │ │  Sell   │ │ Deposit │   │
│  │  ●      │ │  ●      │ │  ●      │   │
│  └─────────┘ └─────────┘ └─────────┘   │
│                                         │
│  POSITIONS                    See All > │
│  ┌─────────────────────────────────┐   │
│  │ ₿ BTC        0.5213    $33,847  │   │
│  │              ▲ 3.2%             │   │
│  ├─────────────────────────────────┤   │
│  │ ◎ ETH        2.100     $4,725   │   │
│  │              ▼ 0.8%             │   │
│  ├─────────────────────────────────┤   │
│  │ 📊 BTC>100K  10 YES    $620     │   │
│  │    Dec 31    @ 62¢              │   │
│  └─────────────────────────────────┘   │
│                                         │
│  WATCHLIST                    See All > │
│  ┌─────────────────────────────────┐   │
│  │ SOL $142.30 ▲2.1%  |  DOGE ... │   │
│  └─────────────────────────────────┘   │
│                                         │
├─────────────────────────────────────────┤
│  🏠    📈    📊    ⭐    ≡           │
│  Home  Trade Events Watch More          │
└─────────────────────────────────────────┘
```

### 3.2 Trading Ticket (Crypto)

The trading ticket appears as a bottom sheet, optimized for one-handed use.

```
┌─────────────────────────────────────────┐
│         ░░░░░░░░░░░░░░░░               │ <- Drag handle
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────┐  ┌─────────────┐      │
│  │    BUY      │  │    SELL     │      │
│  │   ██████    │  │             │      │
│  └─────────────┘  └─────────────┘      │
│                                         │
│  BTC/USD                    $64,950.00  │
│                                         │
│  ┌─────────────┐  ┌─────────────┐      │
│  │   MARKET    │  │   LIMIT     │      │
│  │   ██████    │  │             │      │
│  └─────────────┘  └─────────────┘      │
│                                         │
│  Amount (BTC)                           │
│  ┌─────────────────────────────────┐   │
│  │                           0.1   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐      │
│  │ 25% │ │ 50% │ │ 75% │ │ MAX │      │
│  └─────┘ └─────┘ └─────┘ └─────┘      │
│                                         │
│  ─────────────────────────────────      │
│  Available:           $12,340.00 USD    │
│  Estimated Total:      $6,495.00        │
│  Fee:                     ~$6.50        │
│  ─────────────────────────────────      │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │         REVIEW ORDER            │   │
│  │            ███████              │   │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

### 3.3 Event Contract Trading

```
┌─────────────────────────────────────────┐
│ ←  Event Details                        │
├─────────────────────────────────────────┤
│                                         │
│  📊 ECONOMICS                           │
│                                         │
│  Will the Fed cut rates by              │
│  at least 25bps in March 2024?          │
│                                         │
│  Expires: Mar 20, 2024                  │
│  Settlement: Based on FOMC statement    │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │                                 │   │
│  │    YES 73¢         NO 27¢      │   │
│  │    ▲ 5¢ today      ▼ 5¢ today  │   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  YOUR POSITION                          │
│  ┌─────────────────────────────────┐   │
│  │  25 YES contracts @ 68¢ avg    │   │
│  │  Cost: $17.00   Value: $18.25  │   │
│  │  P&L: +$1.25 (+7.4%)           │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌──────────────┐  ┌──────────────┐    │
│  │   BUY YES    │  │   BUY NO     │    │
│  │    █████     │  │              │    │
│  └──────────────┘  └──────────────┘    │
│                                         │
│  📋 Market Rules                    ▼   │
│                                         │
│  ⚠️ Event contracts involve risk.       │
│  You could lose your entire investment. │
│                                         │
└─────────────────────────────────────────┘
```

### 3.4 Order Confirmation Flow

```
STATE 1: Review                STATE 2: Submitting
┌─────────────────────┐       ┌─────────────────────┐
│                     │       │                     │
│   REVIEW ORDER      │       │                     │
│   ────────────      │       │    ◠ ◡ ◠           │
│                     │       │   Submitting...     │
│   Buy 0.1 BTC       │       │                     │
│   @ Market          │       │                     │
│   ≈ $6,495.00       │       │                     │
│                     │  ──▶  │                     │
│   Fee: ~$6.50       │       │                     │
│                     │       │                     │
│ ┌─────────────────┐ │       │                     │
│ │  CONFIRM ORDER  │ │       │                     │
│ └─────────────────┘ │       │                     │
│                     │       │                     │
└─────────────────────┘       └─────────────────────┘

STATE 3: Success               STATE 4: Error
┌─────────────────────┐       ┌─────────────────────┐
│                     │       │                     │
│        ✓            │       │        ✗            │
│                     │       │                     │
│   Order Filled!     │       │   Order Failed      │
│                     │       │                     │
│   Bought 0.1 BTC    │       │   Insufficient      │
│   @ $64,950.00      │       │   balance at        │
│   Total: $6,495.00  │       │   Crypto.com        │
│                     │       │                     │
│   Confirmation sent │       │ ┌─────────────────┐ │
│   to your email     │       │ │  Add Funds ↗    │ │
│                     │       │ └─────────────────┘ │
│ ┌─────────────────┐ │       │                     │
│ │      DONE       │ │       │ ┌─────────────────┐ │
│ └─────────────────┘ │       │ │    TRY AGAIN    │ │
│                     │       │ └─────────────────┘ │
└─────────────────────┘       └─────────────────────┘
```

---

## 4. Microinteractions & Delight

### 4.1 Loading States

**Skeleton Loaders** - Used for all data-dependent content:

```
Loading Portfolio:            Loading Price:
┌─────────────────────┐      ┌─────────────────────┐
│ ░░░░░░░░░░░░░░░░░░ │      │  BTC    ░░░░░░░░░░ │
│ ░░░░░░░░░░         │      │         ░░░░░      │
│                     │      └─────────────────────┘
│ ░░░░  ░░░░  ░░░░   │
└─────────────────────┘
```

**Pull-to-Refresh** - Haptic feedback on threshold, bounce animation

**Optimistic Updates** - Show pending state immediately, reconcile on server response

### 4.2 Haptic Feedback (iOS/Android)

| Action | Haptic Type |
|--------|-------------|
| Order Submitted | Medium Impact |
| Order Filled | Success (notch) |
| Order Failed | Error (triple tap) |
| Pull-to-Refresh Threshold | Light Impact |
| Tab Switch | Selection |
| Slider Snap (25%, 50%, etc.) | Light Impact |

### 4.3 Animations

| Element | Animation | Duration |
|---------|-----------|----------|
| Price Updates | Fade + slight pulse | 200ms |
| Positive Change | Flash green, fade | 300ms |
| Negative Change | Flash red, fade | 300ms |
| Sheet Appear | Spring from bottom | 350ms |
| Success Checkmark | Draw + scale | 400ms |
| Tab Switch | Cross-fade | 150ms |
| List Item Load | Stagger fade-in | 50ms each |

### 4.4 Empty States

```
No Positions Yet:              No Watchlist Items:
┌─────────────────────┐       ┌─────────────────────┐
│                     │       │                     │
│      📈            │       │      ⭐             │
│                     │       │                     │
│  No positions yet   │       │  Your watchlist     │
│                     │       │  is empty           │
│  Start trading to   │       │                     │
│  see your portfolio │       │  Add crypto or      │
│  here               │       │  events to track    │
│                     │       │                     │
│ ┌─────────────────┐ │       │ ┌─────────────────┐ │
│ │  EXPLORE CRYPTO │ │       │ │   BROWSE MARKETS│ │
│ └─────────────────┘ │       │ └─────────────────┘ │
│                     │       │                     │
└─────────────────────┘       └─────────────────────┘
```

---

## 5. Design Tokens

### 5.1 Colors

```scss
// Brand
$primary:           #2563EB;  // Blue - primary actions
$primary-dark:      #1D4ED8;  // Blue - pressed state

// Semantic
$success:           #10B981;  // Green - gains, success
$danger:            #EF4444;  // Red - losses, errors
$warning:           #F59E0B;  // Amber - cautions

// Neutral
$background:        #FFFFFF;  // Light mode
$background-dark:   #0F172A;  // Dark mode
$surface:           #F8FAFC;  // Cards, sheets
$surface-dark:      #1E293B;  // Dark mode surface
$text-primary:      #0F172A;  // Headings
$text-secondary:    #64748B;  // Body text
$border:            #E2E8F0;  // Dividers

// Accessibility alternatives (for colorblind users)
$success-alt:       #10B981 + ▲ icon
$danger-alt:        #EF4444 + ▼ icon
```

### 5.2 Typography

```scss
// Font Family
$font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
$font-mono: 'SF Mono', 'Roboto Mono', monospace;  // For prices/numbers

// Scale
$text-xs:    12px / 1.4;
$text-sm:    14px / 1.5;
$text-base:  16px / 1.5;
$text-lg:    18px / 1.4;
$text-xl:    20px / 1.3;
$text-2xl:   24px / 1.2;
$text-3xl:   30px / 1.2;
$text-4xl:   36px / 1.1;  // Portfolio value

// Weights
$font-regular:  400;
$font-medium:   500;
$font-semibold: 600;
$font-bold:     700;
```

### 5.3 Spacing

```scss
$space-1:  4px;
$space-2:  8px;
$space-3:  12px;
$space-4:  16px;
$space-5:  20px;
$space-6:  24px;
$space-8:  32px;
$space-10: 40px;
$space-12: 48px;
$space-16: 64px;
```

### 5.4 Shadows

```scss
$shadow-sm:  0 1px 2px rgba(0,0,0,0.05);
$shadow-md:  0 4px 6px rgba(0,0,0,0.07);
$shadow-lg:  0 10px 15px rgba(0,0,0,0.1);
$shadow-xl:  0 20px 25px rgba(0,0,0,0.15);
```

---

## 6. Component Library

### 6.1 Core Components

| Component | Variants | Notes |
|-----------|----------|-------|
| Button | Primary, Secondary, Ghost, Danger | All sizes: sm, md, lg |
| Input | Text, Number, Currency | With label, error state |
| Card | Flat, Elevated, Interactive | Pressable variant for lists |
| Sheet | Bottom sheet | Drag-to-dismiss |
| Modal | Centered | For confirmations |
| Toast | Success, Error, Info | Auto-dismiss 3s |
| Tabs | Underline, Pill | For segmented content |
| List | Simple, Complex | With swipe actions |
| Chart | Line, Candlestick | Lightweight library |
| Badge | Status, Count | For notifications |
| Avatar | Image, Initials, Icon | For assets |
| Skeleton | Line, Circle, Card | Loading states |

### 6.2 Trading-Specific Components

| Component | Description |
|-----------|-------------|
| PriceDisplay | Formatted price with change indicator |
| OrderBookRow | Bid/ask with depth visualization |
| PositionCard | Asset, quantity, value, P&L |
| TradeTicket | Bottom sheet order entry |
| EventCard | Event title, Yes/No prices, expiry |
| AssetRow | Icon, symbol, price, change |
| PercentageBar | Visual for % allocation |
| SparkLine | Tiny inline price chart |

---

## 7. Accessibility

### 7.1 Requirements (WCAG 2.1 AA)

| Requirement | Implementation |
|-------------|----------------|
| Color Contrast | 4.5:1 minimum for text |
| Touch Targets | 44x44px minimum |
| Screen Reader | Full VoiceOver/TalkBack support |
| Reduced Motion | Respect system preference |
| Font Scaling | Support up to 200% |
| Focus States | Visible focus rings |

### 7.2 Trading-Specific Accessibility

- **Price changes**: Announce via screen reader, not just color
- **Order confirmations**: Full audio feedback
- **Error states**: Clear text descriptions, not just red
- **Charts**: Provide tabular data alternative

---

## 8. Localization (Future)

MVP is English-only. Prepare for:

| Language | Priority | Notes |
|----------|----------|-------|
| Spanish | P1 | Large US population |
| Chinese (Simplified) | P2 | Crypto-active demographic |
| Portuguese | P2 | Brazil market potential |

**Preparation:**
- All strings in localization files (not hardcoded)
- RTL-ready layouts
- Number/currency formatting via Intl API
- Date formatting respecting locale

---

## 9. Viral Loop (Ethical)

### 9.1 Referral Program

```
┌─────────────────────────────────────────┐
│         INVITE FRIENDS                  │
├─────────────────────────────────────────┤
│                                         │
│  Share K2 with friends and you both     │
│  benefit when they start trading.       │
│                                         │
│  YOUR REFERRAL LINK                     │
│  ┌─────────────────────────────────┐   │
│  │ k2.app/join/alex123        📋  │   │
│  └─────────────────────────────────┘   │
│                                         │
│  REWARDS                                │
│  • You get: $10 credit after friend's   │
│    first trade                          │
│  • Friend gets: $10 welcome bonus       │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │      SHARE VIA MESSAGE          │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │       SHARE VIA EMAIL           │   │
│  └─────────────────────────────────┘   │
│                                         │
│  YOUR REFERRALS                         │
│  ┌─────────────────────────────────┐   │
│  │ 3 signed up • 2 trading         │   │
│  │ $20 earned                       │   │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

### 9.2 Social Watchlist Sharing

Users can share their watchlists (NOT holdings or trades) with privacy controls:

```
SHARE WATCHLIST

☑️ Share list name ("Tech Crypto Picks")
☑️ Share assets in list
☐ Share my notes (private by default)
☐ Show this is my list (anonymous by default)

[Generate Share Link]
```

### 9.3 Achievement Badges (Non-Gambling)

Celebrate milestones without encouraging excessive trading:

- "First Trade" 🎯
- "Diversified" (3+ asset types)
- "Watchful" (set 5 price alerts)
- "Consistent" (logged in 7 days straight)

NOT included (problematic):
- Trading volume milestones
- Profit milestones
- "Winning streak" badges

---

## 10. Platform-Specific Notes

### 10.1 iOS

- Use SF Symbols for icons
- Respect Safe Area (notch, home indicator)
- Support Dynamic Type
- Use UIKit haptics
- Follow Human Interface Guidelines

### 10.2 Android

- Material Design 3 influences
- Edge-to-edge design
- Support gesture navigation
- Follow Material motion patterns
- Test on various screen sizes

### 10.3 Web

- Responsive: 320px to 2560px
- Keyboard shortcuts for power users
- Progressive Web App (installable)
- No horizontal scroll
- Support mouse + touch

---

## 11. Prototype Specification

For AI agent implementation, create prototypes using:

**Framework**: React Native (mobile) + React (web)

**Component Library**: Build custom on top of:
- React Native: react-native-reanimated, react-native-gesture-handler
- Web: Radix UI primitives + Tailwind CSS

**Design Files**: Generate using:
- Figma (if human designer available)
- OR code-first with Storybook for component documentation

**Prototype Priorities**:
1. Onboarding flow (exchange linking)
2. Dashboard (portfolio view)
3. Trade ticket (crypto market order)
4. Event trading screen
5. Settings (linked accounts)

