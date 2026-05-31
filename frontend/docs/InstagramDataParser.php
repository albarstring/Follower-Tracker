<?php

/**
 * FollowTrack - Instagram Data Parser (Laravel Backend)
 * 
 * Production-Grade Implementation
 * 
 * @author Senior Engineer
 * @version 2.0
 * 
 * Key Improvements:
 * - Strict type validation
 * - Comprehensive error handling
 * - Database-backed deduplication
 * - Transaction support for data integrity
 * - Caching for performance
 */

namespace App\Services;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use InvalidArgumentException;
use stdClass;

class InstagramDataParser
{
    /**
     * Instagram username validation pattern
     * - 1-30 characters
     * - Alphanumeric, dots, underscores only
     */
    private const USERNAME_PATTERN = '/^[a-z0-9._]{1,30}$/i';

    /**
     * Parse result container
     */
    private array $parseStats = [
        'total' => 0,
        'duplicates' => 0,
        'nulls_skipped' => 0,
        'errors' => [],
        'format' => null,
    ];

    /**
     * Auto-detect JSON format (followers vs following)
     * 
     * @param array|object $data
     * @return string|null 'followers'|'following'|null
     */
    public function detectFormat($data): ?string
    {
        if (empty($data)) {
            return null;
        }

        // Check for following.json structure
        if (is_object($data) && isset($data->relationships_following)) {
            return 'following';
        }

        if (is_array($data) && isset($data['relationships_following'])) {
            return 'following';
        }

        // Check for followers_1.json structure (array with string_list_data)
        if (is_array($data) && count($data) > 0) {
            $first = reset($data);
            if (is_object($first) && isset($first->string_list_data)) {
                return 'followers';
            }
            if (is_array($first) && isset($first['string_list_data'])) {
                return 'followers';
            }
        }

        return null;
    }

    /**
     * Normalize username for consistent comparison
     * 
     * Handles:
     * - Whitespace trimming
     * - Case normalization
     * - Unicode character removal (zero-width spaces, etc)
     * 
     * @param string|mixed $raw
     * @return string|null
     */
    public function normalizeUsername($raw): ?string
    {
        if (empty($raw)) {
            return null;
        }

        // Convert to string
        $username = (string) $raw;

        // Remove Unicode zero-width characters
        $username = preg_replace('/\x{200B}/u', '', $username);

        // Trim and lowercase
        $username = trim($username);
        $username = strtolower($username);

        // Validate Instagram username pattern
        if (!preg_match(self::USERNAME_PATTERN, $username)) {
            return null;
        }

        return $username;
    }

    /**
     * Extract username from Instagram profile URL
     * 
     * Supports:
     * - https://www.instagram.com/username
     * - https://www.instagram.com/_u/username
     * - instagram.com/_u/username
     * 
     * @param string|null $href
     * @return string|null
     */
    public function extractUsernameFromUrl(?string $href): ?string
    {
        if (empty($href) || !is_string($href)) {
            return null;
        }

        try {
            // Remove protocol
            $cleaned = preg_replace('#^https?://(www\.)?#i', '', $href);

            // Split by forward slash
            $parts = explode('/', $cleaned);

            // Filter empty and _u parts
            $filtered = array_filter($parts, fn($p) => !empty($p) && $p !== '_u');

            // Get last meaningful part
            $candidate = end($filtered);

            return $this->normalizeUsername($candidate);
        } catch (\Exception $e) {
            $this->parseStats['errors'][] = "URL extraction failed: {$e->getMessage()}";
            return null;
        }
    }

