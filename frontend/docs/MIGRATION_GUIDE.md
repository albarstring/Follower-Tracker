# 📋 Migration Guide: Upgrading to Enhanced Parser

## Option 1: Quick Deploy (Minimal Changes)

If you want to upgrade quickly without major refactoring:

### Step 1: Update UploadData.tsx
```typescript
import { parseInstagramDataEnhanced } from '@/utils/parser-enhanced';

export default function UploadData() {
  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        const result = parseInstagramDataEnhanced(json);  // ← Use enhanced version
        
        // Check for errors
        if (result.stats.errors.length > 0) {
          console.error('Parser errors:', result.stats.errors);
          setErrorMsg(result.stats.errors.join(', '));
          return;
        }
        
        if (result.users.length === 0) {
          setErrorMsg(`File ${file.name} parsed empty`);
          return;
        }

        const fileName = file.name.toLowerCase();
        if (fileName.includes('follower')) {
          setFollowersData(result.users);
        } else if (fileName.includes('following')) {
          setFollowingData(result.users);
        }
      } catch (err) {
        setErrorMsg(`Failed to parse ${file.name}`);
      }
    };
    reader.readAsText(file);
  };
}
```

### Step 2: No changes needed elsewhere!
The enhanced parser is **backward compatible** and returns the same `InstagramUser[]` type.

---

## Option 2: Full Upgrade (Recommended for Production)

Complete replacement with new context and diagnostics.

### Step 1: Replace DataContext

**Old Import:**
```typescript
import { DataProvider } from '@/context/DataContext';
```

**New Import:**
```typescript
import { DataProvider } from '@/context/DataContext-enhanced';
```

### Step 2: Use New Diagnostics

```typescript
export function MyComponent() {
  const { mutuals, stats } = useData();
  
  // Now you have stats available!
  if (stats?.potentialMismatches.length > 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
        <p className="font-semibold">⚠️ Potential Issues Detected</p>
        {stats.potentialMismatches.map(issue => (
          <p key={issue} className="text-sm text-yellow-800">{issue}</p>
        ))}
      </div>
    );
  }
  
  return <>Your normal content</>;
}
```

### Step 3: Update UploadData.tsx

```typescript
import { parseInstagramDataEnhanced } from '@/utils/parser-enhanced';

const processFile = (file: File) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const json = JSON.parse(e.target?.result as string);
      const result = parseInstagramDataEnhanced(json);
      
      // Show detailed parse results
      console.log('Parse Stats:', {
        total: result.stats.total,
        duplicates: result.stats.duplicates,
        skipped: result.stats.nullsSkipped,
        format: result.stats.format,
        errors: result.stats.errors,
      });
      
      if (result.stats.errors.length > 0) {
        setErrorMsg(`Parse errors: ${result.stats.errors.join(', ')}`);
        return;
      }

      if (result.users.length === 0) {
        setErrorMsg(`File ${file.name} contains no valid users`);
        return;
      }

      const fileName = file.name.toLowerCase();
      if (fileName.includes('follower')) {
        setFollowersData(result.users);
      } else if (fileName.includes('following')) {
        setFollowingData(result.users);
      }
    } catch (err) {
      setErrorMsg(`JSON parse error: ${err instanceof Error ? err.message : 'Unknown'}`);
    }
  };
  reader.readAsText(file);
};
```

### Step 4: Remove Old Files

```bash
# Optional: You can keep the old parser as backup
# mv src/utils/parser.ts src/utils/parser.old.ts
# mv src/context/DataContext.tsx src/context/DataContext.old.tsx
```

---

## Option 3: Backend Migration (Laravel)

For a full-stack production deployment:

### Step 1: Install Service

Place `InstagramDataParser.php` in `app/Services/`

### Step 2: Create Service Provider

```php
// config/app.php
'providers' => [
    // ...
    App\Providers\FollowTrackerServiceProvider::class,
],
```

```php
// app/Providers/FollowTrackerServiceProvider.php
namespace App\Providers;

use App\Services\InstagramDataParser;
use App\Services\FollowRelationshipAnalyzer;
use Illuminate\Support\ServiceProvider;

class FollowTrackerServiceProvider extends ServiceProvider
{
    public function register()
    {
        $this->app->singleton(InstagramDataParser::class);
        $this->app->singleton(FollowRelationshipAnalyzer::class);
    }
}
```

### Step 3: Create API Endpoint

