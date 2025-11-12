# Changelog

## [Unreleased] - Notion OAuth Integration & Performance Improvements (Latest)

### Changed
- **Notion OAuth Integration** - Switched from manual API key entry to public OAuth integration:
  - Users now click "Connect with Notion" and authorize through Notion's OAuth flow
  - No more manual API key copying/pasting required
  - OAuth credentials stored in Firebase Functions config
  - Access tokens automatically stored in Firestore after authorization
- **Notion API Query Updates** - Updated to use "data sources" approach:
  - Improved database search performance using newer Notion API methods
  - Added query limits and better error handling to prevent freezing
  - Added logging to help debug query completion issues
  - Fixed infinite loop issues in database queries
- **OAuth Callback Handler** - New page at `/auth/notion/callback`:
  - Handles OAuth redirect from Notion
  - Exchanges authorization code for access token via Cloud Function
  - Automatically redirects back to Settings with success message

### Added
- **NotionCallback Component** - New page component (`src/pages/NotionCallback.tsx`) for OAuth callback handling
- **notionExchangeOAuthToken Cloud Function** - New Firebase Function to exchange OAuth code for access token
- **OAuth Configuration** - Stored Notion OAuth credentials (client ID, secret, redirect URI) in functions code

### Fixed
- **Freezing Issue** - Fixed app freezing when querying Notion data:
  - Added query limits (max 1000 pages) to prevent infinite loops
  - Improved error handling in database queries
  - Added database info validation before querying
  - Better logging to track query progress

### Technical Details
- Notion OAuth Client ID: `29cd872b-594c-80ad-ae12-0037a2146fac`
- Redirect URIs configured for production and development
- Access tokens stored as `notionApiKey` in Firestore for compatibility
- OAuth flow: User → Notion Authorization → Callback → Token Exchange → Settings

## [Unreleased] - Responsive Design & Embed Improvements

### Changed
- **Responsive Design** - Fully responsive across mobile, tablet, and desktop:
  - Homepage: Wider containers (1400px max-width), better breakpoints for mobile/tablet/desktop
  - Feed page: Responsive grid layouts for entries (1 col mobile, 2 col tablet, multi-col desktop)
  - Pricing page: Responsive plan cards (1 col mobile/tablet, 2 col desktop)
  - Mobile-first approach with proper breakpoints (< 640px, 640-1024px, > 1024px)
- **Homepage Chart Embed** - Renders chart directly (like charts.winy.ai) instead of iframe:
  - Uses ResponsiveContainer with direct LineChart rendering
  - Better performance and user experience
  - Maintains sample data visualization

### Technical Details
- Updated container max-widths from 1200px to 1400px for wider layouts
- Added responsive padding adjustments for mobile/tablet/desktop breakpoints
- Chart now renders directly using Recharts components (removed iframe approach)
- Improved grid layouts for entries, features, and pricing cards across screen sizes

## [Unreleased] - Homepage & Sign In Modal
### Added
- **Pricing Page** - New page at `/pricing` (`src/pages/Pricing.tsx`, `src/pages/Pricing.css`)
  - Free (Starter Taste) plan with limits
  - Pro plan with unlimited features
  - Linked from homepage header


### Added
- **Homepage Component** - New landing page (`src/pages/Home.tsx`) similar to charts.winy.ai but food-themed
  - Hero section with food.winy.ai branding and call-to-action
  - Features section highlighting nutrition tracking capabilities
  - Interactive chart examples showcasing daily macros, protein goals, and calorie limits
  - "How It Works" section explaining the food tracking workflow
  - Footer with Winy AI branding
- **Sign In Modal Component** - Reusable authentication modal (`src/components/SignInModal.tsx`)
  - Extracted login functionality from Login.tsx for use in homepage
  - Supports email/password and Google authentication
  - Modal overlay with close functionality
- **Homepage Styles** - Custom CSS styling (`src/pages/Home.css`) matching charts.winy.ai aesthetic
  - Responsive design for mobile/tablet/desktop
  - Food-themed color scheme maintaining black/white base
  - Chart examples with sample data visualization

### Changed
- **Routing Updates** - Updated `src/App.tsx` routing:
  - Root route `/` now shows Home component for unauthenticated users
  - Login page moved to `/login` route
  - Authenticated users continue to redirect to `/feed` as before

### Technical Details
- Homepage uses existing React Router for navigation
- SignInModal integrates with existing `useAuth` hook
- Sample macro data used for homepage chart examples
- Maintains existing CSS patterns (no Tailwind dependency)
- Homepage accessible to unauthenticated users, shows sign-in modal when needed

## [Unreleased] - Dashboard Embed System (Oct 29, 2024)