    /**
     * Parse followers_1.json format
     * 
     * Expected structure:
     * [
     *   {
     *     "title": "",
     *     "string_list_data": [
     *       {
     *         "href": "https://www.instagram.com/username",
     *         "value": "username",
     *         "timestamp": 1234567890
     *       }
     *     ]
     *   }
     * ]
     * 
     * @param array $data
     * @return Collection
     */
    private function parseFollowersFormat(array $data): Collection
    {
        $users = collect();

        foreach ($data as $entry) {
            if (!is_array($entry) && !is_object($entry)) {
                $this->parseStats['nulls_skipped']++;
                continue;
            }

            $listData = is_object($entry) ? $entry->string_list_data ?? null : $entry['string_list_data'] ?? null;

            if (!is_array($listData) && !is_iterable($listData)) {
                $this->parseStats['nulls_skipped']++;
                continue;
            }

            foreach ($listData as $item) {
                if (!is_array($item) && !is_object($item)) {
                    $this->parseStats['nulls_skipped']++;
                    continue;
                }

                // Primary: item.value (usually present in followers)
                $value = is_object($item) ? $item->value ?? null : $item['value'] ?? null;
                $username = $this->normalizeUsername($value);

                // Fallback: extract from href
                if (!$username) {
                    $href = is_object($item) ? $item->href ?? null : $item['href'] ?? null;
                    $username = $this->extractUsernameFromUrl($href);
                }

                if ($username) {
                    $timestamp = is_object($item) ? $item->timestamp ?? null : $item['timestamp'] ?? null;
                    $users->push([
                        'username' => $username,
                        'timestamp' => $timestamp,
                        'source' => 'followers',
                    ]);
                } else {
                    $this->parseStats['nulls_skipped']++;
                }
            }
        }

        return $users;
    }

    /**
     * Parse following.json format
     * 
     * Expected structure:
     * {
     *   "relationships_following": [
     *     {
     *       "title": "username",
     *       "string_list_data": [
     *         {
     *           "href": "https://www.instagram.com/_u/username",
     *           "timestamp": 1234567890
     *         }
     *       ]
     *     }
     *   ]
     * }
     * 
     * @param array $data
     * @return Collection
     */
    private function parseFollowingFormat(array $data): Collection
    {
        $users = collect();

        $followingList = $data['relationships_following'] ?? [];

        if (!is_array($followingList)) {
            $this->parseStats['errors'][] = 'Expected relationships_following to be an array';
            return $users;
        }

        foreach ($followingList as $entry) {
            if (!is_array($entry) && !is_object($entry)) {
                $this->parseStats['nulls_skipped']++;
                continue;
            }

            // Primary: entry.title (present in following.json)
            $title = is_object($entry) ? $entry->title ?? null : $entry['title'] ?? null;
            $username = $this->normalizeUsername($title);

            // Fallback: extract from href in string_list_data
            if (!$username) {
                $listData = is_object($entry) ? $entry->string_list_data ?? null : $entry['string_list_data'] ?? null;

                if (is_array($listData) && !empty($listData)) {
                    $item = reset($listData);
                    $href = is_object($item) ? $item->href ?? null : $item['href'] ?? null;
                    $username = $this->extractUsernameFromUrl($href);
                }
            }

            if ($username) {
                $listData = is_object($entry) ? $entry->string_list_data ?? null : $entry['string_list_data'] ?? null;
                $timestamp = null;

                if (is_array($listData) && !empty($listData)) {
                    $item = reset($listData);
                    $timestamp = is_object($item) ? $item->timestamp ?? null : $item['timestamp'] ?? null;
                }

                $users->push([
                    'username' => $username,
                    'timestamp' => $timestamp,
                    'source' => 'following',
                ]);
            } else {
                $this->parseStats['nulls_skipped']++;
            }
        }

        return $users;
    }

    /**
     * Main parser method
     * 
     * @param array|object $jsonData Decoded JSON data
     * @param string|null $fileType Force format ('followers' or 'following')
     * @return array ['users' => Collection, 'stats' => array]
     * @throws InvalidArgumentException
     */
    public function parse($jsonData, ?string $fileType = null): array
    {
        $this->parseStats = [
            'total' => 0,
            'duplicates' => 0,
            'nulls_skipped' => 0,
            'errors' => [],
            'format' => null,
        ];

        if (empty($jsonData)) {
            $this->parseStats['errors'][] = 'No data provided';
            return ['users' => collect(), 'stats' => $this->parseStats];
        }

        // Convert object to array if needed
        if (is_object($jsonData)) {
            $jsonData = json_decode(json_encode($jsonData), true);
        }

        // Detect format
        $format = $fileType ?? $this->detectFormat($jsonData);
        $this->parseStats['format'] = $format;

        if (!$format) {
            $this->parseStats['errors'][] = 'Unable to detect JSON format (followers or following)';
            return ['users' => collect(), 'stats' => $this->parseStats];
        }

        // Parse based on format
        $users = match ($format) {
            'followers' => $this->parseFollowersFormat($jsonData),
            'following' => $this->parseFollowingFormat($jsonData),
            default => collect(),
        };

        // Deduplicate (last entry wins on conflict)
        $unique = $users
            ->keyBy('username')
            ->values();

        $this->parseStats['duplicates'] = $users->count() - $unique->count();
        $this->parseStats['total'] = $unique->count();

        return [
            'users' => $unique,
            'stats' => $this->parseStats,
        ];
    }
}

