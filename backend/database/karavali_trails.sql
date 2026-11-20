-- Karavali Trails database (MySQL / MariaDB). Import with phpMyAdmin or: mysql -u root < karavali_trails.sql
CREATE DATABASE IF NOT EXISTS karavali_trails CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE karavali_trails;

DROP TABLE IF EXISTS rental_requests;
DROP TABLE IF EXISTS trips;
DROP TABLE IF EXISTS bikes;
DROP TABLE IF EXISTS drivers;
DROP TABLE IF EXISTS guides;
DROP TABLE IF EXISTS restaurants;
DROP TABLE IF EXISTS stays;
DROP TABLE IF EXISTS destinations;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    mobile VARCHAR(15) NOT NULL UNIQUE,
    username VARCHAR(50) NULL UNIQUE,          -- only used by admin accounts
    password VARCHAR(255) NOT NULL,
    role VARCHAR(10) NOT NULL DEFAULT 'user',  -- 'user' or 'admin'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE destinations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(60) NOT NULL,
    address VARCHAR(255),
    description TEXT,
    history TEXT,
    best_time_to_visit VARCHAR(120),
    latitude DECIMAL(9,6) NULL,
    longitude DECIMAL(9,6) NULL,
    coords_approx TINYINT(1) NOT NULL DEFAULT 0,
    entry_fee DECIMAL(10,2) NULL,
    image VARCHAR(255)
);

CREATE TABLE stays (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    location VARCHAR(100) NOT NULL,
    address VARCHAR(255),
    mobile VARCHAR(20),
    type VARCHAR(60),
    price DECIMAL(10,2) NULL,
    rating DECIMAL(2,1) NULL,
    room_type VARCHAR(100),
    facilities TEXT,                            -- JSON array
    image VARCHAR(255),
    demo TINYINT(1) NOT NULL DEFAULT 0
);

CREATE TABLE restaurants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    location VARCHAR(100) NOT NULL,
    address VARCHAR(255),
    mobile VARCHAR(20),
    food_category VARCHAR(80),
    price_range VARCHAR(40),
    rating DECIMAL(2,1) NULL,
    popular_dishes TEXT,                        -- JSON array
    image VARCHAR(255),
    demo TINYINT(1) NOT NULL DEFAULT 0
);

CREATE TABLE drivers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    mobile VARCHAR(20),
    location VARCHAR(100) NOT NULL,
    vehicle_type VARCHAR(60) NOT NULL,
    fare DECIMAL(8,2) NULL,
    availability TINYINT(1) NOT NULL DEFAULT 1,
    photo VARCHAR(255),
    vehicle_photo VARCHAR(255),
    demo TINYINT(1) NOT NULL DEFAULT 0
);

CREATE TABLE bikes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bike_name VARCHAR(100) NOT NULL,
    model VARCHAR(100),
    category VARCHAR(60) NOT NULL,
    price_per_hour DECIMAL(8,2) NULL,
    price_per_day DECIMAL(8,2) NULL,
    pickup_location VARCHAR(100) NOT NULL,
    provider_name VARCHAR(150),
    provider_mobile VARCHAR(20),
    rental_conditions TEXT,
    availability TINYINT(1) NOT NULL DEFAULT 1,
    image VARCHAR(255),
    demo TINYINT(1) NOT NULL DEFAULT 0
);

CREATE TABLE guides (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    mobile VARCHAR(20),
    location VARCHAR(100) NOT NULL,
    category VARCHAR(80),
    languages TEXT,                             -- JSON array
    expertise TEXT,                             -- JSON array
    experience INT NULL,
    rating DECIMAL(2,1) NULL,
    is_verified TINYINT(1) NOT NULL DEFAULT 0,
    photo VARCHAR(255),
    demo TINYINT(1) NOT NULL DEFAULT 0
);

