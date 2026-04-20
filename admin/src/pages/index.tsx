root@vm-woven-valleys:/home/quietchat/app/admin# pm2 save
[PM2] Saving current process list...
[PM2] Successfully saved in /root/.pm2/dump.pm2
root@vm-woven-valleys:/home/quietchat/app/admin# pm2 info admin | grep "exec cwd"
│ exec cwd          │ /home/quietchat/app/admin       │
root@vm-woven-valleys:/home/quietchat/app/admin# cd /home/quietchat/
root@vm-woven-valleys:/home/quietchat# cd app
root@vm-woven-valleys:/home/quietchat/app# ls
README.md  admin  agency  backend
root@vm-woven-valleys:/home/quietchat/app# cd /home/quietchat/app/admin
root@vm-woven-valleys:/home/quietchat/app/admin# grep -R "api/admin/admin/" src -n
src/store/adminSlice.ts:49:      return apiInstanceFetch.post("api/admin/admin/registerAdmin", payload);
src/store/adminSlice.ts:59:  "api/admin/admin/validateAdminLogin",
src/store/adminSlice.ts:63:    return apiInstanceFetch.post("api/admin/admin/validateAdminLogin", payload,
src/store/adminSlice.ts:76:  "api/admin/admin/sendPasswordResetRequest",
src/store/adminSlice.ts:79:    return axios.post(`api/admin/admin/sendPasswordResetRequest?email=${email}`,
src/store/adminSlice.ts:85:  "api/admin/admin/retrieveAdminProfile",
src/store/adminSlice.ts:87:    return axios.get(`api/admin/admin/retrieveAdminProfile`, {
src/store/adminSlice.ts:97:  "api/admin/admin/modifyAdminProfile",
src/store/adminSlice.ts:99:    return axios.patch(`api/admin/admin/modifyAdminProfile`, payload, {
src/store/adminSlice.ts:109:  "api/admin/admin/modifyPassword",
src/store/adminSlice.ts:111:    return axios.patch(`api/admin/admin/modifyPassword`, payload, {
root@vm-woven-valleys:/home/quietchat/app/admin# sed -i 's#api/admin/admin/#api/admin/#g' src/store/adminSlice.ts
root@vm-woven-valleys:/home/quietchat/app/admin# grep -R "api/admin/admin/" src -n
root@vm-woven-valleys:/home/quietchat/app/admin# ^C
root@vm-woven-valleys:/home/quietchat/app/admin# rm -rf .next
root@vm-woven-valleys:/home/quietchat/app/admin# npm run build

> figgy-frontend@0.1.0 build
> next build

  ▲ Next.js 14.2.35

   Creating an optimized production build ...
 ✓ Compiled successfully
 ✓ Linting and checking validity of types
 ✓ Collecting page data
   Generating static pages (18/49)  [   =]value
 ✓ Generating static pages (49/49)
 ✓ Collecting build traces
 ✓ Finalizing page optimization

Route (pages)                              Size     First Load JS
┌ ○ /                                      2.19 kB         283 kB
├   /_app                                  0 B             160 kB
├ ○ /404                                   184 B           160 kB
├ ○ /adminProfile                          3.29 kB         292 kB
├ ○ /Agency                                7.21 kB         523 kB
├ ƒ /api/hello                             0 B             160 kB
├ ○ /AuthCheck                             187 B           160 kB
├ ○ /CoinPlan                              209 B           253 kB
├   └ css/d8a3556df92de8fd.css             195 B
├ ○ /CoinPlanHistory                       222 B           282 kB
├ ○ /DailyCheckInReward                    2.65 kB         253 kB
├ ○ /dashboard                             9.57 kB         301 kB
├   └ css/a4f7feec578e0526.css             242 B
├ ○ /DashboardAgency                       329 B           249 kB
├ ○ /DocumentType                          211 B           252 kB
├   └ css/63bb9943b04b0e5a.css             188 B
├ ○ /ForgotPassword                        1.61 kB         237 kB
├ ○ /GetNewUser                            190 B           163 kB
├   └ css/93b7d82a9937cf9e.css             242 B
├ ○ /GiftCategory                          1.93 kB         253 kB
├ ○ /GiftPage                              56.6 kB         336 kB
├ ○ /Host                                  68.6 kB         572 kB
├   └ css/743bfef502688882.css             3.38 kB
├ ○ /Host/AgencyWiseHost                   4.99 kB         308 kB
├ ○ /Host/HostFollowerList                 2.27 kB         253 kB
├ ○ /Host/HostHistoryPage                  2.21 kB         286 kB
├ ○ /Host/HostInfo                         222 B           449 kB
├ ○ /Host/HostInfoPage                     2.22 kB         453 kB
├ ○ /Host/UserBlock                        2.23 kB         253 kB
├ ○ /HostProfile                           2.92 kB         252 kB
├ ○ /HostRequest                           6.16 kB         257 kB
├   └ css/49d52c9184d2eaf7.css             185 B
├ ○ /Impression                            1.96 kB         253 kB
├ ○ /Login                                 2.28 kB         202 kB
├ ○ /Other                                 3.59 kB         163 kB
├ ○ /Plan                                  4.04 kB         256 kB
├   └ css/6405bc518779b178.css             194 B
├ ○ /PlanHistory                           6.64 kB         287 kB
├ ○ /PlanHistory/coinhistory               1.39 kB         252 kB
├ ○ /PlanHistory/viphistory                1.43 kB         252 kB
├ ○ /PurchaseCoinPlanHistory               2.8 kB          251 kB
├ ○ /Registration                          210 B           281 kB
├ ○ /Setting                               23.2 kB         291 kB
├   └ css/545a950890317676.css             245 B
├ ○ /TopPerformingAgency                   2.98 kB         163 kB
├ ○ /TopPerformingHost                     3.03 kB         163 kB
├ ○ /TopSpenders                           2.82 kB         162 kB
├ ○ /User/CoinPlanHistoryPage              2.94 kB         287 kB
├ ○ /User/FakeUser                         4 kB            220 kB
├ ○ /User/HostBlock                        3.3 kB          252 kB
├ ○ /User/RealUser                         4.09 kB         220 kB
├ ○ /User/User                             7.15 kB         311 kB
├   └ css/c4b182deda48d1ca.css             269 B
├ ○ /User/UserFollowingList                223 B           253 kB
├ ○ /User/UserInfoPage                     1.71 kB         256 kB
├ ○ /UserInfo                              650 B           251 kB
├ ○ /VipPlan                               3.85 kB         252 kB
├   └ css/714b03964a1daed9.css             185 B
├ ○ /VipPlanPrevilage                      6.25 kB         255 kB
└ ○ /WithdrawRequest                       8.14 kB         291 kB
+ First Load JS shared by all              187 kB
  ├ chunks/framework-cb7c0920bfffe473.js   44.9 kB
  ├ chunks/main-965a54131ad9b397.js        34.2 kB
  ├ chunks/pages/_app-7ab4de33ef684e98.js  78.6 kB
  ├ css/89f57b8801a0b2ab.css               27 kB
  └ other shared chunks (total)            1.93 kB

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand

root@vm-woven-valleys:/home/quietchat/app/admin# pm2 restart admin --update-env
[PM2] Applying action restartProcessId on app [admin](ids: [ 6 ])
[PM2] [admin](6) ✓
┌────┬────────────────────┬──────────┬──────┬───────────┬──────────┬──────────┐
│ id │ name               │ mode     │ ↺    │ status    │ cpu      │ memory   │
├────┼────────────────────┼──────────┼──────┼───────────┼──────────┼──────────┤
│ 6  │ admin              │ fork     │ 1    │ online    │ 0%       │ 19.3mb   │
│ 5  │ agency             │ fork     │ 0    │ online    │ 0%       │ 56.9mb   │
│ 3  │ backend            │ fork     │ 135  │ online    │ 33.3%    │ 73.3mb   │
└────┴────────────────────┴──────────┴──────┴───────────┴──────────┴──────────┘
root@vm-woven-valleys:/home/quietchat/app/admin# pm2 logs backend --lines 50
[TAILING] Tailing last 50 lines for [backend] process (change the value with --lines option)
/root/.pm2/logs/backend-out.log last 50 lines:
3|backend  | ✅ Settings Loaded
3|backend  | 🔄 Initializing settings...
3|backend  | ✅ Settings Loaded
3|backend  | 🔄 Initializing settings...
3|backend  | ✅ Settings Loaded
3|backend  | 🔄 Initializing settings...
3|backend  | ✅ Settings Loaded
3|backend  | 🔄 Initializing settings...
3|backend  | ✅ Settings Loaded
3|backend  | 🔄 Initializing settings...
3|backend  | ✅ Settings Loaded
3|backend  | 🔄 Initializing settings...
3|backend  | ✅ Settings Loaded
3|backend  | 🔄 Initializing settings...
3|backend  | ✅ Settings Loaded
3|backend  | 🔄 Initializing settings...
3|backend  | ✅ Settings Loaded
3|backend  | 🔄 Initializing settings...
3|backend  | ✅ Settings Loaded
3|backend  | 🔄 Initializing settings...
3|backend  | ✅ Settings Loaded
3|backend  | 🔄 Initializing settings...
3|backend  | ✅ Settings Loaded
3|backend  | 🔄 Initializing settings...
3|backend  | ✅ Settings Loaded
3|backend  | 🔄 Initializing settings...
3|backend  | ✅ Settings Loaded
3|backend  | 🔄 Initializing settings...
3|backend  | ✅ Settings Loaded
3|backend  | 🔄 Initializing settings...
3|backend  | ✅ Settings Loaded
3|backend  | 🔄 Initializing settings...
3|backend  | ✅ Settings Loaded
3|backend  | 🔄 Initializing settings...
3|backend  | ✅ Settings Loaded
3|backend  | 🔄 Initializing settings...
3|backend  | ✅ Settings Loaded
3|backend  | 🔄 Initializing settings...
3|backend  | ✅ Settings Loaded
3|backend  | 🔄 Initializing settings...
3|backend  | ✅ Settings Loaded
3|backend  | 🔄 Initializing settings...
3|backend  | ✅ Settings Loaded
3|backend  | 🔄 Initializing settings...
3|backend  | ✅ Settings Loaded
3|backend  | 🔄 Initializing settings...
3|backend  | ✅ Settings Loaded
3|backend  | 🔄 Initializing settings...
3|backend  | ✅ Settings Loaded
3|backend  | 🔄 Initializing settings...

/root/.pm2/logs/backend-error.log last 50 lines:
3|backend  |     at Module.require (node:internal/modules/cjs/loader:1289:19)
3|backend  |     at Hook._require.Module.require (/usr/lib/node_modules/pm2/node_modules/require-in-the-middle/index.js:101:39)
3|backend  | ❌ Failed to initialize settings: MongooseError: Operation `settings.findOne()` buffering timed out after 10000ms
3|backend  |     at Timeout.<anonymous> (/home/quietchat/app/backend/node_modules/mongoose/lib/drivers/node-mongodb-native/collection.js:187:23)
3|backend  |     at listOnTimeout (node:internal/timers:581:17)
3|backend  |     at process.processTimers (node:internal/timers:519:7)
3|backend  | ❌ Firebase private key not found in global setting.
3|backend  | MongooseError: The `uri` parameter to `openUri()` must be a string, got "undefined". Make sure the first parameter to `mongoose.connect()` or `mongoose.createConnection()` is a string.
3|backend  |     at NativeConnection.createClient (/home/quietchat/app/backend/node_modules/mongoose/lib/drivers/node-mongodb-native/connection.js:236:11)
3|backend  |     at NativeConnection.openUri (/home/quietchat/app/backend/node_modules/mongoose/lib/connection.js:1071:34)
3|backend  |     at Mongoose.connect (/home/quietchat/app/backend/node_modules/mongoose/lib/mongoose.js:446:15)
3|backend  |     at Object.<anonymous> (/home/quietchat/app/backend/util/connection.js:4:10)
3|backend  |     at Module._compile (node:internal/modules/cjs/loader:1521:14)
3|backend  |     at Module._extensions..js (node:internal/modules/cjs/loader:1623:10)
3|backend  |     at Module.load (node:internal/modules/cjs/loader:1266:32)
3|backend  |     at Module._load (node:internal/modules/cjs/loader:1091:12)
3|backend  |     at Module.require (node:internal/modules/cjs/loader:1289:19)
3|backend  |     at Hook._require.Module.require (/usr/lib/node_modules/pm2/node_modules/require-in-the-middle/index.js:101:39)
3|backend  | ❌ Failed to initialize settings: MongooseError: Operation `settings.findOne()` buffering timed out after 10000ms
3|backend  |     at Timeout.<anonymous> (/home/quietchat/app/backend/node_modules/mongoose/lib/drivers/node-mongodb-native/collection.js:187:23)
3|backend  |     at listOnTimeout (node:internal/timers:581:17)
3|backend  |     at process.processTimers (node:internal/timers:519:7)
3|backend  | ❌ Firebase private key not found in global setting.
3|backend  | MongooseError: The `uri` parameter to `openUri()` must be a string, got "undefined". Make sure the first parameter to `mongoose.connect()` or `mongoose.createConnection()` is a string.
3|backend  |     at NativeConnection.createClient (/home/quietchat/app/backend/node_modules/mongoose/lib/drivers/node-mongodb-native/connection.js:236:11)
3|backend  |     at NativeConnection.openUri (/home/quietchat/app/backend/node_modules/mongoose/lib/connection.js:1071:34)
3|backend  |     at Mongoose.connect (/home/quietchat/app/backend/node_modules/mongoose/lib/mongoose.js:446:15)
3|backend  |     at Object.<anonymous> (/home/quietchat/app/backend/util/connection.js:4:10)
3|backend  |     at Module._compile (node:internal/modules/cjs/loader:1521:14)
3|backend  |     at Module._extensions..js (node:internal/modules/cjs/loader:1623:10)
3|backend  |     at Module.load (node:internal/modules/cjs/loader:1266:32)
3|backend  |     at Module._load (node:internal/modules/cjs/loader:1091:12)
3|backend  |     at Module.require (node:internal/modules/cjs/loader:1289:19)
3|backend  |     at Hook._require.Module.require (/usr/lib/node_modules/pm2/node_modules/require-in-the-middle/index.js:101:39)
3|backend  | ❌ Failed to initialize settings: MongooseError: Operation `settings.findOne()` buffering timed out after 10000ms
3|backend  |     at Timeout.<anonymous> (/home/quietchat/app/backend/node_modules/mongoose/lib/drivers/node-mongodb-native/collection.js:187:23)
3|backend  |     at listOnTimeout (node:internal/timers:581:17)
3|backend  |     at process.processTimers (node:internal/timers:519:7)
3|backend  | ❌ Firebase private key not found in global setting.
3|backend  | MongooseError: The `uri` parameter to `openUri()` must be a string, got "undefined". Make sure the first parameter to `mongoose.connect()` or `mongoose.createConnection()` is a string.
3|backend  |     at NativeConnection.createClient (/home/quietchat/app/backend/node_modules/mongoose/lib/drivers/node-mongodb-native/connection.js:236:11)
3|backend  |     at NativeConnection.openUri (/home/quietchat/app/backend/node_modules/mongoose/lib/connection.js:1071:34)
3|backend  |     at Mongoose.connect (/home/quietchat/app/backend/node_modules/mongoose/lib/mongoose.js:446:15)
3|backend  |     at Object.<anonymous> (/home/quietchat/app/backend/util/connection.js:4:10)
3|backend  |     at Module._compile (node:internal/modules/cjs/loader:1521:14)
3|backend  |     at Module._extensions..js (node:internal/modules/cjs/loader:1623:10)
3|backend  |     at Module.load (node:internal/modules/cjs/loader:1266:32)
3|backend  |     at Module._load (node:internal/modules/cjs/loader:1091:12)
3|backend  |     at Module.require (node:internal/modules/cjs/loader:1289:19)
3|backend  |     at Hook._require.Module.require (/usr/lib/node_modules/pm2/node_modules/require-in-the-middle/index.js:101:39)

3|backend  | ❌ Failed to initialize settings: MongooseError: Operation `settings.findOne()` buffering timed out after 10000ms
3|backend  |     at Timeout.<anonymous> (/home/quietchat/app/backend/node_modules/mongoose/lib/drivers/node-mongodb-native/collection.js:187:23)
3|backend  |     at listOnTimeout (node:internal/timers:581:17)
3|backend  |     at process.processTimers (node:internal/timers:519:7)
3|backend  | ✅ Settings Loaded
3|backend  | ❌ Firebase private key not found in global setting.
3|backend  | 🔄 Initializing settings...
3|backend  | MongooseError: The `uri` parameter to `openUri()` must be a string, got "undefined". Make sure the first parameter to `mongoose.connect()` or `mongoose.createConnection()` is a string.
3|backend  |     at NativeConnection.createClient (/home/quietchat/app/backend/node_modules/mongoose/lib/drivers/node-mongodb-native/connection.js:236:11)
3|backend  |     at NativeConnection.openUri (/home/quietchat/app/backend/node_modules/mongoose/lib/connection.js:1071:34)
3|backend  |     at Mongoose.connect (/home/quietchat/app/backend/node_modules/mongoose/lib/mongoose.js:446:15)
3|backend  |     at Object.<anonymous> (/home/quietchat/app/backend/util/connection.js:4:10)
3|backend  |     at Module._compile (node:internal/modules/cjs/loader:1521:14)
3|backend  |     at Module._extensions..js (node:internal/modules/cjs/loader:1623:10)
3|backend  |     at Module.load (node:internal/modules/cjs/loader:1266:32)
3|backend  |     at Module._load (node:internal/modules/cjs/loader:1091:12)
3|backend  |     at Module.require (node:internal/modules/cjs/loader:1289:19)
3|backend  |     at Hook._require.Module.require (/usr/lib/node_modules/pm2/node_modules/require-in-the-middle/index.js:101:39)
3|backend  | ❌ Failed to initialize settings: MongooseError: Operation `settings.findOne()` buffering timed out after 10000ms
3|backend  |     at Timeout.<anonymous> (/home/quietchat/app/back nd/node_modules/mongoose/lib/drivers/node-mongodb-native/collection.js:187:23)
3|backend  |     at listOnTimeout (node:internal/timers:581:17)
3|backend  |     at process.processTimers (node:internal/timers:519:7)
3|backend  | ✅ Settings Loaded
3|backend  | ❌ Firebase private key not found in global setting.
3|backend  | 🔄 Initializing settings...
3|backend  | MongooseError: The `uri` parameter to `openUri()` must be a string, got "undefined". Make sure the first parameter to `mongoose.connect()` or `mongoose.createConnection()` is a string.
3|backend  |     at NativeConnection.createClient (/home/quietchat/app/backend/node_modules/mongoose/lib/drivers/node-mongodb-native/connection.js:236:11)
3|backend  |     at NativeConnection.openUri (/home/quietchat/app/backend/node_modules/mongoose/lib/connection.js:1071:34)
3|backend  |     at Mongoose.connect (/home/quietchat/app/backend/node_modules/mongoose/lib/mongoose.js:446:15)
3|backend  |     at Object.<anonymous> (/home/quietchat/app/backend/util/connection.js:4:10)
3|backend  |     at Module._compile (node:internal/modules/cjs/loader:1521:14)
3|backend  |     at Module._extensions..js (node:internal/modules/cjs/loader:1623:10)
3|backend  |     at Module.load (node:internal/modules/cjs/loader:1266:32)
3|backend  |     at Module._load (node:internal/modules/cjs/loader:1091:12)
3|backend  |     at Module.require (node:internal/modules/cjs/loader:1289:19)
3|backend  |     at Hook._require.Module.require (/usr/lib/node_modules/pm2/node_modules/require-in-the-middle/index.js:101:39)
^C
root@vm-woven-valleys:/home/quietchat/app/admin# cd /home/quietchat/app/backend
root@vm-woven-valleys:/home/quietchat/app/backend# ls -a
.             .gitignore      controllers  models             package.json  setting.js  util
..            README.md       index.js     node_modules       routes        socket.js   worker


root@vm-woven-valleys:/home/quietchat/app/backend# pm2 restart backend --update-env
[PM2] Applying action restartProcessId on app [backend](ids: [ 3 ])
[PM2] [backend](3) ✓
┌────┬────────────────────┬──────────┬──────┬───────────┬──────────┬──────────┐
│ id │ name               │ mode     │ ↺    │ status    │ cpu      │ memory   │
├────┼────────────────────┼──────────┼──────┼───────────┼──────────┼──────────┤
│ 6  │ admin              │ fork     │ 1    │ online    │ 0%       │ 55.8mb   │
│ 5  │ agency             │ fork     │ 0    │ online    │ 0%       │ 56.4mb   │
│ 3  │ backend            │ fork     │ 164  │ online    │ 0%       │ 18.9mb   │
└────┴────────────────────┴──────────┴──────┴───────────┴──────────┴──────────┘
root@vm-woven-valleys:/home/quietchat/app/backend# pm2 logs backend --lines 20
[TAILING] Tailing last 20 lines for [backend] process (change the value with --lines option)
/root/.pm2/logs/backend-out.log last 20 lines:
3|backend  | 🔄 Initializing settings...
3|backend  | ✅ Settings Loaded
3|backend  | 🔄 Initializing settings...
3|backend  | ✅ Settings Loaded
3|backend  | 🔄 Initializing settings...
3|backend  | ✅ Settings Loaded
3|backend  | 🔄 Initializing settings...
3|backend  | ✅ Settings Loaded
3|backend  | 🔄 Initializing settings...
3|backend  | ✅ Settings Loaded
3|backend  | 🔄 Initializing settings...
3|backend  | ✅ Settings Loaded
3|backend  | 🔄 Initializing settings...
3|backend  | ✅ Settings Loaded
3|backend  | 🔄 Initializing settings...
3|backend  | ✅ Settings Loaded
3|backend  | 🔄 Initializing settings...
3|backend  | ✅ Settings Loaded
3|backend  | 🔄 Initializing settings...
3|backend  | 🔄 Initializing settings...

/root/.pm2/logs/backend-error.log last 20 lines:
3|backend  |     at NativeConnection.openUri (/home/quietchat/app/backend/node_modules/mongoose/lib/connection.js:1071:34)
3|backend  |     at Mongoose.connect (/home/quietchat/app/backend/node_modules/mongoose/lib/mongoose.js:446:15)
3|backend  |     at Object.<anonymous> (/home/quietchat/app/backend/util/connection.js:4:10)
3|backend  |     at Module._compile (node:internal/modules/cjs/loader:1521:14)
3|backend  |     at Module._extensions..js (node:internal/modules/cjs/loader:1623:10)
3|backend  |     at Module.load (node:internal/modules/cjs/loader:1266:32)
3|backend  |     at Module._load (node:internal/modules/cjs/loader:1091:12)
3|backend  |     at Module.require (node:internal/modules/cjs/loader:1289:19)
3|backend  |     at Hook._require.Module.require (/usr/lib/node_modules/pm2/node_modules/require-in-the-middle/index.js:101:39)
3|backend  | MongooseError: The `uri` parameter to `openUri()` must be a string, got "undefined". Make sure the first parameter to `mongoose.connect()` or `mongoose.createConnection()` is a string.
3|backend  |     at NativeConnection.createClient (/home/quietchat/app/backend/node_modules/mongoose/lib/drivers/node-mongodb-native/connection.js:236:11)
3|backend  |     at NativeConnection.openUri (/home/quietchat/app/backend/node_modules/mongoose/lib/connection.js:1071:34)
3|backend  |     at Mongoose.connect (/home/quietchat/app/backend/node_modules/mongoose/lib/mongoose.js:446:15)
3|backend  |     at Object.<anonymous> (/home/quietchat/app/backend/util/connection.js:4:10)
3|backend  |     at Module._compile (node:internal/modules/cjs/loader:1521:14)
3|backend  |     at Module._extensions..js (node:internal/modules/cjs/loader:1623:10)
3|backend  |     at Module.load (node:internal/modules/cjs/loader:1266:32)
3|backend  |     at Module._load (node:internal/modules/cjs/loader:1091:12)
3|backend  |     at Module.require (node:internal/modules/cjs/loader:1289:19)
3|backend  |     at Hook._require.Module.require (/usr/lib/node_modules/pm2/node_modules/require-in-the-middle/index.js:101:39)

3|backend  | ❌ Failed to initialize settings: MongooseError: Operation `settings.findOne()` buffering timed out after 10000ms
3|backend  |     at Timeout.<anonymous> (/home/quietchat/app/backend/node_modules/mongoose/lib/drivers/node-mongodb-native/collection.js:187:23)
3|backend  |     at listOnTimeout (node:internal/timers:581:17)
3|backend  |     at process.processTimers (node:internal/timers:519:7)
3|backend  | ✅ Settings Loaded
3|backend  | ❌ Firebase private key not found in global setting.
3|backend  | 🔄 Initializing settings...
3|backend  | MongooseError: The `uri` parameter to `openUri()` must be a string, got "undefined". Make sure the first parameter to `mongoose.connect()` or `mongoose.createConnection()` is a string.
3|backend  |     at NativeConnection.createClient (/home/quietchat/app/backend/node_modules/mongoose/lib/drivers/node-mongodb-native/connection.js:236:11)
3|backend  |     at NativeConnection.openUri (/home/quietchat/app/backend/node_modules/mongoose/lib/connection.js:1071:34)
3|backend  |     at Mongoose.connect (/home/quietchat/app/backend/node_modules/mongoose/lib/mongoose.js:446:15)
3|backend  |     at Object.<anonymous> (/home/quietchat/app/backend/util/connection.js:4:10)
3|backend  |     at Module._compile (node:internal/modules/cjs/loader:1521:14)
3|backend  |     at Module._extensions..js (node:internal/modules/cjs/loader:1623:10)
3|backend  |     at Module.load (node:internal/modules/cjs/loader:1266:32)
3|backend  |     at Module._load (node:internal/modules/cjs/loader:1091:12)
3|backend  |     at Module.require (node:internal/modules/cjs/loader:1289:19)
3|backend  |     at Hook._require.Module.require (/usr/lib/node_modules/pm2/node_modules/require-in-the-middle/index.js:101:39)
3|backend  | ❌ Failed to initialize settings: MongooseError: Operation `settings.findOne()` buffering timed out after 10000ms
3|backend  |     at Timeout.<anonymous> (/home/quietchat/app/backend/node_modules/mongoose/lib/drivers/node-mongodb-native/collection.js:187:23)
3|backend  |     at listOnTimeout (node:internal/timers:581:17)
3|backend  |     at process.processTimers (node:internal/timers:519:7)
3|backend  | ✅ Settings Loaded
3|backend  | ❌ Firebase private key not found in global setting.
3|backend  | 🔄 Initializing settings...
3|backend  | MongooseError: The `uri` parameter to `openUri()` must be a string, got "undefined". Make sure the first parameter to `mongoose.connect()` or `mongoose.createConnection()` is a string.
3|backend  |     at NativeConnection.createClient (/home/quietchat/app/backend/node_modules/mongoose/lib/drivers/node-mongodb-native/connection.js:236:11)
3|backend  |     at NativeConnection.openUri (/home/quietchat/app/backend/node_modules/mongoose/lib/connection.js:1071:34)
3|backend  |     at Mongoose.connect (/home/quietchat/app/backend/node_modules/mongoose/lib/mongoose.js:446:15)
3|backend  |     at Object.<anonymous> (/home/quietchat/app/backend/util/connection.js:4:10)
3|backend  |     at Module._compile (node:internal/modules/cjs/loader:1521:14)
3|backend  |     at Module._extensions..js (node:internal/modules/cjs/loader:1623:10)
3|backend  |     at Module.load (node:internal/modules/cjs/loader:1266:32)
3|backend  |     at Module._load (node:internal/modules/cjs/loader:1091:12)
3|backend  |     at Module.require (node:internal/modules/cjs/loader:1289:19)
3|backend  |     at Hook._require.Module.require (/usr/lib/node_modules/pm2/node_modules/require-in-the-middle/index.js:101:39)
^C
root@vm-woven-valleys:/home/quietchat/app/backend# nano /home/quietchat/app/backend/util/connection.js
root@vm-woven-valleys:/home/quietchat/app/backend# pm2 logs backend --lines 20
[TAILING] Tailing last 20 lines for [backend] process (change the value with --lines option)
/root/.pm2/logs/backend-out.log last 20 lines:
3|backend  | 🔄 Initializing settings...
3|backend  | ✅ Settings Loaded
3|backend  | 🔄 Initializing settings...
3|backend  | ✅ Settings Loaded
3|backend  | 🔄 Initializing settings...
3|backend  | ✅ Settings Loaded
3|backend  | 🔄 Initializing settings...
3|backend  | 🔄 Initializing settings...
3|backend  | ✅ Settings Loaded
3|backend  | 🔄 Initializing settings...
3|backend  | ✅ Settings Loaded
3|backend  | 🔄 Initializing settings...
3|backend  | ✅ Settings Loaded
3|backend  | 🔄 Initializing settings...
3|backend  | ✅ Settings Loaded
3|backend  | 🔄 Initializing settings...
3|backend  | ✅ Settings Loaded
3|backend  | 🔄 Initializing settings...
3|backend  | ✅ Settings Loaded
3|backend  | 🔄 Initializing settings...

/root/.pm2/logs/backend-error.log last 20 lines:
3|backend  |     at Module.load (node:internal/modules/cjs/loader:1266:32)
3|backend  |     at Module._load (node:internal/modules/cjs/loader:1091:12)
3|backend  |     at Module.require (node:internal/modules/cjs/loader:1289:19)
3|backend  |     at Hook._require.Module.require (/usr/lib/node_modules/pm2/node_modules/require-in-the-middle/index.js:101:39)
3|backend  | ❌ Failed to initialize settings: MongooseError: Operation `settings.findOne()` buffering timed out after 10000ms
3|backend  |     at Timeout.<anonymous> (/home/quietchat/app/backend/node_modules/mongoose/lib/drivers/node-mongodb-native/collection.js:187:23)
3|backend  |     at listOnTimeout (node:internal/timers:581:17)
3|backend  |     at process.processTimers (node:internal/timers:519:7)
3|backend  | ❌ Firebase private key not found in global setting.
3|backend  | MongooseError: The `uri` parameter to `openUri()` must be a string, got "undefined". Make sure the first parameter to `mongoose.connect()` or `mongoose.createConnection()` is a string.
3|backend  |     at NativeConnection.createClient (/home/quietchat/app/backend/node_modules/mongoose/lib/drivers/node-mongodb-native/connection.js:236:11)
3|backend  |     at NativeConnection.openUri (/home/quietchat/app/backend/node_modules/mongoose/lib/connection.js:1071:34)
3|backend  |     at Mongoose.connect (/home/quietchat/app/backend/node_modules/mongoose/lib/mongoose.js:446:15)
3|backend  |     at Object.<anonymous> (/home/quietchat/app/backend/util/connection.js:4:10)
3|backend  |     at Module._compile (node:internal/modules/cjs/loader:1521:14)
3|backend  |     at Module._extensions..js (node:internal/modules/cjs/loader:1623:10)
3|backend  |     at Module.load (node:internal/modules/cjs/loader:1266:32)
3|backend  |     at Module._load (node:internal/modules/cjs/loader:1091:12)
3|backend  |     at Module.require (node:internal/modules/cjs/loader:1289:19)
3|backend  |     at Hook._require.Module.require (/usr/lib/node_modules/pm2/node_modules/require-in-the-middle/index.js:101:39)

3|backend  | ❌ Failed to initialize settings: MongooseError: Operation `settings.findOne()` buffering timed out after 10000ms
3|backend  |     at Timeout.<anonymous> (/home/quietchat/app/backend/node_modules/mongoose/lib/drivers/node-mongodb-native/collection.js:187:23)
3|backend  |     at listOnTimeout (node:internal/timers:581:17)
3|backend  |     at process.processTimers (node:internal/timers:519:7)
3|backend  | ✅ Settings Loaded
3|backend  | ❌ Firebase private key not found in global setting.
3|backend  | 🔄 Initializing settings...
3|backend  | (node:1180670) [MONGODB DRIVER] Warning: useNewUrlParser is a deprecated option: useNewUrlParser has no effect since Node.js Driver version 4.0.0 and will be removed in the next major version
3|backend  | (Use `node --trace-warnings ...` to show where the warning was created)
3|backend  | (node:1180670) [MONGODB DRIVER] Warning: useUnifiedTopology is a deprecated option: useUnifiedTopology has no effect since Node.js Driver version 4.0.0 and will be removed in the next major version
3|backend  | ✅ MongoDB connected
3|backend  | ✅ Settings Initialized
3|backend  | ✅ Settings Loaded
3|backend  | ✅ Firebase Admin SDK initialized successfully
3|backend  | Hello World ! listening on http://0.0.0.0:5000
3|backend  | ❌ No active hosts with videos found. Chat job will not be scheduled.
3|backend  | GET /api/admin/retrieveAdminProfile 404 3.836 ms - 169
3|backend  | 🔹 [AUTH] Validating Admin Firebase token...
3|backend  | 🔹 [AUTH] Validating Admin Firebase token...
3|backend  | ✅ [AUTH] Admin authentication successful. Admin ID: 696a038757701232080acdcf
3|backend  | ✅ [AUTH] Admin authentication successful. Admin ID: 696a038757701232080acdcf
3|backend  | GET /api/admin/setting/fetchSettings 200 248.686 ms - 35729
3|backend  | GET /api/admin/currency/getDefaultCurrency 200 38.418 ms - 262
3|backend  | 🔹 [AUTH] Validating Admin Firebase token...
3|backend  | ✅ [AUTH] Admin authentication successful. Admin ID: 696a038757701232080acdcf
3|backend  | GET /api/admin/user/retrieveUserList?start=1&limit=10&startDate=All&endDate=All&search= 200 32.802 ms - 5125
3|backend  | 🔹 [AUTH] Validating Admin Firebase token...
3|backend  | 🔹 [AUTH] Validating Admin Firebase token...
3|backend  | ✅ [AUTH] Admin authentication successful. Admin ID: 696a038757701232080acdcf
3|backend  | 🔹 [AUTH] Validating Admin Firebase token...
3|backend  | GET /api/admin/currency/getDefaultCurrency 304 14.167 ms - -
3|backend  | ✅ [AUTH] Admin authentication successful. Admin ID: 696a038757701232080acdcf
3|backend  | 🔹 [AUTH] Validating Admin Firebase token...
3|backend  | ✅ [AUTH] Admin authentication successful. Admin ID: 696a038757701232080acdcf
3|backend  | 🔹 [AUTH] Validating Admin Firebase token...
3|backend  | ✅ [AUTH] Admin authentication successful. Admin ID: 696a038757701232080acdcf
3|backend  | ✅ [AUTH] Admin authentication successful. Admin ID: 696a038757701232080acdcf
3|backend  | GET /api/admin/dashboard/retrieveChartStats?type=host&startDate=All&endDate=All 200 23.173 ms - 1854
3|backend  | GET /api/admin/dashboard/retrieveChartStats?type=user&startDate=All&endDate=All 200 45.500 ms - 3040
3|backend  | GET /api/admin/dashboard/getNewUsers?startDate=All&endDate=All 200 22.817 ms - 4103
3|backend  | GET /api/admin/dashboard/fetchDashboardMetrics?startDate=All&endDate=All 200 59.395 ms - 524
3|backend  | 🔹 [AUTH] Validating Admin Firebase token...
3|backend  | 🔹 [AUTH] Validating Admin Firebase token...
3|backend  | ✅ [AUTH] Admin authentication successful. Admin ID: 696a038757701232080acdcf
3|backend  | ✅ [AUTH] Admin authentication successful. Admin ID: 696a038757701232080acdcf
3|backend  | GET /api/admin/currency/getDefaultCurrency 304 12.602 ms - -
3|backend  | GET /api/admin/agency/getAgencies?start=1&limit=10&search=&startDate=All&endDate=All 200 917.242 ms - 5071
3|backend  | 🔹 [AUTH] Validating Admin Firebase token...
3|backend  | ✅ [AUTH] Admin authentication successful. Admin ID: 696a038757701232080acdcf
3|backend  | GET /api/admin/host/fetchHostList?start=1&limit=10&search=&startDate=All&endDate=All&type=1 200 57.906 ms - 13218
3|backend  | GET /storage/1771949620330.jpg 404 3.687 ms - 164
3|backend  | GET /storage/1775737421154.jpg 404 3.629 ms - 164
3|backend  | GET /storage/1771850665224.jpg 404 2.197 ms - 164
3|backend  | GET /storage/1774612117268.jpg 404 1.997 ms - 164
3|backend  | GET /storage/1769063763585.jpg 404 2.604 ms - 164
3|backend  | GET /storage/1774839822466.jpg 404 1.428 ms - 164
3|backend  | GET /storage/1774364254965.jpg 404 1.491 ms - 164
3|backend  | GET /storage/1774096053523.jpg 404 2.330 ms - 164
3|backend  | GET /storage/1774096723295.webp 404 2.866 ms - 165
3|backend  | GET /storage/1774092898746.jpg 404 3.478 ms - 164
3|backend  | GET /storage/1774060442080.jpg 404 3.194 ms - 164
3|backend  | GET /storage/1774002503244.jpg 404 3.113 ms - 164
3|backend  | GET /storage/1774081155402.jpg 404 3.064 ms - 164
3|backend  | GET /storage/1774011079788.jpg 404 4.379 ms - 164
3|backend  | GET /storage/1774002377510.jpg 404 2.775 ms - 164
3|backend  | GET /storage/1773850767512.jpg 404 2.697 ms - 164
3|backend  | GET /storage/1773850011950.jpg 404 3.716 ms - 164
3|backend  | GET /api/admin/retrieveAdminProfile 404 0.549 ms - 169
3|backend  | 🔹 [AUTH] Validating Admin Firebase token...
3|backend  | ✅ [AUTH] Admin authentication successful. Admin ID: 696a038757701232080acdcf
3|backend  | GET /storage/1771949620330.jpg 404 2.020 ms - 164
3|backend  | GET /storage/1775737421154.jpg 404 3.635 ms - 164
3|backend  | GET /storage/1771850665224.jpg 404 10.885 ms - 164
3|backend  | GET /storage/1774612117268.jpg 404 4.786 ms - 164
3|backend  | GET /storage/1774364254965.jpg 404 3.018 ms - 164
3|backend  | GET /storage/1769063763585.jpg 404 3.664 ms - 164
3|backend  | GET /storage/1774096723295.webp 404 5.442 ms - 165
3|backend  | GET /storage/1774096053523.jpg 404 8.486 ms - 164
3|backend  | GET /storage/1774092898746.jpg 404 8.257 ms - 164
3|backend  | GET /storage/1774060442080.jpg 404 8.320 ms - 164
3|backend  | GET /storage/1774839822466.jpg 404 8.401 ms - 164
3|backend  | GET /storage/1774002377510.jpg 404 7.854 ms - 164
3|backend  | GET /storage/1774002503244.jpg 404 6.522 ms - 164
3|backend  | GET /storage/1774081155402.jpg 404 2.139 ms - 164
3|backend  | GET /storage/1774011079788.jpg 404 1.966 ms - 164
3|backend  | GET /storage/1773850767512.jpg 404 2.435 ms - 164
3|backend  | GET /storage/1773850011950.jpg 404 2.785 ms - 164
3|backend  | GET /api/admin/host/fetchHostList?start=2&limit=10&search=&startDate=All&endDate=All&type=1 200 86.510 ms - 13730
3|backend  | GET /storage/1769063763585.jpg 404 2.510 ms - 164
3|backend  | GET /storage/1773730618595.jpg 404 4.246 ms - 164
3|backend  | GET /storage/1773832129705.jpg 404 5.910 ms - 164
3|backend  | GET /storage/1773652096560.jpg 404 1.763 ms - 164
3|backend  | GET /storage/1773646466643.jpg 404 1.753 ms - 164
3|backend  | GET /storage/1773558431511.png 404 4.300 ms - 164
3|backend  | GET /storage/1773150432620.png 404 4.319 ms - 164
3|backend  | GET /storage/1773550444133.jpg 404 4.203 ms - 164
3|backend  | GET /storage/1773476350198.jpg 404 4.689 ms - 164
3|backend  | GET /storage/1771949620330.jpg 404 4.595 ms - 164
3|backend  | GET /storage/1773396434835.jpg 404 2.409 ms - 164
3|backend  | GET /storage/1773390429563.jpg 404 2.071 ms - 164
3|backend  | GET /storage/1771850665224.jpg 404 2.169 ms - 164
3|backend  | GET /storage/1774701531558.png 404 1.425 ms - 164
3|backend  | 🔹 [AUTH] Validating Admin Firebase token...
3|backend  | ✅ [AUTH] Admin authentication successful. Admin ID: 696a038757701232080acdcf
3|backend  | GET /storage/1769063763585.jpg 404 5.482 ms - 164
3|backend  | GET /storage/1773730618595.jpg 404 1.543 ms - 164
3|backend  | GET /storage/1771949620330.jpg 404 2.126 ms - 164
3|backend  | GET /storage/1773832129705.jpg 404 1.521 ms - 164
3|backend  | GET /storage/1773652096560.jpg 404 1.438 ms - 164
3|backend  | GET /storage/1773646466643.jpg 404 2.367 ms - 164
3|backend  | GET /storage/1773558431511.png 404 1.716 ms - 164
3|backend  | GET /storage/1773150432620.png 404 2.006 ms - 164
3|backend  | GET /storage/1773550444133.jpg 404 2.734 ms - 164
3|backend  | GET /storage/1773476350198.jpg 404 1.387 ms - 164
3|backend  | GET /storage/1773396434835.jpg 404 1.383 ms - 164
3|backend  | GET /storage/1771850665224.jpg 404 1.346 ms - 164
3|backend  | GET /storage/1773390429563.jpg 404 1.325 ms - 164
3|backend  | GET /storage/1774701531558.png 404 2.250 ms - 164
3|backend  | GET /api/admin/host/fetchHostList?start=3&limit=10&search=&startDate=All&endDate=All&type=1 200 61.904 ms - 13400
3|backend  | GET /storage/1771949620330.jpg 404 1.398 ms - 164
3|backend  | GET /storage/1773161140720.jpg 404 1.408 ms - 164
3|backend  | GET /storage/1773158718596.jpg 404 9.845 ms - 164
3|backend  | GET /storage/1773153579966.png 404 3.680 ms - 164
3|backend  | GET /storage/1773114470992.jpg 404 2.034 ms - 164
3|backend  | GET /storage/1773063364281.jpg 404 1.417 ms - 164
3|backend  | GET /storage/1771850665224.jpg 404 1.287 ms - 164
3|backend  | GET /storage/1773053289630.png 404 2.867 ms - 164
3|backend  | GET /storage/1773051528577.png 404 2.201 ms - 164
3|backend  | GET /storage/1773038327529.jpg 404 2.004 ms - 164
3|backend  | GET /storage/1772930708803.jpg 404 1.694 ms - 164
3|backend  | GET /storage/1772894221867.jpg 404 2.771 ms - 164
3|backend  | GET /storage/1772851628192.jpg 404 2.248 ms - 164
3|backend  | 🔹 [AUTH] Validating Admin Firebase token...
3|backend  | ✅ [AUTH] Admin authentication successful. Admin ID: 696a038757701232080acdcf
3|backend  | GET /storage/1771949620330.jpg 404 4.360 ms - 164
3|backend  | GET /storage/1773161140720.jpg 404 4.290 ms - 164
3|backend  | GET /storage/1773158718596.jpg 404 3.737 ms - 164
3|backend  | GET /storage/1773153579966.png 404 3.288 ms - 164
3|backend  | GET /storage/1771850665224.jpg 404 2.642 ms - 164
3|backend  | GET /storage/1773114470992.jpg 404 1.918 ms - 164
3|backend  | GET /storage/1773063364281.jpg 404 1.572 ms - 164
3|backend  | GET /storage/1773053289630.png 404 1.480 ms - 164
3|backend  | GET /storage/1773051528577.png 404 1.686 ms - 164
3|backend  | GET /storage/1773038327529.jpg 404 1.713 ms - 164
3|backend  | GET /storage/1772930708803.jpg 404 1.339 ms - 164
3|backend  | GET /storage/1772894221867.jpg 404 1.359 ms - 164
3|backend  | GET /storage/1772851628192.jpg 404 1.194 ms - 164
3|backend  | GET /api/admin/host/fetchHostList?start=4&limit=10&search=&startDate=All&endDate=All&type=1 200 61.769 ms - 13233
3|backend  | GET /storage/1771949620330.jpg 404 1.323 ms - 164
3|backend  | GET /storage/1772819722660.jpg 404 2.092 ms - 164
3|backend  | GET /storage/1773391395918.jpg 404 3.603 ms - 164
3|backend  | GET /storage/1769063763585.jpg 404 3.923 ms - 164
3|backend  | GET /storage/1772797007529.jpg 404 2.570 ms - 164
3|backend  | GET /storage/1772796496629.jpg 404 5.372 ms - 164
3|backend  | GET /storage/1772792009461.jpg 404 3.707 ms - 164
3|backend  | GET /storage/1768978407249.png 404 2.190 ms - 164
3|backend  | GET /storage/1774509219035.jpg 404 1.627 ms - 164
3|backend  | GET /storage/1773340777771.jpg 404 1.428 ms - 164
3|backend  | GET /storage/1773161349567.jpg 404 1.987 ms - 164
3|backend  | GET /storage/1772651344664.jpg 404 3.080 ms - 164
3|backend  | GET /storage/1772651466012.jpg 404 4.745 ms - 164
3|backend  | GET /storage/1772628194334.jpg 404 9.344 ms - 164
3|backend  | GET /storage/1772613043485.jpg 404 12.753 ms - 164
3|backend  | GET /storage/1772553334243.jpg 404 11.848 ms - 164
3|backend  | GET /storage/1772529556913.jpg 404 2.237 ms - 164
3|backend  | GET /storage/1771850665224.jpg 404 0.925 ms - 164
^C
root@vm-woven-valleys:/home/quietchat/app/backend# ls /home/quietchat/app/backend/uploads
ls: cannot access '/home/quietchat/app/backend/uploads': No such file or directory
root@vm-woven-valleys:/home/quietchat/app/backend# find /home/quietchat -type d -name "*upload*"
find /home/quiet^C
root@vm-woven-valleys:/home/quietchat/app/backend# find /home/quietchat -type d -name "*storage*"
/home/quietchat/app/backend/node_modules/@firebase/database/dist/node-esm/src/core/storage
/home/quietchat/app/backend/node_modules/@firebase/database/dist/src/core/storage
/home/quietchat/app/backend/node_modules/multer/storage
/home/quietchat/app/backend/node_modules/@google-cloud/storage
/home/quietchat/app/backend/node_modules/javascript-obfuscator/typings/src/container/modules/storages
/home/quietchat/app/backend/node_modules/javascript-obfuscator/typings/src/interfaces/storages
/home/quietchat/app/backend/node_modules/javascript-obfuscator/typings/src/interfaces/analyzers/string-array-storage-analyzer
/home/quietchat/app/backend/node_modules/javascript-obfuscator/typings/src/storages
/home/quietchat/app/backend/node_modules/javascript-obfuscator/typings/src/custom-nodes/control-flow-flattening-nodes/control-flow-storage-nodes
/home/quietchat/app/backend/node_modules/javascript-obfuscator/typings/src/analyzers/string-array-storage-analyzer
/home/quietchat/app/backend/node_modules/javascript-obfuscator/typings/src/enums/storages
/home/quietchat/app/backend/node_modules/javascript-obfuscator/typings/src/types/storages
/home/quietchat/app/backend/node_modules/firebase-admin/lib/esm/storage
/home/quietchat/app/backend/node_modules/firebase-admin/lib/storage
/home/quietchat/app/admin/node_modules/redux-persist/es/storage
/home/quietchat/app/admin/node_modules/redux-persist/lib/storage
/home/quietchat/app/admin/node_modules/redux-persist/src/storage
/home/quietchat/app/admin/node_modules/redux-persist/types/storage
/home/quietchat/app/admin/node_modules/@firebase/storage-types
/home/quietchat/app/admin/node_modules/@firebase/storage-compat
/home/quietchat/app/admin/node_modules/@firebase/database/dist/node-esm/src/core/storage
/home/quietchat/app/admin/node_modules/@firebase/database/dist/src/core/storage
/home/quietchat/app/admin/node_modules/@firebase/remote-config/dist/esm/src/storage
/home/quietchat/app/admin/node_modules/@firebase/remote-config/dist/src/storage
/home/quietchat/app/admin/node_modules/@firebase/storage
/home/quietchat/app/admin/node_modules/firebase/ai/dist/esm/compat/storage
/home/quietchat/app/admin/node_modules/firebase/ai/dist/esm/storage
/home/quietchat/app/admin/node_modules/firebase/ai/dist/compat/storage
/home/quietchat/app/admin/node_modules/firebase/ai/dist/storage
/home/quietchat/app/admin/node_modules/firebase/functions/dist/esm/compat/storage
/home/quietchat/app/admin/node_modules/firebase/functions/dist/esm/storage
/home/quietchat/app/admin/node_modules/firebase/functions/dist/compat/storage
/home/quietchat/app/admin/node_modules/firebase/functions/dist/storage
/home/quietchat/app/admin/node_modules/firebase/data-connect/dist/esm/compat/storage
/home/quietchat/app/admin/node_modules/firebase/data-connect/dist/esm/storage
/home/quietchat/app/admin/node_modules/firebase/data-connect/dist/compat/storage
/home/quietchat/app/admin/node_modules/firebase/data-connect/dist/storage
/home/quietchat/app/admin/node_modules/firebase/vertexai/dist/esm/compat/storage
/home/quietchat/app/admin/node_modules/firebase/vertexai/dist/esm/storage
/home/quietchat/app/admin/node_modules/firebase/vertexai/dist/compat/storage
/home/quietchat/app/admin/node_modules/firebase/vertexai/dist/storage
/home/quietchat/app/admin/node_modules/firebase/messaging/dist/esm/compat/storage
/home/quietchat/app/admin/node_modules/firebase/messaging/dist/esm/storage
/home/quietchat/app/admin/node_modules/firebase/messaging/dist/compat/storage
/home/quietchat/app/admin/node_modules/firebase/messaging/dist/storage
/home/quietchat/app/admin/node_modules/firebase/messaging/sw/dist/esm/compat/storage
/home/quietchat/app/admin/node_modules/firebase/messaging/sw/dist/esm/storage
/home/quietchat/app/admin/node_modules/firebase/messaging/sw/dist/compat/storage
/home/quietchat/app/admin/node_modules/firebase/messaging/sw/dist/storage
/home/quietchat/app/admin/node_modules/firebase/analytics/dist/esm/compat/storage
/home/quietchat/app/admin/node_modules/firebase/analytics/dist/esm/storage
/home/quietchat/app/admin/node_modules/firebase/analytics/dist/compat/storage
/home/quietchat/app/admin/node_modules/firebase/analytics/dist/storage
/home/quietchat/app/admin/node_modules/firebase/database/dist/esm/compat/storage
/home/quietchat/app/admin/node_modules/firebase/database/dist/esm/storage
/home/quietchat/app/admin/node_modules/firebase/database/dist/compat/storage
/home/quietchat/app/admin/node_modules/firebase/database/dist/storage
/home/quietchat/app/admin/node_modules/firebase/firestore/dist/esm/compat/storage
/home/quietchat/app/admin/node_modules/firebase/firestore/dist/esm/storage
/home/quietchat/app/admin/node_modules/firebase/firestore/dist/compat/storage
/home/quietchat/app/admin/node_modules/firebase/firestore/dist/storage
/home/quietchat/app/admin/node_modules/firebase/firestore/lite/dist/esm/compat/storage
/home/quietchat/app/admin/node_modules/firebase/firestore/lite/dist/esm/storage
/home/quietchat/app/admin/node_modules/firebase/firestore/lite/dist/compat/storage
/home/quietchat/app/admin/node_modules/firebase/firestore/lite/dist/storage
/home/quietchat/app/admin/node_modules/firebase/compat/dist/esm/compat/storage
/home/quietchat/app/admin/node_modules/firebase/compat/dist/esm/storage
/home/quietchat/app/admin/node_modules/firebase/compat/dist/compat/storage
/home/quietchat/app/admin/node_modules/firebase/compat/dist/storage
/home/quietchat/app/admin/node_modules/firebase/compat/functions/dist/esm/compat/storage
/home/quietchat/app/admin/node_modules/firebase/compat/functions/dist/esm/storage
/home/quietchat/app/admin/node_modules/firebase/compat/functions/dist/compat/storage
/home/quietchat/app/admin/node_modules/firebase/compat/functions/dist/storage
/home/quietchat/app/admin/node_modules/firebase/compat/messaging/dist/esm/compat/storage
/home/quietchat/app/admin/node_modules/firebase/compat/messaging/dist/esm/storage
/home/quietchat/app/admin/node_modules/firebase/compat/messaging/dist/compat/storage
/home/quietchat/app/admin/node_modules/firebase/compat/messaging/dist/storage
/home/quietchat/app/admin/node_modules/firebase/compat/analytics/dist/esm/compat/storage
/home/quietchat/app/admin/node_modules/firebase/compat/analytics/dist/esm/storage
/home/quietchat/app/admin/node_modules/firebase/compat/analytics/dist/compat/storage
/home/quietchat/app/admin/node_modules/firebase/compat/analytics/dist/storage
/home/quietchat/app/admin/node_modules/firebase/compat/database/dist/esm/compat/storage
/home/quietchat/app/admin/node_modules/firebase/compat/database/dist/esm/storage
/home/quietchat/app/admin/node_modules/firebase/compat/database/dist/compat/storage
/home/quietchat/app/admin/node_modules/firebase/compat/database/dist/storage
/home/quietchat/app/admin/node_modules/firebase/compat/firestore/dist/esm/compat/storage
/home/quietchat/app/admin/node_modules/firebase/compat/firestore/dist/esm/storage
/home/quietchat/app/admin/node_modules/firebase/compat/firestore/dist/compat/storage
/home/quietchat/app/admin/node_modules/firebase/compat/firestore/dist/storage
/home/quietchat/app/admin/node_modules/firebase/compat/installations/dist/esm/compat/storage
/home/quietchat/app/admin/node_modules/firebase/compat/installations/dist/esm/storage
/home/quietchat/app/admin/node_modules/firebase/compat/installations/dist/compat/storage
/home/quietchat/app/admin/node_modules/firebase/compat/installations/dist/storage
/home/quietchat/app/admin/node_modules/firebase/compat/app/dist/esm/compat/storage
/home/quietchat/app/admin/node_modules/firebase/compat/app/dist/esm/storage
/home/quietchat/app/admin/node_modules/firebase/compat/app/dist/compat/storage
/home/quietchat/app/admin/node_modules/firebase/compat/app/dist/storage
/home/quietchat/app/admin/node_modules/firebase/compat/app-check/dist/esm/compat/storage
/home/quietchat/app/admin/node_modules/firebase/compat/app-check/dist/esm/storage
/home/quietchat/app/admin/node_modules/firebase/compat/app-check/dist/compat/storage
/home/quietchat/app/admin/node_modules/firebase/compat/app-check/dist/storage
/home/quietchat/app/admin/node_modules/firebase/compat/remote-config/dist/esm/compat/storage
/home/quietchat/app/admin/node_modules/firebase/compat/remote-config/dist/esm/storage
/home/quietchat/app/admin/node_modules/firebase/compat/remote-config/dist/compat/storage
/home/quietchat/app/admin/node_modules/firebase/compat/remote-config/dist/storage
/home/quietchat/app/admin/node_modules/firebase/compat/performance/dist/esm/compat/storage
/home/quietchat/app/admin/node_modules/firebase/compat/performance/dist/esm/storage
/home/quietchat/app/admin/node_modules/firebase/compat/performance/dist/compat/storage
/home/quietchat/app/admin/node_modules/firebase/compat/performance/dist/storage
/home/quietchat/app/admin/node_modules/firebase/compat/auth/dist/esm/compat/storage
/home/quietchat/app/admin/node_modules/firebase/compat/auth/dist/esm/storage
/home/quietchat/app/admin/node_modules/firebase/compat/auth/dist/compat/storage
/home/quietchat/app/admin/node_modules/firebase/compat/auth/dist/storage
/home/quietchat/app/admin/node_modules/firebase/compat/storage
/home/quietchat/app/admin/node_modules/firebase/compat/storage/dist/esm/compat/storage
/home/quietchat/app/admin/node_modules/firebase/compat/storage/dist/esm/storage
/home/quietchat/app/admin/node_modules/firebase/compat/storage/dist/compat/storage
/home/quietchat/app/admin/node_modules/firebase/compat/storage/dist/storage
/home/quietchat/app/admin/node_modules/firebase/installations/dist/esm/compat/storage
/home/quietchat/app/admin/node_modules/firebase/installations/dist/esm/storage
/home/quietchat/app/admin/node_modules/firebase/installations/dist/compat/storage
/home/quietchat/app/admin/node_modules/firebase/installations/dist/storage
/home/quietchat/app/admin/node_modules/firebase/app/dist/esm/compat/storage
/home/quietchat/app/admin/node_modules/firebase/app/dist/esm/storage
/home/quietchat/app/admin/node_modules/firebase/app/dist/compat/storage
/home/quietchat/app/admin/node_modules/firebase/app/dist/storage
/home/quietchat/app/admin/node_modules/firebase/app-check/dist/esm/compat/storage
/home/quietchat/app/admin/node_modules/firebase/app-check/dist/esm/storage
/home/quietchat/app/admin/node_modules/firebase/app-check/dist/compat/storage
/home/quietchat/app/admin/node_modules/firebase/app-check/dist/storage
/home/quietchat/app/admin/node_modules/firebase/remote-config/dist/esm/compat/storage
/home/quietchat/app/admin/node_modules/firebase/remote-config/dist/esm/storage
/home/quietchat/app/admin/node_modules/firebase/remote-config/dist/compat/storage
/home/quietchat/app/admin/node_modules/firebase/remote-config/dist/storage
/home/quietchat/app/admin/node_modules/firebase/performance/dist/esm/compat/storage
/home/quietchat/app/admin/node_modules/firebase/performance/dist/esm/storage
/home/quietchat/app/admin/node_modules/firebase/performance/dist/compat/storage
/home/quietchat/app/admin/node_modules/firebase/performance/dist/storage
/home/quietchat/app/admin/node_modules/firebase/auth/cordova/dist/esm/compat/storage
/home/quietchat/app/admin/node_modules/firebase/auth/cordova/dist/esm/storage
/home/quietchat/app/admin/node_modules/firebase/auth/cordova/dist/compat/storage
/home/quietchat/app/admin/node_modules/firebase/auth/cordova/dist/storage
/home/quietchat/app/admin/node_modules/firebase/auth/dist/esm/compat/storage
/home/quietchat/app/admin/node_modules/firebase/auth/dist/esm/storage
/home/quietchat/app/admin/node_modules/firebase/auth/dist/compat/storage
/home/quietchat/app/admin/node_modules/firebase/auth/dist/storage
/home/quietchat/app/admin/node_modules/firebase/auth/web-extension/dist/esm/compat/storage
/home/quietchat/app/admin/node_modules/firebase/auth/web-extension/dist/esm/storage
/home/quietchat/app/admin/node_modules/firebase/auth/web-extension/dist/compat/storage
/home/quietchat/app/admin/node_modules/firebase/auth/web-extension/dist/storage
/home/quietchat/app/admin/node_modules/firebase/storage
/home/quietchat/app/admin/node_modules/firebase/storage/dist/esm/compat/storage
/home/quietchat/app/admin/node_modules/firebase/storage/dist/esm/storage
/home/quietchat/app/admin/node_modules/firebase/storage/dist/compat/storage
/home/quietchat/app/admin/node_modules/firebase/storage/dist/storage
/home/quietchat/app/admin/node_modules/next/dist/esm/server/async-storage
/home/quietchat/app/admin/node_modules/next/dist/server/async-storage
/home/quietchat/app/agency/node_modules/redux-persist/es/storage
/home/quietchat/app/agency/node_modules/redux-persist/lib/storage
/home/quietchat/app/agency/node_modules/redux-persist/src/storage
/home/quietchat/app/agency/node_modules/redux-persist/types/storage
/home/quietchat/app/agency/node_modules/@firebase/storage-types
/home/quietchat/app/agency/node_modules/@firebase/storage-compat
/home/quietchat/app/agency/node_modules/@firebase/database/dist/node-esm/src/core/storage
/home/quietchat/app/agency/node_modules/@firebase/database/dist/src/core/storage
/home/quietchat/app/agency/node_modules/@firebase/remote-config/dist/esm/src/storage
/home/quietchat/app/agency/node_modules/@firebase/remote-config/dist/src/storage
/home/quietchat/app/agency/node_modules/@firebase/storage
/home/quietchat/app/agency/node_modules/firebase/functions/dist/esm/compat/storage
/home/quietchat/app/agency/node_modules/firebase/functions/dist/esm/storage
/home/quietchat/app/agency/node_modules/firebase/functions/dist/compat/storage
/home/quietchat/app/agency/node_modules/firebase/functions/dist/storage
/home/quietchat/app/agency/node_modules/firebase/data-connect/dist/esm/compat/storage
/home/quietchat/app/agency/node_modules/firebase/data-connect/dist/esm/storage
/home/quietchat/app/agency/node_modules/firebase/data-connect/dist/compat/storage
/home/quietchat/app/agency/node_modules/firebase/data-connect/dist/storage
/home/quietchat/app/agency/node_modules/firebase/vertexai/dist/esm/compat/storage
/home/quietchat/app/agency/node_modules/firebase/vertexai/dist/esm/storage
/home/quietchat/app/agency/node_modules/firebase/vertexai/dist/compat/storage
/home/quietchat/app/agency/node_modules/firebase/vertexai/dist/storage
/home/quietchat/app/agency/node_modules/firebase/messaging/dist/esm/compat/storage
/home/quietchat/app/agency/node_modules/firebase/messaging/dist/esm/storage
/home/quietchat/app/agency/node_modules/firebase/messaging/dist/compat/storage
/home/quietchat/app/agency/node_modules/firebase/messaging/dist/storage
/home/quietchat/app/agency/node_modules/firebase/messaging/sw/dist/esm/compat/storage
/home/quietchat/app/agency/node_modules/firebase/messaging/sw/dist/esm/storage
/home/quietchat/app/agency/node_modules/firebase/messaging/sw/dist/compat/storage
/home/quietchat/app/agency/node_modules/firebase/messaging/sw/dist/storage
/home/quietchat/app/agency/node_modules/firebase/analytics/dist/esm/compat/storage
/home/quietchat/app/agency/node_modules/firebase/analytics/dist/esm/storage
/home/quietchat/app/agency/node_modules/firebase/analytics/dist/compat/storage
/home/quietchat/app/agency/node_modules/firebase/analytics/dist/storage
/home/quietchat/app/agency/node_modules/firebase/database/dist/esm/compat/storage
/home/quietchat/app/agency/node_modules/firebase/database/dist/esm/storage
/home/quietchat/app/agency/node_modules/firebase/database/dist/compat/storage
/home/quietchat/app/agency/node_modules/firebase/database/dist/storage
/home/quietchat/app/agency/node_modules/firebase/firestore/dist/esm/compat/storage
/home/quietchat/app/agency/node_modules/firebase/firestore/dist/esm/storage
/home/quietchat/app/agency/node_modules/firebase/firestore/dist/compat/storage
/home/quietchat/app/agency/node_modules/firebase/firestore/dist/storage
/home/quietchat/app/agency/node_modules/firebase/firestore/lite/dist/esm/compat/storage
/home/quietchat/app/agency/node_modules/firebase/firestore/lite/dist/esm/storage
/home/quietchat/app/agency/node_modules/firebase/firestore/lite/dist/compat/storage
/home/quietchat/app/agency/node_modules/firebase/firestore/lite/dist/storage
/home/quietchat/app/agency/node_modules/firebase/compat/dist/esm/compat/storage
/home/quietchat/app/agency/node_modules/firebase/compat/dist/esm/storage
/home/quietchat/app/agency/node_modules/firebase/compat/dist/compat/storage
/home/quietchat/app/agency/node_modules/firebase/compat/dist/storage
/home/quietchat/app/agency/node_modules/firebase/compat/functions/dist/esm/compat/storage
/home/quietchat/app/agency/node_modules/firebase/compat/functions/dist/esm/storage
/home/quietchat/app/agency/node_modules/firebase/compat/functions/dist/compat/storage
/home/quietchat/app/agency/node_modules/firebase/compat/functions/dist/storage
/home/quietchat/app/agency/node_modules/firebase/compat/messaging/dist/esm/compat/storage
/home/quietchat/app/agency/node_modules/firebase/compat/messaging/dist/esm/storage
/home/quietchat/app/agency/node_modules/firebase/compat/messaging/dist/compat/storage
/home/quietchat/app/agency/node_modules/firebase/compat/messaging/dist/storage
/home/quietchat/app/agency/node_modules/firebase/compat/analytics/dist/esm/compat/storage
/home/quietchat/app/agency/node_modules/firebase/compat/analytics/dist/esm/storage
/home/quietchat/app/agency/node_modules/firebase/compat/analytics/dist/compat/storage
/home/quietchat/app/agency/node_modules/firebase/compat/analytics/dist/storage
/home/quietchat/app/agency/node_modules/firebase/compat/database/dist/esm/compat/storage
/home/quietchat/app/agency/node_modules/firebase/compat/database/dist/esm/storage
/home/quietchat/app/agency/node_modules/firebase/compat/database/dist/compat/storage
/home/quietchat/app/agency/node_modules/firebase/compat/database/dist/storage
/home/quietchat/app/agency/node_modules/firebase/compat/firestore/dist/esm/compat/storage
/home/quietchat/app/agency/node_modules/firebase/compat/firestore/dist/esm/storage
/home/quietchat/app/agency/node_modules/firebase/compat/firestore/dist/compat/storage
/home/quietchat/app/agency/node_modules/firebase/compat/firestore/dist/storage
/home/quietchat/app/agency/node_modules/firebase/compat/installations/dist/esm/compat/storage
/home/quietchat/app/agency/node_modules/firebase/compat/installations/dist/esm/storage
/home/quietchat/app/agency/node_modules/firebase/compat/installations/dist/compat/storage
/home/quietchat/app/agency/node_modules/firebase/compat/installations/dist/storage
/home/quietchat/app/agency/node_modules/firebase/compat/app/dist/esm/compat/storage
/home/quietchat/app/agency/node_modules/firebase/compat/app/dist/esm/storage
/home/quietchat/app/agency/node_modules/firebase/compat/app/dist/compat/storage
/home/quietchat/app/agency/node_modules/firebase/compat/app/dist/storage
/home/quietchat/app/agency/node_modules/firebase/compat/app-check/dist/esm/compat/storage
/home/quietchat/app/agency/node_modules/firebase/compat/app-check/dist/esm/storage
/home/quietchat/app/agency/node_modules/firebase/compat/app-check/dist/compat/storage
/home/quietchat/app/agency/node_modules/firebase/compat/app-check/dist/storage
/home/quietchat/app/agency/node_modules/firebase/compat/remote-config/dist/esm/compat/storage
/home/quietchat/app/agency/node_modules/firebase/compat/remote-config/dist/esm/storage
/home/quietchat/app/agency/node_modules/firebase/compat/remote-config/dist/compat/storage
/home/quietchat/app/agency/node_modules/firebase/compat/remote-config/dist/storage
/home/quietchat/app/agency/node_modules/firebase/compat/performance/dist/esm/compat/storage
/home/quietchat/app/agency/node_modules/firebase/compat/performance/dist/esm/storage
/home/quietchat/app/agency/node_modules/firebase/compat/performance/dist/compat/storage
/home/quietchat/app/agency/node_modules/firebase/compat/performance/dist/storage
/home/quietchat/app/agency/node_modules/firebase/compat/auth/dist/esm/compat/storage
/home/quietchat/app/agency/node_modules/firebase/compat/auth/dist/esm/storage
/home/quietchat/app/agency/node_modules/firebase/compat/auth/dist/compat/storage
/home/quietchat/app/agency/node_modules/firebase/compat/auth/dist/storage
/home/quietchat/app/agency/node_modules/firebase/compat/storage
/home/quietchat/app/agency/node_modules/firebase/compat/storage/dist/esm/compat/storage
/home/quietchat/app/agency/node_modules/firebase/compat/storage/dist/esm/storage
/home/quietchat/app/agency/node_modules/firebase/compat/storage/dist/compat/storage
/home/quietchat/app/agency/node_modules/firebase/compat/storage/dist/storage
/home/quietchat/app/agency/node_modules/firebase/installations/dist/esm/compat/storage
/home/quietchat/app/agency/node_modules/firebase/installations/dist/esm/storage
/home/quietchat/app/agency/node_modules/firebase/installations/dist/compat/storage
/home/quietchat/app/agency/node_modules/firebase/installations/dist/storage
/home/quietchat/app/agency/node_modules/firebase/app/dist/esm/compat/storage
/home/quietchat/app/agency/node_modules/firebase/app/dist/esm/storage
/home/quietchat/app/agency/node_modules/firebase/app/dist/compat/storage
/home/quietchat/app/agency/node_modules/firebase/app/dist/storage
/home/quietchat/app/agency/node_modules/firebase/app-check/dist/esm/compat/storage
/home/quietchat/app/agency/node_modules/firebase/app-check/dist/esm/storage
/home/quietchat/app/agency/node_modules/firebase/app-check/dist/compat/storage
/home/quietchat/app/agency/node_modules/firebase/app-check/dist/storage
/home/quietchat/app/agency/node_modules/firebase/remote-config/dist/esm/compat/storage
/home/quietchat/app/agency/node_modules/firebase/remote-config/dist/esm/storage
/home/quietchat/app/agency/node_modules/firebase/remote-config/dist/compat/storage
/home/quietchat/app/agency/node_modules/firebase/remote-config/dist/storage
/home/quietchat/app/agency/node_modules/firebase/performance/dist/esm/compat/storage
/home/quietchat/app/agency/node_modules/firebase/performance/dist/esm/storage
/home/quietchat/app/agency/node_modules/firebase/performance/dist/compat/storage
/home/quietchat/app/agency/node_modules/firebase/performance/dist/storage
/home/quietchat/app/agency/node_modules/firebase/auth/cordova/dist/esm/compat/storage
/home/quietchat/app/agency/node_modules/firebase/auth/cordova/dist/esm/storage
/home/quietchat/app/agency/node_modules/firebase/auth/cordova/dist/compat/storage
/home/quietchat/app/agency/node_modules/firebase/auth/cordova/dist/storage
/home/quietchat/app/agency/node_modules/firebase/auth/dist/esm/compat/storage
/home/quietchat/app/agency/node_modules/firebase/auth/dist/esm/storage
/home/quietchat/app/agency/node_modules/firebase/auth/dist/compat/storage
/home/quietchat/app/agency/node_modules/firebase/auth/dist/storage
/home/quietchat/app/agency/node_modules/firebase/auth/web-extension/dist/esm/compat/storage
/home/quietchat/app/agency/node_modules/firebase/auth/web-extension/dist/esm/storage
/home/quietchat/app/agency/node_modules/firebase/auth/web-extension/dist/compat/storage
/home/quietchat/app/agency/node_modules/firebase/auth/web-extension/dist/storage
/home/quietchat/app/agency/node_modules/firebase/storage
/home/quietchat/app/agency/node_modules/firebase/storage/dist/esm/compat/storage
/home/quietchat/app/agency/node_modules/firebase/storage/dist/esm/storage
/home/quietchat/app/agency/node_modules/firebase/storage/dist/compat/storage
/home/quietchat/app/agency/node_modules/firebase/storage/dist/storage
/home/quietchat/app/agency/node_modules/next/dist/esm/server/async-storage
/home/quietchat/app/agency/node_modules/next/dist/server/async-storage
/home/quietchat/backend-backup/node_modules/@firebase/database/dist/node-esm/src/core/storage
/home/quietchat/backend-backup/node_modules/@firebase/database/dist/src/core/storage
/home/quietchat/backend-backup/node_modules/multer/storage
/home/quietchat/backend-backup/node_modules/@google-cloud/storage
/home/quietchat/backend-backup/node_modules/javascript-obfuscator/typings/src/container/modules/storages
/home/quietchat/backend-backup/node_modules/javascript-obfuscator/typings/src/interfaces/storages
/home/quietchat/backend-backup/node_modules/javascript-obfuscator/typings/src/interfaces/analyzers/string-array-storage-analyzer
/home/quietchat/backend-backup/node_modules/javascript-obfuscator/typings/src/storages
/home/quietchat/backend-backup/node_modules/javascript-obfuscator/typings/src/custom-nodes/control-flow-flattening-nodes/control-flow-storage-nodes
/home/quietchat/backend-backup/node_modules/javascript-obfuscator/typings/src/analyzers/string-array-storage-analyzer
/home/quietchat/backend-backup/node_modules/javascript-obfuscator/typings/src/enums/storages
/home/quietchat/backend-backup/node_modules/javascript-obfuscator/typings/src/types/storages
/home/quietchat/backend-backup/node_modules/firebase-admin/lib/esm/storage
/home/quietchat/backend-backup/node_modules/firebase-admin/lib/storage
/home/quietchat/backend-backup/storage
/home/quietchat/quietchat-backend/backend/node_modules/@firebase/database/dist/node-esm/src/core/storage
/home/quietchat/quietchat-backend/backend/node_modules/@firebase/database/dist/src/core/storage
/home/quietchat/quietchat-backend/backend/node_modules/multer/storage
/home/quietchat/quietchat-backend/backend/node_modules/@google-cloud/storage
/home/quietchat/quietchat-backend/backend/node_modules/javascript-obfuscator/typings/src/container/modules/storages
/home/quietchat/quietchat-backend/backend/node_modules/javascript-obfuscator/typings/src/interfaces/storages
/home/quietchat/quietchat-backend/backend/node_modules/javascript-obfuscator/typings/src/interfaces/analyzers/string-array-storage-analyzer
/home/quietchat/quietchat-backend/backend/node_modules/javascript-obfuscator/typings/src/storages
/home/quietchat/quietchat-backend/backend/node_modules/javascript-obfuscator/typings/src/custom-nodes/control-flow-flattening-nodes/control-flow-storage-nodes
/home/quietchat/quietchat-backend/backend/node_modules/javascript-obfuscator/typings/src/analyzers/string-array-storage-analyzer
/home/quietchat/quietchat-backend/backend/node_modules/javascript-obfuscator/typings/src/enums/storages
/home/quietchat/quietchat-backend/backend/node_modules/javascript-obfuscator/typings/src/types/storages
/home/quietchat/quietchat-backend/backend/node_modules/firebase-admin/lib/esm/storage
/home/quietchat/quietchat-backend/backend/node_modules/firebase-admin/lib/storage
/home/quietchat/quietchat-backend/backend/storage
/home/quietchat/quietchat-backend/admin/node_modules/redux-persist/es/storage
/home/quietchat/quietchat-backend/admin/node_modules/redux-persist/lib/storage
/home/quietchat/quietchat-backend/admin/node_modules/redux-persist/src/storage
/home/quietchat/quietchat-backend/admin/node_modules/redux-persist/types/storage
/home/quietchat/quietchat-backend/admin/node_modules/@firebase/storage-types
/home/quietchat/quietchat-backend/admin/node_modules/@firebase/storage-compat
/home/quietchat/quietchat-backend/admin/node_modules/@firebase/database/dist/node-esm/src/core/storage
/home/quietchat/quietchat-backend/admin/node_modules/@firebase/database/dist/src/core/storage
/home/quietchat/quietchat-backend/admin/node_modules/@firebase/remote-config/dist/esm/src/storage
/home/quietchat/quietchat-backend/admin/node_modules/@firebase/remote-config/dist/src/storage
/home/quietchat/quietchat-backend/admin/node_modules/@firebase/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/ai/dist/esm/compat/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/ai/dist/esm/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/ai/dist/compat/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/ai/dist/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/functions/dist/esm/compat/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/functions/dist/esm/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/functions/dist/compat/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/functions/dist/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/data-connect/dist/esm/compat/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/data-connect/dist/esm/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/data-connect/dist/compat/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/data-connect/dist/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/vertexai/dist/esm/compat/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/vertexai/dist/esm/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/vertexai/dist/compat/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/vertexai/dist/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/messaging/dist/esm/compat/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/messaging/dist/esm/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/messaging/dist/compat/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/messaging/dist/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/messaging/sw/dist/esm/compat/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/messaging/sw/dist/esm/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/messaging/sw/dist/compat/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/messaging/sw/dist/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/analytics/dist/esm/compat/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/analytics/dist/esm/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/analytics/dist/compat/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/analytics/dist/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/database/dist/esm/compat/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/database/dist/esm/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/database/dist/compat/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/database/dist/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/firestore/dist/esm/compat/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/firestore/dist/esm/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/firestore/dist/compat/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/firestore/dist/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/firestore/lite/dist/esm/compat/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/firestore/lite/dist/esm/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/firestore/lite/dist/compat/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/firestore/lite/dist/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/compat/dist/esm/compat/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/compat/dist/esm/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/compat/dist/compat/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/compat/dist/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/compat/functions/dist/esm/compat/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/compat/functions/dist/esm/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/compat/functions/dist/compat/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/compat/functions/dist/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/compat/messaging/dist/esm/compat/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/compat/messaging/dist/esm/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/compat/messaging/dist/compat/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/compat/messaging/dist/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/compat/analytics/dist/esm/compat/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/compat/analytics/dist/esm/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/compat/analytics/dist/compat/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/compat/analytics/dist/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/compat/database/dist/esm/compat/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/compat/database/dist/esm/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/compat/database/dist/compat/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/compat/database/dist/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/compat/firestore/dist/esm/compat/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/compat/firestore/dist/esm/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/compat/firestore/dist/compat/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/compat/firestore/dist/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/compat/installations/dist/esm/compat/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/compat/installations/dist/esm/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/compat/installations/dist/compat/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/compat/installations/dist/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/compat/app/dist/esm/compat/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/compat/app/dist/esm/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/compat/app/dist/compat/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/compat/app/dist/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/compat/app-check/dist/esm/compat/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/compat/app-check/dist/esm/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/compat/app-check/dist/compat/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/compat/app-check/dist/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/compat/remote-config/dist/esm/compat/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/compat/remote-config/dist/esm/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/compat/remote-config/dist/compat/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/compat/remote-config/dist/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/compat/performance/dist/esm/compat/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/compat/performance/dist/esm/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/compat/performance/dist/compat/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/compat/performance/dist/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/compat/auth/dist/esm/compat/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/compat/auth/dist/esm/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/compat/auth/dist/compat/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/compat/auth/dist/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/compat/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/compat/storage/dist/esm/compat/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/compat/storage/dist/esm/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/compat/storage/dist/compat/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/compat/storage/dist/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/installations/dist/esm/compat/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/installations/dist/esm/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/installations/dist/compat/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/installations/dist/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/app/dist/esm/compat/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/app/dist/esm/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/app/dist/compat/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/app/dist/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/app-check/dist/esm/compat/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/app-check/dist/esm/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/app-check/dist/compat/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/app-check/dist/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/remote-config/dist/esm/compat/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/remote-config/dist/esm/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/remote-config/dist/compat/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/remote-config/dist/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/performance/dist/esm/compat/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/performance/dist/esm/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/performance/dist/compat/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/performance/dist/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/auth/cordova/dist/esm/compat/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/auth/cordova/dist/esm/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/auth/cordova/dist/compat/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/auth/cordova/dist/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/auth/dist/esm/compat/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/auth/dist/esm/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/auth/dist/compat/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/auth/dist/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/auth/web-extension/dist/esm/compat/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/auth/web-extension/dist/esm/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/auth/web-extension/dist/compat/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/auth/web-extension/dist/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/storage/dist/esm/compat/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/storage/dist/esm/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/storage/dist/compat/storage
/home/quietchat/quietchat-backend/admin/node_modules/firebase/storage/dist/storage
/home/quietchat/quietchat-backend/admin/node_modules/next/dist/esm/server/async-storage
/home/quietchat/quietchat-backend/admin/node_modules/next/dist/server/async-storage
/home/quietchat/quietchat-backend/agency/node_modules/redux-persist/es/storage
/home/quietchat/quietchat-backend/agency/node_modules/redux-persist/lib/storage
/home/quietchat/quietchat-backend/agency/node_modules/redux-persist/src/storage
/home/quietchat/quietchat-backend/agency/node_modules/redux-persist/types/storage
/home/quietchat/quietchat-backend/agency/node_modules/@firebase/storage-types
/home/quietchat/quietchat-backend/agency/node_modules/@firebase/storage-compat
/home/quietchat/quietchat-backend/agency/node_modules/@firebase/database/dist/node-esm/src/core/storage
/home/quietchat/quietchat-backend/agency/node_modules/@firebase/database/dist/src/core/storage
/home/quietchat/quietchat-backend/agency/node_modules/@firebase/remote-config/dist/esm/src/storage
/home/quietchat/quietchat-backend/agency/node_modules/@firebase/remote-config/dist/src/storage
/home/quietchat/quietchat-backend/agency/node_modules/@firebase/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/functions/dist/esm/compat/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/functions/dist/esm/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/functions/dist/compat/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/functions/dist/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/data-connect/dist/esm/compat/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/data-connect/dist/esm/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/data-connect/dist/compat/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/data-connect/dist/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/vertexai/dist/esm/compat/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/vertexai/dist/esm/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/vertexai/dist/compat/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/vertexai/dist/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/messaging/dist/esm/compat/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/messaging/dist/esm/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/messaging/dist/compat/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/messaging/dist/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/messaging/sw/dist/esm/compat/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/messaging/sw/dist/esm/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/messaging/sw/dist/compat/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/messaging/sw/dist/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/analytics/dist/esm/compat/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/analytics/dist/esm/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/analytics/dist/compat/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/analytics/dist/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/database/dist/esm/compat/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/database/dist/esm/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/database/dist/compat/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/database/dist/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/firestore/dist/esm/compat/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/firestore/dist/esm/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/firestore/dist/compat/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/firestore/dist/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/firestore/lite/dist/esm/compat/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/firestore/lite/dist/esm/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/firestore/lite/dist/compat/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/firestore/lite/dist/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/compat/dist/esm/compat/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/compat/dist/esm/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/compat/dist/compat/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/compat/dist/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/compat/functions/dist/esm/compat/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/compat/functions/dist/esm/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/compat/functions/dist/compat/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/compat/functions/dist/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/compat/messaging/dist/esm/compat/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/compat/messaging/dist/esm/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/compat/messaging/dist/compat/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/compat/messaging/dist/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/compat/analytics/dist/esm/compat/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/compat/analytics/dist/esm/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/compat/analytics/dist/compat/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/compat/analytics/dist/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/compat/database/dist/esm/compat/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/compat/database/dist/esm/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/compat/database/dist/compat/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/compat/database/dist/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/compat/firestore/dist/esm/compat/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/compat/firestore/dist/esm/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/compat/firestore/dist/compat/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/compat/firestore/dist/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/compat/installations/dist/esm/compat/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/compat/installations/dist/esm/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/compat/installations/dist/compat/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/compat/installations/dist/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/compat/app/dist/esm/compat/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/compat/app/dist/esm/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/compat/app/dist/compat/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/compat/app/dist/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/compat/app-check/dist/esm/compat/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/compat/app-check/dist/esm/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/compat/app-check/dist/compat/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/compat/app-check/dist/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/compat/remote-config/dist/esm/compat/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/compat/remote-config/dist/esm/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/compat/remote-config/dist/compat/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/compat/remote-config/dist/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/compat/performance/dist/esm/compat/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/compat/performance/dist/esm/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/compat/performance/dist/compat/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/compat/performance/dist/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/compat/auth/dist/esm/compat/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/compat/auth/dist/esm/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/compat/auth/dist/compat/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/compat/auth/dist/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/compat/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/compat/storage/dist/esm/compat/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/compat/storage/dist/esm/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/compat/storage/dist/compat/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/compat/storage/dist/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/installations/dist/esm/compat/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/installations/dist/esm/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/installations/dist/compat/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/installations/dist/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/app/dist/esm/compat/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/app/dist/esm/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/app/dist/compat/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/app/dist/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/app-check/dist/esm/compat/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/app-check/dist/esm/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/app-check/dist/compat/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/app-check/dist/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/remote-config/dist/esm/compat/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/remote-config/dist/esm/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/remote-config/dist/compat/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/remote-config/dist/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/performance/dist/esm/compat/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/performance/dist/esm/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/performance/dist/compat/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/performance/dist/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/auth/cordova/dist/esm/compat/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/auth/cordova/dist/esm/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/auth/cordova/dist/compat/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/auth/cordova/dist/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/auth/dist/esm/compat/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/auth/dist/esm/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/auth/dist/compat/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/auth/dist/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/auth/web-extension/dist/esm/compat/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/auth/web-extension/dist/esm/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/auth/web-extension/dist/compat/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/auth/web-extension/dist/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/storage/dist/esm/compat/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/storage/dist/esm/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/storage/dist/compat/storage
/home/quietchat/quietchat-backend/agency/node_modules/firebase/storage/dist/storage
/home/quietchat/quietchat-backend/agency/node_modules/next/dist/esm/server/async-storage
/home/quietchat/quietchat-backend/agency/node_modules/next/dist/server/async-storage
root@vm-woven-valleys:/home/quietchat/app/backend# cp -r /home/quietchat/quietchat-backend/backend/storage /home/quietchat/app/backend/

root@vm-woven-valleys:/home/quietchat/app/backend#
root@vm-woven-valleys:/home/quietchat/app/backend# ls /home/quietchat/app/backend/storage | head
1768563934818.gif
1768563945802.gif
1768563957056.gif
1768563969324.gif
1768564196633.png
1768579887241.jpg
1768580061908.m4a
1768580098288.m4a
1768580111653.jpg
1768658782966.m4a
root@vm-woven-valleys:/home/quietchat/app/backend# nano backend/routes/admin.route.js
root@vm-woven-valleys:/home/quietchat/app/backend# nano routes/admin.route.js
root@vm-woven-valleys:/home/quietchat/app/backend# find . -name "*admin*route*"
./routes/admin/admin.route.js
root@vm-woven-valleys:/home/quietchat/app/backend# cd /home/quietchat/app
root@vm-woven-valleys:/home/quietchat/app# git pull origin main
remote: Enumerating objects: 23, done.
remote: Counting objects: 100% (23/23), done.
remote: Compressing objects: 100% (2/2), done.
remote: Total 12 (delta 10), reused 12 (delta 10), pack-reused 0 (from 0)
Unpacking objects: 100% (12/12), 1024 bytes | 204.00 KiB/s, done.
From https://github.com/URLWebwala/quiet-chat-admin
 * branch            main       -> FETCH_HEAD
   915b182..24d7b9d  main       -> origin/main
Updating 915b182..24d7b9d
error: Your local changes to the following files would be overwritten by merge:
        admin/src/store/adminSlice.ts
Please commit your changes or stash them before you merge.
Aborting
root@vm-woven-valleys:/home/quietchat/app# pm2 restart backend --update-env
[PM2] Applying action restartProcessId on app [backend](ids: [ 3 ])
[PM2] [backend](3) ✓
┌────┬────────────────────┬──────────┬──────┬───────────┬──────────┬──────────┐
│ id │ name               │ mode     │ ↺    │ status    │ cpu      │ memory   │
├────┼────────────────────┼──────────┼──────┼───────────┼──────────┼──────────┤
│ 6  │ admin              │ fork     │ 1    │ online    │ 0%       │ 56.3mb   │
│ 5  │ agency             │ fork     │ 0    │ online    │ 0%       │ 56.9mb   │
│ 3  │ backend            │ fork     │ 172  │ online    │ 0%       │ 18.3mb   │
└────┴────────────────────┴──────────┴──────┴───────────┴──────────┴──────────┘
root@vm-woven-valleys:/home/quietchat/app# cd /home/quietchat/app/admin
root@vm-woven-valleys:/home/quietchat/app/admin# npm run build

> figgy-frontend@0.1.0 build
> next build

  ▲ Next.js 14.2.35

   Creating an optimized production build ...
 ✓ Compiled successfully
 ✓ Linting and checking validity of types
 ✓ Collecting page data
   Generating static pages (18/49)  [  ==]value
 ✓ Generating static pages (49/49)
 ✓ Collecting build traces
 ✓ Finalizing page optimization

Route (pages)                              Size     First Load JS
┌ ○ /                                      2.19 kB         283 kB
├   /_app                                  0 B             160 kB
├ ○ /404                                   184 B           160 kB
├ ○ /adminProfile                          3.29 kB         292 kB
├ ○ /Agency                                7.21 kB         523 kB
├ ƒ /api/hello                             0 B             160 kB
├ ○ /AuthCheck                             187 B           160 kB
├ ○ /CoinPlan                              209 B           253 kB
├   └ css/d8a3556df92de8fd.css             195 B
├ ○ /CoinPlanHistory                       222 B           282 kB
├ ○ /DailyCheckInReward                    2.65 kB         253 kB
├ ○ /dashboard                             9.57 kB         301 kB
├   └ css/a4f7feec578e0526.css             242 B
├ ○ /DashboardAgency                       329 B           249 kB
├ ○ /DocumentType                          211 B           252 kB
├   └ css/63bb9943b04b0e5a.css             188 B
├ ○ /ForgotPassword                        1.61 kB         237 kB
├ ○ /GetNewUser                            190 B           163 kB
├   └ css/93b7d82a9937cf9e.css             242 B
├ ○ /GiftCategory                          1.93 kB         253 kB
├ ○ /GiftPage                              56.6 kB         336 kB
├ ○ /Host                                  68.6 kB         572 kB
├   └ css/743bfef502688882.css             3.38 kB
├ ○ /Host/AgencyWiseHost                   4.99 kB         308 kB
├ ○ /Host/HostFollowerList                 2.27 kB         253 kB
├ ○ /Host/HostHistoryPage                  2.21 kB         286 kB
├ ○ /Host/HostInfo                         222 B           449 kB
├ ○ /Host/HostInfoPage                     2.22 kB         453 kB
├ ○ /Host/UserBlock                        2.23 kB         253 kB
├ ○ /HostProfile                           2.92 kB         252 kB
├ ○ /HostRequest                           6.16 kB         257 kB
├   └ css/49d52c9184d2eaf7.css             185 B
├ ○ /Impression                            1.96 kB         253 kB
├ ○ /Login                                 2.28 kB         202 kB
├ ○ /Other                                 3.59 kB         163 kB
├ ○ /Plan                                  4.04 kB         256 kB
├   └ css/6405bc518779b178.css             194 B
├ ○ /PlanHistory                           6.64 kB         287 kB
├ ○ /PlanHistory/coinhistory               1.39 kB         252 kB
├ ○ /PlanHistory/viphistory                1.43 kB         252 kB
├ ○ /PurchaseCoinPlanHistory               2.8 kB          251 kB
├ ○ /Registration                          210 B           281 kB
├ ○ /Setting                               23.2 kB         291 kB
├   └ css/545a950890317676.css             245 B
├ ○ /TopPerformingAgency                   2.98 kB         163 kB
├ ○ /TopPerformingHost                     3.03 kB         163 kB
├ ○ /TopSpenders                           2.82 kB         162 kB
├ ○ /User/CoinPlanHistoryPage              2.94 kB         287 kB
├ ○ /User/FakeUser                         4 kB            220 kB
├ ○ /User/HostBlock                        3.3 kB          252 kB
├ ○ /User/RealUser                         4.09 kB         220 kB
├ ○ /User/User                             7.15 kB         311 kB
├   └ css/c4b182deda48d1ca.css             269 B
├ ○ /User/UserFollowingList                223 B           253 kB
├ ○ /User/UserInfoPage                     1.71 kB         256 kB
├ ○ /UserInfo                              650 B           251 kB
├ ○ /VipPlan                               3.85 kB         252 kB
├   └ css/714b03964a1daed9.css             185 B
├ ○ /VipPlanPrevilage                      6.25 kB         255 kB
└ ○ /WithdrawRequest                       8.14 kB         291 kB
+ First Load JS shared by all              187 kB
  ├ chunks/framework-cb7c0920bfffe473.js   44.9 kB
  ├ chunks/main-965a54131ad9b397.js        34.2 kB
  ├ chunks/pages/_app-7ab4de33ef684e98.js  78.6 kB
  ├ css/89f57b8801a0b2ab.css               27 kB
  └ other shared chunks (total)            1.93 kB

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand

root@vm-woven-valleys:/home/quietchat/app/admin# pm2 restart admin --update-env
[PM2] Applying action restartProcessId on app [admin](ids: [ 6 ])
[PM2] [admin](6) ✓
┌────┬────────────────────┬──────────┬──────┬───────────┬──────────┬──────────┐
│ id │ name               │ mode     │ ↺    │ status    │ cpu      │ memory   │
├────┼────────────────────┼──────────┼──────┼───────────┼──────────┼──────────┤
│ 6  │ admin              │ fork     │ 2    │ online    │ 0%       │ 19.5mb   │
│ 5  │ agency             │ fork     │ 0    │ online    │ 0%       │ 57.5mb   │
│ 3  │ backend            │ fork     │ 172  │ online    │ 0%       │ 97.5mb   │
└────┴────────────────────┴──────────┴──────┴───────────┴──────────┴──────────┘
root@vm-woven-valleys:/home/quietchat/app/admin#"use client";
import { useEffect, useState } from "react";
import Login from "./Login";
import Registration from "./Registration";
import axios from "axios";
import Loader from "@/component/Loader";

const Home = (res: any) => {
  const [login, setLogin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("/api/admin/login")
      .then((res) => {
        setLogin(res.data.login);
        setLoading(false);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);
  return loading ? <Loader /> : login ? <Login /> : <Registration />;

};

export default Home;
