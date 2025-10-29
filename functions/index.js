/**
 * Firebase Cloud Functions for Winy AI Food
 *
 * These functions act as a proxy for the Notion API to bypass CORS restrictions
 */

const functions = require('firebase-functions'); // v1 API for other functions
const {onCall, HttpsError} = require('firebase-functions/v2/https'); // v2 API for notionSearchDatabases
const admin = require('firebase-admin');

admin.initializeApp();

/**
 * Search for databases accessible by the Notion integration
 */
exports.notionSearchDatabases = onCall(async (request) => {
  // Log auth context for debugging
  console.log('Auth context:', request.auth ? 'Present' : 'Missing');
  console.log('Auth UID:', request.auth?.uid);
  console.log('Full request.auth:', JSON.stringify(request.auth, null, 2));

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
    // Search for both pages and databases
    const response = await fetch('https://api.notion.com/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionApiKey}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        sort: {
          direction: 'descending',
          timestamp: 'last_edited_time',
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new HttpsError('internal', errorData.message || 'Notion API error');
    }

    const responseData = await response.json();

    return {
      databases: responseData.results.map((item) => ({
        id: item.id,
        title: item.object === 'database'
          ? (item.title?.[0]?.plain_text || 'Untitled')
          : (item.properties?.title?.title?.[0]?.plain_text || 'Untitled'),
        type: item.object, // 'page' or 'database'
        parent: item.parent, // Include parent information for hierarchy
      })),
    };
  } catch (error) {
    console.error('Error searching databases:', error);
    throw new HttpsError('internal', error.message || 'Failed to search databases');
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
