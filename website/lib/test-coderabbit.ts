/**
 * TEST FILE FOR CODERABBIT AI CODE REVIEW
 *
 * This file contains intentional code issues to demonstrate CodeRabbit's capabilities:
 * - Security vulnerabilities
 * - Performance problems
 * - Type safety issues
 * - Missing error handling
 * - Accessibility concerns
 *
 * DO NOT MERGE THIS FILE - IT'S FOR TESTING ONLY
 */

// ❌ ISSUE 1: Missing TypeScript types
export function getUserData(email) {
  // ❌ ISSUE 2: Hardcoded API secret (security vulnerability)
  const API_SECRET = "sk-1234567890abcdefghijklmnop";

  // ❌ ISSUE 3: No input validation
  // ❌ ISSUE 4: Potential XSS vulnerability in query parameter
  // ❌ ISSUE 5: No error handling
  fetch(`/api/user?email=${email}`, {
    headers: {
      'Authorization': `Bearer ${API_SECRET}`
    }
  });

  // ❌ ISSUE 6: No return type
  return email;
}

// ❌ ISSUE 7: React component not memoized (performance)
export const ExpensiveComponent = () => {
  // ❌ ISSUE 8: Expensive calculation in render (performance)
  const data = Array(10000).fill(0).map((_, i) => {
    return i * i * Math.random();
  });

  // ❌ ISSUE 9: Missing accessibility attributes
  // ❌ ISSUE 10: Inline event handler (should be memoized)
  return (
    <div onClick={() => console.log('clicked')}>
      {data.map(item => (
        <span key={item}>{item}</span>
      ))}
    </div>
  );
};

// ❌ ISSUE 11: Async function without error handling
export async function saveUserData(userId, data) {
  const response = await fetch('/api/save', {
    method: 'POST',
    body: JSON.stringify({ userId, data })
  });

  // ❌ ISSUE 12: No response validation
  const result = await response.json();
  return result;
}

// ❌ ISSUE 13: Database password in code (critical security issue)
export const connectToDatabase = () => {
  const dbConfig = {
    host: 'localhost',
    user: 'admin',
    password: 'SuperSecret123!',  // Never do this!
    database: 'reddyfit'
  };

  return dbConfig;
};

// ❌ ISSUE 14: eval() usage (security vulnerability)
export function executeUserCode(code) {
  return eval(code);
}

// ❌ ISSUE 15: Inefficient array operations
export function processLargeDataset(items) {
  let result = [];

  for (let i = 0; i < items.length; i++) {
    // ❌ Nested loop causing O(n²) complexity
    for (let j = 0; j < items.length; j++) {
      if (items[i] === items[j] && i !== j) {
        result.push(items[i]);
      }
    }
  }

  return result;
}

// ❌ ISSUE 16: Missing null checks
export function getUserAge(user) {
  // Will throw if user or user.birthDate is undefined
  const birthYear = new Date(user.birthDate).getFullYear();
  const currentYear = new Date().getFullYear();
  return currentYear - birthYear;
}

// ❌ ISSUE 17: Improper Promise handling
export function fetchMultipleUsers(userIds) {
  // ❌ Not waiting for all promises
  userIds.forEach(async (id) => {
    const response = await fetch(`/api/users/${id}`);
    console.log(await response.json());
  });
}

// ❌ ISSUE 18: Memory leak potential
let cachedData = [];

export function addToCache(item) {
  // ❌ Unbounded array growth
  cachedData.push(item);
  return cachedData;
}

// ❌ ISSUE 19: Non-sanitized HTML rendering
export function renderUserContent(htmlContent) {
  return <div dangerouslySetInnerHTML={{ __html: htmlContent }} />;
}

// ❌ ISSUE 20: Improper error suppression
export async function silentlyFailingFunction() {
  try {
    await fetch('/api/critical-operation');
  } catch (error) {
    // ❌ Swallowing errors without logging
  }
}
