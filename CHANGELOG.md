# Changelog

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