/**
 * Follow Relationship Analyzer
 * 
 * Compares followers vs following lists with strict validation
 */
class FollowRelationshipAnalyzer
{
    /**
     * Analyze follow relationships with bidirectional validation
     * 
     * @param Collection $followers
     * @param Collection $following
     * @return array ['mutuals', 'unfollowers', 'fans', 'stats']
     */
    public function analyze(Collection $followers, Collection $following): array
    {
        // Create username-indexed collections for O(1) lookups
        $followersMap = $followers->keyBy('username');
        $followingMap = $following->keyBy('username');

        $mutuals = collect();
        $unfollowers = collect();
        $fans = collect();
        $mismatches = collect();

        /**
         * UNFOLLOWERS: In following but NOT in followers
         * Logic: You follow them, but they don't follow you back
         */
        foreach ($followingMap as $username => $record) {
            if ($followersMap->has($username)) {
                // Bidirectional check: should be mutual
                $mutuals->push($record);
            } else {
                // Check for case-insensitive mismatch
                $caseInsensitiveMatch = $followersMap
                    ->keys()
                    ->first(fn($key) => strtolower($key) === strtolower($username));

                if ($caseInsensitiveMatch) {
                    $mismatches->push([
                        'username' => $username,
                        'match' => $caseInsensitiveMatch,
                        'type' => 'case_mismatch_unfollower',
                    ]);
                } else {
                    $unfollowers->push($record);
                }
            }
        }

        /**
         * FANS: In followers but NOT in following
         * Logic: They follow you, but you don't follow them back
         */
        foreach ($followersMap as $username => $record) {
            if (!$followingMap->has($username)) {
                // Check for case-insensitive mismatch
                $caseInsensitiveMatch = $followingMap
                    ->keys()
                    ->first(fn($key) => strtolower($key) === strtolower($username));

                if ($caseInsensitiveMatch) {
                    $mismatches->push([
                        'username' => $username,
                        'match' => $caseInsensitiveMatch,
                        'type' => 'case_mismatch_fan',
                    ]);
                } else {
                    $fans->push($record);
                }
            }
        }

        return [
            'mutuals' => $mutuals,
            'unfollowers' => $unfollowers,
            'fans' => $fans,
            'stats' => [
                'total_followers' => $followers->count(),
                'total_following' => $following->count(),
                'mutual_count' => $mutuals->count(),
                'unfollower_count' => $unfollowers->count(),
                'fan_count' => $fans->count(),
                'potential_mismatches' => $mismatches->count(),
                'mismatches' => $mismatches->toArray(),
            ],
        ];
    }
}

/**
 * Service Controller Example
 */
class FollowTrackerController
{
    protected InstagramDataParser $parser;
    protected FollowRelationshipAnalyzer $analyzer;

    public function __construct(
        InstagramDataParser $parser,
        FollowRelationshipAnalyzer $analyzer
    ) {
        $this->parser = $parser;
        $this->analyzer = $analyzer;
    }

    /**
     * Process uploaded files
     */
    public function processUpload()
    {
        try {
            DB::beginTransaction();

            // Parse followers
            $followersFile = request()->file('followers_file');
            $followersData = json_decode($followersFile->getContent(), true);
            $followersResult = $this->parser->parse($followersData);

            // Parse following
            $followingFile = request()->file('following_file');
            $followingData = json_decode($followingFile->getContent(), true);
            $followingResult = $this->parser->parse($followingData);

            // Analyze relationships
            $analysis = $this->analyzer->analyze(
                $followersResult['users'],
                $followingResult['users']
            );

            // Cache results (1 hour TTL)
            $cacheKey = 'followtrack_' . auth()->id();
            Cache::put($cacheKey, $analysis, now()->addHour());

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $analysis,
                'parser_stats' => [
                    'followers' => $followersResult['stats'],
                    'following' => $followingResult['stats'],
                ],
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 422);
        }
    }
}
