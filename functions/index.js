/**
 * Firebase Cloud Functions for Winy AI Food
 *
 * These functions act as a proxy for the Notion API to bypass CORS restrictions
 */

const functions = require('firebase-functions'); // v1 API for other functions
const {onCall, HttpsError} = require('firebase-functions/v2/https'); // v2 API for notionSearchDatabases
const admin = require('firebase-admin');

admin.initializeApp();

// Notion OAuth Configuration
// These should be set in Firebase Functions config:
// firebase functions:config:set notion.client_id="YOUR_CLIENT_ID"
// firebase functions:config:set notion.client_secret="YOUR_CLIENT_SECRET"
// firebase functions:config:set notion.redirect_uri="https://food.winy.ai/auth/notion/callback"
const NOTION_CLIENT_ID = functions.config().notion?.client_id || process.env.NOTION_CLIENT_ID;
const NOTION_CLIENT_SECRET = functions.config().notion?.client_secret || process.env.NOTION_CLIENT_SECRET;
const NOTION_REDIRECT_URI = functions.config().notion?.redirect_uri || process.env.NOTION_REDIRECT_URI;

/**
 * Exchange OAuth authorization code for access token
 */
exports.notionExchangeOAuthToken = onCall(async (request) => {
  // Verify user is authenticated
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { code } = request.data;

  if (!code) {
    throw new HttpsError('invalid-argument', 'Authorization code is required');
  }

  try {
    // Exchange code for access token
    const response = await fetch('https://api.notion.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${NOTION_CLIENT_ID}:${NOTION_CLIENT_SECRET}`).toString('base64')}`,
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: NOTION_REDIRECT_URI,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OAuth token exchange error:', errorData);
      throw new HttpsError('internal', errorData.error_description || 'Failed to exchange OAuth token');
    }

    const tokenData = await response.json();

    // Store access token in Firestore user settings
    const db = admin.firestore();
    const userId = request.auth.uid;
    
    await db.collection('settings').doc(userId).set({
      userId: userId,
      notionApiKey: tokenData.access_token, // Store as notionApiKey for compatibility
      notionOAuth: true,
      notionWorkspace: tokenData.workspace_name || '',
      notionBotId: tokenData.bot_id || '',
      notionAccessTokenExpiry: tokenData.expires_in 
        ? Date.now() + (tokenData.expires_in * 1000) 
        : null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    return {
      accessToken: tokenData.access_token,
      workspace: tokenData.workspace_name || '',
      botId: tokenData.bot_id || '',
    };
  } catch (error) {
    console.error('Error exchanging OAuth token:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', error.message || 'Failed to exchange OAuth token');
  }
});

/**
 * Search for data sources (databases) accessible by the Notion integration
 * This function is used when users are connecting to a database during Notion setup.
 * Updated to use "data sources" API (newer Notion API approach)
 * According to: https://developers.notion.com/reference/post-search
 * 
 * Returns both:
 * - data_sources (databases) that users can connect to
 * - pages where users can create new databases
 */
exports.notionSearchDatabases = onCall(async (request) => {
  // Log auth context for debugging
  console.log('Auth context:', request.auth ? 'Present' : 'Missing');
  console.log('Auth UID:', request.auth?.uid);

  // Verify user is authenticated
  if (!request.auth) {
    console.error('No auth context found');
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { notionApiKey } = request.data;

  if (!notionApiKey) {
    throw new HttpsError('invalid-argument', 'Notion API key is required');
  }

  try {
    // Search for data sources (databases) that the user can connect to
    // According to Notion API docs: https://developers.notion.com/reference/post-search
    // The search endpoint searches for pages and data_sources (databases)
    // This is used during database connection setup
    const searchResponse = await fetch('https://api.notion.com/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionApiKey}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        // Filter to search for data sources (databases are now called data_sources in the API)
        // This returns all databases the user can connect to
        filter: {
          value: 'data_source',
          property: 'object',
        },
        sort: {
          direction: 'descending',
          timestamp: 'last_edited_time',
        },
        page_size: 100,
      }),
    });

    if (!searchResponse.ok) {
      const errorData = await searchResponse.json();
      console.error('Search API error:', errorData);
      throw new HttpsError('internal', errorData.message || 'Notion API error');
    }

    const searchData = await searchResponse.json();
    
    // Also search for pages (for creating new databases)
    // Users need pages to create databases inside them during connection setup
    const pageSearchResponse = await fetch('https://api.notion.com/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionApiKey}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        // Filter to search for pages (where users can create new databases)
        filter: {
          value: 'page',
          property: 'object',
        },
        sort: {
          direction: 'descending',
          timestamp: 'last_edited_time',
        },
        page_size: 100,
      }),
    });

    let allResults = [];
    
    if (pageSearchResponse.ok) {
      const pageData = await pageSearchResponse.json();
      allResults = [...searchData.results, ...pageData.results];
    } else {
      allResults = searchData.results;
    }

    return {
      databases: allResults.map((item) => ({
        id: item.id,
        // Handle both data_source and database object types for backwards compatibility
        // data_sources are databases in the new API, database is the old type
        title: item.object === 'data_source' || item.object === 'database'
          ? (item.title?.[0]?.plain_text || 'Untitled')
          : (item.properties?.title?.title?.[0]?.plain_text || item.title?.[0]?.plain_text || 'Untitled'),
        type: item.object === 'data_source' ? 'database' : item.object, // Map data_source to 'database' for UI compatibility
        parent: item.parent, // Include parent information for hierarchy display
      })),
    };
  } catch (error) {
    console.error('Error searching data sources for database connection:', error);
    throw new HttpsError('internal', error.message || 'Failed to search data sources');
  }
});

