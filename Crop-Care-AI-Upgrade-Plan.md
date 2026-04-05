# Crop-Care-AI Upgrade Plan

## Overview

This document tracks the full upgrade of the Crop-Care-AI project across four phases.

| Phase | Scope | Status |
|-------|-------|--------|
| 1 | Python / TensorFlow / Keras / Notebooks | ✅ Complete |
| 2A | Web Frontend (React + MUI) | ✅ Complete |
| 2B | Mobile App (React Native) | ✅ Complete |
| 3 | Android Native Build Layer | ⬜ Not Started |
| 4 | GCP Deployment | ⬜ Not Started |

---

## Phase 1 — Python / TensorFlow / Keras / Notebooks ✅

### What Was Done

- Fixed `_DictWrapper` TypeError in all 9 plant disease classification notebooks:
  - `apple`, `bell-pepper`, `cherry`, `corn`, `grape`, `peach`, `potato`, `strawberry`, `tomato`
  - Pattern applied: `hist = dict(history.history)` + `epochs_range = range(len(acc))`
  - Potato notebook additionally needed `history.history = dict(history.history)` injected right after `model.fit()` because it had many exploratory cells directly accessing `history.history['key']`

- Fixed `FileNotFoundError` for `DATA_DIR` in all notebooks:
  - Old fragile approach: `pathlib.Path().resolve().parent.parent / "Data" / "Plant"` (broke because kernel CWD is workspace root, not `training/`)
  - New approach: landmark-based project root discovery loop — searches upward from CWD until it finds a directory containing both `training/` and `api/` subdirectories

- Updated `api/main.py`:
  - Changed model path to `../potatoes.keras`
  - Removed `compile=False` (only needed for old `.h5` format, not needed for `.keras`)

- All 9 notebooks now call `model.save("crop_name.keras")` and `model.export()`

### Key Files Modified

- `training/*.ipynb` — all 9 notebooks
- `api/main.py`

---

## Phase 2A — Web Frontend

### Current Stack → Target Stack

| Package | Current | Target |
|---------|---------|--------|
| `react` | 17.0.2 | 18.x |
| `react-dom` | 17.0.2 | 18.x |
| `react-scripts` | 4.0.3 | 5.0.1 |
| `@material-ui/core` | 4.11.4 | `@mui/material` 5.x |
| `@material-ui/icons` | 4.11.2 | `@mui/icons-material` 5.x |
| `material-ui-dropzone` | 3.5.0 | `react-dropzone` 14.x |
| `axios` | 0.21.1 | 1.x |
| `web-vitals` | 1.1.2 | 3.x |

### Step-by-Step Plan

#### Step 2A-1 — Upgrade `react-scripts` 4 → 5.0.1
- **Risk:** Low — no code changes required
- **Action:** `npm install react-scripts@5.0.1`
- **Verify:** `npm run build` succeeds

#### Step 2A-2 — Upgrade `axios` 0.21 → 1.x
- **Risk:** Low
- **Action:**
  - `npm install axios@latest`
  - In `frontend/src/home.js`, change:
    ```js
    // Before
    const axios = require("axios").default;

    // After
    import axios from "axios";
    ```
- **Verify:** Image upload still POSTs correctly

#### Step 2A-3 — Upgrade React 17 → 18
- **Risk:** Low-Medium
- **Action:**
  - `npm install react@18 react-dom@18`
  - In `frontend/src/index.js`, change:
    ```js
    // Before (React 17)
    import ReactDOM from 'react-dom';
    ReactDOM.render(<App />, document.getElementById('root'));

    // After (React 18)
    import { createRoot } from 'react-dom/client';
    const root = createRoot(document.getElementById('root'));
    root.render(<App />);
    ```
- **Verify:** App renders without warnings

