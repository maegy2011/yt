// Simple test file for formatting functions
// This can be run manually to verify the formatting works correctly

import { formatDuration, formatViewCount, formatPublishedDate } from './format';

// Test cases for duration formatting
const durationTests = [
  { input: 'PT4M13S', expected: '4:13' },
  { input: 'PT1H2M30S', expected: '1:02:30' },
  { input: 'PT30S', expected: '0:30' },
  { input: 'PT1H5S', expected: '1:00:05' },
  { input: 253, expected: '4:13' },
  { input: 3725, expected: '1:02:05' },
  { input: '253', expected: '4:13' },
  { input: '4:13', expected: '4:13' },
  { input: '1:02:30', expected: '1:02:30' },
  { input: null, expected: '' },
  { input: '', expected: '' },
  { input: 0, expected: '' }
];

// Test cases for view count formatting
const viewCountTests = [
  { input: 123, expected: '123 views' },
  { input: 1234, expected: '1.2K views' },
  { input: 12345, expected: '12.3K views' },
  { input: 1234567, expected: '1.2M views' },
  { input: 12345678, expected: '12.3M views' },
  { input: 1234567890, expected: '1.2B views' },
  { input: '123', expected: '123 views' },
  { input: '1,234', expected: '1.2K views' },
  { input: '1.2K views', expected: '1.2K views' },
  { input: null, expected: '' },
  { input: '', expected: '' },
  { input: 0, expected: '0 views' }
];

// Test cases for published date formatting
const publishedTests = [
  { input: '2024-01-15', expected: '2 months ago' }, // This will vary based on current date
  { input: '2024-12-01', expected: '5 months ago' }, // This will vary based on current date
  { input: '2022-06-15', expected: '2 years ago' }, // This will vary based on current date
  { input: null, expected: '' },
  { input: '', expected: '' }
];

// Run tests (for manual verification)
export function runFormatTests() {
  console.log('Testing Duration Formatting:');
  durationTests.forEach(test => {
    const result = formatDuration(test.input);
    const passed = result === test.expected;
    console.log(`${passed ? '✅' : '❌'} formatDuration(${JSON.stringify(test.input)}) = "${result}" (expected: "${test.expected}")`);
  });

  console.log('\nTesting View Count Formatting:');
  viewCountTests.forEach(test => {
    const result = formatViewCount(test.input);
    const passed = result === test.expected;
    console.log(`${passed ? '✅' : '❌'} formatViewCount(${JSON.stringify(test.input)}) = "${result}" (expected: "${test.expected}")`);
  });

  console.log('\nTesting Published Date Formatting:');
  publishedTests.forEach(test => {
    const result = formatPublishedDate(test.input);
    console.log(`📅 formatPublishedDate(${JSON.stringify(test.input)}) = "${result}" (relative to current date)`);
  });
}

// Uncomment to run tests manually
// runFormatTests();