/**
 * Create a new parent page for the database
 */
exports.notionCreatePage = functions.https.onCall(async (data, context) => {
  // Verify user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { notionApiKey } = data;

  if (!notionApiKey) {
    throw new functions.https.HttpsError('invalid-argument', 'Notion API key is required');
  }

  try {
    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionApiKey}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        parent: { type: 'workspace', workspace: true },
        properties: {
          title: {
            title: [
              {
                type: 'text',
                text: {
                  content: 'Winy AI Food',
                },
              },
            ],
          },
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new functions.https.HttpsError('internal', errorData.message || 'Failed to create page');
    }

    const responseData = await response.json();

    return {
      pageId: responseData.id,
    };
  } catch (error) {
    console.error('Error creating page:', error);
    throw new functions.https.HttpsError('internal', error.message || 'Failed to create page');
  }
});

/**
 * Create a new Food Log database
 * Accepts optional schema to create dynamic columns based on template
 */
exports.notionCreateDatabase = onCall(async (request) => {
  // Log auth context for debugging
  console.log('CreateDatabase - Auth context:', request.auth ? 'Present' : 'Missing');
  console.log('CreateDatabase - Auth UID:', request.auth?.uid);

  // Verify user is authenticated
  if (!request.auth) {
    console.error('No auth context found in createDatabase');
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { notionApiKey, parentPageId, schema } = request.data;

  if (!notionApiKey || !parentPageId) {
    throw new HttpsError('invalid-argument', 'Notion API key and parent page ID are required');
  }

  try {
    // Build properties based on schema or use default
    const properties = {};

    if (schema && schema.fields) {
      // Create properties dynamically from schema fields
      schema.fields.forEach((field) => {
        const propertyConfig = {};

        switch (field.notionPropertyType) {
          case 'title':
            propertyConfig.title = {};
            break;
          case 'rich_text':
            propertyConfig.rich_text = {};
            break;
          case 'number':
            propertyConfig.number = { format: 'number' };
            break;
          case 'date':
            propertyConfig.date = {};
            break;
          case 'url':
            propertyConfig.url = {};
            break;
          case 'select':
            propertyConfig.select = { options: [] };
            break;
          case 'multi_select':
            propertyConfig.multi_select = { options: [] };
            break;
          case 'checkbox':
            propertyConfig.checkbox = {};
            break;
          default:
            // Default to rich_text for unknown types
            propertyConfig.rich_text = {};
        }

        properties[field.name] = propertyConfig;
      });
    } else {
      // Default properties - match FoodEntry structure
      properties.Name = { title: {} };
      properties.Timestamp = { date: {} }; // Includes time when ISO string is provided
      properties.Text = { rich_text: {} }; // User's original description
      properties['AI Summary'] = { rich_text: {} }; // AI-generated summary
      properties.Photo = { url: {} };
    }

    const response = await fetch('https://api.notion.com/v1/databases', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionApiKey}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        parent: { type: 'page_id', page_id: parentPageId },
        title: [
          {
            type: 'text',
            text: {
              content: schema?.name || 'Food Log',
            },
          },
        ],
        properties,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new HttpsError('internal', errorData.message || 'Failed to create database');
    }

    const responseData = await response.json();

    return {
      databaseId: responseData.id,
    };
  } catch (error) {
    console.error('Error creating database:', error);
    throw new HttpsError('internal', error.message || 'Failed to create database');
  }
});