#### Step 2A-4 — Migrate MUI v4 → v5
- **Risk:** HIGH — most labor-intensive change (~150 lines in `home.js`)
- **Action:**
  - Uninstall old packages:
    ```
    npm uninstall @material-ui/core @material-ui/icons
    ```
  - Install new packages:
    ```
    npm install @mui/material @mui/icons-material @emotion/react @emotion/styled
    ```
  - In `frontend/src/home.js`:
    - Replace all `@material-ui/core` imports → `@mui/material`
    - Replace all `@material-ui/icons` imports → `@mui/icons-material`
    - Replace `makeStyles` (JSS) with either `sx` prop or `styled()` API (Emotion-based)
    - Replace `withStyles` HOC pattern similarly
    - Update any deprecated MUI v4 prop names (e.g. `variant="outlined"` is unchanged; `color` props may vary)
- **Verify:** UI renders correctly with no MUI console errors

#### Step 2A-5 — Replace `material-ui-dropzone` with `react-dropzone`
- **Risk:** HIGH — `material-ui-dropzone` is abandoned with no MUI v5 release; requires writing a custom drop zone component
- **Action:**
  - Uninstall: `npm uninstall material-ui-dropzone`
  - Install: `npm install react-dropzone@14`
  - Replace `<DropzoneArea>` usage in `home.js` with a custom component using `useDropzone()` hook from `react-dropzone` and MUI v5 components for styling
  - The custom component must replicate: drag-and-drop, file preview, `onChange` callback
- **Verify:** File can be drag-dropped or clicked-to-browse and preview shows correctly

#### Step 2A-6 — Upgrade `web-vitals` 1 → 3
- **Risk:** Low — no code changes expected
- **Action:** `npm install web-vitals@3`
- **Verify:** `npm run build` succeeds

#### Step 2A-7 — Final Verification
- `npm run build` — clean build, no errors
- `npm start` — app loads, image can be uploaded, prediction is returned from API

---

## Phase 2B — Mobile App (React Native)

### Current Stack → Target Stack

| Package | Current | Target |
|---------|---------|--------|
| `react-native` | 0.64.2 | 0.73.x |
| `react` | 17.0.1 | 18.x (peer of RN 0.73) |
| `axios` | 0.21.1 | 1.x |
| `react-native-image-picker` | 4.0.4 | 7.x |
| `react-native-permissions` | 3.0.5 | 4.x |
| `react-native-config` | 1.4.4 | 1.5.x |
| `metro` / `metro-core` | 0.66.1 | 0.80.x (bundled with RN 0.73) |

### Step-by-Step Plan

#### Step 2B-1 — Upgrade React Native 0.64.2 → 0.73.x
- **Risk:** HIGH — native build files must be updated precisely
- **Action:** Use the official React Native Upgrade Helper: https://react-native-community.github.io/upgrade-helper/
  - Set source version `0.64.2` → target `0.73.x`
  - Apply the generated diff to these native files:
    - `android/build.gradle`
    - `android/app/build.gradle`
    - `android/gradle/wrapper/gradle-wrapper.properties`
    - `ios/Podfile`
    - `metro.config.js`
    - `babel.config.js`
  - Update `package.json` React Native and React peer versions
- **Verify:** `npx react-native start --reset-cache` runs without errors

#### Step 2B-2 — Upgrade `axios` 0.21 → 1.x + Fix Interceptor
- **Risk:** Medium — the existing interceptor uses the old header mutation pattern which is broken in axios 1.x
- **Action:**
  - `npm install axios@latest` inside `mobile-app/`
  - In `mobile-app/App.js`, find the axios interceptor and update the headers pattern:
    ```js
    // Before (axios 0.x — broken in 1.x)
    axios.interceptors.request.use(request => {
      request.headers = {
        'Content-Type': 'multipart/form-data',
        Accept: 'application/json',
      };
      return request;
    });

    // After (axios 1.x compatible)
    axios.interceptors.request.use(request => {
      request.headers['Content-Type'] = 'multipart/form-data';
      request.headers['Accept'] = 'application/json';
      return request;
    });
    ```
- **Verify:** API call from mobile app succeeds, no `Cannot set properties of undefined` errors