### Added
- **Dashboard Settings UI** - New "Dashboard Settings" section in Settings page with "Edit Dashboard" button
- **Chart Visibility Toggles** - Toggle on/off for each chart: Main Line Chart, Protein Goal, Calorie Limit, Protein Streak, Calorie Streak
- **Calorie Limit Tracking** - New calorie limit progress bar and streak counter (parallel to protein goal)
- **Embed URLs** - Generate secure public embed URLs for each chart to share in Notion or other platforms
- **5 Embed Pages** - Public embed pages for each chart type optimized for iframe embedding:
  - `/embed/main-chart/:token` - Daily macros line chart
  - `/embed/protein-goal/:token` - Protein goal progress bar
  - `/embed/calorie-limit/:token` - Calorie limit progress bar
  - `/embed/protein-streak/:token` - Protein goal streak counter
  - `/embed/calorie-streak/:token` - Calorie limit streak counter
- **Token System** - Secure 32-char alphanumeric tokens for each embed URL with Cloud Function validation
- **Auto-refresh Embeds** - Embed pages auto-refresh data from Notion every 5 minutes
- **Copy-to-Clipboard** - One-click copy buttons for embed URLs in Dashboard Settings

### Changed
- **Firebase Cache Headers** - Updated `firebase.json` to prevent aggressive caching of `index.html` (set to `no-cache, no-store, must-revalidate`)
- **Dashboard Component** - Now respects visibility settings from UserSettings and conditionally renders charts
- **UserSettings Type** - Extended with `calorieLimit`, `dashboardVisibility`, and `embedTokens` fields

### Technical Details
- Created `DashboardSettings.tsx` component with toggle UI and embed URL management
- Created `embed/` directory with `EmbedLayout.tsx` and 5 embed page components
- Added `embed.ts` service for token validation and Notion data fetching
- Added `embedTokens.ts` utility for token generation and URL parsing
- Added `validateEmbedToken` Cloud Function for secure token-to-userId lookup
- Added `calculateCalorieStreak()` utility function to mirror protein streak for calories
- Dashboard widgets for calorie limit show "remaining" or "over limit" status
- Embed pages fetch data directly from Notion (source of truth) via token validation

## [Unreleased] - True Notion-First Architecture

### Fixed
- **Notion as Source of Truth** - When Notion is connected, the app now ONLY shows entries from Notion. Legacy Firestore entries that don't exist in Notion are hidden.
- **Removed Firestore fallback** - When Notion is configured, the app no longer falls back to showing Firestore entries if Notion query fails or returns empty. Notion is the single source of truth.

### Changed
- **Feed loading behavior** - If Notion is connected, only entries from Notion database are displayed, even if that means showing an empty state
- **Error handling** - If Notion query fails, shows error message instead of silently falling back to Firestore entries
- **Notion query** - Filters out archived pages from Notion query results

### Technical Details
- `loadData()` and `loadEntries()` in Feed.tsx now set `entries` to empty array if Notion fails (instead of Firestore fallback)
- Notion query Cloud Function filters out archived pages
- Firestore is still used as a cache, but entries displayed come from Notion

## [Unreleased] - EntryCard Redesign & Notion-First Deletion

### Added
- **Expandable EntryCard** - Entry cards now show macros (calories, protein, carbs, fat) below the title by default. Clicking the card expands to show AI summary and other fields.
- **Notion-first deletion** - When Notion is configured, entries are deleted from Notion first (archived), then removed from Firestore cache. Includes `notionDeletePage` Cloud Function.
- **EntryCard expand/collapse button** - Visual indicator (▼/▲) for expandable entries

### Changed
- **EntryCard display** - Macros are now prominently displayed below the title instead of AI summary. AI summary moved to expanded section.
- **EntryCard interaction** - Entire card is clickable to expand/collapse (only when expandable content exists). Footer actions (delete, expand button) stop event propagation to prevent accidental expands.
- **Entry deletion flow** - Deletes from Notion first when `notionPageId` exists, then deletes from Firestore cache

