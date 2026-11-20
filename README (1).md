# Karavali Trails

Karavali Trails is a travel-planning web application focused on the coastal and nearby destinations of Karnataka. It brings destination discovery, trip planning, accommodation and food listings, local travel services, and rental requests together in one place.

## Features

- **Explore destinations** – Browse places such as beaches, temples, waterfalls, and nature destinations.
- **Trip planner** – Generate a multi-day itinerary based on trip details such as duration, interests, budget, starting location, and number of travellers.
- **Stays and restaurants** – Browse accommodation and food listings.
- **Travel services** – View guide and cab/driver information.
- **Bike rentals** – Browse available bikes and submit rental requests.
- **User accounts** – Register, log in, manage profile details, and change passwords.
- **Saved trips and requests** – View saved itineraries and bike rental requests.
- **Admin dashboard** – Manage destination and service listings, users, trips, and rental requests.

## Technology Stack

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** PHP
- **Database:** MySQL / MariaDB
- **Database access:** PHP PDO

## Project Structure

```text
karavali-trails/
├── backend/
│   ├── config/
│   │   └── database.php
│   ├── database/
│   │   ├── create_admin.php
│   │   └── karavali_trails.sql
│   ├── handlers/
│   │   ├── admin.php
│   │   ├── auth.php
│   │   └── user.php
│   ├── lib/
│   │   ├── bootstrap.php
│   │   ├── collections.php
│   │   └── planner.php
│   └── index.php
└── frontend/
    ├── assets/
    │   ├── icons/
    │   ├── images/
    │   └── logos/
    ├── css/
    ├── js/
    └── *.html
```

## Requirements

Install the following before running the project:

- PHP 8 or a compatible PHP version with PDO and the PDO MySQL extension enabled
- MySQL or MariaDB
- Apache (for example, through XAMPP) or PHP's built-in development server
- A modern web browser

## Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/<your-repository>.git
cd <your-repository>
```

Replace the repository URL with your GitHub repository URL.

### 2. Set up the database

1. Start Apache and MySQL from XAMPP (or start your equivalent services).
2. Open **phpMyAdmin** at `http://localhost/phpmyadmin`.
3. Select **Import**.
4. Choose `backend/database/karavali_trails.sql`.
5. Run the import.

The SQL script creates the `karavali_trails` database and its tables, and inserts sample destination and demo service data.

> **Important:** The SQL file drops and recreates the project's tables when imported. Do not import it into a database containing data you need to keep.

### 3. Configure the database connection

The default configuration in `backend/config/database.php` is:

| Setting | Default |
|---|---|
| Host | `localhost` |
| Database | `karavali_trails` |
| Username | `root` |
| Password | Empty |

If your MySQL credentials are different, set these environment variables before starting PHP:

- `KT_DB_HOST`
- `KT_DB_NAME`
- `KT_DB_USER`
- `KT_DB_PASS`

You can also provide a full PDO connection string using `KT_DB_DSN`.

### 4. Create an administrator account

From the project root, run:

```bash
php backend/database/create_admin.php <username> <password>
```

Replace `<username>` and `<password>` with your chosen admin credentials. Use a strong password and do not publish it in the repository.

### 5. Run the project

**Option A – XAMPP**

1. Copy the project folder into XAMPP's `htdocs` directory.
2. Start Apache and MySQL.
3. Open the frontend home page in your browser:

```text
http://localhost/karavali-trails/frontend/home.html
```

The frontend is configured to call the backend at `../backend/index.php`.

**Option B – PHP built-in server**

From the project root, run:

```bash
php -S localhost:8000
```

Then open:

```text
http://localhost:8000/frontend/home.html
```

Keep the terminal running while using the application.

## Main Pages

| Page | File |
|---|---|
| Home | `frontend/home.html` |
| Explore destinations | `frontend/Exploreuk.html` |
| Trip planner | `frontend/tripplanner.html` |
| Stays | `frontend/stays.html` |
| Food | `frontend/food.html` |
| Guides | `frontend/guide.html` |
| Cab services | `frontend/cab.html` |
| Create account | `frontend/createAccount.html` |
| User login | `frontend/login.html` |
| User dashboard | `frontend/afterlogin.html` |
| Profile | `frontend/profile.html` |
| Admin dashboard | `frontend/admin.html` |

## Backend API

The API uses the PHP entry point:

```text
backend/index.php/api/
```

The main API route groups include:

- `auth` – Registration, login, logout, profile, and password operations.
- Public collection routes – Read destination and service listings.
- `trips` – Plan trips, save trips, list the current user's trips, and delete saved trips.
- `rental-requests` – Create and view the current user's bike rental requests.
- `admin` – Admin login and protected management operations.

Requests that create or update data use JSON request bodies. User and administrator features require the appropriate login session.

## Sample Data and Images

- Destination and service images are stored under `frontend/assets/images/`.
- The SQL file includes destination records and demo records for other services.
- Demo service records are sample data and should be replaced with verified real listings before public use.
- Destination coordinates in the supplied SQL data are marked approximate. Verify and correct them before relying on them for navigation.

## Security Notes

- Do not commit real passwords, database credentials, private keys, or personal data.
- Keep administrator credentials private.
- Change default database credentials where appropriate for your environment.
- Use HTTPS and production-appropriate server configuration before deploying publicly.
- Review and replace demo data before presenting listings as real businesses or service providers.

## Contributing

Contributions and suggestions are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Make and test your changes locally.
4. Commit your changes with a clear message.
5. Open a pull request describing the changes.

## License

No license file is included by default. Add a `LICENSE` file if you want to specify how others may use, modify, and distribute this project.
