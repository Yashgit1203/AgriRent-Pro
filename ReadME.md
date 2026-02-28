# AgriRent Pro - Farming Equipment Management System

A full-stack web application for managing farming equipment rentals with separate admin and customer interfaces. Built with Flask (backend) and React (frontend).

![AgriRent Pro](https://img.shields.io/badge/Status-Production%20Ready-green)
![Python](https://img.shields.io/badge/Python-3.8+-blue)
![React](https://img.shields.io/badge/React-18.2-blue)
![Flask](https://img.shields.io/badge/Flask-3.0-green)

## Features

### Admin Features
- **Dashboard Overview**: Real-time statistics including equipment count, active rentals, revenue, and customer count
- **Equipment Management**: Add, activate, deactivate farming equipment with pricing
- **Rental Management**: View all rentals with filtering (active/returned)
- **Revenue Reports**: Visual charts and detailed breakdown of revenue by equipment
- **Audit Logs**: Complete system activity tracking with timestamps
- **Secure Authentication**: Password hashing, account lockout after 3 failed attempts

### Customer Features
- **Personal Dashboard**: View rental statistics and spending
- **Browse Equipment**: Explore available equipment with prices
- **Quick Rental**: Rent equipment for specified days with automatic total calculation
- **My Rentals**: Track active and historical rentals
- **Easy Returns**: Return equipment with one click
- **Secure Access**: Protected routes with JWT authentication

### Security Features
- **Password Validation**: Minimum 8 characters, uppercase, lowercase, digit, special character
- **SHA-256 Hashing**: Secure password storage
- **JWT Authentication**: Token-based session management
- **XSS Prevention**: Input sanitization
- **Account Lockout**: 30-second lockout after 3 failed login attempts
- **Audit Logging**: Track all system actions with user attribution

## Technology Stack

### Backend
- **Flask**: Web framework
- **SQLite3**: Database
- **PyJWT**: JWT token generation and validation
- **Flask-CORS**: Cross-origin resource sharing
- **Hashlib**: Password hashing

### Frontend
- **React**: UI framework
- **React Router**: Client-side routing
- **Axios**: HTTP client
- **Recharts**: Data visualization
- **React Icons**: Icon library
- **CSS3**: Modern styling with animations

## Project Structure

```
farming-equipment-system/
├── backend/
│   ├── app.py                 # Flask application with all API endpoints
│   ├── requirements.txt       # Python dependencies
│   └── farming.db            # SQLite database (auto-generated)
│
├── frontend/
│   ├── public/
│   │   └── index.html        # HTML entry point
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.js              # Login page
│   │   │   ├── Login.css
│   │   │   ├── Register.js           # Registration page
│   │   │   ├── Register.css
│   │   │   ├── AdminDashboard.js     # Admin layout
│   │   │   ├── AdminDashboard.css
│   │   │   ├── CustomerDashboard.js  # Customer layout
│   │   │   ├── CustomerDashboard.css
│   │   │   ├── admin/
│   │   │   │   ├── Overview.js       # Admin dashboard
│   │   │   │   ├── Equipment.js      # Equipment management
│   │   │   │   ├── Rentals.js        # All rentals view
│   │   │   │   ├── Reports.js        # Revenue reports
│   │   │   │   └── AuditLogs.js      # System logs
│   │   │   └── customer/
│   │   │       ├── CustomerOverview.js  # Customer dashboard
│   │   │       ├── BrowseEquipment.js   # Equipment catalog
│   │   │       └── MyRentals.js         # Customer rentals
│   │   ├── services/
│   │   │   └── api.js            # API service layer
│   │   ├── App.js                # Main app component
│   │   ├── App.css
│   │   ├── index.js
│   │   └── index.css
│   └── package.json              # Node dependencies
│
└── README.md
```

## Installation & Setup

### Prerequisites
- Python 3.8 or higher
- Node.js 14 or higher
- npm or yarn

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create a virtual environment (recommended):**
   ```bash
   python -m venv venv
   
   # On Windows
   venv\Scripts\activate
   
   # On macOS/Linux
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the Flask server:**
   ```bash
   python app.py
   ```
   
   The backend will start on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```
   
   The frontend will start on `http://localhost:3000`

## Usage Guide

### First Time Setup

1. **Start both servers** (backend and frontend)

2. **Register an Admin account:**
   - Go to `http://localhost:3000/register`
   - Fill in the form and select "Admin" as account type
   - Password must meet security requirements

3. **Register a Customer account** (optional for testing)

4. **Login** with your credentials

### Admin Workflow

1. **Login** → Admin Dashboard
2. **Add Equipment**: 
   - Navigate to Equipment → Click "Add Equipment"
   - Enter equipment name and daily price
3. **Monitor Rentals**: View all active and returned rentals
4. **View Reports**: Check revenue analytics with charts
5. **Review Audit Logs**: Track all system activities

### Customer Workflow

1. **Login** → Customer Dashboard
2. **Browse Equipment**: View available equipment catalog
3. **Rent Equipment**:
   - Click "Rent Now" on desired equipment
   - Enter number of days
   - Confirm rental
4. **View My Rentals**: Track active and past rentals
5. **Return Equipment**: Click "Return" button when done

## API Endpoints

### Authentication
- `POST /api/register` - Register new user
- `POST /api/login` - User login

### Equipment (Admin only)
- `GET /api/equipment` - Get active equipment
- `GET /api/equipment/all` - Get all equipment
- `POST /api/equipment` - Add new equipment
- `PUT /api/equipment/<id>/activate` - Activate equipment
- `PUT /api/equipment/<id>/deactivate` - Deactivate equipment

### Rentals
- `POST /api/rentals` - Create rental
- `GET /api/rentals/my` - Get user's rentals
- `GET /api/rentals` - Get all rentals (admin)
- `PUT /api/rentals/<id>/return` - Return equipment

### Reports & Analytics
- `GET /api/reports/revenue` - Revenue report (admin)
- `GET /api/audit-logs` - System audit logs (admin)
- `GET /api/stats/dashboard` - Dashboard statistics

## Database Schema

### Users Table
- `id`: Primary key
- `name`: User's full name
- `username`: Unique username
- `password`: Hashed password
- `role`: 'admin' or 'customer'
- `failed_attempts`: Login failure counter
- `lock_time`: Account lock timestamp

### Equipment Table
- `id`: Primary key
- `name`: Equipment name
- `price`: Daily rental price
- `is_active`: Active status (1 or 0)

### Rentals Table
- `id`: Primary key
- `username`: Customer username
- `equipment_id`: Foreign key to equipment
- `days`: Rental duration
- `total`: Total cost
- `status`: 'rented' or 'returned'

### Audit Logs Table
- `id`: Primary key
- `username`: User who performed action
- `action`: Action description
- `timestamp`: Unix timestamp

## Security Considerations

### Production Deployment

1. **Change Secret Key**: Update `app.config['SECRET_KEY']` in `app.py`
2. **Enable HTTPS**: Use SSL certificates
3. **Database**: Consider PostgreSQL for production
4. **Environment Variables**: Store sensitive data in `.env` file
5. **Rate Limiting**: Add API rate limiting
6. **Input Validation**: Already implemented, but review based on use case

## Design Philosophy

The UI follows modern web design principles:

- **Dark Theme**: Reduces eye strain, modern aesthetic
- **Glassmorphism**: Frosted glass effects with backdrop blur
- **Gradient Accents**: Vibrant color gradients for visual interest
- **Smooth Animations**: Micro-interactions enhance user experience
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Accessibility**: High contrast, clear typography, intuitive navigation

## Troubleshooting

### Backend Issues

**Port 5000 already in use:**
```python
# Change port in app.py
app.run(debug=True, port=5001)
```

**CORS errors:**
- Ensure Flask-CORS is installed
- Check CORS configuration in app.py

### Frontend Issues

**Port 3000 already in use:**
- The system will ask to use another port automatically

**API connection failed:**
- Verify backend is running on port 5000
- Check API_URL in `src/services/api.js`

**Blank page:**
- Check browser console for errors
- Verify all dependencies are installed

## Future Enhancements

- Email notifications for rental reminders
- Payment gateway integration
- Equipment availability calendar
- Mobile app version
- Multi-language support
- Advanced search and filters
- Equipment maintenance tracking
- Customer reviews and ratings

## License

This project is created for educational purposes. Feel free to use and modify as needed.

## Support

For issues or questions, please review the code comments or create an issue in the repository.

---

Built with ❤️ for modern farming equipment management