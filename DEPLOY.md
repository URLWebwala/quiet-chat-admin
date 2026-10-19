# Deployment Guide (शांत चैट / QuietChat)

इस गाइड में **Backend**, **Admin Panel**, और **Agency Panel** को सर्वर पर डिप्लॉय और रीस्टार्ट करने के स्टेप्स दिए गए हैं।

---

## 🖥️ सर्वर डिटेल्स
- **सर्वर पाथ (Project Root):** `/home/quietchat/app`
- **PM2 प्रोसेस नाम:**
  - `backend` (Express.js API & Socket Server)
  - `admin` (Next.js Admin Panel - Port 5001)
  - `agency` (Next.js Agency Panel - Port 5002)

---

## ⚡ 1. Backend Deploy (जब सिर्फ Backend में बदलाव हो)

Backend में कोई build स्टेप नहीं होता। सीधे कोड pull करके PM2 रीस्टार्ट करें:

```bash
# 1. प्रोजेक्ट फोल्डर में जाएँ
cd /home/quietchat/app

# 2. नया कोड Pull करें
git pull origin main

# 3. (वैकल्पिक) अगर कोई नया npm पैकेज जोड़ा गया हो:
# cd backend && npm install && cd ..

# 4. Backend रीस्टार्ट करें
pm2 restart backend

# 5. लाइव लॉग्स चेक करें
pm2 logs backend --lines 50
```

---

## 🌐 2. Admin Panel Deploy (जब Admin Panel में बदलाव हो)

Admin Panel **Next.js** पर आधारित है, इसलिए इसे build करना आवश्यक है:

```bash
# 1. प्रोजेक्ट फोल्डर में जाएँ
cd /home/quietchat/app

# 2. नया कोड Pull करें
git pull origin main

# 3. Admin डायरेक्टरी में जाकर Build करें
cd admin
npm install
npm run build

# 4. Admin PM2 रीस्टार्ट करें
pm2 restart admin

# 5. लॉग्स चेक करें
pm2 logs admin --lines 50
```

---

## 🏢 3. Agency Panel Deploy (जब Agency Panel में बदलाव हो)

Agency Panel भी **Next.js** पर आधारित है, इसलिए इसे भी build करना आवश्यक है:

```bash
# 1. प्रोजेक्ट फोल्डर में जाएँ
cd /home/quietchat/app

# 2. नया कोड Pull करें
git pull origin main

# 3. Agency डायरेक्टरी में जाकर Build करें
cd agency
npm install
npm run build

# 4. Agency PM2 रीस्टार्ट करें
pm2 restart agency

# 5. लॉग्स चेक करें
pm2 logs agency --lines 50
```

---

## 🚀 4. Full Deployment (जब तीनों को एक साथ डिप्लॉय करना हो)

अगर आपने तीनों में एक साथ बदलाव किए हैं, तो यह ऑल-इन-वन कमांड रन करें:

```bash
cd /home/quietchat/app && \
git pull origin main && \
(cd admin && npm install && npm run build) && \
(cd agency && npm install && npm run build) && \
pm2 restart backend admin agency && \
pm2 list
```

---

## 🛠️ उपयोगी PM2 कमांड्स

| कमांड | उपयोग |
|---|---|
| `pm2 list` | सभी रनिंग प्रोसेस की स्थिति देखें |
| `pm2 logs backend` | Backend के लाइव लॉग्स देखें |
| `pm2 logs admin` | Admin के लाइव लॉग्स देखें |
| `pm2 logs agency` | Agency के लाइव लॉग्स देखें |
| `pm2 restart all` | सभी सर्विसेस को एक साथ रीस्टार्ट करें |
| `pm2 stop <name>` | किसी प्रोसेस को रोकने के लिए |
