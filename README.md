# ECE 1779 Project Report - Team 11
## Table of Contents
1. [Team Information](#Team-information)
2. [Objectives](#Objectives)
3. [Tech Stack](#Technical-Stack)
4. [Features](#Features)
5. [User Guide](#User-Guide)
6. [Dev Guide](#Development-Guide)
7. [Deployment Info](#Deployment-Information)
8. [AI Assistance & Verification](#AI-Assistance-&-Verification)
9. [Individual Contributions](#Contributions)
10. [Lessons Learned](#lessons-learned-and-concluding-remarks)
11.[Video Demo](#video-demo)

## Team information
| Name/Github Username | Email | Student Number |  	
|--|--|--|
| Kaiwei Zhang (kwei-zhang) | kwei.zhang@mail.utoronto.ca |  1007073872|  
| Meixuan Chen (Njzfjiang) | meixan.chen@mail.utoronto.ca | 1006901943 |  
| Lihang Xu (lihangxu2025-jpg) | lihangxu2025@gmail.com | 1007883337 |  
| Chengguang Li (lcg077) | chenguangl804@gmail.com | 1006809900 |  

## **Motivation**
**Problem Statement:** Traditional academic file-sharing systems typically provide basic storage and sharing capabilities but lack structured metadata management, fine-grained access control, and integrated monitoring mechanisms necessary for scalable and secure academic collaboration. In practice, course teams often rely on ad-hoc combinations of Quercus, Google Drive, and chat applications, which can make it difficult to enforce consistent naming/tagging, implement fine-grained access control, or audit resource access when multiple TAs and students collaborate.

**Why the project is worth pursuing:** LRMS addresses these limitations by integrating role-based access control, structured metadata storage, persistent cloud-backed databases, and observability within a resilient cloud-native architecture. This approach enhances both usability and system reliability.

**Target Users:** Students, instructors, and teaching assistants who need a secure and organized platform for managing learning resources.


## **Objectives**
*The Learning Resource Management System (LRMS) is a web-based platform designed to support academic teams in storing, organizing, and sharing educational materials such as lecture notes, PDFs, slides, and recorded videos. Unlike generic file-sharing platforms, LRMS emphasizes structured resource categorization, role-specific permissions, high availability, and system observability.*

This project aims to demonstrates practical system design and cloud engineering skills through the implementation of RBAC, containerized deployment, Kubernetes orchestration, persistent storage, monitoring, and modern DevOps practices.
The main objective of LRMS is to build and deploy a **cloud-native, stateful web application** that enables efficient management of learning resources while demonstrating core cloud computing and DevOps principles.


## **Technical Stack**

This project is a full-stack learning resource management system built with a microservice-oriented backend, a modern React frontend, PostgreSQL-based persistence, cloud object storage, and containerized/Kubernetes deployment.

**Frontend**

-   Next.js 16  with  React 19
-   TypeScript
-   Tailwind CSS v4
-   shadcn/ui  and Radix-based UI components
-   lucide-react  for icons
-   sonner  for notifications

The frontend lives in  [frontend](/frontend/)  and is responsible for the user-facing web interface, including login, resource browsing, uploads, profile views, course management, and admin dashboards.

**API Gateway and Authentication**

-   Node.js
-   Express
-   Better Auth
-   Prisma
-   PostgreSQL

The ```auth```  service acts as the main entry point for the system. It handles authentication, token issuance, request validation, and exposes REST endpoints for the frontend. It also serves as a gateway that forwards requests to internal backend services over gRPC.

**Backend Services**

-   Node.js  microservices
-   gRPC  with  Protocol Buffers
-   Mix of  TypeScript  and  JavaScript

The backend is split into multiple internal services:

-   user-server: manages users, courses, and enrollments
-   file-server: manages resource metadata, access logging, and signed file URLs
-   system-server: manages operational metrics, incidents, backup status, and health reporting

These services communicate internally through shared protobuf contracts defined in  [proto/services.proto](/proto/services.proto).

**Database and Persistence**

-   PostgreSQL
-   Prisma ORM
-   pg  driver

PostgreSQL is the primary relational database for the system. Prisma is used by the auth, user-server, and file-server services for application data access. The system-server uses direct SQL through the  ```pg```  library for metrics and backup-tracking tables.

The persisted data includes:

-   authentication and session data
-   users and roles
-   courses and enrollments
-   resource metadata
-   access logs
-   system metrics and backup records

**File Storage**

-   DigitalOcean Spaces
-   AWS SDK for S3-compatible APIs
-   Presigned upload/download URLs

The ```file-server``` uses DigitalOcean Spaces as object storage for uploaded course resources. Files are accessed through presigned URLs rather than being streamed directly through the backend.

**Serverless / Notification Services**

-   DigitalOcean Functions
-   Node.js 18
-   Resend

The project includes a serverless function for sending announcement emails. The auth/admin layer triggers this function when administrators send announcements to users.

**Infrastructure and Deployment**

-   Docker
-   Docker Compose
-   Kubernetes
-   NGINX Ingress
-   cert-manager
-   Horizontal Pod Autoscaler
-   CronJob  for automated backups

The system supports both local development and cloud deployment. Docker Compose is used for local orchestration, while Kubernetes manifests in  [k8s](/k8s/)  define the production-style deployment layout.

**Observability and Operations**

-   Custom request metrics
-   Database metrics
-   Incident reporting
-   Health checks
-   Backup status tracking

Operational monitoring is built into the application itself. The ```system-server``` collects and serves internal metrics for request traffic, latency, database performance, incidents, and backups. DOKS dashboards are also used to monitor the system-level metrics of the application.

----------

**Orchestration Approach**

This project uses a  **two-layer orchestration approach**: Docker Compose for local development and Kubernetes for deployed environments.

**1. Local orchestration with Docker Compose**

For local development and testing, the system is orchestrated with Docker Compose using [docker-compose.local.yml](/docker-compose.local.yml).

In this mode:

-   each service runs in its own container
-   services communicate over an internal Docker network
-   PostgreSQL is provisioned as a container
-   environment variables are injected into each service
-   startup ordering is managed with  depends_on
-   health checks are used for readiness-sensitive services like  auth  and  system-server

This is a practical development orchestration setup because it keeps the full distributed system reproducible on one machine.

**2. Cluster orchestration with Kubernetes**

For deployment, the project moves to Kubernetes-based orchestration using manifests under  [k8s](/k8s/).

The Kubernetes setup includes:

-   Deployment  resources for each service
-   Service  resources for internal discovery
-   Ingress  for external routing
-   HPA  for autoscaling selected workloads
-   PersistentVolumeClaim  for PostgreSQL storage
-   CronJob  for scheduled database backups
-   namespace and secret templates for environment isolation and configuration

In this model:

-   frontend  and  auth  are exposed through ingress
-   internal services such as  user-server,  file-server, and  system-server  communicate inside the cluster
-   readiness and liveness probes support self-healing and rollout safety
-   autoscaling is applied based on CPU usage
-   TLS is managed through  cert-manager  with Let’s Encrypt
-   backups are automated and uploaded to DigitalOcean Spaces

**Overall orchestration design**

The orchestration strategy matches the architecture well:

-   Compose is used for simple local multi-container coordination
-   Kubernetes is used for scalable, production-style service orchestration
-   object storage and serverless functions are external platform services integrated into the deployment
-   the backend remains loosely coupled through gRPC service boundaries, which makes it easier to deploy and scale services independently


## **Features**
-   **Structured Resource Storage:** Each learning resource stores core metadata including title, course code, content type, visibility policy, uploader, and tags. Users can browse resources by course and search by title or tag.
-   **Role-Based Access Control (RBAC):** The implemented user-facing roles are **Student**, **Instructor**, and **Admin**. Students can view and download resources available to them, instructors can upload and manage course resources, and admins can manage platform-wide resources, courses, announcements, and monitoring data. The backend also includes policy handling for TA-scoped resource visibility, and authorization is enforced at the API layer and in backend service checks.
-   **Cloud Deployment:** The application is containerized with Docker and supports both local orchestration with Docker Compose and cloud deployment on DigitalOcean Kubernetes, including ingress-based routing and autoscaling for selected services.
-   **Monitoring and Operational Visibility:** The platform includes built-in monitoring for request traffic, latency, database performance, incident reporting, backup status, and service health checks. These metrics are exposed through the admin monitoring dashboard, while DigitalOcean dashboards can be used for infrastructure-level observation.
-   **Security Enhancements**
    -   Enforced **HTTPS** for encrypted communication.
    -   Secret-based configuration for database credentials, object storage credentials, and service tokens.
    -   Role-checked API access for protected routes and administrative operations.
-   **Persistent Data Storage & Backup Strategy**
    -   **PostgreSQL** database for storing user accounts, metadata, access logs, permissions, and operational records.
    -   Automated database backups scheduled with a Kubernetes CronJob and uploaded to secure cloud object storage.
    -   Backup run status is recorded and exposed through the system monitoring interface.

## User Guide
This section provides detailed instruction on how to use the basic functions of LRMS for the 3 different types of accounts (Student, Instructor, Admin).

### General Functionality
#### Sign-Up:
1. Navigate to https://chalatus.com/login
2. Click Sign up on the page
3. Input a name, valid email account and password, select the account role (Student, TA or Instructor) 
4. Click Sign up

#### Log in
1. Navigate to https://chalatus.com/login
2. Click Log in on the page
3. Input your account and password
4. Click Sign in

#### Change Password
1. Assume you are logged in
2. Click on the email address on the top right corner of the page
3. Enter Current password and new password
4. Click on Update password


#### View Public Resources 
1. Click on the Public Resources Tab on the Left Sidebar
2. Click on the Name of the Resource to view each resource

### Student Specific 	Functionality
_All functionality below assumes you are logged into a student account and on the LRMS student homepage._

#### Enroll In Course
1. Click on the Enroll In Course button on the side bar
2. Search or Select the course you wish to join
3. Click on the Join button on the right of the course number
4. Click Done to close the tab

#### View Resource in a given Course
 1. Assume the user is enrolled in a Course called "ECE 1779"
 2. Find the couse "ECE 1779" Under the "My courses" Section on the left side bar
 3. Click on the course name to enter the folder of a given course
 4. Click on the name of the resource to view it
 
### Instructor Specific Functionality
 _All functionality below assumes you are logged into a student account and on the LRMS Instructor homepage._
 
#### Create a New Course
 1. Click on the Courses button on the left side bar to navigate to the courses page
 2. Click on the "+ New Course" button on the top right of the page
 3. Enter a valid Course Code and Course Name (Course code have to be unique)
 4. Click on Create to Create the Course
 
#### Delete a Course
 1. Click on the Courses button on the left side bar to navigate to the courses page
 2. Find the course you wish to delete in the course list
 3. Click on the trash can icon on the right side to delete the course
 
#### Upload Resource
 1. Click on the Upload button on the left side bar
 2. Input relevant information for the resource to upload
 3. Select Course and visibility policy
 4. Choose the file to upload
 5. Click on upload resource
 
#### Edit Resource Metadata
1. Click on the Manage button on the left side bar
2. Find the sepecific resource in the list
3. Click on Edit
4. Change the Metadata of the file you wish to edit
5. Click on Save Changes

#### Delete a Resource
1. Click on the Manage button on the left side bar
2. Find the sepecific resource in the list
3. Click on Delete

### Admin Specific Functionality
 _All functionality below assumes you are logged into a student account and on the LRMS admin homepage._ 
 ***test account for admin:***
| Email | Password | 
|--|--| 
 | admin@mail.com | admin111 |  
 
#### Delete a Resource
1. Click on the Admin button on the top right corner of the page
2. Click on the Resource tab under the admin panel
3. Click on delete

#### Delete a Course
1. Click on the Admin button on the top right corner of the page
2. Click on the Course tab under the admin panel
3. Click on delete 

#### View Monitoring Metrics
1. Click on the Admin button on the top right corner of the page
2. Click on the Monitoring tab under the admin panel
3. View site Metrics and Incidents from the dashboard

#### Send Announcement to All Users via email
1. Click on the Admin button on the top right corner of the page
2. Click on the Announcements tab under the admin panel
3. Enter A subject and message
4. Click on Send to all users


## Development Guide

This section covers everything needed to set up, run, and develop the LRMS application locally.

### Prerequisites

- **Node.js** v18 or later and **npm**
- **Docker** and **Docker Compose** (for containerized local development)
- **PostgreSQL** 16 (only if running services without Docker)
- A **DigitalOcean Spaces** bucket (or any S3-compatible object storage) for file uploads

### Overall Architecture

```
                    ┌───────────┐
                    │  frontend │
                    └─────┬─────┘
                          │ REST (HTTP/JSON)
                          ▼
                    ┌───────────┐
                    │   auth    │  REST gateway + gRPC client
                    └─────┬─────┘
                          │ gRPC
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
    ┌───────────┐   ┌───────────┐   ┌───────────┐
    │ User server│  │ File server│   │System server│
    └───────────┘   └───────────┘   └───────────┘
```

- **Frontend → Auth**: REST (HTTP/JSON). All client requests go through auth.
- **Auth → User / File / System servers**: gRPC (binary, HTTP/2). Auth acts as a REST gateway and gRPC client.

The `auth` service is the single entry point for all frontend traffic. It handles authentication (via Better Auth), enforces role-based access control, and proxies requests to the appropriate backend gRPC service. The backend services never receive requests directly from the frontend.

### Folder Structure

```
ECE1779-Project/
├── proto/              # Shared .proto definitions (used by auth + all servers)
├── frontend/           # Next.js frontend app (talks to auth via REST)
├── auth/               # Auth service: REST API + gRPC client to backend servers
├── user-server/        # User/course/enrollment management (gRPC)
├── file-server/        # Resource metadata + S3 presigned URLs (gRPC)
├── system-server/      # Metrics, incidents, backups, health (gRPC)
├── functions/          # Serverless functions (e.g. announcement emails via Resend)
├── k8s/                # Kubernetes manifests for production deployment
└── docker-compose.local.yml   # Local development orchestration (Docker Compose)
```

### Service Ports

| Service         | Protocol | Default Port | Description                          |
|-----------------|----------|--------------|--------------------------------------|
| **frontend**    | HTTP     | 3000         | Next.js web application              |
| **auth**        | HTTP     | 4000         | REST API gateway + authentication    |
| **user-server** | gRPC     | 5001         | User, course, and enrollment service |
| **file-server** | gRPC     | 5002         | Resource metadata + file URLs        |
| **system-server** | gRPC   | 5003         | System metrics and health            |
| **db**          | TCP      | 5432         | PostgreSQL database                  |

### Environment Setup

Each backend service requires a `.env` file. Example templates are provided:

- `auth/.env.example` — database URL, Better Auth secret/URL, frontend URL, gRPC targets
- `user-server/.env.example` — database URL
- `file-server/.env.example` — database URL, DigitalOcean Spaces credentials

Copy each `.env.example` to `.env` and fill in the values:

```bash
cp auth/.env.example auth/.env
cp user-server/.env.example user-server/.env
cp file-server/.env.example file-server/.env
```

Key variables:

| Variable               | Service       | Description                                    |
|------------------------|---------------|------------------------------------------------|
| `DATABASE_URL`         | all backends  | PostgreSQL connection string                   |
| `BETTER_AUTH_SECRET`   | auth          | Secret key for session signing (min 32 chars)  |
| `BETTER_AUTH_URL`      | auth          | Public URL of the auth service                 |
| `FRONTEND_URL`         | auth          | Public URL of the frontend (for CORS)          |
| `SPACES_BUCKET`        | file-server   | DigitalOcean Spaces bucket name                |
| `SPACES_KEY`           | file-server   | Spaces access key ID                           |
| `SPACES_SECRET`        | file-server   | Spaces secret access key                       |

### Running Locally with Docker Compose (Recommended)

The easiest way to run the full system locally is with Docker Compose. This starts all services, a PostgreSQL database, and wires them together automatically.

```bash
docker compose -f docker-compose.local.yml up -d --build
```

This provisions:

- A PostgreSQL 16 container with a health check
- All four backend services connected to the database
- The frontend, built with the auth URL set to `http://localhost:4000`
- Proper startup ordering via `depends_on` and health checks

Once running:

- **Frontend**: http://localhost:3000
- **Auth API**: http://localhost:4000

To tear everything down (including database volumes):

```bash
docker compose -f docker-compose.local.yml down -v
```

**Troubleshooting: auth fails with "failed migrations" (e.g. P3009)**

Reset the database and rebuild auth so Prisma migrations run against a clean state:

```bash
docker compose -f docker-compose.local.yml down -v
docker compose -f docker-compose.local.yml build --no-cache auth
docker compose -f docker-compose.local.yml up -d
```

### Running Services Individually (Without Docker)

If you prefer to run services directly on your machine (e.g. for faster iteration during development), follow these steps. You will need a running PostgreSQL instance.

1. **Install dependencies** in each service:

```bash
cd user-server && npm install && cd ..
cd file-server && npm install && cd ..
cd system-server && npm install && cd ..
cd auth && npm install && cd ..
cd frontend && npm install && cd ..
```

2. **Run Prisma migrations** to initialize the database schemas:

```bash
cd auth && npx prisma migrate deploy && cd ..
cd user-server && npx prisma migrate deploy && cd ..
cd file-server && npx prisma migrate deploy && cd ..
```

3. **Start the gRPC servers** (each in a separate terminal):

```bash
cd user-server && npm start     # gRPC on port 5001
cd file-server && npm start     # gRPC on port 5002
cd system-server && npm start   # gRPC on port 5003
```

4. **Start the Auth gateway**:

```bash
cd auth && npm start   # REST on port 4000
```

5. **Start the frontend**:

```bash
cd frontend && npm run dev   # Next.js dev server on port 3000
```

For development with hot-reload, use `npm run dev` instead of `npm start` for auth and user-server:

```bash
cd auth && npm run dev
cd user-server && npm run dev
```

### Proto / gRPC Development

All gRPC service contracts are defined in `proto/services.proto`. This single file contains the definitions for:

- **UserService** — user CRUD, search, course management, enrollments
- **ResourceService** — resource CRUD, access logging
- **FileService** — presigned upload/download URL generation
- **SystemService** — metrics recording, incident tracking, backup status

When you modify `services.proto`, all services that reference it will pick up the changes on restart — no separate code generation step is required because the project uses dynamic proto loading at runtime.

### Database Schema

The project uses three separate Prisma schemas, each scoped to its own domain:

| Schema location             | Scope                                    |
|-----------------------------|------------------------------------------|
| `auth/prisma/schema.prisma` | Authentication tables (users, sessions, accounts, verifications) |
| `user-server/prisma/schema.prisma` | Courses, enrollments                |
| `file-server/prisma/schema.prisma` | Resources, tags, access logs        |

The `system-server` does not use Prisma — it manages its own tables (metrics, incidents, backups) via raw SQL with the `pg` driver.

To create a new migration after changing a Prisma schema:

```bash
cd <service> && npx prisma migrate dev --name <migration-name>
```

### Frontend Development

The frontend is a Next.js 16 app using the App Router, React 19, Tailwind CSS v4, and shadcn/ui components.

Key directories under `frontend/src/`:

```
src/
├── app/              # Next.js App Router pages
│   ├── login/        # Login / sign-up page
│   ├── courses/      # Course listing (instructor)
│   ├── upload/       # Resource upload (instructor)
│   ├── manage/       # Resource management (instructor)
│   ├── resources/    # Resource browsing and detail view
│   ├── profile/      # User profile / password change
│   └── admin/        # Admin dashboard (metrics, announcements)
├── components/
│   ├── ui/           # shadcn/ui primitives (Button, Dialog, Card, etc.)
│   ├── auth/         # LoginForm component
│   └── shell/        # AppShell, Navbar, Sidebar, Topbar, RouteGuard
└── lib/
    ├── api.ts        # API client (wraps fetch calls to auth service)
    ├── auth.ts       # Better Auth client instance
    ├── AuthContext.tsx # React context for auth state
    ├── types.ts      # Shared TypeScript types
    └── utils.ts      # Utility helpers
```

Run the frontend dev server with hot-reload:

```bash
cd frontend && npm run dev
```

The frontend communicates exclusively with the `auth` service. The auth URL is configured via the `NEXT_PUBLIC_AUTH_URL` build argument (set to `http://localhost:4000` in the local Docker Compose setup).

### Testing

**Unit tests** are available in the auth and user-server services:

```bash
cd auth && npm test
cd user-server && npm test
```

**File-server tests:**

```bash
cd file-server && npm test
```

Tests require a running PostgreSQL instance and properly configured `.env` files.

## Deployment Information
The deployed application can be found at https://chalatus.com.

## AI Assistance & Verification
We used AI in a limited and practical way during the project, mainly when we ran into specific technical issues during development, integration, and deployment. Most of the system design, implementation, and integration work was still completed by our team. AI was most helpful when a problem had several possible causes and we needed a clearer place to start. In those cases, it helped us organize our troubleshooting steps and decide what to check first.

One representative example was during our Kubernetes deployment stage. Some features, such as file upload and course enrollment, were not working correctly after deployment even though related parts of the system worked locally. We used AI to help think through the problem, and it suggested several areas to inspect, including ingress routing, service paths, environment variables, secrets, and database setup. This was helpful because it turned a broad deployment issue into a smaller set of checks and gave us a more systematic way to review our manifests, routes, and configuration files.

AI was also helpful in a few smaller situations. For example, when services were not communicating as expected, it helped us think through whether the issue was more likely to come from routing, environment configuration, or path mismatches between the frontend and backend. It was also useful when checking deployment settings that could behave differently in local and cloud environments.

At the same time, we learned that AI suggestions were not always fully correct for our actual project. Some ideas sounded reasonable, but were not the real cause in our setup. For example, one suggestion was to check whether auth database initialization was missing. That was still worth verifying, but after comparing it with our deployment files, request paths, logs, and testing results, we found that the more important issues were related to secret handling and duplicated API paths in the deployed system. This made us treat AI as a debugging reference rather than a final answer. We learned that AI is useful for narrowing down possible causes, but the final judgment still had to come from our own checks. More specific examples are included in `ai-session.md`.

## Contributions
| Name/Github Username | Contributions | 	
|--|--|
| Kaiwei Zhang (kwei-zhang) | Setup infra, auth services, user services, RBAC, overall deployment |   
| Meixuan Chen (Njzfjiang) | Implement file services, system services & monitoring, create documentation |  
| Lihang Xu (lihangxu2025-jpg) | overall deployment, orchestration, cloud specific settings |   
| Chengguang Li (lcg077) | frontend implementation |  

## Lessons Learned and Concluding Remarks
Through the development of the Learning Resource Management System (LRMS), our team gained valuable experience in both cloud-native system design and collaborative software engineering.

1. System Design and Architecture

One of the most important lessons was understanding how a distributed, microservice-based architecture differs from a monolithic system. While separating the system into services (auth, user-server, file-server, system-server) improved modularity and scalability, it also introduced additional complexity in communication, debugging, and deployment. In particular, using gRPC for internal communication required careful coordination of service interfaces and protobuf definitions.

2. Working with Cloud-Native Technologies

This project deepened our understanding of cloud-native development. We learned how containerization (Docker) simplifies environment consistency, while Kubernetes provides more advanced orchestration features such as scaling, health checks, and automated recovery. However, compared to Docker Compose, Kubernetes has a steeper learning curve and requires more configuration, especially for networking, storage, and deployment management.

3. Handling Stateful Systems

Managing persistent data (PostgreSQL and object storage) highlighted the challenges of building stateful applications. We learned the importance of backup strategies, data consistency, and recovery planning. Implementing automated backups and ensuring data durability were critical for system reliability.

4. Observability and Debugging

Another key takeaway was the importance of monitoring and observability. By tracking metrics such as request latency, system health, and database performance, we were able to better understand system behavior and identify issues. Debugging in a distributed system is significantly more difficult than in a single application, as errors may originate from multiple services.

5. Frontend–Backend Integration

Integrating the frontend with backend APIs required careful design of endpoints and consistent data formats. We learned how authentication, authorization, and API validation affect the overall user experience. Ensuring smooth interaction between the frontend and backend services was essential for building a reliable application.

6. Team Collaboration

From a teamwork perspective, we learned the importance of clear task division, communication, and version control. Working with multiple services and contributors made it necessary to maintain consistent coding practices and avoid integration conflicts. Regular coordination helped ensure that different components of the system worked together correctly.

Conclusion

Overall, this project provided hands-on experience in building a full-stack, cloud-native application. It strengthened our understanding of core cloud computing concepts, including containerization, microservices architecture, Kubernetes-based orchestration, and system scalability. These lessons will be valuable for future work involving distributed systems and cloud-based applications.

## Video Demo
https://youtu.be/bDgVz5NvRYE
