# Frontend structure

```
src/
  api/          One module per backend resource. All HTTP goes through api/client.js.
  auth/         session.js: the logged-in user (token, role, region/school), role home pages and page access.
  components/   Reusable UI (PageHeader, StatCard, DataState, SchoolReport, ...).
  hooks/        useAsync (load data), usePagination (client-side paging).
  layout/       App shell (route guard, header) and the role-based sidebar.
  pages/        One file per route, grouped by role: admin/, regional/, school/, auth/.
  utils/        Small pure helpers (formatDate, formatRate, ...).
  router.jsx    Every route, grouped by role.
```

## Conventions

**Calling the backend.** Import named functions from `src/api/*`; don't use axios or
`localStorage` in pages. The client adds the auth token and logs the user out on a 401.
Every failed call throws an `ApiError` whose `message` is safe to show the user, so a
`catch (err)` can display `err.message`.

| Module | Endpoints | Used by |
| --- | --- | --- |
| `regions`, `districts`, `schools`, `academicYears`, `subjects` | `/admin/...` reference data (reads open to all roles) | everyone |
| `students`, `transfers`, `reports` | `/admin/...` | super admin |
| `regionPortal` | `/region/:regionId/...` (read-only) | regional admin |
| `schoolPortal` | `/school/:schoolId/...` | school manager |
| `auth` | `/login` | login page |

**Loading data in a page.** Use `useAsync` with a memoized loader, and `DataState` to
render the loading, error and empty states:

```jsx
const { regionId } = useParams();
const { data: districts = [], loading, error, reload } = useAsync(
  useCallback(() => listRegionDistricts(regionId), [regionId])
);

<DataState loading={loading} error={error} onRetry={reload} empty={!districts.length}>
  ...table...
</DataState>
```

**IDs come from the URL.** Region and school pages read `regionId` / `schoolId` from
`useParams()`, not from storage. The app shell already guarantees the URL ID is the
logged-in user's own region or school.

**Filters that other pages link to** (for example `?district=3`) live in the URL via
`useSearchParams`, so links like "View schools in this district" work.

**Adding a page:** create it under `pages/<role>/`, add the route in `router.jsx`, and
add the sidebar link in `layout/UnifiedSidebar.jsx`.

## UI design system

Every page uses the same look (based on the Student Enrollment page): a gradient header,
pill tabs, white cards with a coloured accent edge, soft inputs and pill buttons.
Build pages from `src/components/ui` (styles in `src/styles/ui.css`, all classes `ui-*`):

```jsx
import { Page, Card, Table, Button, IconButton, Field, Select, StatTile } from "../../components/ui";

<Page icon="bi-book-half" title="Subjects" subtitle="…" stats={[{ label: "Subjects", value: 8 }]}
      actions={<Button variant="ghost" icon="bi-plus-lg">Add</Button>}
      tabs={[{ key: "list", label: "All", icon: "bi-list-ul", count: 8 }]} activeTab={tab} onTabChange={setTab}>
  <div className="ui-grid ui-cols-4">{/* StatTile × 4 */}</div>
  <Card accent="blue" icon="bi-list-ul" title="All Subjects" actions={<SearchInput … />} flush>
    <DataState …><Table>…</Table></DataState>
  </Card>
</Page>
```

| Component | Use for |
| --- | --- |
| `Page` | Every page: header (icon, title, subtitle, header stats, actions) + optional tabs |
| `Card` | Sections. `accent`: blue, green, amber, red, purple, slate. `flush` for tables |
| `StatTile` | Summary numbers; lay out in `ui-grid ui-cols-4` |
| `Table` | Data tables; cell classes `num`, `center`, `end`, `strong` |
| `Button`, `IconButton` | Actions. `Button variant`: primary, ghost, danger, success; `to` makes a link. `IconButton kind`: view, edit, delete, save |
| `Field` + `Input` / `Select` / `Textarea` / `Switch` / `Segmented` | Forms; lay out in `ui-grid ui-cols-2/3/4` |
| `SearchInput`, `Badge`, `Person`, `Notice`, `EmptyState`, `Dialog` | Search boxes, labels, avatar + name, messages, empty states, modals |
| `DataState`, `TablePagination`, `DetailRow`, `ConfirmModal`, `TransferStatusBadge` | Shared pieces already styled to match |

Bootstrap is still loaded (for react-bootstrap's Modal/Toast and a few utilities like
`me-2`), but pages should not use Bootstrap cards, tables, forms or buttons. Page-specific
styles go in a co-located CSS module (`MyPage.module.css`) so they cannot leak; never put
global rules (`body`, `*`, `.btn`, …) in a page.

## Not built yet

Notifications have no backend; every role's Notifications page shows a placeholder.
