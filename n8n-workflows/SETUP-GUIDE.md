# LifeSync Setup Guide — n8n + Telegram + Claude

## Overview

This guide walks you through setting up LifeSync: a system that monitors your email, calendar, Slack, and **text messages**, uses Claude AI to parse and prioritize events, and sends you everything through a Telegram bot you can chat with.

**Total setup time: ~1-2 hours**

---

## Phase 1: Telegram Bot (15 minutes)

### Step 1: Create the Bot

1. Open Telegram on your phone
2. Search for `@BotFather` and start a chat
3. Send `/newbot`
4. Name it: `LifeSync` (or whatever you like)
5. Choose a username: `lifesync_yourname_bot` (must end in `bot`)
6. **Copy the API token** — you'll need this in n8n

### Step 2: Get Your Chat ID

1. Start a conversation with your new bot (search for it by username, tap "Start")
2. Send it any message like "hello"
3. Open this URL in your browser (replace TOKEN with your actual token):
   ```
   https://api.telegram.org/botTOKEN/getUpdates
   ```
4. Look for `"chat":{"id":XXXXXXXX}` — that number is your Chat ID
5. **Save this Chat ID** — you'll use it in multiple workflows

### Step 3: Add Telegram Credentials to n8n

1. In n8n, go to **Credentials** → **Add Credential**
2. Search for **Telegram API**
3. Paste your bot token
4. Name it: `LifeSync Bot`
5. Save

---

## Phase 2: Google Sheet (10 minutes)

### Step 1: Create the Sheet

