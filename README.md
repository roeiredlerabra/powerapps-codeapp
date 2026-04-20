# מערכת ציוד טכני — Power Apps Code App

> אפליקציית Code App לניהול ציוד טכני עבור טכנאי מחשבים, בנויה ב-React ומחוברת ל-Power Automate.

![Power Platform](https://img.shields.io/badge/Power%20Platform-Code%20App-6264A7?logo=microsoft)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4?logo=tailwindcss)
![CI](https://img.shields.io/github/actions/workflow/status/roeiredlerabra/powerapps-codeapp/build-and-release.yml?label=Build%20%26%20Package)

---

## מה זה?

אפליקציית **Power Apps Code App** שמציגה טבלת ציוד טכני (מחשבים, רשתות, כבלים וכו') שנשלפת מ-**Power Automate Flow**.

| תכונה | פרט |
|--------|-----|
| **שפה** | עברית (RTL) |
| **Layout** | רספונסיבי — כרטיסיות במובייל, טבלה מלאה בדסקטופ |
| **סטייל** | Tailwind CSS v4 + Tabler Icons |
| **Data** | Power Automate Flow → JSON response |
| **CI/CD** | GitHub Actions — build + pack solution (unmanaged + managed) |

---

## מבנה הפרויקט

```
├── src/
│   ├── App.tsx                      ← הקומפוננטה הראשית — טבלת ציוד + כרטיסיות
│   ├── App.css                      ← סגנונות בסיס
│   ├── index.css                    ← Tailwind v4 import
│   └── generated/                   ← קוד שנוצר אוטומטית ע"י power-apps CLI
│       ├── services/
│       │   └── TestcallfromcustomconnectorService.ts
│       └── models/
│           └── TestcallfromcustomconnectorModel.ts
│
├── solution-src/                    ← קוד מקור ה-Solution (unpacked)
│   ├── CanvasApps/                  ← ה-Code App bundle
│   ├── Workflows/                   ← ה-Power Automate Flow definition
│   └── Other/
│       ├── Solution.xml             ← גרסת ה-Solution (מתעדכנת ב-CI)
│       └── Customizations.xml
│
├── power.config.json                ← הגדרות Power Platform (env, app ID, flow)
├── .github/workflows/
│   └── build-and-release.yml        ← GitHub Actions — build & pack
│
├── GUIDE-power-automate-to-code-app.md  ← 📖 מדריך מפורט
└── package.json
```

---

## דרישות מוקדמות

```
Node.js  v18+  (מומלץ v22)
npm      v9+
PAC CLI  npm install -g pac
```

---

## התקנה והרצה מקומית

```bash
# שכפול הפרויקט
git clone https://github.com/roeiredlerabra/powerapps-codeapp.git
cd powerapps-codeapp

# התקנת תלויות
npm install

# פיתוח מקומי (hot reload)
npm run dev

# בנייה
npm run build
```

---

## Deploy ל-Power Platform

```bash
# ודא שאתה מחובר ל-Environment
pac auth list
pac org who

# העלה את ה-Code App
node_modules/.bin/power-apps push
```

> ⚠️ **חשוב:** השתמש ב-`node_modules/.bin/power-apps push` ולא ב-`pac code push` — PAC CLI ישן מסיר את שדה `workflowDetails` מ-`power.config.json` וגורם לשגיאה 500 בעליה.

---

## CI/CD — GitHub Actions

בכל push ל-`main` רץ workflow אוטומטי:

```
npm ci  →  npm run build  →  copy dist/ to solution-src/
→  bump Solution.xml version (1.0.0.<run#>)
→  pac solution pack (unmanaged)
→  pac solution pack (managed)
→  GitHub Release עם שני ה-zips
```

**לא נדרשים secrets ולא חיבור לסביבה.** הכל רץ לוקלית.

### ייבוא ידני

1. לך ל-[Releases](https://github.com/roeiredlerabra/powerapps-codeapp/releases)
2. הורד את ה-zip המתאים:
   - `*_unmanaged.zip` → לסביבת פיתוח/בדיקות
   - `*_managed.zip` → לסביבת ייצור
3. [make.powerapps.com](https://make.powerapps.com) → Solutions → Import Solution → העלה את ה-zip

---

## Stack טכנולוגי

| טכנולוגיה | גרסה | שימוש |
|-----------|-------|-------|
| React | 19 | UI framework |
| Vite | 7 | Build tool |
| TypeScript | strict | Type safety |
| Tailwind CSS | 4 | Styling & responsive |
| @tabler/icons-react | 3 | אייקונים |
| @microsoft/power-apps | 1.0.3 | Power Platform SDK |
| PAC CLI | 2.6.4 | Solution packing |

---

## Power Automate Flow

ה-Flow `test call from custom connector` מחזיר JSON array של פריטי ציוד:

```json
[
  {
    "id": 1,
    "name": "Dell Laptop XPS 15",
    "category": "מחשב נייד",
    "description": "מחשב נייד לפיתוח",
    "quantity": 3,
    "serial_number": "DL-2024-001",
    "status": "זמין",
    "location": "מחסן A",
    "assigned_to": null
  }
]
```

---

## �️ Power Platform Skills — GitHub Copilot Plugin

פרויקט זה נבנה בעזרת **[Power Platform Skills](https://github.com/microsoft/power-platform-skills)** — תוסף (plugin) ל-GitHub Copilot שמוסיף ל-Copilot Chat יכולות ייעודיות לפיתוח Power Apps Code Apps.

### מה זה עושה?

ה-plugin מלמד את GitHub Copilot:

| יכולת | תיאור |
|-------|--------|
| **create-code-app** | יצירת פרויקט Code App חדש מאפס — scaffold, init, deploy |
| **add-flow** | חיבור Power Automate Flow לפרויקט — מייצר service + model אוטומטית |
| **list-flows** | חיפוש Flows זמינים ב-Solution |
| **push** | העלאת הקוד ל-Power Platform |
| **list-connection-references** | הצגת connection references ב-Solution |

### איך מתקינים?

```bash
# מתוך VS Code — פתח Command Palette (Ctrl+Shift+P):
> GitHub Copilot: Install Chat Skill

# או מה-terminal:
npx power-platform-skills install
```

לאחר ההתקנה, ניתן לשוחח עם Copilot ב-VS Code ולבקש ממנו:
- *"create a new code app"*
- *"add a flow to the project"*
- *"push the app to Power Platform"*

Copilot יבצע את כל השלבים באופן אוטומטי — כולל scaffold, `pac code init`, `power-apps add-flow`, `npm run build`, ו-`power-apps push`.

### קישורים

- **Repo:** [github.com/microsoft/power-platform-skills](https://github.com/microsoft/power-platform-skills)
- **Code Apps template:** [github.com/microsoft/PowerAppsCodeApps](https://github.com/microsoft/PowerAppsCodeApps)
- **Docs:** [learn.microsoft.com/power-apps/maker/canvas-apps/code-apps](https://learn.microsoft.com/en-us/power-apps/maker/canvas-apps/code-apps-overview)

---

## 📖 מדריך מפורט

**[GUIDE-power-automate-to-code-app.md](GUIDE-power-automate-to-code-app.md)** — מדריך מלא לעובד חדש:

- איך בונים Flow שעובד עם Code App
- באיזה Trigger ו-Response להשתמש
- איך מוסיפים את ה-Flow לפרויקט
- דוגמאות קוד מלאות
- שגיאות נפוצות ואיך לפתור אותן
- כללי אצבע לעבודה שוטפת

---

## פרטי סביבה

| שדה | ערך |
|-----|-----|
| Environment ID | `e179aff1-bcc3-e311-8436-cdb56678bf53` |
| Org URL | `https://org3b820678.crm4.dynamics.com/` |
| App ID | `26074970-becf-4e66-aacc-15e8b0a5838c` |
| Solution | `codeapps_powerplatform` |
| Flow ID | `e312e07f-a735-4d55-8609-1d207d41902e` |

---

*נבנה באפריל 2026 · Abra IT*
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
