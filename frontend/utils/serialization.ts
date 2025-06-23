/**
 * Utilities for handling serialization/deserialization in Next.js
 * 
 * This module provides functions to help with common serialization issues,
 * especially handling Date objects that Next.js cannot serialize directly.
 */

/**
 * Recursively serializes an object, converting Date objects to ISO strings
 * 
 * @param obj - The object to serialize
 * @returns A new object with all Dates converted to ISO strings
 */
export function serializeObject<T>(obj: T): T {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  
  const newObj: any = Array.isArray(obj) ? [] : {};
  
  Object.keys(obj as object).forEach(key => {
    const value = (obj as any)[key];
    
    if (value instanceof Date) {
      newObj[key] = value.toISOString();
    } else if (typeof value === 'object' && value !== null) {
      newObj[key] = serializeObject(value);
    } else {
      newObj[key] = value;
    }
  });
  
  return newObj as T;
}

/**
 * Recursively deserializes an object, converting ISO date strings back to Date objects
 * 
 * @param obj - The object to deserialize
 * @returns A new object with ISO date strings converted to Date objects
 */
export function deserializeObject<T>(obj: T): T {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  
  const newObj: any = Array.isArray(obj) ? [] : {};
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/;
  
  Object.keys(obj as object).forEach(key => {
    const value = (obj as any)[key];
    
    if (typeof value === 'string' && isoDateRegex.test(value)) {
      newObj[key] = new Date(value);
    } else if (typeof value === 'object' && value !== null) {
      newObj[key] = deserializeObject(value);
    } else {
      newObj[key] = value;
    }
  });
  
  return newObj as T;
}

/**
 * Utility for server-side data fetching functions to safely serialize results
 * 
 * @param handler - Async function that returns data
 * @returns Serialized data safe for Next.js props
 */
export function withSerialization<T, P = any>(
  handler: (params: P) => Promise<T>
) {
  return async (params: P): Promise<T> => {
    try {
      const result = await handler(params);
      return serializeObject(result);
    } catch (error) {
      console.error('Serialization error:', error);
      throw error;
    }
  };
} 