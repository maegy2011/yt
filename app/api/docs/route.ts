/**
 * OpenAPI/Swagger Documentation API Route
 * Provides comprehensive API documentation for the YouTube Clone application
 */

import { NextRequest, NextResponse } from 'next/server';
import { monitoring } from '@/lib/monitoring';

// OpenAPI 3.0 specification
const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'YouTube Clone API',
    description: `A comprehensive YouTube clone application with advanced features including:
    
• **Video Management**: Search, play, and organize YouTube content
• **Favorites System**: Advanced favorites with categorization and batch operations
• **Notebook System**: Create and manage notebooks with PDF attachments
• **Watched History**: Track viewing progress and statistics
• **Channel Management**: Follow channels and get recommendations
• **Real-time Features**: WebSocket support for live updates
• **AI Integration**: Smart channel recommendations and content analysis

## Authentication
Currently uses session-based authentication. Include session cookies in all requests.

## Rate Limiting
API endpoints are rate-limited to prevent abuse. Standard limits:
- 100 requests per minute for authenticated users
- 20 requests per minute for anonymous users

## Error Handling
All errors follow a consistent format:
\`\`\`json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": { ... }
  }
}
\`\`\``,
    version: '2.0.0',
    contact: {
      name: 'YouTube Clone Support',
      email: 'support@youtube-clone.com'
    },
    license: {
      name: 'MIT'
    }
  },
  servers: [
    {
      url: process.env.NODE_ENV === 'production' 
        ? 'https://youtube-clone.com' 
        : 'http://localhost:3000',
      description: process.env.NODE_ENV === 'production' 
        ? 'Production server' 
        : 'Development server'
    }
  ],
  paths: {
    '/api/health': {
      get: {
        tags: ['Health'],
        summary: 'Check API health status',
        description: 'Returns the current health status of the API and its dependencies',
        responses: {
          '200': {
            description: 'API is healthy',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/HealthResponse'
                }
              }
            }
          }
        }
      }
    },
    '/api/health/database': {
      get: {
        tags: ['Health'],
        summary: 'Check database health',
        description: 'Returns detailed database connection and performance metrics',
        responses: {
          '200': {
            description: 'Database is healthy',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/DatabaseHealthResponse'
                }
              }
            }
          }
        }
      }
    },
    '/api/favorites': {
      get: {
        tags: ['Favorites'],
        summary: 'Get user favorites',
        description: 'Retrieve all favorite videos for the current user with optional filtering',
        parameters: [
          {
            name: 'limit',
            in: 'query',
            description: 'Maximum number of results to return',
            schema: { type: 'integer', default: 50 }
          },
          {
            name: 'offset',
            in: 'query',
            description: 'Number of results to skip for pagination',
            schema: { type: 'integer', default: 0 }
          },
          {
            name: 'category',
            in: 'query',
            description: 'Filter by category',
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': {
            description: 'Favorites retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    favorites: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/FavoriteVideo' }
                    },
                    total: { type: 'integer' },
                    hasMore: { type: 'boolean' }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Favorites'],
        summary: 'Add video to favorites',
        description: 'Add a new video to the user favorites collection',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AddFavoriteRequest' }
            }
          }
        },
        responses: {
          '201': {
            description: 'Video added to favorites',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/FavoriteVideo' }
              }
            }
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '409': { $ref: '#/components/responses/Conflict' }
        }
      }
    },
    '/api/favorites/{videoId}': {
      get: {
        tags: ['Favorites'],
        summary: 'Get specific favorite',
        description: 'Retrieve details of a specific favorite video',
        parameters: [
          {
            name: 'videoId',
            in: 'path',
            required: true,
            description: 'YouTube video ID',
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': {
            description: 'Favorite retrieved successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/FavoriteVideo' }
              }
            }
          },
          '404': { $ref: '#/components/responses/NotFound' }
        }
      },
      delete: {
        tags: ['Favorites'],
        summary: 'Remove from favorites',
        description: 'Remove a video from the user favorites collection',
        parameters: [
          {
            name: 'videoId',
            in: 'path',
            required: true,
            description: 'YouTube video ID',
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': {
            description: 'Video removed from favorites',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' }
              }
            }
          },
          '404': { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    '/api/favorites/batch': {
      post: {
        tags: ['Favorites'],
        summary: 'Batch operations on favorites',
        description: 'Perform batch operations on multiple favorites',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/BatchFavoriteRequest' }
            }
          }
        },
        responses: {
          '200': {
            description: 'Batch operation completed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/BatchResponse' }
              }
            }
          }
        }
      }
    },
    '/api/notebooks': {
      get: {
        tags: ['Notebooks'],
        summary: 'Get user notebooks',
        description: 'Retrieve all notebooks for the current user',
        responses: {
          '200': {
            description: 'Notebooks retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Notebook' }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Notebooks'],
        summary: 'Create new notebook',
        description: 'Create a new notebook with optional initial notes',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateNotebookRequest' }
            }
          }
        },
        responses: {
          '201': {
            description: 'Notebook created successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Notebook' }
              }
            }
          }
        }
      }
    },
    '/api/notebooks/{id}': {
      get: {
        tags: ['Notebooks'],
        summary: 'Get specific notebook',
        description: 'Retrieve a specific notebook with its notes',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Notebook ID',
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': {
            description: 'Notebook retrieved successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/NotebookWithNotes' }
              }
            }
          }
        }
      },
      delete: {
        tags: ['Notebooks'],
        summary: 'Delete notebook',
        description: 'Delete a notebook and all its notes',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Notebook ID',
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': {
            description: 'Notebook deleted successfully'
          }
        }
      }
    },
    '/api/watched': {
      get: {
        tags: ['Watched History'],
        summary: 'Get watched history',
        description: 'Retrieve user watched history with playback positions',
        parameters: [
          {
            name: 'limit',
            in: 'query',
            description: 'Maximum number of results',
            schema: { type: 'integer', default: 50 }
          }
        ],
        responses: {
          '200': {
            description: 'Watched history retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/WatchedVideo' }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Watched History'],
        summary: 'Update watched status',
        description: 'Update or add a video to watched history',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateWatchedRequest' }
            }
          }
        },
        responses: {
          '200': {
            description: 'Watched status updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/WatchedVideo' }
              }
            }
          }
        }
      }
    },
    '/api/youtube/search': {
      get: {
        tags: ['YouTube Integration'],
        summary: 'Search YouTube videos',
        description: 'Search for videos on YouTube with advanced filtering',
        parameters: [
          {
            name: 'q',
            in: 'query',
            required: true,
            description: 'Search query',
            schema: { type: 'string' }
          },
          {
            name: 'maxResults',
            in: 'query',
            description: 'Maximum number of results',
            schema: { type: 'integer', default: 25 }
          },
          {
            name: 'duration',
            in: 'query',
            description: 'Video duration filter',
            schema: { 
              type: 'string', 
              enum: ['short', 'medium', 'long', 'any'],
              default: 'any'
            }
          }
        ],
        responses: {
          '200': {
            description: 'Search results retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/YouTubeVideo' }
                }
              }
            }
          }
        }
      }
    },
    '/api/youtube/video/{videoId}': {
      get: {
        tags: ['YouTube Integration'],
        summary: 'Get video details',
        description: 'Retrieve detailed information about a specific YouTube video',
        parameters: [
          {
            name: 'videoId',
            in: 'path',
            required: true,
            description: 'YouTube video ID',
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': {
            description: 'Video details retrieved',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/YouTubeVideoDetails' }
              }
            }
          }
        }
      }
    },
    '/api/channels': {
      get: {
        tags: ['Channels'],
        summary: 'Get followed channels',
        description: 'Retrieve channels that the user is following',
        responses: {
          '200': {
            description: 'Channels retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Channel' }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Channels'],
        summary: 'Follow a channel',
        description: 'Add a channel to the user followed channels',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/FollowChannelRequest' }
            }
          }
        },
        responses: {
          '201': {
            description: 'Channel followed successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Channel' }
              }
            }
          }
        }
      }
    }
  },
  components: {
    schemas: {
      HealthResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['healthy', 'unhealthy'] },
          timestamp: { type: 'string', format: 'date-time' },
          version: { type: 'string' },
          uptime: { type: 'number' },
          services: {
            type: 'object',
            properties: {
              database: { type: 'string', enum: ['connected', 'disconnected'] },
              cache: { type: 'string', enum: ['connected', 'disconnected'] },
              youtube: { type: 'string', enum: ['available', 'unavailable'] }
            }
          }
        }
      },
      DatabaseHealthResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['healthy', 'unhealthy'] },
          connectionTime: { type: 'number' },
          queryTime: { type: 'number' },
          stats: {
            type: 'object',
            properties: {
              totalConnections: { type: 'integer' },
              activeConnections: { type: 'integer' },
              totalQueries: { type: 'integer' }
            }
          }
        }
      },
      FavoriteVideo: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          videoId: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          channelTitle: { type: 'string' },
          thumbnailUrl: { type: 'string' },
          duration: { type: 'string' },
          publishedAt: { type: 'string', format: 'date-time' },
          addedAt: { type: 'string', format: 'date-time' },
          category: { type: 'string' },
          tags: {
            type: 'array',
            items: { type: 'string' }
          },
          notes: { type: 'string' }
        }
      },
      AddFavoriteRequest: {
        type: 'object',
        required: ['videoId', 'title', 'channelTitle'],
        properties: {
          videoId: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          channelTitle: { type: 'string' },
          thumbnailUrl: { type: 'string' },
          duration: { type: 'string' },
          publishedAt: { type: 'string', format: 'date-time' },
          category: { type: 'string' },
          tags: {
            type: 'array',
            items: { type: 'string' }
          },
          notes: { type: 'string' }
        }
      },
      BatchFavoriteRequest: {
        type: 'object',
        required: ['operation', 'videoIds'],
        properties: {
          operation: { 
            type: 'string', 
            enum: ['delete', 'updateCategory', 'addTags'] 
          },
          videoIds: {
            type: 'array',
            items: { type: 'string' }
          },
          category: { type: 'string' },
          tags: {
            type: 'array',
            items: { type: 'string' }
          }
        }
      },
      BatchResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          processed: { type: 'integer' },
          failed: { type: 'integer' },
          errors: {
            type: 'array',
            items: { type: 'string' }
          }
        }
      },
      Notebook: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          notesCount: { type: 'integer' },
          pdfsCount: { type: 'integer' },
          isPublic: { type: 'boolean' },
          shareToken: { type: 'string' }
        }
      },
      CreateNotebookRequest: {
        type: 'object',
        required: ['title'],
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          isPublic: { type: 'boolean' }
        }
      },
      NotebookWithNotes: {
        allOf: [
          { $ref: '#/components/schemas/Notebook' },
          {
            type: 'object',
            properties: {
              notes: {
                type: 'array',
                items: { $ref: '#/components/schemas/Note' }
              }
            }
          }
        ]
      },
      Note: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          content: { type: 'string' },
          videoId: { type: 'string' },
          timestamp: { type: 'number' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      WatchedVideo: {
        type: 'object',
        properties: {
          videoId: { type: 'string' },
          title: { type: 'string' },
          channelTitle: { type: 'string' },
          thumbnailUrl: { type: 'string' },
          duration: { type: 'string' },
          watchedAt: { type: 'string', format: 'date-time' },
          playbackPosition: { type: 'number' },
          completed: { type: 'boolean' }
        }
      },
      UpdateWatchedRequest: {
        type: 'object',
        required: ['videoId'],
        properties: {
          videoId: { type: 'string' },
          title: { type: 'string' },
          channelTitle: { type: 'string' },
          thumbnailUrl: { type: 'string' },
          duration: { type: 'string' },
          playbackPosition: { type: 'number' },
          completed: { type: 'boolean' }
        }
      },
      YouTubeVideo: {
        type: 'object',
        properties: {
          videoId: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          channelTitle: { type: 'string' },
          channelId: { type: 'string' },
          thumbnailUrl: { type: 'string' },
          duration: { type: 'string' },
          publishedAt: { type: 'string', format: 'date-time' },
          viewCount: { type: 'integer' },
          likeCount: { type: 'integer' }
        }
      },
      YouTubeVideoDetails: {
        allOf: [
          { $ref: '#/components/schemas/YouTubeVideo' },
          {
            type: 'object',
            properties: {
              tags: {
                type: 'array',
                items: { type: 'string' }
              },
              category: { type: 'string' },
              language: { type: 'string' },
              embeddable: { type: 'boolean' }
            }
          }
        ]
      },
      Channel: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          thumbnailUrl: { type: 'string' },
          subscriberCount: { type: 'integer' },
          videoCount: { type: 'integer' },
          followedAt: { type: 'string', format: 'date-time' }
        }
      },
      FollowChannelRequest: {
        type: 'object',
        required: ['channelId', 'title'],
        properties: {
          channelId: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          thumbnailUrl: { type: 'string' }
        }
      },
      SuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              details: { type: 'object' }
            }
          }
        }
      }
    },
    responses: {
      BadRequest: {
        description: 'Bad request - invalid input parameters',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' }
          }
        }
      },
      Unauthorized: {
        description: 'Unauthorized - authentication required',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' }
          }
        }
      },
      Forbidden: {
        description: 'Forbidden - insufficient permissions',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' }
          }
        }
      },
      NotFound: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' }
          }
        }
      },
      Conflict: {
        description: 'Resource conflict - duplicate or invalid state',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' }
          }
        }
      },
      TooManyRequests: {
        description: 'Rate limit exceeded',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' }
          }
        }
      },
      InternalServerError: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' }
          }
        }
      }
    },
    securitySchemes: {
      sessionAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'session'
      }
    }
  },
  security: [
    {
      sessionAuth: []
    }
  ],
  tags: [
    {
      name: 'Health',
      description: 'API health monitoring and diagnostics'
    },
    {
      name: 'Favorites',
      description: 'Video favorites management'
    },
    {
      name: 'Notebooks',
      description: 'Notebook and note management'
    },
    {
      name: 'Watched History',
      description: 'Video viewing history and progress tracking'
    },
    {
      name: 'YouTube Integration',
      description: 'YouTube API integration and video data'
    },
    {
      name: 'Channels',
      description: 'Channel management and recommendations'
    }
  ]
};

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  let format = 'json'; // Define format in outer scope
  
  try {
    const { searchParams } = new URL(request.url);
    format = searchParams.get('format') || 'json';
    
    // Log the documentation request
    monitoring.info('API documentation accessed', {
      format,
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || 'unknown'
    });

    if (format === 'yaml') {
      // Return YAML format for Swagger UI
      // Note: js-yaml would need to be installed for YAML support
      // For now, return JSON with YAML content-type as fallback
      const yamlSpec = `
openapi: 3.0.3
info:
  title: YouTube Clone API
  version: 2.0.0
# ... (YAML content would be here)
      `.trim();
      
      return new NextResponse(yamlSpec, {
        headers: {
          'Content-Type': 'text/yaml',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }

    // Return JSON format by default
    return NextResponse.json(openApiSpec, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });

  } catch (error) {
    monitoring.error('Failed to serve API documentation', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      {
        error: {
          code: 'DOCUMENTATION_ERROR',
          message: 'Failed to generate API documentation',
          details: {
            error: error instanceof Error ? error.message : String(error)
          }
        }
      },
      { status: 500 }
    );
  } finally {
    const duration = Date.now() - startTime;
    monitoring.logPerformance('api:docs', duration, { format });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
}