CREATE TABLE trips (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    number_of_days INT NOT NULL,
    interests TEXT,
    budget VARCHAR(30),
    starting_location VARCHAR(100),
    travellers INT NOT NULL DEFAULT 1,
    itinerary TEXT NOT NULL,                    -- JSON
    estimated_total DECIMAL(12,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE rental_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    bike_id INT NULL,
    rental_start_date DATE NOT NULL,
    rental_end_date DATE NOT NULL,
    total_estimated_price DECIMAL(10,2) NULL,
    request_status VARCHAR(10) NOT NULL DEFAULT 'Pending',  -- Pending / Accepted / Rejected
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (bike_id) REFERENCES bikes(id) ON DELETE SET NULL
);

-- ---------------------------------------------------------------------------
-- Sample data. Destination coordinates are approximate (coords_approx = 1):
-- check them on openstreetmap.org and correct them from the Admin dashboard.
-- Everything except destinations is DEMO DATA (invented names, no phone numbers).
-- Create the admin account with:  php backend/database/create_admin.php <username> <password>
-- ---------------------------------------------------------------------------
-- destinations
INSERT INTO destinations (name, category, address, description, history, best_time_to_visit, latitude, longitude, coords_approx, entry_fee, image) VALUES ('Om Beach, Gokarna', 'Beaches', 'Gokarna, Uttara Kannada', 'A beach whose two curved bays form the shape of the Om symbol.', 'Gokarna is an old pilgrimage town; the beach is a modern tourist draw.', 'October to March', 14.52, 74.32, 1, 0, 'assets/images/gokarna.jpg');
INSERT INTO destinations (name, category, address, description, history, best_time_to_visit, latitude, longitude, coords_approx, entry_fee, image) VALUES ('Kudle Beach', 'Beaches', 'Gokarna, Uttara Kannada', 'A long, quieter beach reached by a short walk from town.', 'Popular with backpackers since the late 20th century.', 'October to March', 14.533, 74.315, 1, 0, NULL);
INSERT INTO destinations (name, category, address, description, history, best_time_to_visit, latitude, longitude, coords_approx, entry_fee, image) VALUES ('Murudeshwar Beach and Temple', 'Temples', 'Murudeshwar, Bhatkal Taluk', 'A Shiva temple and a very tall gopura beside the Arabian Sea.', 'The temple complex was rebuilt in recent decades around an older shrine.', 'October to March', 14.0942, 74.485, 1, 0, 'assets/images/murudeshwar.jpg');
INSERT INTO destinations (name, category, address, description, history, best_time_to_visit, latitude, longitude, coords_approx, entry_fee, image) VALUES ('Mahabaleshwar Temple, Gokarna', 'Temples', 'Gokarna, Uttara Kannada', 'A Shiva temple holding the Atmalinga, one of the main pilgrimage sites of the coast.', 'Associated with the legend of Ravana and the Atmalinga; an important Shaiva centre.', 'Throughout the year', 14.536, 74.319, 1, 0, NULL);
INSERT INTO destinations (name, category, address, description, history, best_time_to_visit, latitude, longitude, coords_approx, entry_fee, image) VALUES ('Jog Falls', 'Waterfalls', 'Near Sagar, Shivamogga district border', 'One of the highest plunge waterfalls in India, best after the monsoon.', 'Formed by the Sharavathi river; a famous viewpoint since colonial times.', 'July to November', 14.2294, 74.8125, 1, 25, 'assets/images/jog-falls.jpg');
INSERT INTO destinations (name, category, address, description, history, best_time_to_visit, latitude, longitude, coords_approx, entry_fee, image) VALUES ('Magod Falls', 'Waterfalls', 'Near Yellapur', 'A two-stage fall where the Bedthi river drops into a forested gorge.', 'A local beauty spot on the Bedthi river.', 'August to December', 14.82, 74.57, 1, 0, NULL);
INSERT INTO destinations (name, category, address, description, history, best_time_to_visit, latitude, longitude, coords_approx, entry_fee, image) VALUES ('Sathodi Falls', 'Waterfalls', 'Near Yellapur', 'A waterfall in a green valley, best visited soon after the rains.', 'A seasonal fall on the Kali river tributaries.', 'August to December', 14.93, 74.6, 1, 0, NULL);
INSERT INTO destinations (name, category, address, description, history, best_time_to_visit, latitude, longitude, coords_approx, entry_fee, image) VALUES ('Unchalli (Lushington) Falls', 'Waterfalls', 'Near Siddapur', 'A broad fall into a deep pool, reached by a forest walk and viewpoint.', 'Named after a British collector who documented it.', 'August to December', 14.54, 74.76, 1, 0, NULL);
INSERT INTO destinations (name, category, address, description, history, best_time_to_visit, latitude, longitude, coords_approx, entry_fee, image) VALUES ('Dandeli Wildlife Sanctuary', 'Forests and Wildlife', 'Dandeli', 'Dense forest on the Kali river with birds, bison and occasional big cats.', 'Protected as part of the Western Ghats forest belt.', 'October to May', 15.27, 74.61, 1, 100, 'assets/images/dandeli.jpg');
INSERT INTO destinations (name, category, address, description, history, best_time_to_visit, latitude, longitude, coords_approx, entry_fee, image) VALUES ('Supa Dam and Kali River Backwaters', 'Rivers and Islands', 'Near Dandeli', 'Quiet reservoir and river stretch used for boating and rafting.', 'Created by the Supa dam on the Kali river.', 'October to April', 15.36, 74.53, 1, 0, NULL);
INSERT INTO destinations (name, category, address, description, history, best_time_to_visit, latitude, longitude, coords_approx, entry_fee, image) VALUES ('Yana Caves', 'Trekking and Adventure', 'Near Kumta / Sirsi', 'Dark rock pillars of crystalline limestone rising from the forest, reached by a trek.', 'A pilgrimage point at the Bhairaveshwara shrine inside the rocks.', 'October to March', 14.578, 74.57, 1, 0, 'assets/images/yana.jpg');
INSERT INTO destinations (name, category, address, description, history, best_time_to_visit, latitude, longitude, coords_approx, entry_fee, image) VALUES ('Devbagh Island', 'Rivers and Islands', 'Near Karwar', 'A small island with a beach, accessible by a short boat ride.', 'A quiet spot near the mouth of the Kali river.', 'October to March', 14.83, 74.11, 1, 0, NULL);
INSERT INTO destinations (name, category, address, description, history, best_time_to_visit, latitude, longitude, coords_approx, entry_fee, image) VALUES ('Mirjan Fort', 'Historical Places', 'Mirjan, near Kumta', 'A laterite fort on the bank of the Aghanashini river.', 'Built in the 16th century and attributed to Queen Chennabhairadevi of Gerusoppa.', 'October to February', 14.477, 74.46, 1, 0, 'assets/images/mirjan-fort.jpg');
INSERT INTO destinations (name, category, address, description, history, best_time_to_visit, latitude, longitude, coords_approx, entry_fee, image) VALUES ('Sadashivgad Fort', 'Historical Places', 'Near Karwar', 'A hill fort overlooking the Kali river mouth and the sea.', 'Associated with local Maratha and Portuguese-era history.', 'October to February', 14.84, 74.14, 1, 0, NULL);
INSERT INTO destinations (name, category, address, description, history, best_time_to_visit, latitude, longitude, coords_approx, entry_fee, image) VALUES ('Sahasralinga, Shalmala River', 'Historical Places', 'Near Sirsi', 'Hundreds of Shiva lingas carved on rocks in the river bed.', 'Created in the 17th century under the Sonda rulers.', 'November to May', 14.67, 74.73, 1, 0, NULL);
INSERT INTO destinations (name, category, address, description, history, best_time_to_visit, latitude, longitude, coords_approx, entry_fee, image) VALUES ('Kodibag Viewpoint', 'Hill Stations and Viewpoints', 'Karwar', 'A sea-facing viewpoint near the Kali river and estuary.', 'A local sunset spot.', 'October to March', 14.813, 74.12, 1, 0, NULL);

-- stays
INSERT INTO stays (name, location, address, mobile, type, price, rating, room_type, facilities, image, demo) VALUES ('Sample Beach Cottage', 'Gokarna', 'Near Kudle Beach, Gokarna', NULL, 'Homestay', 1500, 3.8, 'Double room', '["Wi-Fi","Breakfast"]', NULL, 1);
INSERT INTO stays (name, location, address, mobile, type, price, rating, room_type, facilities, image, demo) VALUES ('Sample Sea View Resort', 'Murudeshwar', 'Murudeshwar seafront', NULL, 'Resort', 4500, 4.2, 'Deluxe sea-view room', '["Pool","Restaurant","Parking","Wi-Fi"]', NULL, 1);
INSERT INTO stays (name, location, address, mobile, type, price, rating, room_type, facilities, image, demo) VALUES ('Sample Karwar Lodge', 'Karwar', 'Main road, Karwar', NULL, 'Hotel', 1800, 3.5, 'Standard AC room', '["AC","Parking"]', NULL, 1);
INSERT INTO stays (name, location, address, mobile, type, price, rating, room_type, facilities, image, demo) VALUES ('Sample Forest Camp', 'Dandeli', 'Near Kali river, Dandeli', NULL, 'Resort', 3200, 4, 'Tent / cottage', '["Meals included","Bonfire"]', NULL, 1);
INSERT INTO stays (name, location, address, mobile, type, price, rating, room_type, facilities, image, demo) VALUES ('Sample Garden Homestay', 'Sirsi', 'Outskirts of Sirsi', NULL, 'Homestay', 1200, 3.9, 'Double room', '["Home food","Parking"]', NULL, 1);
INSERT INTO stays (name, location, address, mobile, type, price, rating, room_type, facilities, image, demo) VALUES ('Sample Ghats Retreat', 'Yellapur', 'Near Magod road, Yellapur', NULL, 'Resort', 2600, 4.1, 'Cottage', '["Restaurant","Nature walks"]', NULL, 1);

-- restaurants
INSERT INTO restaurants (name, location, address, mobile, food_category, price_range, rating, popular_dishes, image, demo) VALUES ('Sample Fish Thali House', 'Karwar', 'Beach road, Karwar', NULL, 'Seafood', '₹100 – ₹300', 4.1, '["Fish thali","Prawn masala"]', NULL, 1);
INSERT INTO restaurants (name, location, address, mobile, food_category, price_range, rating, popular_dishes, image, demo) VALUES ('Sample Shack by the Sea', 'Gokarna', 'Kudle Beach, Gokarna', NULL, 'Coastal', '₹200 – ₹500', 3.9, '["Grilled fish","Fruit salad"]', NULL, 1);
INSERT INTO restaurants (name, location, address, mobile, food_category, price_range, rating, popular_dishes, image, demo) VALUES ('Sample Udupi Bhavan', 'Murudeshwar', 'Near temple, Murudeshwar', NULL, 'South Indian vegetarian', 'Under ₹150', 4, '["Masala dosa","Idli vada"]', NULL, 1);
INSERT INTO restaurants (name, location, address, mobile, food_category, price_range, rating, popular_dishes, image, demo) VALUES ('Sample Malnad Mess', 'Sirsi', 'Market road, Sirsi', NULL, 'Traditional Karnataka', '₹100 – ₹250', 4.2, '["Akki roti","Ragi mudde"]', NULL, 1);
INSERT INTO restaurants (name, location, address, mobile, food_category, price_range, rating, popular_dishes, image, demo) VALUES ('Sample Riverside Kitchen', 'Dandeli', 'Near river, Dandeli', NULL, 'Traditional Karnataka', '₹150 – ₹350', 3.8, '["Jolada roti","Chicken curry"]', NULL, 1);

-- drivers
INSERT INTO drivers (name, mobile, location, vehicle_type, fare, availability, photo, vehicle_photo, demo) VALUES ('Sample Driver A', NULL, 'Gokarna', 'Sedan', 14, 1, NULL, NULL, 1);
INSERT INTO drivers (name, mobile, location, vehicle_type, fare, availability, photo, vehicle_photo, demo) VALUES ('Sample Driver B', NULL, 'Karwar', 'SUV', 20, 1, NULL, NULL, 1);
INSERT INTO drivers (name, mobile, location, vehicle_type, fare, availability, photo, vehicle_photo, demo) VALUES ('Sample Driver C', NULL, 'Murudeshwar', 'Auto rickshaw', 12, 1, NULL, NULL, 1);
INSERT INTO drivers (name, mobile, location, vehicle_type, fare, availability, photo, vehicle_photo, demo) VALUES ('Sample Driver D', NULL, 'Dandeli', 'SUV', 22, 0, NULL, NULL, 1);
INSERT INTO drivers (name, mobile, location, vehicle_type, fare, availability, photo, vehicle_photo, demo) VALUES ('Sample Driver E', NULL, 'Sirsi', 'Sedan', 15, 1, NULL, NULL, 1);

-- bikes
INSERT INTO bikes (bike_name, model, category, price_per_hour, price_per_day, pickup_location, provider_name, provider_mobile, rental_conditions, availability, image, demo) VALUES ('Sample Scooter', '110cc scooter', 'Scooter', 60, 450, 'Gokarna', 'Sample Rentals Gokarna', NULL, 'Valid driving licence for the vehicle class, minimum age 18, ID proof and a refundable deposit. Sample listing: confirm terms with the provider.', 1, NULL, 1);
INSERT INTO bikes (bike_name, model, category, price_per_hour, price_per_day, pickup_location, provider_name, provider_mobile, rental_conditions, availability, image, demo) VALUES ('Sample Commuter Bike', '125cc motorcycle', 'Motorcycle', 80, 600, 'Karwar', 'Sample Rentals Karwar', NULL, 'Valid driving licence for the vehicle class, minimum age 18, ID proof and a refundable deposit. Sample listing: confirm terms with the provider.', 1, NULL, 1);
INSERT INTO bikes (bike_name, model, category, price_per_hour, price_per_day, pickup_location, provider_name, provider_mobile, rental_conditions, availability, image, demo) VALUES ('Sample Touring Bike', '350cc motorcycle', 'Motorcycle', 150, 1200, 'Murudeshwar', 'Sample Rentals Murudeshwar', NULL, 'Valid driving licence for the vehicle class, minimum age 18, ID proof and a refundable deposit. Sample listing: confirm terms with the provider.', 1, NULL, 1);
INSERT INTO bikes (bike_name, model, category, price_per_hour, price_per_day, pickup_location, provider_name, provider_mobile, rental_conditions, availability, image, demo) VALUES ('Sample Scooter 2', '110cc scooter', 'Scooter', 60, 500, 'Sirsi', 'Sample Rentals Sirsi', NULL, 'Valid driving licence for the vehicle class, minimum age 18, ID proof and a refundable deposit. Sample listing: confirm terms with the provider.', 0, NULL, 1);

-- guides
INSERT INTO guides (name, mobile, location, category, languages, expertise, experience, rating, is_verified, photo, demo) VALUES ('Sample Guide A', NULL, 'Gokarna', 'Temple and culture guide', '["Kannada","English","Hindi"]', '["Temples","Local history"]', 8, 4.3, 1, NULL, 1);
INSERT INTO guides (name, mobile, location, category, languages, expertise, experience, rating, is_verified, photo, demo) VALUES ('Sample Guide B', NULL, 'Dandeli', 'Wildlife guide', '["Kannada","English"]', '["Birdwatching","Safari"]', 5, 4, 1, NULL, 1);
INSERT INTO guides (name, mobile, location, category, languages, expertise, experience, rating, is_verified, photo, demo) VALUES ('Sample Guide C', NULL, 'Yellapur', 'Trekking guide', '["Kannada","English","Konkani"]', '["Waterfall treks","Forest trails"]', 6, 4.1, 0, NULL, 1);
INSERT INTO guides (name, mobile, location, category, languages, expertise, experience, rating, is_verified, photo, demo) VALUES ('Sample Guide D', NULL, 'Karwar', 'Heritage guide', '["Kannada","Konkani","English"]', '["Forts","Coastal history"]', 10, 4.4, 1, NULL, 1);

