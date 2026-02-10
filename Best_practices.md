# React Best Practices Guide

> A comprehensive guide based on code review findings, targeting common pitfalls and establishing patterns for scalable React applications.

---

## Table of Contents

1. [Folder Structure](#1-folder-structure)
2. [Component Architecture](#2-component-architecture)
3. [State Management](#3-state-management)
4. [TypeScript & Data Modeling](#4-typescript--data-modeling)
5. [TanStack Query Best Practices](#5-tanstack-query-best-practices)
6. [Code Organization & DRY Principles](#6-code-organization--dry-principles)
7. [Quick Reference Checklist](#7-quick-reference-checklist)

---

## 1. Folder Structure

### Current Issues

Your current structure mixes concerns. The `api/admin/service.ts` contains both types and API calls, and page components are monolithic.

### Recommended Structure

```
src/
├── api/                          # API layer (thin, only HTTP calls)
│   ├── client.ts                 # Axios instance & interceptors
│   └── endpoints/                # Grouped by domain
│       ├── admin.ts
│       ├── auth.ts
│       └── user.ts
│
├── types/                        # Centralized type definitions
│   ├── index.ts                  # Re-exports
│   ├── user.types.ts
│   ├── admin.types.ts
│   └── api.types.ts              # Generic API response types
│
├── hooks/                        # Custom hooks
│   ├── queries/                  # TanStack Query hooks
│   │   ├── useAdmin.ts
│   │   ├── useAuth.ts
│   │   └── useUser.ts
│   ├── mutations/                # TanStack Mutation hooks
│   │   └── useAdminMutations.ts
│   └── ui/                       # UI-related hooks
│       ├── useModal.ts
│       └── useClickOutside.ts
│
├── components/
│   ├── ui/                       # Atomic/design system components
│   │   ├── Button/
│   │   ├── Modal/
│   │   ├── Table/
│   │   └── Select/
│   ├── common/                   # Shared compound components
│   │   ├── DataTable/
│   │   ├── ConfirmDialog/
│   │   └── AssignmentDropdown/
│   └── features/                 # Feature-specific components
│       ├── admin/
│       │   ├── PendingApprovals/
│       │   ├── StudentAssignment/
│       │   └── CoachAssignment/
│       └── auth/
│
├── pages/                        # Route-level components (thin)
│   ├── Admin/
│   │   └── AdminPage.tsx         # Composes feature components
│   └── Dashboard/
│
├── constants/                    # App-wide constants & enums
│   ├── roles.ts
│   └── queryKeys.ts
│
├── utils/                        # Pure utility functions
│   └── formatters.ts
│
└── context/                      # React contexts
    └── AuthContext.tsx
```

### Key Principles

1. **Colocation**: Keep related code together (component + styles + tests + types)
2. **Flat over nested**: Avoid deep nesting (max 3 levels)
3. **Feature folders**: Group by feature, not by type, for complex domains
4. **Index exports**: Use barrel files for cleaner imports

---

## 2. Component Architecture

### Current Issues in `AdminPage.tsx`

```tsx
// ❌ PROBLEM: 500+ line monolithic component
// - 15 useState hooks
// - Multiple responsibilities
// - Hard to test and maintain
```

### Solution: Component Decomposition

#### Rule: Single Responsibility

Each component should do ONE thing well. Split `AdminPage.tsx` into:

```tsx
// ✅ BETTER: Thin page component that composes features
// src/pages/Admin/AdminPage.tsx
export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabType>("pending");

  return (
    <div>
      <PageMeta title="Admin Dashboard" />
      <PageBreadcrumb pageTitle="Admin Dashboard" />
      
      <AdminTabs activeTab={activeTab} onTabChange={setActiveTab} />
      
      <AdminTabContent activeTab={activeTab} />
    </div>
  );
}

// src/components/features/admin/AdminTabContent.tsx
function AdminTabContent({ activeTab }: { activeTab: TabType }) {
  switch (activeTab) {
    case "pending":
      return <PendingApprovals />;
    case "students":
      return <StudentAssignments />;
    case "coaches":
      return <CoachAssignments />;
  }
}
```

#### Rule: Extract Repeated Patterns

```tsx
// ❌ BEFORE: Repeated table structure in each tab
<Table>
  <TableHeader>...</TableHeader>
  <TableBody>
    {items.map(item => <TableRow>...</TableRow>)}
  </TableBody>
</Table>

// ✅ AFTER: Generic DataTable component
interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  emptyMessage?: string;
  isLoading?: boolean;
}

function DataTable<T>({ data, columns, emptyMessage, isLoading }: DataTableProps<T>) {
  if (isLoading) return <TableSkeleton />;
  if (data.length === 0) return <EmptyState message={emptyMessage} />;
  
  return (
    <Table>
      <TableHeader columns={columns} />
      <TableBody data={data} columns={columns} />
    </Table>
  );
}
```

#### Rule: Extract Custom Hooks for Logic

```tsx
// ❌ BEFORE: Logic embedded in component
const [openMenuId, setOpenMenuId] = useState<string | null>(null);
const menuRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
      setOpenMenuId(null);
    }
  };
  if (openMenuId) {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }
}, [openMenuId]);

// ✅ AFTER: Reusable hook
// src/hooks/ui/useClickOutside.ts
export function useClickOutside<T extends HTMLElement>(
  callback: () => void
): React.RefObject<T> {
  const ref = useRef<T>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [callback]);

  return ref;
}

// Usage
const menuRef = useClickOutside<HTMLDivElement>(() => setOpenMenuId(null));
```

---

## 3. State Management

### Current Issues

```tsx
// ❌ PROBLEM: Too many related useState calls
const [assigningStudentId, setAssigningStudentId] = useState<string | null>(null);
const [assigningCoachId, setAssigningCoachId] = useState<string | null>(null);
const [selectedCoachForStudent, setSelectedCoachForStudent] = useState<Record<string, string>>({});
const [selectedMentorForCoach, setSelectedMentorForCoach] = useState<Record<string, string>>({});
const [openMenuId, setOpenMenuId] = useState<string | null>(null);
const [updateModalOpen, setUpdateModalOpen] = useState(false);
const [updateType, setUpdateType] = useState<"student" | "coach" | null>(null);
const [updateTargetId, setUpdateTargetId] = useState<string | null>(null);
const [updateSelectedCoach, setUpdateSelectedCoach] = useState<string>("");
const [updateSelectedMentor, setUpdateSelectedMentor] = useState<string>("");
```

### Solution 1: Group Related State with useReducer

```tsx
// ✅ BETTER: useReducer for complex related state
interface UpdateModalState {
  isOpen: boolean;
  type: "student" | "coach" | null;
  targetId: string | null;
  selectedValue: string;
}

type UpdateModalAction =
  | { type: "OPEN"; payload: { type: "student" | "coach"; targetId: string; initialValue: string } }
  | { type: "CLOSE" }
  | { type: "SET_VALUE"; payload: string };

function updateModalReducer(state: UpdateModalState, action: UpdateModalAction): UpdateModalState {
  switch (action.type) {
    case "OPEN":
      return {
        isOpen: true,
        type: action.payload.type,
        targetId: action.payload.targetId,
        selectedValue: action.payload.initialValue,
      };
    case "CLOSE":
      return { isOpen: false, type: null, targetId: null, selectedValue: "" };
    case "SET_VALUE":
      return { ...state, selectedValue: action.payload };
    default:
      return state;
  }
}

// Usage
const [modalState, dispatch] = useReducer(updateModalReducer, {
  isOpen: false,
  type: null,
  targetId: null,
  selectedValue: "",
});
```

### Solution 2: Custom Hook for Feature State

```tsx
// src/hooks/useAssignmentModal.ts
interface UseAssignmentModalReturn {
  isOpen: boolean;
  type: "student" | "coach" | null;
  targetId: string | null;
  selectedValue: string;
  open: (type: "student" | "coach", targetId: string, initialValue: string) => void;
  close: () => void;
  setValue: (value: string) => void;
}

export function useAssignmentModal(): UseAssignmentModalReturn {
  const [state, dispatch] = useReducer(updateModalReducer, initialState);

  const open = useCallback((type: "student" | "coach", targetId: string, initialValue: string) => {
    dispatch({ type: "OPEN", payload: { type, targetId, initialValue } });
  }, []);

  const close = useCallback(() => dispatch({ type: "CLOSE" }), []);
  
  const setValue = useCallback((value: string) => {
    dispatch({ type: "SET_VALUE", payload: value });
  }, []);

  return { ...state, open, close, setValue };
}
```

### State Location Guidelines

| State Type | Location | Example |
|------------|----------|---------|
| Server state | TanStack Query | User data, lists |
| UI state (local) | useState/useReducer | Modal open, selected tab |
| UI state (shared) | Context or Zustand | Theme, sidebar open |
| Form state | React Hook Form | Form inputs |
| URL state | React Router | Filters, pagination |

---

## 4. TypeScript & Data Modeling

### Current Issues

```tsx
// ❌ PROBLEM: Using string instead of enum
const isAdmin = user?.role?.toLowerCase() === "admin";

// ❌ PROBLEM: role defined as `string` instead of using UserRole enum
export interface User {
  role: string;  // Should use UserRole enum
}
```

### Solution 1: Use Enums Consistently

You already have `UserRole` enum in `dto.ts` — use it everywhere:

```tsx
// src/types/user.types.ts
export enum UserRole {
  STUDENT = "student",
  COACH = "coach",
  MENTOR = "mentor",
  ADMIN = "admin",
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;  // ✅ Use enum, not string
  approved: boolean;
  // ...
}

// Usage
const isAdmin = user?.role === UserRole.ADMIN;  // ✅ Type-safe
```

### Solution 2: Discriminated Unions for Related Types

```tsx
// ❌ BEFORE: Separate interfaces with optional fields
export interface StudentWithAssignment extends User {
  coach_id?: string;
  mentor_coach_id?: string;
  assigned_at?: string;
}

// ✅ AFTER: Discriminated union for clarity
interface BaseAssignment {
  assigned_at: string;
}

interface StudentCoachAssignment extends BaseAssignment {
  type: "student_coach";
  student_id: string;
  coach_id: string;
}

interface CoachMentorAssignment extends BaseAssignment {
  type: "coach_mentor";
  coach_id: string;
  mentor_coach_id: string;
}

type Assignment = StudentCoachAssignment | CoachMentorAssignment;

// Now you can use type narrowing
function handleAssignment(assignment: Assignment) {
  if (assignment.type === "student_coach") {
    // TypeScript knows this is StudentCoachAssignment
    console.log(assignment.student_id);
  }
}
```

### Solution 3: Strict Null Checks

```tsx
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true  // Arrays/objects return T | undefined
  }
}

// ❌ BEFORE: Unsafe access
const mentor = coaches.find(m => m.id === coach.mentor_coach_id);
return mentor.first_name;  // Runtime error if undefined!

// ✅ AFTER: Handle undefined explicitly
const mentor = coaches.find(m => m.id === coach.mentor_coach_id);
return mentor?.first_name ?? "Unknown";  // Safe
```

### Solution 4: Branded Types for IDs

```tsx
// Prevent mixing up different ID types
type UserId = string & { readonly __brand: "UserId" };
type CoachId = string & { readonly __brand: "CoachId" };
type StudentId = string & { readonly __brand: "StudentId" };

// Helper functions to create branded types
const toUserId = (id: string): UserId => id as UserId;
const toCoachId = (id: string): CoachId => id as CoachId;

// Now the compiler catches mistakes
function assignCoach(studentId: StudentId, coachId: CoachId): void { }

assignCoach(toCoachId("123"), toStudentId("456"));  // ❌ Compile error!
assignCoach(toStudentId("123"), toCoachId("456"));  // ✅ Correct
```

---

## 5. TanStack Query Best Practices

### Current Issues

```tsx
// ❌ PROBLEM 1: Query keys as inline arrays (no consistency)
queryKey: ["admin", "unapproved-users"]
queryKey: ["admin", "students"]

// ❌ PROBLEM 2: Mutations defined inline in component
const approveMutation = useMutation({
  mutationFn: approveUser,
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin"] });
  },
});

// ❌ PROBLEM 3: No error boundaries or loading states beyond simple check
```

### Solution 1: Centralized Query Keys

```tsx
// src/constants/queryKeys.ts
export const queryKeys = {
  admin: {
    all: ["admin"] as const,
    unapprovedUsers: () => [...queryKeys.admin.all, "unapproved-users"] as const,
    students: () => [...queryKeys.admin.all, "students"] as const,
    coaches: () => [...queryKeys.admin.all, "coaches"] as const,
  },
  user: {
    all: ["user"] as const,
    profile: (id: string) => [...queryKeys.user.all, "profile", id] as const,
  },
} as const;

// Usage
queryKey: queryKeys.admin.unapprovedUsers()
```

### Solution 2: Custom Query Hooks (Separation of Concerns)

```tsx
// src/hooks/queries/useAdminQueries.ts
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/constants/queryKeys";
import { fetchUnapprovedUsers, fetchStudentsWithAssignments } from "@/api/endpoints/admin";
import type { User, StudentWithAssignment } from "@/types";

export function useUnapprovedUsers(enabled = true) {
  return useQuery({
    queryKey: queryKeys.admin.unapprovedUsers(),
    queryFn: fetchUnapprovedUsers,
    enabled,
    staleTime: 30_000,  // Data fresh for 30 seconds
  });
}

export function useStudents(enabled = true) {
  return useQuery({
    queryKey: queryKeys.admin.students(),
    queryFn: fetchStudentsWithAssignments,
    enabled,
    staleTime: 30_000,
  });
}

export function useCoaches(enabled = true) {
  return useQuery({
    queryKey: queryKeys.admin.coaches(),
    queryFn: fetchCoachesWithAssignments,
    enabled,
    staleTime: 30_000,
  });
}

// Combine related queries
export function useAdminData(enabled = true) {
  const unapproved = useUnapprovedUsers(enabled);
  const students = useStudents(enabled);
  const coaches = useCoaches(enabled);

  return {
    unapprovedUsers: unapproved.data ?? [],
    students: students.data ?? [],
    coaches: coaches.data ?? [],
    isLoading: unapproved.isLoading || students.isLoading || coaches.isLoading,
    isError: unapproved.isError || students.isError || coaches.isError,
    error: unapproved.error || students.error || coaches.error,
  };
}
```

### Solution 3: Custom Mutation Hooks

```tsx
// src/hooks/mutations/useAdminMutations.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/constants/queryKeys";
import { approveUser, setStudentCoachAssignment, setCoachMentorAssignment } from "@/api/endpoints/admin";
import { toast } from "sonner";  // Or your toast library

export function useApproveUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: approveUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
      toast.success("User approved successfully");
    },
    onError: (error) => {
      toast.error(`Failed to approve user: ${error.message}`);
    },
  });
}

export function useStudentAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ studentId, coachId }: { studentId: string; coachId: string }) =>
      setStudentCoachAssignment(studentId, coachId),
    onSuccess: () => {
      // Invalidate both to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.students() });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.coaches() });
      toast.success("Assignment updated");
    },
    onError: (error) => {
      toast.error(`Failed to update assignment: ${error.message}`);
    },
  });
}
```

### Solution 4: Optimistic Updates for Better UX

```tsx
export function useApproveUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: approveUser,
    
    // Optimistic update
    onMutate: async (userId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.admin.unapprovedUsers() });

      // Snapshot previous value
      const previousUsers = queryClient.getQueryData<User[]>(queryKeys.admin.unapprovedUsers());

      // Optimistically remove from list
      queryClient.setQueryData<User[]>(
        queryKeys.admin.unapprovedUsers(),
        (old) => old?.filter(u => u.id !== userId) ?? []
      );

      return { previousUsers };
    },
    
    // Rollback on error
    onError: (err, userId, context) => {
      queryClient.setQueryData(queryKeys.admin.unapprovedUsers(), context?.previousUsers);
      toast.error("Failed to approve user");
    },
    
    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
    },
  });
}
```

### Solution 5: Loading & Error States

```tsx
// src/components/common/QueryWrapper.tsx
interface QueryWrapperProps<T> {
  query: UseQueryResult<T>;
  children: (data: T) => React.ReactNode;
  loadingFallback?: React.ReactNode;
  errorFallback?: (error: Error) => React.ReactNode;
}

export function QueryWrapper<T>({
  query,
  children,
  loadingFallback = <Skeleton />,
  errorFallback = (error) => <ErrorDisplay error={error} />,
}: QueryWrapperProps<T>) {
  if (query.isLoading) return loadingFallback;
  if (query.isError) return errorFallback(query.error);
  if (!query.data) return null;
  
  return children(query.data);
}

// Usage
<QueryWrapper query={studentsQuery}>
  {(students) => <StudentTable students={students} />}
</QueryWrapper>
```

---

## 6. Code Organization & DRY Principles

### Current Issues

```tsx
// ❌ PROBLEM 1: Repeated badge logic
{student.coach_id || student.mentor_coach_id ? (
  <Badge size="sm" color="success">Assigned</Badge>
) : (
  <Badge size="sm" color="warning">Unassigned</Badge>
)}

// ❌ PROBLEM 2: Repeated dropdown options logic
const getAvailableCoaches = () => {
  return coaches
    .filter(c => !c.is_mentor && c.role === "coach")
    .map(c => ({
      value: c.id,
      label: `${c.first_name} ${c.last_name} (${c.email})`
    }));
};

const getAvailableMentorCoaches = () => {
  return coaches
    .filter(c => c.role === "mentor")
    .map(c => ({
      value: c.id,
      label: `${c.first_name} ${c.last_name} (${c.email})`
    }));
};

// ❌ PROBLEM 3: Repeated menu dropdown structure
```

### Solution 1: Create Reusable Components

```tsx
// src/components/common/AssignmentBadge.tsx
interface AssignmentBadgeProps {
  isAssigned: boolean;
}

export function AssignmentBadge({ isAssigned }: AssignmentBadgeProps) {
  return (
    <Badge size="sm" color={isAssigned ? "success" : "warning"}>
      {isAssigned ? "Assigned" : "Unassigned"}
    </Badge>
  );
}
```

### Solution 2: Extract Utility Functions

```tsx
// src/utils/formatters.ts
export function formatUserOption(user: Pick<User, 'id' | 'first_name' | 'last_name' | 'email'>) {
  return {
    value: user.id,
    label: `${user.first_name} ${user.last_name} (${user.email})`,
  };
}

export function formatUserName(user: Pick<User, 'first_name' | 'last_name'>) {
  return `${user.first_name} ${user.last_name}`;
}

// Usage
const coachOptions = coaches
  .filter(c => c.role === UserRole.COACH)
  .map(formatUserOption);
```

### Solution 3: Generic Action Menu Component

```tsx
// src/components/common/ActionMenu.tsx
interface ActionMenuItem {
  label: string;
  onClick: () => void;
  variant?: "default" | "danger";
  show?: boolean;
}

interface ActionMenuProps {
  items: ActionMenuItem[];
  isOpen: boolean;
  onToggle: () => void;
}

export function ActionMenu({ items, isOpen, onToggle }: ActionMenuProps) {
  const ref = useClickOutside<HTMLDivElement>(onToggle);
  const visibleItems = items.filter(item => item.show !== false);

  if (visibleItems.length === 0) return null;

  return (
    <div className="relative" ref={ref}>
      <button onClick={onToggle} className="p-1 hover:bg-gray-100 rounded">
        <MoreDotIcon className="w-5 h-5" />
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-1 w-48 bg-white border rounded-lg shadow-lg z-10">
          {visibleItems.map((item, index) => (
            <button
              key={index}
              onClick={item.onClick}
              className={cn(
                "w-full text-left px-4 py-2 text-sm hover:bg-gray-100",
                item.variant === "danger" && "text-red-600"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Usage
<ActionMenu
  isOpen={openMenuId === `student-${student.id}`}
  onToggle={() => toggleMenu(`student-${student.id}`)}
  items={[
    { label: "Update Assignment", onClick: () => handleUpdate(student.id), show: !!student.coach_id },
    { label: "Remove Assignment", onClick: () => handleRemove(student.id), variant: "danger", show: !!student.coach_id },
  ]}
/>
```

### Solution 4: Avoid Inline Functions in JSX

```tsx
// ❌ BEFORE: New function created on each render
<Button onClick={() => handleAssignStudent(student.id, selectedCoachForStudent[student.id] || "")}>

// ✅ AFTER: Use useCallback or extract handler
const createAssignHandler = useCallback(
  (studentId: string) => () => {
    handleAssignStudent(studentId, selectedCoachForStudent[studentId] || "");
  },
  [selectedCoachForStudent, handleAssignStudent]
);

<Button onClick={createAssignHandler(student.id)}>

// Or better: Extract to a row component that receives the handler
<StudentRow
  student={student}
  onAssign={handleAssignStudent}
  selectedCoach={selectedCoachForStudent[student.id]}
/>
```

---

## 7. Quick Reference Checklist

### Before Creating a Component

- [ ] Is it doing ONE thing? (Single Responsibility)
- [ ] Could this be split into smaller components?
- [ ] Is there similar code elsewhere that should be abstracted?
- [ ] Are props properly typed with interfaces?

### State Management

- [ ] Is this server state? → Use TanStack Query
- [ ] Is this form state? → Use React Hook Form
- [ ] Are there 3+ related useState? → Consider useReducer
- [ ] Is state needed by siblings? → Lift up or use Context
- [ ] Is state derived? → Use useMemo instead of useState

### TypeScript

- [ ] No `any` types
- [ ] No type assertions (`as`) without justification
- [ ] Using enums/constants instead of magic strings
- [ ] All function parameters and returns typed
- [ ] Strict null checks handled (`?.`, `??`, early returns)

### TanStack Query

- [ ] Query keys defined in constants file
- [ ] Queries in custom hooks, not inline
- [ ] Mutations have onError handling
- [ ] Loading and error states handled
- [ ] staleTime configured appropriately

### Performance

- [ ] No inline functions in frequently re-rendered JSX
- [ ] useCallback for handlers passed as props
- [ ] useMemo for expensive computations
- [ ] React.memo for pure presentational components
- [ ] Keys are stable (not index for dynamic lists)

### Code Quality

- [ ] No duplicate code (DRY)
- [ ] Meaningful variable/function names
- [ ] Complex logic extracted to named functions
- [ ] No magic numbers/strings
- [ ] Console.log removed before commit

---

## Example Refactored Structure

Here's how your `AdminPage.tsx` should look after refactoring:

```tsx
// src/pages/Admin/AdminPage.tsx (< 50 lines!)
import { useState } from "react";
import PageMeta from "@/components/common/PageMeta";
import PageBreadcrumb from "@/components/common/PageBreadcrumb";
import { AdminTabs } from "@/components/features/admin/AdminTabs";
import { PendingApprovals } from "@/components/features/admin/PendingApprovals";
import { StudentAssignments } from "@/components/features/admin/StudentAssignments";
import { CoachAssignments } from "@/components/features/admin/CoachAssignments";
import { useAdminData } from "@/hooks/queries/useAdminQueries";
import { useRequireRole } from "@/hooks/useRequireRole";
import { UserRole } from "@/types";
import type { TabType } from "./types";

export default function AdminPage() {
  useRequireRole(UserRole.ADMIN);  // Redirect if not admin
  const [activeTab, setActiveTab] = useState<TabType>("pending");
  const { isLoading, isError, error } = useAdminData();

  if (isLoading) return <AdminPageSkeleton />;
  if (isError) return <ErrorDisplay error={error} />;

  return (
    <div>
      <PageMeta title="Admin Dashboard | Chess Dashboard" />
      <PageBreadcrumb pageTitle="Admin Dashboard" />
      
      <AdminTabs activeTab={activeTab} onTabChange={setActiveTab} />
      
      {activeTab === "pending" && <PendingApprovals />}
      {activeTab === "students" && <StudentAssignments />}
      {activeTab === "coaches" && <CoachAssignments />}
    </div>
  );
}
```

---

## Resources

- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [Bulletproof React](https://github.com/alan2207/bulletproof-react)
- [Kent C. Dodds Blog](https://kentcdodds.com/blog)

---

*Generated from code review of chess-dashboard-FE project*
