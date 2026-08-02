# Team SiteSavvy – Full-Stack Web Application

A modern, high-performance web platform featuring **User Authentication (Sign In & Register)**, **SQLite Database Persistence**, **Projects Showcase**, and **Resume Showcase**.

---

## 🚀 How to Run

### Step 1: Open Terminal
Navigate to the project folder in your terminal:
```bash
cd "/Users/amankesarwani/Desktop/Projects/college Project- 1 updated"
```

### Step 2: Start the Python Flask Server
Run the backend server:
```bash
python3 app.py
```

### Step 3: Open in Browser
Open your browser and visit:
👉 **[http://127.0.0.1:5050](http://127.0.0.1:5050)** or **[http://localhost:5050](http://localhost:5050)**

---

## 🔑 Test Credentials (Pre-seeded in DB)

| Account Type | Email | Password | Role |
| :--- | :--- | :--- | :--- |
| **Regular User** | `user@example.com` | `user123` | Can submit messages & view personal database submissions |
| **Admin User** | `admin@sitesavvy.com` | `admin123` | Can view all user submissions stored in SQLite database |

*(You can also click **Register** to create any new account!)*

---

## 📁 Project Structure

- `app.py` – Python Flask Backend server + SQLite database initialization & API endpoints
- `database.db` – SQLite Database storing user accounts and contact messages
- `index.html` – Main Web Application (Home, About, Services, Projects, Experience & Resume, Team, Contact, Database Messages)
- `login.html` – Standalone Login & Registration Page
- `assets/main.css` – Midnight + Cyan + Violet design theme & responsive layout
- `assets/main.js` – Auth session management, API calls, and form submission logic
- `assets/docs/` – Resumes / CVs (PDF)
# Portfolio
