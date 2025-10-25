# Next Features

## Planned Enhancements for food.winy.ai

---

## 1. Individual Macro Properties in Notion Database

**Status:** 📋 Planned

**Description:**
Currently, all nutritional information is stored in a single "Summary" text field. This feature will add separate database properties for each macronutrient, enabling better filtering, sorting, and data analysis in Notion.

**Implementation:**
- Add individual properties to Notion database:
  - `Protein` (Number) - grams
  - `Carbs` (Number) - grams
  - `Fat` (Number) - grams
  - `Calories` (Number) - kcal
- Parse AI summary to extract macro values
- Update `notionSyncEntry` Cloud Function to populate individual fields
- Update `createFoodLogDatabase` to include these properties in schema

**Benefits:**
- Filter entries by macro ranges (e.g., "Show all high-protein meals")
- Sort by specific nutrients
- Create formulas and rollups in Notion (daily/weekly totals)
- Build charts and visualizations in Notion
- Better data analysis and tracking

**Technical Details:**
```javascript
// Notion database schema update
properties: {
  Name: { title: {} },
  Date: { date: {} },
  Protein: { number: { format: "number" } },
  Carbs: { number: { format: "number" } },
  Fat: { number: { format: "number" } },
  Calories: { number: { format: "number" } },
  Summary: { rich_text: {} },
  Photo: { url: {} }
}
```

---

## 2. Dashboard on App

**Status:** 📋 Planned

**Description:**
Create an analytics dashboard within the food.winy.ai app to visualize nutrition data, track progress, and view trends over time.

**Features:**
- **Daily Summary:**
  - Today's total macros (Protein/Carbs/Fat/Calories)
  - Meal count
  - Progress bars for daily goals

- **Weekly/Monthly Views:**
  - Macro trends over time
  - Line charts showing protein/carbs/fat intake
  - Calorie tracking graph
  - Comparison to previous weeks

- **Insights:**
  - Highest protein days
  - Most frequent foods
  - Average daily macros
  - Meal type distribution (breakfast/lunch/dinner/snacks)

- **Goal Setting:**
  - Set daily macro targets
  - Track progress against goals
  - Streak tracking

**UI Components:**
- `/dashboard` route in the app
- Charts using Chart.js or Recharts
- Date range selector
- Export data to CSV

**Technical Stack:**
- React components
- Firebase Firestore queries for aggregation
- Chart visualization library
- Responsive design for mobile

---

## 3. Embeddable Notion Dashboard

**Status:** 📋 Planned

**Description:**
Create a shareable, embeddable dashboard that can be viewed directly in Notion pages, providing a seamless experience for users who want to see their food analytics without leaving Notion.

**Implementation Options:**

### Option A: Notion Embed Block
- Create a public dashboard page on food.winy.ai
- User-specific secure URL: `food.winy.ai/dashboard/embed?token=USER_TOKEN`
- Embed in Notion using `/embed` command
- Real-time data sync from Firebase

### Option B: Notion API Dashboard Page
- Create a dedicated Notion page with database views
- Use Notion API to build custom views:
  - Gallery view for recent meals
  - Table view with macro totals
  - Board view by meal type
  - Timeline view for weekly tracking

### Option C: Notion Database Charts (Recommended)
- Leverage Notion's native database features:
  - Create linked database views
  - Use Notion formulas for calculations
  - Build database charts for visualization
  - Set up filters and sorts

**Features:**
- Daily/Weekly/Monthly macro summaries
- Visual charts and graphs
- Recent entries preview
- Quick stats (total entries, avg calories, etc.)
- Responsive iframe design
- Secure, authenticated access

**Technical Details:**
```javascript
// Generate secure embed URL
/api/dashboard/embed
- Authenticate user via token
- Return HTML page with charts
- Real-time data updates via Firebase
- Responsive CSS for Notion embed width
```

**Notion Integration:**
1. User copies embed URL from Settings
2. Paste in Notion: `/embed [URL]`
3. Dashboard appears in Notion page
4. Auto-refreshes with new data

---

## Priority Order

1. **Macro Properties** (Highest Impact) - Enables all other features
2. **App Dashboard** (User Retention) - Core value proposition
3. **Notion Embed** (Nice to Have) - Enhanced integration

---

## Technical Requirements

### Database Migration for Feature 1
- Update Firestore schema to store parsed macros
- Backfill existing entries with macro extraction
- Update Cloud Functions
- Update Notion database template

### New Routes for Feature 2
- `/dashboard` - Main analytics page
- Analytics service for data aggregation
- Chart components library

### New Endpoint for Feature 3
- `/dashboard/embed` - Embeddable dashboard
- Token-based authentication
- Lightweight HTML/CSS for iframe
- CORS configuration for Notion

---

## Estimated Timeline

- **Feature 1 (Macro Properties):** 2-3 days
  - Day 1: Update database schemas
  - Day 2: Implement macro parsing
  - Day 3: Test and deploy

- **Feature 2 (App Dashboard):** 5-7 days
  - Days 1-2: Design UI/UX
  - Days 3-4: Implement components
  - Days 5-6: Add charts and analytics
  - Day 7: Testing and refinement

- **Feature 3 (Notion Embed):** 3-4 days
  - Day 1: Create embed endpoint
  - Day 2: Build lightweight dashboard
  - Day 3: Add authentication and security
  - Day 4: Testing and optimization

**Total:** ~2-3 weeks for all features

---

## Success Metrics

- **Feature 1:** 
  - All entries have populated macro fields
  - Users create filtered views in Notion
  - Database query performance maintained

- **Feature 2:**
  - Dashboard load time < 2 seconds
  - 70%+ of active users view dashboard weekly
  - Positive user feedback on insights

- **Feature 3:**
  - Embed loads in < 1 second
  - 50%+ of Notion users use embed feature
  - No security incidents

---

## Notes

- All features should maintain the minimal, clean design philosophy
- Mobile-first approach for dashboard
- Consider adding AI insights (e.g., "You eat more protein on weekdays")
- Privacy: All data remains user-owned and secure
- Performance: Optimize queries for fast load times

---

**Last Updated:** January 20, 2025
**Version:** 1.0



