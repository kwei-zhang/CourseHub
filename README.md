# ECE1779-Project

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
└── system-server/   # System server (gRPC)
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
   curl http://localhost:3000/file/get   # {"message":"hello"}
   curl http://localhost:3000/system/get # {"message":"hello"}
   ```

### Run with Docker

From the project root:

```bash
docker compose up --build
```

- **user-server** (gRPC): 5001  
- **file-server** (gRPC): 5002  
- **system-server** (gRPC): 5003  
- **auth** (REST): 3000  

Then: `curl http://localhost:3000/user/get` (and `/file/get`, `/system/get`).

**If auth fails with "failed migrations" (e.g. P3009):** reset the DB and rebuild auth so migrations run in a clean state:

```bash
docker compose down -v
docker compose build --no-cache auth
docker compose up -d
```