/**
 * Verify Notion connection by retrieving database info
 */
exports.notionVerifyConnection = onCall(async (request) => {
  // Verify user is authenticated
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { notionApiKey, databaseId } = request.data;

  if (!notionApiKey || !databaseId) {
    throw new HttpsError('invalid-argument', 'Notion API key and database ID are required');
  }

  try {
    const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${notionApiKey}`,
        'Notion-Version': '2022-06-28',
      },
    });

    if (!response.ok) {
      return { isValid: false };
    }

    return { isValid: true };
  } catch (error) {
    console.error('Error verifying connection:', error);
    return { isValid: false };
  }
});

/**
 * Analyze an existing Notion database schema
 * Returns column names and types for intelligent matching with app schemas
 */
exports.notionAnalyzeDatabase = functions.https.onCall(async (data, context) => {
  // Verify user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { notionApiKey, databaseId } = data;

  if (!notionApiKey || !databaseId) {
    throw new functions.https.HttpsError('invalid-argument', 'Notion API key and database ID are required');
  }

  try {
    const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${notionApiKey}`,
        'Notion-Version': '2022-06-28',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new functions.https.HttpsError('internal', errorData.message || 'Failed to retrieve database');
    }

    const database = await response.json();

    // Extract property information
    const columns = [];
    for (const [propertyName, propertyConfig] of Object.entries(database.properties)) {
      columns.push({
        name: propertyName,
        type: propertyConfig.type,
        id: propertyConfig.id,
      });
    }

    return {
      databaseId: database.id,
      title: database.title?.[0]?.plain_text || 'Untitled',
      columns,
    };
  } catch (error) {
    console.error('Error analyzing database:', error);
    throw new functions.https.HttpsError('internal', error.message || 'Failed to analyze database');
  }
});

/**
 * Sync a food entry to Notion database
 * Creates a new page in the Notion database with dynamic properties based on schema
 */
