# 🐛 Bug Fix: Execution Time Error

## Issue
```
Uncaught TypeError: Cannot read properties of undefined (reading 'toFixed')
at CodePractice.tsx:616
```

## Root Cause
The `memoryUsed` and `executionTime` variables could be `undefined` (not just `null`) when:
1. The API doesn't return these values
2. We check `!== null` but not `!== undefined`
3. Then calling `.toFixed()` on `undefined` throws an error

## Fix Applied

### 1. Added Undefined Check
```typescript
// BEFORE ❌
{executionTime !== null && (
  <span>Time: {executionTime.toFixed(3)}s</span>
)}

// AFTER ✅
{executionTime !== null && executionTime !== undefined && (
  <span>Time: {executionTime.toFixed(3)}s</span>
)}
```

### 2. Normalize API Response
```typescript
// BEFORE ❌
setMemoryUsed(data.memoryUsed); // Could be undefined

// AFTER ✅
setMemoryUsed(data.memoryUsed || null); // Always null if falsy
```

### 3. Reset on Error
```typescript
// AFTER ✅
} else {
  setOutput(data.error || data.output || 'Execution failed');
  setStatus('error');
  setExecutionTime(null);  // ✅ Reset to null
  setMemoryUsed(null);     // ✅ Reset to null
  toast({ ... });
}
```

## Files Modified
- `src/pages/CodePractice.tsx`

## Status
✅ **FIXED** - The error should no longer occur

## Testing
Try running code now:
1. Go to `/code-practice`
2. Write some JavaScript code
3. Click "Run Code"
4. Execution stats should display correctly without errors

## Prevention
For future development:
- Always check for both `null` AND `undefined` before using number methods
- Or use optional chaining: `executionTime?.toFixed(3)`
- Or use nullish coalescing: `(executionTime ?? 0).toFixed(3)`



