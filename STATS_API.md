# Stats API contract

The `/stats` dashboard reads from `/api/stats/*`, which is served by the API
deployed alongside this site — not from this repository. The dashboard needs
three endpoints. They are generic on purpose: the frontend passes the metric type
it wants, so adding a metric to the bot needs no new endpoint here.

Documents come from the bot's **`metrics`** collection
(`src/structures/AnalyticsManager.js` in `uwu-bot-v4`), which stores:

```
daily     { _id: { type, date, ...dimensions }, ...counters, expiresAt }
lifetime  { _id: { type: `${type}Total`, ...dimensions }, ...counters }
```

`date` is a UTC `YYYY-MM-DD` string. Daily documents carry `expiresAt` and are
removed by a TTL index after 180 days; lifetime documents have no `expiresAt` and
are never removed.

Match on dotted paths (`"_id.type"`), never on a whole `_id` sub-document — an
exact sub-document match depends on key order.

## `GET /api/stats/daily?type=<metricType>&days=<n>`

Rows for the last `n` UTC days, oldest first. Flatten `_id` into each row so
`date` and the dimension keys are top-level.

```js
const from = DateTime.utc().minus({ days: days - 1 }).toFormat("yyyy-MM-dd");
const documents = await db.collection("metrics")
  .find({ "_id.type": type, "_id.date": { $gte: from } })
  .toArray();

res.json(
  documents
    .map(({ _id, expiresAt, lastUpdated, ...counters }) => ({ ...counters, ..._id }))
    .sort((a, b) => (a.date < b.date ? -1 : 1))
);
```

Validate `type` against an allowlist so the parameter cannot be used to read
arbitrary collections' documents.

## `GET /api/stats/lifetime?type=<metricType>`

Same shape, without `date`. `type` here is the lifetime type name, e.g.
`commandUsageTotal`.

```js
const documents = await db.collection("metrics").find({ "_id.type": type }).toArray();
res.json(documents.map(({ _id, lastUpdated, ...counters }) => ({ ...counters, ..._id })));
```

## `GET /api/stats/summary`

The KPI row. `AnalyticsManager.getSummary()` already returns exactly this shape,
so the API can call it directly, or reproduce it:

```json
{
  "today": {
    "date": "2026-07-30",
    "servers":  { "count": 0, "increase": 0, "decrease": 0, "delta": 0 },
    "members":  { "count": 0, "increase": 0, "decrease": 0, "delta": 0 },
    "commands": { "count": 0, "slash": 0, "text": 0 },
    "errors":   { "count": 0, "api": 0, "logic": 0, "validation": 0, "rate": 0 },
    "api":      { "count": 0, "ok": 0, "failed": 0, "fellBack": 0, "failureRate": 0 },
    "latency":  { "count": 0, "averageMs": 0, "p95Ms": 0, "maxMs": 0 },
    "resources": {
      "samples": 0, "averageCpuPercent": 0, "peakCpuPercent": 0,
      "averageMemRssMb": 0, "peakMemRssMb": 0, "averageHostCpuPercent": 0
    },
    "topCommands": [{ "command": "hug", "count": 0 }],
    "topErrors":   [{ "command": "hug", "count": 0 }],
    "worstApis":   [{ "api": "nekos.best", "failed": 0, "count": 0 }],
    "retention":   { "leaves": 0, "averageDays": 0, "under24h": 0 },
    "uniqueUsers": 0,
    "activeGuilds": 0
  },
  "yesterday": { "…same shape, minus uniqueUsers/activeGuilds": true },
  "lifetime": {
    "retention": { "leaves": 0, "averageDays": 0, "maxDays": 0, "under24h": 0 }
  }
}
```

`uniqueUsers` and `activeGuilds` are counted from the separate
`metrics_unique` collection, where each set is sharded across bucket documents
so no single document approaches the 16MB BSON limit:

```js
const [result] = await db.collection("metrics_unique").aggregate([
  { $match: { "_id.type": "uniqueUsers", "_id.date": today } },
  { $group: { _id: null, total: { $sum: { $size: { $ifNull: ["$ids", []] } } } } }
]).toArray();
```

## Metric types

Daily type → lifetime type. `—` means the metric has no lifetime analogue.

