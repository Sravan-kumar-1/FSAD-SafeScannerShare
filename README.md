# 🛡️ DocuSafe: Zero-Trust Document Vault

DocuSafe is an enterprise-grade, full-stack document sharing application designed with a strict zero-trust architecture. It solves the critical vulnerability of traditional file-sharing platforms by ensuring that sensitive documents are never directly downloaded or exposed via public URLs. 

Instead, files are securely stored, streamed directly into memory, and rendered with dynamic anti-theft mechanics to ensure complete data sovereignty and leak attribution.

## ✨ Core Security Features

* **Stateless Authentication:** Secured via JSON Web Tokens (JWT) and Spring Security 6.
* **Zero-Trust Streaming:** Documents are never served as static files. They are streamed as raw byte arrays (`Blob`) directly into the React memory space.
* **Anti-Theft Viewer:** Bypasses vulnerable native browser PDF viewers. Uses `react-pdf` with disabled right-click and prevented text-selection (`select-none`).
* **Dynamic Watermarking:** Context-aware, diagonal watermarks overlay the document viewer, embedding the user's email, IP address, and a live timestamp directly over the content to deter screenshots.
* **Ephemeral Share Links:** Owners can generate secure, 10-minute expiring tokens. Once the time elapses, the backend strictly enforces a `410 Gone` or `403 Forbidden` response.
* **Enterprise Audit Logging:** Every single action (UPLOAD, SHARE, VIEW) is tracked in real-time, recording timestamps and viewer IP addresses/identities in a color-coded timeline.

## 🛠️ Tech Stack

**Backend (The Vault Engine)**
* **Java & Spring Boot 3:** RESTful API development.
* **Spring Security 6:** JWT filtering and role-based access control.
* **Spring Data JPA & Hibernate:** ORM and database management.
* **MySQL:** Relational database for metadata, session, and audit persistence.

**Frontend (The Glassmorphism Client)**
* **React (Vite):** Lightning-fast frontend build tool.
* **Tailwind CSS:** Utility-first styling for the dark-mode glassmorphism UI.
* **Framer Motion:** Smooth, staggered page transitions and interactive micro-animations.
* **React-PDF:** Secure, in-memory PDF rendering engine.
* **Axios:** API client with automated JWT interceptors.

---

## 🏗️ System Architecture

1. **Upload:** Files are saved to a secure, local, isolated `/uploads` directory managed entirely by the Spring Boot server.
2. **Retrieve:** The client requests a file stream via a Bearer token. 
3. **Verify:** Spring Boot validates the JWT, checks document ownership, and intercepts the file.
4. **Render:** The raw byte stream is sent with an `inline` Content-Disposition, loaded into the React-PDF canvas, and locked down behind the dynamic watermark overlay.

---

## 🚀 Getting Started (Local Development)

### Prerequisites
* Java 17+
* Node.js & npm
* MySQL installed and running locally

### 1. Database Setup
Log into your local MySQL instance and create the database:
```sql
CREATE DATABASE docusafe;
```

Update the `/src/main/resources/application.properties` file with your MySQL credentials:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/docusafe
spring.datasource.username=YOUR_USERNAME
spring.datasource.password=YOUR_PASSWORD
```

### 2. Backend Setup
Navigate to the project root and run the Spring Boot application:
```bash
./mvnw clean package spring-boot:run -DskipTests
```
The backend API will start on `http://localhost:8080`.

### 3. Frontend Setup
Navigate to the `frontend` directory, install dependencies, and start the Vite development server:
```bash
cd frontend
npm install
npm run dev
```
The client will start on `http://localhost:5173`.

### 4. Create an Account
1. Open `http://localhost:5173` in your browser.
2. Sign up for a new account.
3. Once logged in, you can upload documents, view them securely in the vault, generate shareable links, and track activity via the Audit Log!
