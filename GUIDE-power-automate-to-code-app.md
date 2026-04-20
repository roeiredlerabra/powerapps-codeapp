# מדריך: חיבור Power Automate ל-Power Apps Code App

> **קהל יעד:** עובד חדש שמכיר בסיסי React/TypeScript ורוצה לחבר לוגיקה עסקית מ-Power Automate לאפליקציית Code App.
>
> **מה תלמד:** איך לבנות Flow שיידע לדבר עם Code App, איך לייצא את השירות לתוך הקוד, ואיך לקרוא לו נכון.

---

## תוכן עניינים

1. [ארכיטקטורה — איך זה עובד בגדול](#1-ארכיטקטורה--איך-זה-עובד-בגדול)
2. [דרישות מוקדמות](#2-דרישות-מוקדמות)
3. [שלב 1 — יצירת Flow ב-Power Automate](#3-שלב-1--יצירת-flow-ב-power-automate)
4. [שלב 2 — הוספת ה-Flow לפרויקט](#4-שלב-2--הוספת-ה-flow-לפרויקט)
5. [שלב 3 — שימוש בשירות בקוד](#5-שלב-3--שימוש-בשירות-בקוד)
6. [דוגמה מלאה — מערכת ציוד טכני](#6-דוגמה-מלאה--מערכת-ציוד-טכני)
7. [העברת פרמטרים ל-Flow](#7-העברת-פרמטרים-ל-flow)
8. [שגיאות נפוצות ואיך לפתור](#8-שגיאות-נפוצות-ואיך-לפתור)
9. [כללי אצבע לעובד חדש](#9-כללי-אצבע-לעובד-חדש)

---

## 1. ארכיטקטורה — איך זה עובד בגדול

```
┌─────────────────────────────────────────────────────────┐
│                    Power Apps Code App                   │
│  (React + TypeScript, רץ בדפדפן המשתמש)                │
│                                                         │
│   const result = await MyFlowService.Run({ param })     │
│              │                                          │
└──────────────┼──────────────────────────────────────────┘
               │  HTTP POST (דרך Power Platform runtime)
               ▼
┌─────────────────────────────────────────────────────────┐
│                    Power Automate Flow                   │
│                                                         │
│   [טריגר: PowerApps (V2)]                              │
│        │                                                │
│        ▼                                                │
│   [לוגיקה עסקית: SQL / Dataverse / HTTP / וכו']        │
│        │                                                │
│        ▼                                                │
│   [Respond to a PowerApp or flow]                       │
│        └──► { "response": "<JSON string>" }             │
└─────────────────────────────────────────────────────────┘
```

**הנקודות החשובות:**

| נושא | פרט |
|------|-----|
| **טריגר** | חייב להיות `PowerApps (V2)` — לא V1, לא HTTP |
| **תגובה** | חייב להשתמש ב-`Respond to a PowerApp or flow` |
| **פורמט הנתונים** | ה-Code App מקבל `string` — לכן מחזירים JSON שעבר `serialize` |
| **מיקום ה-Flow** | חייב להיות **באותה Solution** שבה גם ה-App |
| **הרצה** | הכלי `power-apps add-flow` מייצר קוד TypeScript אוטומטית |

---

## 2. דרישות מוקדמות

לפני שמתחילים, ודא שיש לך:

```
✅ Node.js v18 ומעלה (מומלץ v22)
✅ Git
✅ PAC CLI: npm install -g pac
✅ Power Apps local CLI: npm install (בתוך פרויקט הקוד-אפ)
✅ גישה ל-Power Platform environment
✅ פרויקט Code App קיים (npx degit microsoft/PowerAppsCodeApps/templates/vite my-app)
✅ Solution קיימת ב-Power Platform שמכילה גם את ה-App
```

בדיקה מהירה — הרץ את הפקודות האלה ב-terminal:

```powershell
# בדוק גרסאות
node --version       # צריך להיות v18+
pac --version        # צריך להיות קיים

# בדוק שאתה מחובר ל-environment
pac auth list
pac org who
```

---

## 3. שלב 1 — יצירת Flow ב-Power Automate

### 3.1 פתח את ה-Flow ב-make.powerautomate.com

1. גש ל-[make.powerautomate.com](https://make.powerautomate.com)
2. בחר את ה-**Environment הנכון** (פינה עליונה ימנית)
3. לחץ **Solutions** בתפריט שמאל
4. פתח את ה-Solution של הפרויקט שלך
5. לחץ **New → Automation → Cloud flow → Instant**

### 3.2 בחר את הטריגר הנכון ⚠️

> **חשוב מאוד:** בחר דווקא **`PowerApps (V2)`** — לא גרסה ישנה ולא HTTP trigger.

```
[ בחירת טריגר ]

🔍 חפש: "PowerApps"

✅ PowerApps (V2)           ← זה הנכון!
❌ PowerApps                ← גרסה ישנה, לא תעבוד
❌ When a HTTP request...   ← לא מתאים ל-Code App
```

**מראה הטריגר אחרי הבחירה:**

```
╔══════════════════════════════════════╗
║  ⚡ PowerApps (V2)                   ║
║                                      ║
║  Add an input (אופציונלי):           ║
║  ┌──────────────────────────────┐   ║
║  │ + Text / Number / Boolean... │   ║
║  └──────────────────────────────┘   ║
╚══════════════════════════════════════╝
```

### 3.3 הוסף פרמטרים לטריגר (אם צריך)

אם ה-Flow צריך לקבל נתונים מה-App (כמו מזהה, מחרוזת חיפוש וכו'):

לחץ **"Add an input"** בתוך ה-Trigger ובחר את הסוג:

| סוג | מתי להשתמש | דוגמה |
|-----|-----------|-------|
| **Text** | מחרוזות, IDs, מילות חיפוש | `userId`, `searchQuery` |
| **Number** | מספרים שלמים / עשרוניים | `itemId`, `quantity` |
| **Boolean** | אמת/שקר | `includeInactive` |
| **Date** | תאריכים | `fromDate` |

**דוגמה — טריגר עם פרמטר:**

```
PowerApps (V2) Trigger
├── Input: searchQuery (Text)
└── Input: categoryFilter (Text)
```

### 3.4 הוסף לוגיקה עסקית

כאן תוסיף את הפעולות שה-Flow צריך לעשות. לדוגמה:

**דוגמה א' — שאילתה מ-Dataverse:**
```
PowerApps (V2)
    │
    ▼
List rows (Dataverse)
    Table: Equipment Items
    Filter: category eq '@{triggerBody()?[''categoryFilter'']}'
    │
    ▼
Respond to a PowerApp or flow
```

**דוגמה ב' — קריאת HTTP חיצוני:**
```
PowerApps (V2)
    │
    ▼
HTTP - GET https://my-api.com/equipment
    Headers: Authorization: Bearer ...
    │
    ▼
Parse JSON (כדי לעבד את התגובה)
    │
    ▼
Respond to a PowerApp or flow
```

**דוגמה ג' — שאילתת SQL:**
```
PowerApps (V2)
    │
    ▼
Execute a SQL query
    Query: SELECT * FROM equipment WHERE status = 'active'
    │
    ▼
Respond to a PowerApp or flow
```

### 3.5 הגדרת ה-Response — החלק הכי חשוב ⚠️

> **כלל ברזל:** ה-Code App מקבל רק `string` בתגובה. לכן, נמיר את הנתונים ל-JSON string לפני שנחזיר.

הוסף פעולה: **"Respond to a PowerApp or flow"**

```
╔══════════════════════════════════════════════╗
║  📤 Respond to a PowerApp or flow            ║
║                                              ║
║  + Add an output                             ║
║  ┌────────────────────────────────────────┐  ║
║  │  Name:   response                      │  ║
║  │  Type:   Text                          │  ║
║  │  Value:  [expression]                  │  ║
║  └────────────────────────────────────────┘  ║
╚══════════════════════════════════════════════╝
```

**שם השדה חייב להיות בדיוק: `response`** (כי זה מה שה-SDK מצפה לו).

**ערך ה-Value — Expression:**

לחץ על שדה ה-Value, לחץ על לשונית **Expression**, והכנס:

```
string(body('List_rows')?['value'])
```

או אם רוצים להחזיר אובייקט שלם:

```
string(outputs('HTTP')['body'])
```

**הדרך הנכונה ביותר — Convert to JSON string:**

```
json אחד שעבר stringify:

outputs('Execute_a_SQL_query')?['body']?['resultsets']?['Table1']
```

---

### דוגמת Flow שלמה — מסך ציוד

```
[PowerApps (V2)]
       │
       ▼
[Initialize Variable]
   Name: equipmentList
   Type: Array
   Value: empty
       │
       ▼
[List rows - Dataverse]
   Table: cr123_equipmentitems
   Select columns: cr123_id, cr123_name, cr123_category, cr123_status, ...
   Top count: 100
       │
       ▼
[Respond to a PowerApp or flow]
   Output name: response
   Output type: Text
   Value: string(outputs('List_rows')?['body']?['value'])
```

---

## 4. שלב 2 — הוספת ה-Flow לפרויקט

### 4.1 מצא את ה-Flow ID

```powershell
cd "C:\path\to\my-code-app"

# רשום את כל ה-Flows בסביבה
node_modules\.bin\power-apps list-flows

# או חפש לפי שם
node_modules\.bin\power-apps list-flows --search "שם הפלו שלך"
```

הפלט יראה כך:

```
Flows:
  - test call from custom connector
    ID: e312e07f-a735-4d55-8609-1d207d41902e
    Status: Active
```

**העתק את ה-ID** — תצטרך אותו בשלב הבא.

### 4.2 הוסף את ה-Flow לפרויקט

```powershell
node_modules\.bin\power-apps add-flow --flow-id <FLOW_ID_שלך>

# דוגמה:
node_modules\.bin\power-apps add-flow --flow-id e312e07f-a735-4d55-8609-1d207d41902e
```

**מה הפקודה הזו עושה?**

```
לפני:                           אחרי:
src/                            src/
├── App.tsx                     ├── App.tsx
└── ...                         ├── generated/
                                │   ├── services/
                                │   │   └── MyFlowService.ts  ← נוצר אוטומטית!
                                │   └── models/
                                │       └── MyFlowModel.ts    ← נוצר אוטומטית!
                                └── ...

                                power.config.json  ← מתעדכן אוטומטית!
```

### 4.3 בדוק את הקבצים שנוצרו

**`src/generated/models/MyFlowModel.ts`:**

```typescript
// קובץ זה נוצר אוטומטית — אל תערוך אותו!

export type ManualTriggerInput = object;
// אם הוספת פרמטרים לטריגר, הם יופיעו כאן:
// export interface ManualTriggerInput {
//   searchQuery?: string;
//   categoryFilter?: string;
// }

export interface ResponseActionOutput {
  response?: string;  // ← כל הנתונים חוזרים כ-JSON string
}
```

**`src/generated/services/MyFlowService.ts`:**

```typescript
// קובץ זה נוצר אוטומטית — אל תערוך אותו!

export class MyFlowService {
  public static async Run(input: ManualTriggerInput): Promise<IOperationResult<ResponseActionOutput>> {
    // ...קריאה ל-Power Platform runtime
  }
}
```

**`power.config.json`** (מתעדכן אוטומטית):

```json
{
  "connectionReferences": {
    "4d93f509-2691-4b92-bfcb-b5b08df47698": {
      "id": "/providers/Microsoft.PowerApps/apis/shared_logicflows",
      "displayName": "Logic flows",
      "dataSources": ["myflow"],
      "workflowDetails": {
        "workflowEntityId": "...",
        "workflowDisplayName": "My Flow Name",
        "workflowName": "e312e07f-..."
      }
    }
  }
}
```

> ⚠️ **אזהרה:** אל תמחק את `workflowDetails` מ-`power.config.json`!
> אם תשתמש ב-`pac code push` (PAC CLI) במקום ב-`node_modules\.bin\power-apps.cmd push`, הוא ידחה את השדה הזה וה-App לא יעלה.
> **תמיד השתמש ב:** `node_modules\.bin\power-apps.cmd push`

---

## 5. שלב 3 — שימוש בשירות בקוד

### 5.1 Import בסיסי

```typescript
import { MyFlowService } from './generated/services/MyFlowService'
```

### 5.2 קריאה פשוטה ללא פרמטרים

```typescript
async function loadData() {
  const result = await MyFlowService.Run({})
  
  // התגובה מגיעה כ-JSON string
  const jsonString = result.data?.response
  
  if (jsonString) {
    const items = JSON.parse(jsonString)
    console.log(items)
  }
}
```

### 5.3 קריאה עם פרמטרים

```typescript
async function searchEquipment(query: string, category: string) {
  const result = await MyFlowService.Run({
    searchQuery: query,
    categoryFilter: category,
  })
  
  const jsonString = result.data?.response
  if (jsonString) {
    const items = JSON.parse(jsonString) as EquipmentItem[]
    return items
  }
  return []
}
```

### 5.4 Pattern מומלץ — עם State ו-useEffect

```typescript
import { useState, useEffect } from 'react'
import { MyFlowService } from './generated/services/MyFlowService'

interface MyItem {
  id: number
  name: string
  status: string
}

type LoadState = 'idle' | 'loading' | 'loaded' | 'error'

function MyComponent() {
  const [items, setItems] = useState<MyItem[]>([])
  const [loadState, setLoadState] = useState<LoadState>('idle')
  const [error, setError] = useState('')

  async function fetchData() {
    setLoadState('loading')
    setError('')

    try {
      const result = await MyFlowService.Run({})
      const raw = result.data?.response

      if (raw) {
        const parsed = JSON.parse(raw)
        // ה-Flow יכול להחזיר מערך או אובייקט בודד
        const list: MyItem[] = Array.isArray(parsed) ? parsed : [parsed]
        setItems(list)
      } else {
        setItems([])
      }

      setLoadState('loaded')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה לא ידועה')
      setLoadState('error')
    }
  }

  // טעינה אוטומטית בעת פתיחת הדף
  useEffect(() => {
    fetchData()
  }, [])

  if (loadState === 'loading') return <div>טוען...</div>
  if (loadState === 'error') return <div>שגיאה: {error}</div>

  return (
    <ul>
      {items.map((item) => (
        <li key={item.id}>{item.name} — {item.status}</li>
      ))}
    </ul>
  )
}
```

---

## 6. דוגמה מלאה — מערכת ציוד טכני

זוהי הדוגמה האמיתית שרצה ב-App הזה.

### Flow בPower Automate

```
[PowerApps (V2)] — ללא פרמטרים קלט

    │
    ▼

[HTTP - GET]
    URL: https://my-api.azure.com/api/equipment
    Method: GET
    Headers:
      Content-Type: application/json
      Authorization: Bearer @{variables('token')}

    │
    ▼

[Respond to a PowerApp or flow]
    Output: response (Text)
    Value:  string(body('HTTP'))
```

### מבנה ה-JSON שה-Flow מחזיר

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
  },
  {
    "id": 2,
    "name": "Cisco Switch 24-port",
    "category": "רשת",
    "description": "ציוד רשת לשרתייה",
    "quantity": 2,
    "serial_number": "CS-2023-007",
    "status": "פעיל",
    "location": "שרתייה קומה 3",
    "assigned_to": "ישראל ישראלי"
  }
]
```

### הקוד ב-App.tsx

```typescript
// 1. ייבוא השירות שנוצר אוטומטית
import { TestcallfromcustomconnectorService } from './generated/services/TestcallfromcustomconnectorService'

// 2. הגדרת הטיפוס — חייב להתאים לשדות שה-Flow מחזיר!
interface EquipmentItem {
  id?: number
  name?: string
  category?: string
  description?: string
  quantity?: number
  serial_number?: string
  status?: string
  location?: string
  assigned_to?: string
}

// 3. הקריאה לפלו
async function fetchEquipment() {
  const result = await TestcallfromcustomconnectorService.Run({})
  const raw = result.data?.response  // ← זה JSON string

  if (raw) {
    const parsed = JSON.parse(raw)  // ← המרה ל-array
    const list: EquipmentItem[] = Array.isArray(parsed) ? parsed : [parsed]
    setItems(list)
  }
}
```

---

## 7. העברת פרמטרים ל-Flow

### כאשר צריך לשלוח נתונים מה-App לפלו (כמו חיפוש, סינון, וכו')

**שלב א' — הוסף Input לטריגר ב-Power Automate:**

```
PowerApps (V2) Trigger
├── [Add an input] → Text → Name: "searchQuery"
└── [Add an input] → Text → Name: "categoryFilter"
```

**שלב ב' — השתמש בפרמטרים בתוך ה-Flow:**

בכל שלב ב-Flow, ניתן להשתמש ב-Dynamic Content:

```
בשאילתת Dataverse Filter:
  cr123_category eq '@{triggerBody()?[''categoryFilter'']}'

או בשאילתת SQL:
  WHERE category = '@{triggerBody()?[''categoryFilter'']}'
  AND name LIKE '%@{triggerBody()?[''searchQuery'']}%'
```

**שלב ג' — עדכן את Model הטיפוסים ב-TypeScript (לאחר `add-flow`):**

הקובץ `MyFlowModel.ts` יתעדכן אוטומטית עם השדות שהגדרת.
אם לא, תוכל לערוך ידנית:

```typescript
// ⚠️ קובץ זה נוצר אוטומטית — במקרה חריג בלבד, ערוך אותו
export interface ManualTriggerInput {
  searchQuery?: string
  categoryFilter?: string
}
```

**שלב ד' — שלח את הפרמטרים מהקוד:**

```typescript
const result = await MyFlowService.Run({
  searchQuery: userInput,
  categoryFilter: selectedCategory,
})
```

---

## 8. שגיאות נפוצות ואיך לפתור

### ❌ שגיאה: App נטען אבל לא עושה כלום / מציג שגיאה 500

**סיבה:** `workflowDetails` חסר מ-`power.config.json`

**פתרון:**
```powershell
# השתמש תמיד ב-Local CLI ולא ב-PAC:
# ❌ אל תשתמש:
pac code push

# ✅ השתמש:
node_modules\.bin\power-apps.cmd push
```

---

### ❌ שגיאה: `TypeError: Cannot read properties of undefined (reading 'response')`

**סיבה:** ה-Flow לא החזיר נתונים או ה-Output לא נקרא `response`

**פתרון:**
1. ודא ששם ה-Output ב-"Respond to a PowerApp or flow" הוא **בדיוק** `response`
2. הוסף null check:
```typescript
const raw = result.data?.response  // ← שים לחת ?.
if (raw) {
  const items = JSON.parse(raw)
}
```

---

### ❌ שגיאה: `JSON.parse` נכשל

**סיבה:** ה-Flow מחזיר string שאינו JSON תקין

**פתרון — עטוף ב-try/catch:**
```typescript
try {
  const parsed = JSON.parse(raw)
  setItems(parsed)
} catch {
  // אם התגובה אינה JSON — הצג כטקסט
  console.error('תגובת Flow אינה JSON תקין:', raw)
  setItems([])
}
```

---

### ❌ שגיאה: `add-flow` נכשל — "Flow not found"

**סיבה:** ה-Flow לא נמצא ב-Solution הנכונה או ב-Environment הנכון

**פתרון:**
```powershell
# ודא שאתה ב-Environment הנכון
pac org who

# רשום את כל ה-Flows עם פרטים
node_modules\.bin\power-apps list-flows

# ודא ש-Flow פעיל (Status: Active) ב-Solution
```

---

### ❌ שגיאה: `add-flow` עובד אבל אין קבצים ב-`src/generated/`

**סיבה:** ה-Flow לא פעיל או ה-Trigger אינו `PowerApps (V2)`

**פתרון:**
1. פתח ה-Flow ב-Power Automate ← ודא שה-Trigger הוא `PowerApps (V2)`
2. ודא שה-Flow **Enabled** (לא Turned Off)
3. הרץ שוב: `node_modules\.bin\power-apps add-flow --flow-id <ID>`

---

### ❌ שגיאה: TypeScript — `Object is possibly 'undefined'`

**סיבה:** השדות בתגובה הם `optional` בטיפוס

**פתרון:**
```typescript
// ❌ לא טוב — יגרום לשגיאה:
<td>{item.name}</td>

// ✅ טוב — Fallback ל-dash:
<td>{item.name ?? '—'}</td>

// ✅ גם טוב — המרה מפורשת:
<td>{String(item.name ?? '')}</td>
```

---

## 9. כללי אצבע לעובד חדש

```
📌 כלל 1: תמיד בנה את ה-Flow בתוך Solution
           ← אחרת add-flow לא יוכל למצוא אותו

📌 כלל 2: Trigger = PowerApps (V2) בלבד
           ← לא V1, לא HTTP trigger

📌 כלל 3: Response = Respond to a PowerApp or flow
           ← שם השדה חייב להיות "response"
           ← סוג השדה חייב להיות "Text"

📌 כלל 4: הנתונים חוזרים כ-JSON string
           ← תמיד JSON.parse() את result.data?.response
           ← תמיד עטוף ב-try/catch

📌 כלל 5: אל תערוך את src/generated/ ידנית
           ← הקבצים האלה נוצרים אוטומטית
           ← שינויים ידניים יאבדו בפעם הבאה שתריץ add-flow

📌 כלל 6: Deploy תמיד עם Local CLI
           node_modules\.bin\power-apps.cmd push
           ← לא: pac code push

📌 כלל 7: בעיות? בדוק קודם:
           ✓ האם ה-Flow פעיל ב-Power Automate?
           ✓ האם ה-Flow באותה Solution?
           ✓ האם power.config.json מכיל workflowDetails?
```

---

## נספח — רצף פקודות מלא מאפס

```powershell
# ── 1. אתחול פרויקט ──────────────────────────────────────
npx degit microsoft/PowerAppsCodeApps/templates/vite my-app
cd my-app
npm install

# ── 2. חיבור ל-Environment ───────────────────────────────
pac auth create --environment <ENV_ID>
pac code init --displayName "שם האפליקציה" --environment <ENV_ID>

# ── 3. הוספת Flow ────────────────────────────────────────
node_modules\.bin\power-apps list-flows --search "שם הפלו"
node_modules\.bin\power-apps add-flow --flow-id <FLOW_ID>

# ── 4. פיתוח ─────────────────────────────────────────────
# ערוך את src/App.tsx, השתמש בשירות שנוצר

# ── 5. בנייה ──────────────────────────────────────────────
npm run build

# ── 6. Deploy ────────────────────────────────────────────
node_modules\.bin\power-apps.cmd push
```

---

*מדריך זה מבוסס על פרויקט מערכת ציוד טכני — אפריל 2026*
*Power Apps Code Apps SDK: @microsoft/power-apps v1.1.1*