#### Step 2B-3 — Upgrade `react-native-image-picker` 4 → 7
- **Risk:** Medium
- **Action:**
  - `npm install react-native-image-picker@7`
  - In `mobile-app/App.js`, remove deprecated options `width` and `height` from the picker options object (removed in v5+):
    ```js
    // Before
    const options = {
      width: 256,
      height: 256,
      // ...
    };

    // After
    const options = {
      // width and height removed
      // ...
    };
    ```
  - Review any other API differences from the [v4→v7 migration guide](https://github.com/react-native-image-picker/react-native-image-picker/blob/main/docs/Migrating.md)
- **Verify:** Camera and gallery both open correctly, selected image is returned

#### Step 2B-4 — Upgrade `react-native-permissions` 3 → 4
- **Risk:** Medium
- **Action:**
  - `npm install react-native-permissions@4`
  - Review `mobile-app/Permissions.js` for any API changes
  - Update native setup per the [v4 setup guide](https://github.com/zoontek/react-native-permissions/blob/master/README.md) (Android: `AndroidManifest.xml` entries, iOS: `Info.plist` and `Podfile` setup)
- **Verify:** Camera and storage permissions are requested and granted correctly on both platforms

#### Step 2B-5 — Upgrade `react-native-config` 1.4 → 1.5
- **Risk:** Low — no code changes expected
- **Action:** `npm install react-native-config@1.5`
- **Verify:** `.env` variables still accessible at runtime

#### Step 2B-6 — Update Dev Dependencies (Metro, Babel)
- **Risk:** Low — these are bundled with RN 0.73 upgrade
- **Action:** Already covered by Step 2B-1 (Upgrade Helper diff patches `metro.config.js` and `babel.config.js`)
- **Packages affected:** `@babel/core`, `metro`, `metro-core`, `metro-react-native-babel-preset`

#### Step 2B-7 — Final Verification
- Android: `npx react-native run-android`
- iOS: `cd ios && pod install && cd .. && npx react-native run-ios`
- Test: camera, gallery, image upload, prediction response displayed

---

## Phase 3 — Android Native Build Layer ⬜

> Detailed plan TBD after Phase 2B is complete.

Key areas:
- Gradle version alignment
- Android SDK / build tools versions
- ProGuard / R8 rules for TFLite if using on-device inference
- Signing config for release build

---

## Phase 4 — GCP Deployment ⬜

> Detailed plan TBD after Phases 1–3 are complete.

Key areas:
- `gcp/main.py` review and update
- TF Serving vs direct FastAPI deployment
- Cloud Run vs GKE
- Model artifact storage (GCS bucket)
- CI/CD pipeline

---

## Risk Summary

| Risk | Severity | Phase |
|------|----------|-------|
| `makeStyles`/`withStyles` → MUI v5 `sx`/`styled()` migration | 🔴 High | 2A-4 |
| `material-ui-dropzone` → custom `react-dropzone` component | 🔴 High | 2A-5 |
| React Native native build file patches (Upgrade Helper) | 🔴 High | 2B-1 |
| axios 1.x interceptor headers mutation | 🟡 Medium | 2B-2 |
| `react-native-image-picker` v4 → v7 API changes | 🟡 Medium | 2B-3 |
| `react-native-permissions` v3 → v4 native setup | 🟡 Medium | 2B-4 |
| `react-scripts` 4 → 5 | 🟢 Low | 2A-1 |
| `axios` 0.21 → 1.x (frontend only) | 🟢 Low | 2A-2 |
| React 17 → 18 (`createRoot`) | 🟢 Low | 2A-3 |
| `web-vitals` 1 → 3 | 🟢 Low | 2A-6 |
| `react-native-config` 1.4 → 1.5 | 🟢 Low | 2B-5 |

---

## Files That Will Be Modified

### Phase 2A
- `frontend/package.json`
- `frontend/src/index.js`
- `frontend/src/home.js`

### Phase 2B
- `mobile-app/package.json`
- `mobile-app/App.js`
- `mobile-app/Permissions.js`
- `mobile-app/android/build.gradle`
- `mobile-app/android/app/build.gradle`
- `mobile-app/android/gradle/wrapper/gradle-wrapper.properties`
- `mobile-app/ios/Podfile`
- `mobile-app/metro.config.js`
- `mobile-app/babel.config.js`

---

*Last updated: Phase 1 complete. Phase 2 plan reviewed and approved before implementation begins.*
