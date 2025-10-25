/**
 * Firebase Cloud Functions for Winy AI Food
 *
 * These functions act as a proxy for the Notion API to bypass CORS restrictions
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

/**
 * Search for databases accessible by the Notion integration
 */
exports.notionSearchDatabases = functions.https.onCall(async (data, context) => {
  // Verify user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { notionApiKey } = data;

  if (!notionApiKey) {
    throw new functions.https.HttpsError('invalid-argument', 'Notion API key is required');
  }

  try {
    const response = await fetch('https://api.notion.com/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionApiKey}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        filter: {
          property: 'object',
          value: 'database',
        },
        sort: {
          direction: 'descending',
          timestamp: 'last_edited_time',
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new functions.https.HttpsError('internal', errorData.message || 'Notion API error');
    }

    const responseData = await response.json();

    return {
      databases: responseData.results.map((db) => ({
        id: db.id,
        title: db.title?.[0]?.plain_text || 'Untitled',
      })),
    };
  } catch (error) {
    console.error('Error searching databases:', error);
    throw new functions.https.HttpsError('internal', error.message || 'Failed to search databases');
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
 */
exports.notionCreateDatabase = functions.https.onCall(async (data, context) => {
  // Verify user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { notionApiKey, parentPageId } = data;

  if (!notionApiKey || !parentPageId) {
    throw new functions.https.HttpsError('invalid-argument', 'Notion API key and parent page ID are required');
  }

  try {
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
              content: 'Food Log',
            },
          },
        ],
        properties: {
          Name: {
            title: {},
          },
          Date: {
            date: {},
          },
          Summary: {
            rich_text: {},
          },
          Photo: {
            url: {},
          },
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new functions.https.HttpsError('internal', errorData.message || 'Failed to create database');
    }

    const responseData = await response.json();

    return {
      databaseId: responseData.id,
    };
  } catch (error) {
    console.error('Error creating database:', error);
    throw new functions.https.HttpsError('internal', error.message || 'Failed to create database');
  }
});

/**
 * Verify Notion connection by retrieving database info
 */
exports.notionVerifyConnection = functions.https.onCall(async (data, context) => {
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
      return { isValid: false };
    }

    return { isValid: true };
  } catch (error) {
    console.error('Error verifying connection:', error);
    return { isValid: false };
  }
});