exports.notionSyncEntry = onCall(async (request) => {
  // Verify user is authenticated
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { notionApiKey, databaseId, entry, schema } = request.data;

  if (!notionApiKey || !databaseId || !entry) {
    throw new HttpsError('invalid-argument', 'Missing required parameters');
  }

  try {
    // Build Notion properties based on schema and entry data
    const properties = {};

    if (schema && schema.fields && entry.fieldValues) {
      // Use schema-based field mapping
      schema.fields.forEach((field) => {
        const value = entry.fieldValues[field.id];

        // Skip if no value provided
        if (value === undefined || value === null) return;

        // Map field types to Notion property types
        switch (field.notionPropertyType) {
          case 'title':
            properties[field.name] = {
              title: [{ text: { content: String(value) } }],
            };
            break;

          case 'rich_text':
            properties[field.name] = {
              rich_text: [{ text: { content: String(value) } }],
            };
            break;

          case 'number':
            properties[field.name] = {
              number: Number(value) || 0,
            };
            break;

          case 'date':
            properties[field.name] = {
              date: { start: new Date(value).toISOString() },
            };
            break;

          case 'url':
            if (value && String(value).trim()) {
              properties[field.name] = {
                url: String(value),
              };
            }
            break;

          default:
            // Default to rich_text for unknown types
            properties[field.name] = {
              rich_text: [{ text: { content: String(value) } }],
            };
        }
      });
    } else {
      // Legacy fallback: use fixed properties matching default database structure
      properties.Name = {
        title: [{ text: { content: entry.title || entry.text || 'Food Entry' } }],
      };

      if (entry.timestamp) {
        properties.Timestamp = {
          date: { start: new Date(entry.timestamp).toISOString() },
        };
      }

      if (entry.text) {
        properties.Text = {
          rich_text: [{ text: { content: entry.text } }],
        };
      }

      if (entry.aiSummary) {
        properties['AI Summary'] = {
          rich_text: [{ text: { content: entry.aiSummary } }],
        };
      }

      if (entry.photoUrl) {
        properties.Photo = {
          url: entry.photoUrl,
        };
      }
    }

    // Create page in Notion
    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionApiKey}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        parent: { database_id: databaseId },
        properties,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Notion API error:', errorData);
      throw new HttpsError('internal', errorData.message || 'Failed to create Notion page');
    }

    const responseData = await response.json();

    return {
      pageId: responseData.id,
      url: responseData.url,
    };
  } catch (error) {
    console.error('Error syncing entry to Notion:', error);
    throw new HttpsError('internal', error.message || 'Failed to sync entry');
  }
});

/**
 * Sync entries FROM Notion database (read all pages)
 * Queries Notion database and returns entries that can be synced to Firestore
 */
