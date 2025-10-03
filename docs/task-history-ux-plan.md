# Task History UX Plan for Kilo Code Web Client

## Overview
Design a comprehensive task history system that allows users to view, search, and reload past conversations with the AI agent.

## Core Features

### 1. **Task History Sidebar**
- **Location**: Collapsible sidebar panel (left side of the interface)
- **Toggle**: Button in header to show/hide history panel
- **Layout**: Vertical list of task cards with infinite scroll

### 2. **Task Card Design**
```
┌─────────────────────────────────────┐
│ 📝 Create a React component         │
│ 2 hours ago • 12 messages          │
│ Status: ✅ Completed                │
│ ─────────────────────────────────── │
│ "Can you help me create a simple... │
│ [Preview of first user message]     │
└─────────────────────────────────────┘
```

**Card Elements**:
- **Title**: Auto-generated from first user message (truncated)
- **Timestamp**: Relative time (e.g., "2 hours ago", "Yesterday")
- **Message Count**: Total messages in conversation
- **Status Badge**: Visual indicator (✅ Completed, ⚠️ Error, 🔄 Active)
- **Preview**: First 50 characters of initial user message
- **Actions**: Hover to reveal (Resume, Delete, Export)

### 3. **Search & Filter**
- **Search Bar**: At top of history panel
- **Filters**:
  - Status (All, Active, Completed, Error)
  - Date Range (Today, This Week, This Month, Custom)
  - Message Count (Short <5, Medium 5-20, Long >20)
- **Sort Options**: Recent, Oldest, Most Messages, Alphabetical

### 4. **Task Resumption Flow**

#### **Resume Active Task**:
1. Click on active task card
2. Load conversation history in main chat
3. Continue from where left off
4. Maintain task context and state

#### **Resume Completed Task**:
1. Click on completed task card
2. Show confirmation dialog: "Resume this completed task?"
3. Options:
   - "Continue Conversation" - Add new messages to existing task
   - "Start New Task" - Create new task with context from old one
   - "View Only" - Read-only mode to review conversation

### 5. **WebSocket Message Types**

#### **Client → Server**:
```typescript
// Get task history
{
  type: "get_task_history",
  payload: {
    limit?: number,
    offset?: number,
    filters?: {
      status?: string[],
      dateRange?: { start: Date, end: Date },
      search?: string
    }
  }
}

// Resume task
{
  type: "resume_task", 
  payload: {
    taskId: string,
    mode: "continue" | "new_with_context" | "view_only"
  }
}

// Delete task
{
  type: "delete_task",
  payload: {
    taskId: string
  }
}
```

#### **Server → Client**:
```typescript
// Task history response
{
  type: "task_history_response",
  payload: {
    tasks: TaskHistory[],
    totalCount: number,
    hasMore: boolean
  }
}

// Task resumed
{
  type: "task_resumed",
  payload: {
    taskId: string,
    messages: ChatMessage[],
    status: string
  }
}
```

### 6. **UI Components**

#### **History Panel** (`components/TaskHistory.tsx`):
```tsx
interface TaskHistoryProps {
  isOpen: boolean
  onToggle: () => void
  onTaskSelect: (taskId: string) => void
}
```

#### **Task Card** (`components/TaskCard.tsx`):
```tsx
interface TaskCardProps {
  task: TaskHistory
  isActive?: boolean
  onResume: (taskId: string) => void
  onDelete: (taskId: string) => void
  onExport: (taskId: string) => void
}
```

#### **Search Bar** (`components/TaskSearch.tsx`):
```tsx
interface TaskSearchProps {
  onSearch: (query: string) => void
  onFilter: (filters: TaskFilters) => void
  onSort: (sortBy: SortOption) => void
}
```

### 7. **State Management**

#### **Client State**:
```typescript
interface HistoryState {
  isHistoryOpen: boolean
  tasks: TaskHistory[]
  loading: boolean
  searchQuery: string
  filters: TaskFilters
  selectedTaskId?: string
  hasMore: boolean
}
```

#### **WebSocket Integration**:
- Real-time updates when tasks are created/completed
- Automatic refresh of history when current task status changes
- Optimistic updates for delete operations

### 8. **Mobile Responsive Design**

#### **Desktop** (>768px):
- Sidebar panel (300px width)
- Side-by-side with main chat
- Resizable divider

#### **Mobile** (<768px):
- Full-screen overlay modal
- Swipe gestures for navigation
- Bottom sheet design for task actions

### 9. **Performance Optimizations**

#### **Virtual Scrolling**:
- Load 20 tasks initially
- Infinite scroll with pagination
- Virtual list for large task histories

#### **Caching Strategy**:
- Cache recent tasks in localStorage
- Sync with Firebase on connection
- Optimistic updates for better UX

### 10. **Advanced Features** (Future)

#### **Task Organization**:
- Folders/Tags for grouping related tasks
- Favorites/Bookmarks for important conversations
- Bulk operations (delete multiple, export batch)

#### **Collaboration**:
- Share task links with others
- Export conversations as markdown/PDF
- Import tasks from other users

#### **Analytics**:
- Task completion rates
- Average conversation length
- Most used features

## Implementation Priority

### **Phase 1** (MVP):
1. Basic task history list
2. Simple task resumption
3. WebSocket integration for history

### **Phase 2** (Enhanced):
1. Search and filtering
2. Task status management
3. Mobile responsive design

### **Phase 3** (Advanced):
1. Virtual scrolling
2. Advanced task organization
3. Export/import functionality

## Technical Considerations

### **Data Structure**:
- Firebase collections with "kilo." prefix (already implemented)
- Efficient querying with composite indexes
- Real-time listeners for live updates

### **Security**:
- Client-specific task isolation
- Secure task sharing mechanisms
- Data retention policies

### **Scalability**:
- Pagination for large histories
- Efficient Firebase queries
- Client-side caching strategies

This UX plan provides a comprehensive foundation for task history management while maintaining the real-time, WebSocket-first architecture we've implemented.