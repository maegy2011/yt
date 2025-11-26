// Utility functions for incognito mode in API routes

// Check if request is from incognito mode
export function isIncognitoRequest(request: Request): boolean {
  // Check header for incognito mode indicator
  const incognitoHeader = request.headers.get('x-incognito-mode')
  return incognitoHeader === 'true'
}

// Helper to create incognito-aware API responses
export function createIncognitoResponse(data: any, isIncognito: boolean) {
  if (isIncognito) {
    return {
      ...data,
      incognito: true,
      message: 'Data not saved in incognito mode'
    }
  }
  return data
}

// Helper to skip database operations in incognito mode
export function shouldSkipInIncognito(isIncognito: boolean): boolean {
  return isIncognito
}

// Helper to add incognito headers to fetch requests
export function addIncognitoHeaders(options: RequestInit = {}, isIncognito: boolean = false): RequestInit {
  if (isIncognito) {
    return {
      ...options,
      headers: {
        ...options.headers,
        'x-incognito-mode': 'true'
      }
    }
  }
  return options
}