exports.notionQueryDatabase = onCall(async (request) => {
  // Verify user is authenticated
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { notionApiKey, databaseId, schema } = request.data;

  if (!notionApiKey || !databaseId) {
    throw new HttpsError('invalid-argument', 'Notion API key and database ID are required');
  }

  try {
    // Updated: Query using data sources approach (newer Notion API)
    // First, get database info to ensure it exists and is accessible
    const dbInfoResponse = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${notionApiKey}`,
        'Notion-Version': '2022-06-28',
      },
    });

    if (!dbInfoResponse.ok) {
      const errorData = await dbInfoResponse.json();
      throw new HttpsError('internal', errorData.message || 'Failed to access Notion database');
    }

    // Query database for all pages using data sources approach (newer Notion API)
    // Query the database directly as a data source - this is the recommended approach
    let allPages = [];
    let hasMore = true;
    let startCursor = undefined;
    let pageCount = 0;
    const maxPages = 1000; // Limit to prevent infinite loops

    while (hasMore && pageCount < maxPages) {
      // Query database as data source - use empty filter or filter on actual database properties
      // The filter property here refers to database property names, not 'object'
      const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${notionApiKey}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28',
        },
        body: JSON.stringify({
          start_cursor: startCursor,
          page_size: 100, // Maximum page size per Notion API
          // No filter needed - query all pages from the database as data source
          // Archived pages will be filtered out manually below
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Query error:', errorData);
        throw new HttpsError('internal', errorData.message || 'Failed to query Notion database');
      }

      const data = await response.json();
      // Filter out archived pages (Notion doesn't always exclude them)
      const activePages = data.results.filter((page) => !page.archived);
      allPages = allPages.concat(activePages);
      hasMore = data.has_more;
      startCursor = data.next_cursor;
      pageCount += activePages.length;
    }

    // Log query completion to help debug freezing issues
    console.log(`Query completed: ${pageCount} pages retrieved from database ${databaseId}`);

    // Convert Notion pages to entry format
    const entries = allPages.map((page) => {
      const properties = page.properties;
      const entry = {
        // CRITICAL: notionPageId must be present - this is how we identify Notion entries
        notionPageId: page.id,
        // Use notionPageId as id if no Firestore ID exists yet
        id: page.id, // Temporary ID until synced to Firestore
        timestamp: page.created_time ? new Date(page.created_time).getTime() : Date.now(),
        fieldValues: {},
      };

      // Extract fields based on schema or default mapping
      if (schema && schema.fields) {
        schema.fields.forEach((field) => {
          const prop = properties[field.name];
          if (!prop) return;

          let value = null;

          switch (prop.type) {
            case 'title':
              value = prop.title?.[0]?.plain_text || '';
              break;
            case 'rich_text':
              value = prop.rich_text?.[0]?.plain_text || '';
              break;
            case 'number':
              value = prop.number || 0;
              break;
            case 'date':
              value = prop.date?.start ? new Date(prop.date.start).getTime() : null;
              break;
            case 'url':
              value = prop.url || '';
              break;
            case 'checkbox':
              value = prop.checkbox || false;
              break;
            default:
              value = null;
          }

          if (value !== null) {
            entry.fieldValues[field.id] = value;
          }
        });
      } else {
        // Legacy/default mapping
        if (properties.Name?.title?.[0]?.plain_text) {
          entry.title = properties.Name.title[0].plain_text;
          entry.fieldValues.name = entry.title;
        }
        if (properties.Text?.rich_text?.[0]?.plain_text) {
          entry.text = properties.Text.rich_text[0].plain_text;
        }
        if (properties['AI Summary']?.rich_text?.[0]?.plain_text) {
          entry.aiSummary = properties['AI Summary'].rich_text[0].plain_text;
          entry.fieldValues.summary = entry.aiSummary;
        }
        if (properties.Photo?.url) {
          entry.photoUrl = properties.Photo.url;
          entry.fieldValues.photo = entry.photoUrl;
        }
        if (properties.Timestamp?.date?.start) {
          entry.timestamp = new Date(properties.Timestamp.date.start).getTime();
          entry.fieldValues.date = entry.timestamp;
        }
      }

      return entry;
    });

    return { entries };
  } catch (error) {
    console.error('Error querying Notion database:', error);
    throw new HttpsError('internal', error.message || 'Failed to query Notion database');
  }
});

/**
 * Delete a page from Notion database
 * Used when Notion is the source of truth
 */
exports.notionDeletePage = onCall(async (request) => {
  // Verify user is authenticated
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { notionApiKey, pageId } = request.data;

  if (!notionApiKey || !pageId) {
    throw new HttpsError('invalid-argument', 'Notion API key and page ID are required');
  }

  try {
    // Archive the page in Notion (Notion doesn't have true delete, only archive)
    const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${notionApiKey}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        archived: true,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new HttpsError('internal', errorData.message || 'Failed to delete Notion page');
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting Notion page:', error);
    throw new HttpsError('internal', error.message || 'Failed to delete Notion page');
  }
});

/**
 * Validate embed token and return user ID
 * Used by embed pages to look up user data by token
 */
exports.validateEmbedToken = onCall(async (request) => {
  // This function is public (no auth required) for embed pages
  
  const { token, chartType } = request.data;

  if (!token || !chartType) {
    throw new HttpsError('invalid-argument', 'Token and chart type are required');
  }

  try {
    // Map chart type to token key
    const tokenKeyMap = {
      'main-chart': 'mainChart',
      'protein-goal': 'proteinGoal',
      'calorie-limit': 'calorieLimit',
      'protein-streak': 'proteinStreak',
      'calorie-streak': 'calorieStreak',
    };

    const tokenKey = tokenKeyMap[chartType];
    if (!tokenKey) {
      throw new HttpsError('invalid-argument', 'Invalid chart type');
    }

    // Query Firestore for user with matching token
    // Note: Firestore doesn't support direct queries on nested map fields like embedTokens.${key}
    // So we need to query all settings and filter, or use a better data structure
    // For now, we'll query and filter client-side (works for small scale)
    const db = admin.firestore();
    const settingsSnapshot = await db.collection('settings').get();

    let foundUserId = null;
    
    for (const doc of settingsSnapshot.docs) {
      const data = doc.data();
      const embedTokens = data.embedTokens || {};
      if (embedTokens[tokenKey] === token) {
        foundUserId = data.userId;
        break;
      }
    }

    if (!foundUserId) {
      throw new HttpsError('not-found', 'Invalid embed token');
    }

    return {
      userId: foundUserId,
      valid: true,
    };
  } catch (error) {
    console.error('Error validating embed token:', error);
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    throw new HttpsError('internal', error.message || 'Failed to validate token');
  }
});
