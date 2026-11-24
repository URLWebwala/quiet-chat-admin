# Shanaya Prototype - 1-on-1 AI Host React Chat Frontend

This is a standalone React (Next.js) web application designed for 1-on-1 persona chat with **Shanaya** (AI Host) powered by QuietChat's isolated host-user architecture.

---

## 🌟 Key Features

1. **Host-Specific User Authentication:**
   - Users register & log in with `Email` and `Password`.
   - Each AI Host maintains an isolated user database (`HostUser` collection scoped by `hostSlug: "shanaya-prototype"`).
   - Generates and uses standard JWT Bearer tokens.
2. **Real-Time 1-on-1 Persona Chat:**
   - Direct connection to Shanaya's Glamorous & Flirty persona engine.
   - Saves all message threads to MongoDB (`HostUserChat` collection).
   - Simulates human typing indicator before replying.
   - Supports conversation memory reset.
3. **Admin Visibility:**
   - All users registered here automatically appear under Admin Panel &rarr; **Host Manage** (`/HostManage`).
   - Admins can inspect the complete chat history of any user directly from the admin panel.

---

## 🚀 How to Run

```bash
# 1. Navigate to directory
cd shanaya-prototype

# 2. Start development server on port 3005
npm run dev

# 3. Open in browser:
# http://localhost:3005
```

---

## 📡 API Contract Used

- **Register:** `POST https://admin.quietchat.in/api/host-user/register`  
  Payload: `{ "hostSlug": "shanaya-prototype", "email": "...", "password": "...", "name": "...", "gender": "male" }`
- **Login:** `POST https://admin.quietchat.in/api/host-user/login`  
  Payload: `{ "hostSlug": "shanaya-prototype", "email": "...", "password": "..." }`
- **Profile:** `GET https://admin.quietchat.in/api/host-user/profile`  
  Header: `Authorization: Bearer <token>`
- **Chat:** `POST https://admin.quietchat.in/api/host-user/chat`  
  Header: `Authorization: Bearer <token>`  
  Payload: `{ "message": "Hi Shanaya!" }`
- **History:** `GET https://admin.quietchat.in/api/host-user/history`  
  Header: `Authorization: Bearer <token>`
- **Reset:** `POST https://admin.quietchat.in/api/host-user/reset`  
  Header: `Authorization: Bearer <token>`