| Daily | Lifetime | Dimensions | Counters |
|---|---|---|---|
| `allCommandUsage` | `allCommandUsageTotal` | — | `count`, `slashCount`, `textCount` |
| `commandUsage` | `commandUsageTotal` | `command` | `count`, `slashCount`, `textCount` |
| `commandUsageByCategory` | `commandUsageByCategoryTotal` | `category` | `count` |
| `commandUsageBySize` | `commandUsageBySizeTotal` | `range` | `count` |
| `hourlyUsage` | — | `hour` | `count` |
| `commandErrors` | `commandErrorsTotal` | — | `count`, `api`, `logic`, `validation` |
| `commandErrorsByCategory` | `commandErrorsByCategoryTotal` | `category` | as above |
| `commandErrorsByCommand` | `commandErrorsByCommandTotal` | `command` | as above |
| `apiCalls` | `apiCallsTotal` | `api` | `count`, `ok`, `failed`, `fellBack` |
| `commandLatency` | `commandLatencyTotal` | — | `count`, `totalMs`, `le100`…`le10000`, `maxMs` |
| `commandLatencyByCommand` | `commandLatencyByCommandTotal` | `command` | as above |
| `commandBlocked` | `commandBlockedTotal` | `reason` | `count` |
| `commandBlockedByCommand` | `commandBlockedByCommandTotal` | `reason`, `command` | `count` |
| `permissionBlocked` | `permissionBlockedTotal` | `permission` | `count` |
| `unknownCommand` | `unknownCommandTotal` | `attempted` | `count` |
| `guildRetention` | `guildRetentionTotal` | — | `leaves`, `totalDays`, `under24h`, `under7d`, `under30d`, `maxDays` |
| `resourceUsage` | — | — | `samples`, `cpuPercentTotal`, `memRssMbTotal`, `hostCpuPercentTotal`, `maxCpuPercent`, `maxMemRssMb` |
| `resourceUsageByShard` | — | `shard` | as above |
| `totalServerCount` | — | — | `count`, `increase`, `decrease` |
| `serverCount` | — | `range` | `count`, `increase`, `decrease` |
| `totalUserCount` | — | — | `count`, `increase`, `decrease` |
| `memberCountBySize` | — | `range` | `count`, `increase`, `decrease` |
| `guildChurn` | `guildChurnTotal` | — | `joins`, `leaves` |

Notes for anyone consuming these:

- Averages are ratios of stored counters, never stored directly:
  `averageMs = totalMs / count`, `averageCpuPercent = cpuPercentTotal / samples`.
- `le100`…`le10000` are latency histogram buckets. A percentile is the upper edge
  of the bucket the target count lands in — the dashboard and
  `AnalyticsManager.approximatePercentile` compute it the same way.
- `count` on `serverCount` / `memberCountBySize` is a standing total, set from an
  hourly authoritative snapshot. `increase` / `decrease` are flows and are only
  ever incremented.
- Sum across dates when a range spans several days, except the `max*` counters,
  which take the maximum.

## ⚠️ The old collection is frozen — repoint anything reading it

The refactor changed the document model, so it writes to a new collection. The
previous `analytics` collection is **no longer written to**. Its day keys were
host-local rather than UTC and its category counters were inflated by a flush
bug, so the two cannot be merged.

Any endpoint still querying `analytics` returns data frozen at the deploy, while
looking perfectly plausible. These need repointing at `metrics`:

| Endpoint | Serves | Replace with |
|---|---|---|
| `/api/stats` | **the home page's user/server counts** | `daily?type=totalServerCount&days=1` and `totalUserCount`, or the bot's live totals |
| `/api/stats/total-server-count` | old Stats page | `daily?type=totalServerCount` |
| `/api/stats/server-size-distribution` | old Stats page | `daily?type=serverCount&days=1` |
| `/api/stats/command-usage` | old Stats page | `lifetime?type=commandUsageTotal` |
| `/api/stats/command-usage-by-category` | old Stats page | `lifetime?type=commandUsageByCategoryTotal` |

`/api/stats` is the urgent one: it feeds the public home page, so if it reads
`analytics` those numbers stop moving.

The dashboard previously fell back to the four single-purpose endpoints so it
would keep working before the generic ones shipped. Those fallbacks are now
removed — a frozen number presented as today's is worse than an honest "not
available yet", which is what each panel shows until its endpoint exists.

If you want the pre-refactor history on the new charts, backfill it into
`metrics` deliberately: re-key each daily document's date to UTC and skip
`commandUsageByCategory`, whose counts cannot be recovered.

## Access

`/stats` is unlinked, marked `noindex`, and gated behind `REACT_APP_STATS_KEY`
(set it in the site's build environment; the dashboard accepts it via a prompt or
`?key=`). That gate is obscurity, not security — it ships in a public bundle.
**The `/api/stats/*` endpoints are what need to actually authenticate**, since
anyone can call them directly regardless of what the page does.
