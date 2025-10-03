/**
 * Utility functions for working with Firestore data in the web server
 * Based on /home/prmichaelsen/goodneighbor/src/lib/firestore-utils.ts
 */

/**
 * Sanitizes Firestore document data to ensure it's serializable and doesn't contain undefined values.
 * Firestore doesn't allow undefined values, so this function removes them and logs warnings.
 *
 * @param data The object to sanitize
 * @param context Optional context for logging (e.g., 'task history update')
 * @returns A new object with undefined values removed and Firestore-compatible types
 */
export function sanitizeFirestoreData<T>(data: any, context?: string): T {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data !== "object") {
    return data;
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeFirestoreData(item, context)) as unknown as T;
  }

  // Handle Date objects - convert to Firestore Timestamp
  if (data instanceof Date) {
    return data as unknown as T;
  }

  // Handle plain objects recursively
  const result: Record<string, any> = {};
  const undefinedFields: string[] = [];

  try {
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        if (data[key] !== undefined) {
          result[key] = sanitizeFirestoreData(data[key], context);
        } else {
          undefinedFields.push(key);
        }
      }
    }
  } catch (error) {
    console.error("Error sanitizing Firestore data:", error);
    // If we encounter an error, return a simplified version of the object
    return { error: "Failed to sanitize data" } as unknown as T;
  }

  // Log warnings for undefined fields
  if (undefinedFields.length > 0) {
    const contextStr = context ? ` in ${context}` : "";
    console.warn(
      `[FirestoreUtils] Undefined fields filtered out${contextStr}: ${undefinedFields.join(", ")}`
    );
  }

  return result as T;
}

/**
 * Filters out undefined values from an object to prepare it for Firestore updates.
 * Firestore doesn't allow undefined values, so this function removes them and logs warnings.
 *
 * @param data The object to filter
 * @param context Optional context for logging (e.g., 'profile update')
 * @returns A new object with undefined values removed
 */
export function filterUndefinedValues<T extends Record<string, any>>(
  data: T,
  context?: string
): Partial<T> {
  const filtered: Partial<T> = {};
  const undefinedFields: string[] = [];

  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      if (data[key] !== undefined) {
        filtered[key] = data[key];
      } else {
        undefinedFields.push(key);
      }
    }
  }

  // Log warnings for undefined fields
  if (undefinedFields.length > 0) {
    const contextStr = context ? ` in ${context}` : "";
    console.warn(
      `[FirestoreUtils] Undefined fields filtered out${contextStr}: ${undefinedFields.join(", ")}`
    );
  }

  return filtered;
}

/**
 * Prepares data for Firestore by sanitizing and filtering undefined values
 * This is the main function to use before saving any data to Firestore
 *
 * @param data The data to prepare
 * @param context Optional context for logging
 * @returns Sanitized and filtered data ready for Firestore
 */
export function prepareForFirestore<T>(data: T, context?: string): Partial<T> {
  const sanitized = sanitizeFirestoreData(data, context);
  return filterUndefinedValues(sanitized as Record<string, any>, context) as Partial<T>;
}