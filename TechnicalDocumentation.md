# Technical Documentation - AgriRent Pro

## System Architecture

### Overview
AgriRent Pro is a full-stack web application following a client-server architecture with clear separation of concerns:

```
┌─────────────────┐         HTTP/JSON          ┌──────────────────┐
│                 │◄──────────────────────────►│                  │
│  React Frontend │         REST API           │  Flask Backend   │
│   (Port 3000)   │                            │   (Port 5000)    │
│                 │                            │                  │
└─────────────────┘                            └────────┬─────────┘
                                                        │
                                                        │ SQL
                                                        ▼
                                                 ┌──────────────┐
                                                 │   SQLite     │
                                                 │   Database   │
                                                 └──────────────┘
```

## Backend Architecture (Flask)

### Application Structure

#### 1. Database Layer (`get_connection()`, `setup_db()`)
- **Connection Management**: SQLite database connections
- **Schema Creation**: Automatic table creation on first run
- **Row Factory**: Configured to return dictionary-like rows for easy JSON serialization

#### 2. Security Layer
```python
# Password Validation
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter  
- At least 1 digit
- At least 1 special character (@$!%*?&)

# Password Hashing
- Algorithm: SHA-256
- Salt: Not implemented (consider adding for production)

# Input Sanitization
- Removes: < > / characters
- Purpose: Prevent XSS attacks

# JWT Authentication
- Token expiry: 24 hours
- Payload: username, role, expiration
- Algorithm: HS256
```

#### 3. Authentication Middleware
```python
@token_required
- Extracts JWT from Authorization header
- Validates token
- Passes username and role to route handler

@admin_required  
- Built on top of @token_required
- Checks if role == 'admin'
- Returns 403 if not admin
```

#### 4. API Routes

**Authentication Routes:**
- `POST /api/register`: Create new user account
  - Input: name, username, password, role
  - Validation: Password strength, username uniqueness
  - Output: Success message or error

- `POST /api/login`: Authenticate user
  - Input: username, password
  - Features: Account lockout (3 attempts), 30-second cooldown
  - Output: JWT token, user info, or error

**Equipment Routes (Protected):**
- `GET /api/equipment`: Get all active equipment
  - Auth: Required (any role)
  - Output: Array of active equipment

- `GET /api/equipment/all`: Get all equipment including inactive
  - Auth: Admin only
  - Output: Array of all equipment

- `POST /api/equipment`: Add new equipment
  - Auth: Admin only
  - Input: name, price
  - Output: Success with equipment ID

- `PUT /api/equipment/<id>/activate`: Activate equipment
  - Auth: Admin only
  - Output: Success or not found

- `PUT /api/equipment/<id>/deactivate`: Deactivate equipment
  - Auth: Admin only
  - Output: Success or not found

**Rental Routes (Protected):**
- `POST /api/rentals`: Create rental
  - Auth: Required (customer)
  - Input: equipment_id, days
  - Validation: Equipment exists and is active
  - Calculation: total = price × days
  - Output: rental_id and total

- `GET /api/rentals/my`: Get user's rentals
  - Auth: Required (customer)
  - Output: Array of user's rentals with equipment details

- `GET /api/rentals`: Get all rentals
  - Auth: Admin only
  - Output: Array of all rentals with user and equipment details

- `PUT /api/rentals/<id>/return`: Return equipment
  - Auth: Required (customer)
  - Validation: Rental belongs to user and is active
  - Output: Success or not found

**Analytics Routes (Protected):**
- `GET /api/reports/revenue`: Revenue report
  - Auth: Admin only
  - Aggregation: SUM by equipment for returned rentals
  - Output: Revenue by equipment + grand total

- `GET /api/audit-logs`: System audit logs
  - Auth: Admin only
  - Output: Last 100 audit entries with readable timestamps

- `GET /api/stats/dashboard`: Dashboard statistics
  - Auth: Required (role-specific data)
  - Admin stats: equipment count, active rentals, revenue, customers
  - Customer stats: active rentals, total rentals, total spent
  - Output: Statistics object