### Technical Details
- EntryCard uses `useState` for expand/collapse state
- Macros extracted from `fieldValues` (calories, protein, carbs, fat) displayed compactly
- Expand animation with CSS keyframes
- Notion deletion uses PATCH to archive pages (Notion doesn't support hard delete)

## [Unreleased] - Documentation & Dashboard Feature

### Added
- **Notion Integration Guide** (`NOTION_INTEGRATION_GUIDE.md`) - Comprehensive documentation covering:
  - Onboarding flow and page selector implementation
  - Database connection and entry sync process
  - Firebase Cloud Functions architecture
  - Common issues and debugging checklist
  - Code examples and best practices
- **Macro filter toggles** on dashboard chart - Users can show/hide Calories, Protein, Carbs, and Fat lines
- **Notion-first architecture** - When Notion is configured, entries are created in Notion first (source of truth), then cached in Firestore for performance

### Changed
- **Entry creation flow** - When Notion is connected, entries are created in Notion first, then cached in Firestore. If Notion creation fails, entry is not saved (Notion is source of truth)
- **Dashboard chart** - Added checkbox filters above chart to toggle which macro lines are visible

### Dashboard Feature

### Added
- **Mobile-optimized Dashboard component** with analytics charts and goal tracking
- **Multi-line chart** showing daily macro trends (calories, protein, carbs, fat) over the last 7 days
- **Goal progress bar** displaying current day's progress toward protein goal (or custom goal field)
- **Streak counter** showing consecutive days goal was reached
- **Dashboard data utilities** (`src/utils/dashboardData.ts`) for aggregating entries, calculating streaks, and extracting macros
- **Extended UserSettings type** with `proteinGoal` and `goalField` fields for goal tracking
- **Installed recharts library** for charting visualizations

### Changes
- **Updated Feed page** to display Dashboard above entries list
- **Moved "New Entry" button** below Dashboard component for better mobile UX
- **Feed page now loads** schema and user settings alongside entries for dashboard data

### Technical Details
- Dashboard aggregates entries by date, summing macros per day
- Handles missing values gracefully (treats as 0)
- Supports multiple schema types (macro-tracking, keto-tracking, simple-logging)
- Responsive design with mobile-first approach
- Charts use recharts library with ResponsiveContainer for mobile optimization
- Charts only display dates with actual entry data (no empty dates shown)
- Dashboard automatically refreshes when new entries are added

## [Unreleased] - 2024-12-19

### Cleanup
- Removed duplicate `src/` directory at project root
- Deleted debug files: `debug-modern-firebase.js`, `debug-production.js`, `debug-user-settings.js`
- Removed test files: `quick-test.js`, `test-config.js`, `test-macro-extraction.js`, `test-notion-data.js`, `test-notion-integration.mjs`
- Deleted Playwright test runners: `playwright-test-runner.js`, `run-playwright-test.js`
- Removed migration script: `migrate-schemas.js`
- Cleaned up root-level test file: `test-notion-integration.mjs`

### Added
- Created `.env.example` file with all required environment variables
- Added comprehensive `.gitignore` file for Node.js/React/Firebase projects
- Created `CHANGELOG.md` for tracking project changes

### Project Structure
- Organized project files within `food-winy-ai/` directory
- Maintained clean separation between source code and documentation
- Preserved all essential project files and documentation

### Next Steps
- Initialize git repository ✅
- Push to GitHub ✅
- Test application functionality ✅
- Set up environment variables for development

### GitHub Repository
- Successfully created and pushed to: https://github.com/snb55/food-winy-ai
- Removed sensitive API tokens from git history
- Repository is now public and ready for development

## [Latest] - 2024-12-19

### Simplified Input Form
- **Removed "Name" field** from all schema templates (now AI-extracted only)
- **Added "Description" field** as the main text input for users
- **Updated form logic** to use description field instead of name field
- **Users now only see**: Description (text) + Photo (image) inputs
- **AI will automatically extract**: name, macros, calories, and other data from description
- **Form is now much simpler** and more intuitive

### Cleanup
- Removed test files containing API tokens
- Cleaned git history to remove all sensitive data
- Application builds successfully with simplified form structure

### Schema Migration for Existing Users
- **Added automatic schema migration** for existing users
- **Created schemaMigration.ts service** to update existing schemas
- **Modified AddEntryModal** to automatically migrate schemas on load
- **Existing users will now see simplified form** (Description + Photo only)
- **Name field is hidden** and AI-extracted from description
- **Meal Type field is also AI-extracted**
- **Migration is automatic and seamless** for all users

### Typography Update
- **Replaced Inter font with Apple system fonts**
- **Updated font-family** to: `-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Helvetica, Arial, sans-serif`
- **Applied across all CSS files** for consistent Apple-native look
- **Maintains excellent readability** and typography
- **Font now has native Apple look and feel**

### File Cleanup
- **Removed duplicate `src/` directory** at project root
- **Removed duplicate `favicon.png`** at project root  
- **Consolidated documentation files** by removing redundant ones:
  - Removed: `CLAUDE.md`, `DEPLOYMENT_GUIDE.md`, `IMPLEMENTATION_SUMMARY.md`
  - Removed: `NEXT_FEATURES.md`, `NEXT_STEPS.md`, `PROJECT_SUMMARY.md`
- **Kept essential documentation**: `README.md`, `CHANGELOG.md`, `DEPLOYMENT.md`, `QUICKSTART.md`
- **Project structure is now clean and organized**