1. Go to [Google Sheets](https://sheets.google.com) and create a new spreadsheet
2. Name it: `LifeSync Data`

### Step 2: Create the Tabs

Create these 3 tabs (sheets) at the bottom:

**Tab 1: EventLog**
Add these column headers in row 1:
```
timestamp | source | from | subject | summary | category | priority | has_event | has_action_item | action_item
```

**Tab 2: ConversationHistory**
Add these column headers in row 1:
```
timestamp | role | message | user_id
```

**Tab 3: Reminders**
Add these column headers in row 1:
```
timestamp | message | scheduled_for | chat_id | status
```

### Step 3: Get the Sheet ID

The Sheet ID is in the URL:
```
https://docs.google.com/spreadsheets/d/THIS_IS_YOUR_SHEET_ID/edit
```

### Step 4: Add Google Sheets Credentials to n8n

1. In n8n, go to **Credentials** → **Add Credential**
2. Search for **Google Sheets OAuth2**
3. Follow the OAuth flow to connect your Google account
4. Name it: `Google Sheets`

---

## Phase 3: Anthropic API Key (5 minutes)

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an API key (or use an existing one)
3. In n8n, go to **Credentials** → **Add Credential**
4. Search for **Header Auth**
5. Set:
   - **Name**: `x-api-key`
   - **Value**: your Anthropic API key
6. Name the credential: `Anthropic API Key`

---

## Phase 4: Import Workflows (20 minutes)

Import each workflow JSON file in order. After importing each one, you'll need to update a few placeholder values.

### For EVERY workflow, replace these placeholders:

| Placeholder | Replace with |
|---|---|
| `YOUR_SHEET_ID` | Your Google Sheet ID from Phase 2 |
| `YOUR_TELEGRAM_CHAT_ID` | Your Telegram Chat ID from Phase 1 |
| `TELEGRAM_CREDENTIAL_ID` | Select your "LifeSync Bot" credential |
| `ANTHROPIC_CREDENTIAL_ID` | Select your "Anthropic API Key" credential |
| `GSHEETS_CREDENTIAL_ID` | Select your "Google Sheets" credential |

### Import Order:

#### Workflow 01: Telegram Conversation Handler
1. In n8n, click **Import from File** → select `01-telegram-conversation-handler.json`
2. Update all credential selections (click each node, select correct credentials)
3. Update the Google Sheet ID in the Load/Save nodes
4. **Activate** the workflow

#### Workflow 02: Gmail Monitor
1. Import `02-gmail-monitor.json`
2. Add **Gmail OAuth2** credentials if you haven't already
3. Update all placeholders
4. **Activate** the workflow

#### Workflow 03: Google Calendar Monitor
1. Import `03-google-calendar-monitor.json`
2. Add **Google Calendar OAuth2** credentials
3. Update all placeholders
4. **Activate** the workflow

#### Workflow 04: Daily Digest
1. Import `04-daily-digest.json`
2. Update all placeholders
3. Adjust the cron time if 7am isn't right for your timezone
4. **Activate** the workflow

#### Workflow 05: Slack Monitor
1. Import `05-slack-monitor.json`
2. Add **Slack OAuth2** credentials
3. Select which Slack channels to monitor
4. Update all placeholders
5. **Activate** the workflow

#### Workflow 06: Reminder Delivery
1. Import `06-reminder-delivery.json`
2. Update the Telegram Chat ID fallback
3. **Activate** the workflow
4. Note the webhook URL — you'll need to update Workflow 01's action router to call this

#### Workflow 07: SMS Monitor (Android)
1. Import `07-sms-monitor.json`
2. Update all placeholders
3. **Activate** the workflow
4. **Copy the webhook URL** — you'll need it for MacroDroid setup (Phase 5)

---

## Phase 5: MacroDroid Setup — Android SMS Forwarding (15 minutes)

This is what makes automatic text message monitoring work. MacroDroid runs in the background on your Android phone and forwards every incoming SMS to n8n in real time.

### Step 1: Install MacroDroid

1. Install **MacroDroid** from the Google Play Store (free, no subscription needed)
2. Open it and grant the permissions it asks for (SMS access is required)

### Step 2: Create the SMS Forwarding Macro

1. Tap **Add Macro** (the + button)
2. Name it: `LifeSync SMS Forward`

**Trigger:**
1. Tap **Triggers** → **Device Events** → **SMS Received**
2. Select **Any Number** (or choose specific contacts if you want to filter)
3. Leave content filter empty (forward everything, let Claude decide relevance)

**Action:**
1. Tap **Actions** → **Connectivity** → **HTTP Request**
2. Configure:
   - **Method**: POST
   - **URL**: Your n8n webhook URL from Workflow 07 (looks like `https://your-n8n.app.n8n.cloud/webhook/lifesync-sms`)
   - **Content Type**: `application/json`
   - **Body**:
     ```json
     {
       "sender": "{sms_number}",
       "message": "{sms_message}",
       "timestamp": "{year}-{month_digit}-{dayofmonth}T{hour24}:{minute}:{second}"
     }
     ```
   Note: The `{sms_number}`, `{sms_message}`, etc. are MacroDroid built-in variables — tap the `{}` icon to insert them.

**Constraints (optional but recommended):**
- None needed, but you can add **Battery > Battery Level > Above 15%** to preserve battery

3. Save the macro and make sure it shows as **Enabled**

### Step 3: Keep MacroDroid Running

Android may kill background apps to save battery. To prevent this:

1. Go to **Settings** → **Battery** → **Battery Optimization**
2. Find MacroDroid and set it to **Don't optimize** / **Unrestricted**
3. In MacroDroid settings, enable **Start at boot**

### Step 4: Test It

1. Have someone send you a text message (or text yourself from another number)
2. Within a few seconds, you should see:
   - The n8n workflow execution in your n8n dashboard
   - A Telegram notification from LifeSync with the parsed message
3. If the text contains an event (like a birthday party invite), you'll see suggested actions

---

## Phase 6: Test Everything (15 minutes)

### Test 1: Telegram Conversation
1. Open Telegram and message your bot: "What can you do?"
2. You should get a response from Claude within 2-3 seconds
3. Try: "Add Emma's soccer practice to the family calendar for Saturday at 10am"

### Test 2: Gmail
1. Send yourself a test email with subject "Emma's field trip permission slip due Friday"
2. Within 5 minutes, you should get a Telegram notification with the parsed event

### Test 3: Calendar
1. Add a test event to your Google Calendar
2. You should get a Telegram summary within 5 minutes

### Test 4: Daily Digest
1. In n8n, manually execute the Daily Digest workflow
2. Check Telegram for the morning briefing

---

## Customization Tips

### Adjust Gmail Filters
In Workflow 02, you can add label or sender filters to the Gmail Trigger to only process emails from specific sources (school, sports leagues, etc.).

### Change Notification Priority
In Workflow 02, edit the "Priority >= Medium?" node to change which emails trigger Telegram notifications vs. just getting logged.

### Add More Calendar Sources
Duplicate Workflow 03 and change the `calendarId` from `primary` to another calendar ID to monitor family, work, or school calendars separately.

### Customize the AI Personality
In Workflow 01, edit the system prompt in the "Build Claude Prompt" node. You can change the assistant's name, tone, and capabilities.

---

## Troubleshooting

| Problem | Solution |
|---|---|
| Bot doesn't respond | Check that Workflow 01 is active and the Telegram credentials are correct |
| No Gmail notifications | Verify Gmail OAuth permissions include read access; check the trigger is polling |
| Claude API errors | Verify your API key is correct and has credits; check the Header Auth credential |
| Google Sheet errors | Make sure the sheet ID is correct and the tab names match exactly |
| Telegram "chat not found" | Make sure you sent at least one message to the bot first, and the Chat ID is correct |

---

## Cost Estimate

| Service | Monthly Cost |
|---|---|
| Telegram | Free |
| n8n (cloud) | Free tier or ~$20/mo |
| Claude API | ~$1-3/mo (50-100 calls/day with Haiku) |
| Google Sheets | Free |
| Gmail/Calendar APIs | Free |
| **Total** | **~$1-23/mo** |