#### 5. Audit Logging System
```python
def log_action(username, action):
    - Logs all significant system events
    - Stores: username, action description, timestamp
    - Actions logged:
      * USER_REGISTERED
      * LOGIN_SUCCESS / LOGIN_FAIL / LOGIN_FAIL_LOCKED
      * EQUIPMENT_ADDED / ACTIVATED / DEACTIVATED
      * RENT_EQUIPMENT / RETURN_EQUIPMENT
```

### Database Design

#### Users Table
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    failed_attempts INTEGER DEFAULT 0,
    lock_time REAL
)
```

#### Equipment Table
```sql
CREATE TABLE equipment (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    is_active INTEGER DEFAULT 1
)
```

#### Rentals Table
```sql
CREATE TABLE rentals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    equipment_id INTEGER NOT NULL,
    days INTEGER NOT NULL,
    total REAL NOT NULL,
    status TEXT NOT NULL,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id)
)
```

#### Audit Logs Table
```sql
CREATE TABLE audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    action TEXT NOT NULL,
    timestamp REAL NOT NULL
)
```

## Frontend Architecture (React)

### Component Hierarchy

```
App (Router + Auth Context)
├── Login
├── Register
├── AdminDashboard
│   ├── Sidebar Navigation
│   ├── Overview (Dashboard Stats)
│   ├── Equipment (CRUD Operations)
│   ├── Rentals (View All)
│   ├── Reports (Revenue Analytics)
│   └── AuditLogs (System Logs)
└── CustomerDashboard
    ├── Sidebar Navigation
    ├── CustomerOverview (Personal Stats)
    ├── BrowseEquipment (Catalog)
    └── MyRentals (Personal Rentals)
```

### State Management

#### Authentication Context
```javascript
AuthContext provides:
- auth: { isAuthenticated, token, user, role }
- login(token, username, role, name)
- logout()

Stored in localStorage:
- token
- username  
- role
- name

