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

For local development and testing, the system is orchestrated with Docker Compose using files such as:

-   [docker-compose.local.yml](/docker-compose.local.yml)
-   [docker-compose.yml](/docker-compose.yml)

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
-   **Structured Metadata File Storage:** Each learning resource (e.g., PDF, slides, video) will include structured metadata such as title, course code, topic, instructor, upload date, and tags. This enables efficient filtering, categorization, and search functionality.
-   **Role-Based Access Control (RBAC):** Users will be assigned roles (Instructor, Teaching Assistant, Student) with clearly defined permissions. Instructors can upload, edit, and delete resources; TAs may manage selected content; students can view and download permitted materials. Authorization logic will be enforced at the API layer.
-   **Cloud Deployment:** The application will be containerized using Docker and deployed on DigitalOcean. Kubernetes will be used for container orchestration, enabling scalable, resilient, and managed deployment of backend services, frontend components, and supporting infrastructure.
-   **Monitoring:** Monitoring will be implemented using **DigitalOcean’s monitoring and alerting services** in combination with Kubernetes-native tools. Metrics such as CPU usage, memory consumption, pod health, and application performance will be tracked through dashboards to ensure system reliability and availability.
-   **Security Enhancements**
    -   Enforced **HTTPS** for encrypted communication.
    -   Secure **secrets management** for database credentials and API keys using environment variables or a cloud secrets manager.
    -   Container security best practices during deployment.
-   **Persistent Data Storage & Backup and Recovery Strategy**
    -   **PostgreSQL** database for storing user accounts, metadata, access logs, and permissions.
    -   Automated database backups scheduled regularly with backups stored in secure cloud object storage.
    -   Clear recovery procedure to restore the system from backup in case of failure and periodic testing of backup integrity to ensure recoverability.

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
## Overall architecture

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

- **Frontend** → **Auth**: REST (HTTP/JSON). All client requests go through auth.
- **Auth** → **User / File / System servers**: gRPC (binary, HTTP/2). Auth is a REST gateway and gRPC client.

## Folder structure

```
ECE1779-Project/
├── proto/           # Shared .proto definitions (used by auth + all servers)
├── frontend/        # Frontend app (talks to auth via REST)
├── auth/            # Auth service: REST API + gRPC client to backend servers
├── user-server/     # User server (gRPC)
├── file-server/     # File server (gRPC)
├── system-server/   # System server (gRPC)
└── integration-test/ # Integration tests (run after docker compose up)
```

## How to run

1. **Install dependencies** in each service (once):

   ```bash
   cd user-server && npm install && cd ..
   cd file-server && npm install && cd ..
   cd system-server && npm install && cd ..
   cd auth && npm install && cd ..
   ```

2. **Start the gRPC servers** (in separate terminals):

   ```bash
   cd user-server && npm start   # port 5001
   cd file-server && npm start  # port 5002
   cd system-server && npm start # port 5003
   ```

3. **Start the Auth gateway**:

   ```bash
   cd auth && npm start   # REST on port 3000
   ```

4. **Call the API** (frontend or curl):

   ```bash
   curl http://localhost:3000/user/get   # {"message":"hello"}
   curl -H "Authorization: Bearer <token>" http://localhost:3000/user/<userId>   # get user info by id
   curl http://localhost:3000/file/get   # {"message":"hello"}
   curl http://localhost:3000/system/get # {"message":"hello"}
   ```

### Run with Docker

From the project root:

```bash
docker compose -f docker-compose.local.yml up -d --build
```

- **user-server** (gRPC): 5001  
- **file-server** (gRPC): 5002  
- **system-server** (gRPC): 5003  
- **auth** (REST): 3000  

Then: `curl http://localhost:3000/`.

### Integration tests (after Docker is up)

```bash
cd integration-test
npm install
npm test
```

See `integration-test/README.md` for details.

**If auth fails with "failed migrations" (e.g. P3009):** reset the DB and rebuild auth so migrations run in a clean state:

```bash
docker compose down -v
docker compose build --no-cache auth
docker compose up -d
```

## Deployment Information
The deployed application can be found at https://chalatus.com/login.

## AI Assistance & Verification

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