```php
// routes/api.php
Route::post('/followtrack/process', [FollowTrackerController::class, 'processUpload'])
    ->middleware('auth')
    ->name('followtrack.process');
```

### Step 4: Update React Frontend

```typescript
// services/api.ts
export async function uploadFollowTrackerData(files: {
  followers: File;
  following: File;
}) {
  const formData = new FormData();
  formData.append('followers_file', files.followers);
  formData.append('following_file', files.following);

  const response = await fetch('/api/followtrack/process', {
    method: 'POST',
    body: formData,
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  });

  if (!response.ok) {
    throw new Error('Upload failed');
  }

  return response.json();
}
```

---

## Testing Checklist

### Unit Tests (React)

```typescript
// __tests__/parser-enhanced.test.ts
import { parseInstagramDataEnhanced } from '@/utils/parser-enhanced';

describe('Parser Enhancement', () => {
  it('handles case insensitive usernames', () => {
    const data = [{
      string_list_data: [{
        value: 'TestUser',
        timestamp: 123
      }]
    }];
    
    const result = parseInstagramDataEnhanced(data);
    expect(result.users[0].username).toBe('testuser');
  });

  it('removes unicode zero-width characters', () => {
    const data = [{
      string_list_data: [{
        value: 'test​user',  // Contains zero-width space
        timestamp: 123
      }]
    }];
    
    const result = parseInstagramDataEnhanced(data);
    expect(result.users[0].username).toBe('testuser');
  });

  it('extracts username from URL', () => {
    const data = [{
      string_list_data: [{
        href: 'https://www.instagram.com/_u/username',
        timestamp: 123
      }]
    }];
    
    const result = parseInstagramDataEnhanced(data);
    expect(result.users[0].username).toBe('username');
  });
});
```

### Integration Tests

```typescript
// __tests__/integration.test.ts
import followersData from './fixtures/followers_1.json';
import followingData from './fixtures/following.json';
import { parseInstagramDataEnhanced } from '@/utils/parser-enhanced';
import { compareFollowRelationships } from '@/context/DataContext-enhanced';

it('correctly identifies mutuals', () => {
  const followers = parseInstagramDataEnhanced(followersData).users;
  const following = parseInstagramDataEnhanced(followingData).users;
  
  const { mutuals, unfollowers, fans } = compareFollowRelationships(followers, following);
  
  // Verify counts make sense
  expect(mutuals.length + unfollowers.length).toBe(following.length);
  expect(mutuals.length + fans.length).toBe(followers.length);
});
```

### Manual Validation

1. Upload your `followers_1.json` and `following.json`
2. Open browser DevTools → Console
3. Check logs for:
   - Parse stats (no errors)
   - Relationship counts (should make sense)
   - Mismatch warnings (if any)
4. Verify a few random users:
   - Known mutuals should appear in "Mutual Followers"
   - Known unfollowers should appear in "Unfollowers"
   - Known fans should appear in "Fans"

---

## Rollback Plan

If issues arise:

```bash
# Restore old files
cp src/utils/parser.old.ts src/utils/parser.ts
cp src/context/DataContext.old.tsx src/context/DataContext.tsx

# Restart dev server
npm run dev
```

---

## Performance Monitoring

Add this to your Analytics page:

```typescript
export function Analytics() {
  const { stats } = useData();
  
  return (
    <div className="p-4 bg-blue-50 rounded">
      <h3 className="font-semibold">Parser Performance</h3>
      <p>Format Detected: {stats?.totalFollowers ? '✅' : '⚠️'} {stats?.format}</p>
      <p>Nulls Skipped: {stats?.skipped || 0}</p>
      <p>Duplicates Removed: {stats?.duplicates || 0}</p>
      {stats?.potentialMismatches?.length > 0 && (
        <p className="text-yellow-700">⚠️ {stats.potentialMismatches.length} potential mismatches</p>
      )}
    </div>
  );
}
```

---

## Support & Debugging

If users still report issues:

1. **Enable Verbose Logging:**
   ```typescript
   localStorage.setItem('DEBUG_FOLLOWTRACK', 'true');
   ```

2. **Export diagnostic data:**
   ```typescript
   const { stats } = useData();
   console.log(JSON.stringify(stats, null, 2));
   ```

3. **Check these common issues:**
   - Instagram updated their JSON export format
   - User has special characters in username (emoji, etc)
   - File is corrupted or incomplete