Used throughout app for:
- Protected routes
- API authorization headers
- User-specific UI
```

#### Component-Level State
Each component manages its own state:
- `loading`: Loading indicators
- `error`: Error messages
- `success`: Success messages
- `data`: Component-specific data (equipment, rentals, etc.)
- `formData`: Form inputs
- `showModal`: Modal visibility

### Routing Structure

```javascript
/ → Redirect based on auth status
/login → Login component
/register → Register component
/admin/* → AdminDashboard (protected, admin only)
  /admin → Overview
  /admin/equipment → Equipment management
  /admin/rentals → All rentals
  /admin/reports → Revenue reports
  /admin/audit → Audit logs
/customer/* → CustomerDashboard (protected, customer only)
  /customer → CustomerOverview
  /customer/browse → Browse equipment
  /customer/rentals → My rentals
```

### API Service Layer

```javascript
// services/api.js
- Axios instance with base URL
- Request interceptor: Adds JWT token
- Centralized API methods:
  * Auth: register(), login()
  * Equipment: getEquipment(), addEquipment(), etc.
  * Rentals: createRental(), getMyRentals(), etc.
  * Analytics: getRevenueReport(), getDashboardStats(), etc.
```

### UI/UX Design Patterns

#### 1. Glassmorphism
```css
background: rgba(255, 255, 255, 0.05);
backdrop-filter: blur(20px);
border: 1px solid rgba(255, 255, 255, 0.1);
```
Creates frosted glass effect with depth

#### 2. Gradient Accents
```css
background: linear-gradient(135deg, #10b981 0%, #059669 100%);
```
Used for buttons, highlights, and interactive elements

#### 3. Smooth Animations
```css
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
```
Applied to cards, modals, and page transitions

#### 4. Responsive Grid Layouts
```css
display: grid;
grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
gap: 1.5rem;
```
Automatically adjusts to screen size

#### 5. Interactive Feedback
- Hover effects: Elevation changes
- Loading states: Spinners
- Success/error alerts: Temporary notifications
- Disabled states: Visual indicators

### Performance Optimizations

1. **Lazy Loading**: Routes loaded on demand
2. **Memoization**: React components can use useMemo/useCallback
3. **Debouncing**: Search inputs (if implemented)
4. **Pagination**: Consider for large datasets
5. **Image Optimization**: Icons from react-icons (tree-shaken)

## Security Implementation

### Backend Security

1. **Password Security**
   - Validation before hashing
   - SHA-256 hashing (consider bcrypt for production)
   - No plaintext storage

2. **Authentication**
   - JWT tokens with expiration
   - Token verification on every protected route
   - Role-based access control

3. **Account Protection**
   - Failed login tracking
   - Automatic account lockout
   - Time-based unlock

4. **Input Validation**
   - XSS prevention through sanitization
   - Type checking on API inputs
   - SQL injection prevention (parameterized queries)

5. **Audit Trail**
   - All actions logged
   - User attribution
   - Timestamp tracking

### Frontend Security

1. **Token Storage**
   - localStorage (consider httpOnly cookies for production)
   - Automatic inclusion in requests
   - Cleared on logout

2. **Route Protection**
   - Authentication checks
   - Role-based rendering
   - Automatic redirects

3. **Input Validation**
   - Client-side validation
   - Type enforcement
   - Range checks

4. **CORS**
   - Backend configured for frontend origin
   - Credentials included in requests

## Data Flow Examples

### User Registration Flow
```
1. User fills registration form
2. Frontend validates password format
3. POST /api/register with user data
4. Backend validates:
   - Password strength
   - Username uniqueness
   - Input sanitization
5. Backend hashes password
6. Backend inserts into database
7. Backend logs action
8. Success response to frontend
9. Frontend redirects to login
```

### Equipment Rental Flow
```
1. Customer browses equipment
2. GET /api/equipment (active only)
3. Customer selects equipment, enters days
4. Frontend calculates total (price × days)
5. POST /api/rentals with equipment_id, days
6. Backend validates:
   - Equipment exists and is active
   - Days is positive integer
7. Backend calculates total
8. Backend creates rental record
9. Backend logs action
10. Success response with rental details
11. Frontend shows success message
12. Frontend refreshes rental list
```

### Revenue Report Generation
```
1. Admin navigates to reports
2. GET /api/reports/revenue
3. Backend queries:
   - SUM(total) GROUP BY equipment
   - WHERE status = 'returned'
   - JOIN with equipment table
4. Backend calculates grand total
5. Response with report data
6. Frontend receives data
7. Recharts renders:
   - Bar chart for visual representation
   - Table for detailed breakdown
8. Display grand total
```

## Deployment Considerations

### Backend Deployment

1. **Web Server**: Use Gunicorn or uWSGI
   ```bash
   gunicorn -w 4 app:app
   ```

2. **Database**: Migrate to PostgreSQL
   ```python
   # Replace SQLite connection with PostgreSQL
   import psycopg2
   ```

3. **Environment Variables**
   ```python
   import os
   app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY')
   ```

4. **HTTPS**: Use SSL certificates
   - Let's Encrypt for free certificates
   - Nginx as reverse proxy

5. **Logging**: Configure production logging
   ```python
   import logging
   logging.basicConfig(level=logging.INFO)
   ```

### Frontend Deployment

1. **Build for Production**
   ```bash
   npm run build
   ```

2. **Static Hosting Options**
   - Netlify
   - Vercel
   - AWS S3 + CloudFront
   - GitHub Pages (with custom domain)

3. **Environment Variables**
   ```javascript
   const API_URL = process.env.REACT_APP_API_URL
   ```

4. **CDN**: Use CDN for assets
   - Faster global delivery
   - Reduced server load

### Monitoring & Maintenance

1. **Error Tracking**: Sentry or similar
2. **Performance Monitoring**: New Relic, DataDog
3. **Database Backups**: Automated daily backups
4. **Log Aggregation**: ELK stack or cloud solution
5. **Uptime Monitoring**: Pingdom or UptimeRobot

## Testing Strategy

### Backend Testing
```python
# Unit Tests
- Test password validation
- Test password hashing
- Test input sanitization

# Integration Tests
- Test API endpoints
- Test authentication flow
- Test database operations

# Security Tests
- Test SQL injection prevention
- Test XSS prevention
- Test authentication bypass attempts
```

### Frontend Testing
```javascript
// Unit Tests (Jest)
- Component rendering
- State management
- Form validation

// Integration Tests
- API integration
- Routing
- Authentication flow

// E2E Tests (Cypress)
- User registration
- Login/logout
- Equipment rental
- Admin operations
```

## Conclusion

This system provides a solid foundation for farming equipment management with proper security, scalability considerations, and modern UI/UX patterns. The modular architecture allows for easy feature additions and maintenance.
