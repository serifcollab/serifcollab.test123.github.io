# LifeSync Setup Guide — n8n + Twilio + Claude

## Overview

This guide walks you through setting up LifeSync: a system that monitors your email, calendar, Slack, and **text messages**, uses Claude AI to parse and prioritize events, and communicates with you via SMS through Google Messages — no extra apps needed.

**How it works:** LifeSync gets its own phone number (via Twilio). It texts you like a regular contact in Google Messages. You text it back to give commands. Meanwhile, MacroDroid silently forwards your incoming texts to n8n so Claude can detect events and offer to help.

**Total setup time: ~1-2 hours**

---

## Phase 1: Twilio Phone Number (15 minutes)

### Step 1: Create a Twilio Account

1. Go to [twilio.com](https://www.twilio.com) and sign up for a free trial
2. Verify your phone number during signup
3. Twilio gives you trial credit (~$15) — enough for months of testing

### Step 2: Get a Phone Number

1. In the Twilio Console, go to **Phone Numbers** → **Buy a Number**
2. Search for a number in your area code (or any number you like)
3. Make sure **SMS** capability is checked
4. Buy the number (~$1.15/month)
5. **Save this number** — this is LifeSync's phone number (e.g., `+15551234567`)

### Step 3: Save LifeSync as a Contact

1. On your Android phone, open **Contacts**
2. Add a new contact:
   - **Name**: LifeSync
   - **Number**: Your Twilio phone number
3. Now when LifeSync texts you, it shows up as "LifeSync" in Google Messages

### Step 4: Configure the Webhook

1. In Twilio Console, go to **Phone Numbers** → **Manage** → **Active Numbers**
2. Click your number
3. Under **Messaging** → **A Message Comes In**:
   - Set to **Webhook**
   - URL: `https://your-n8n.app.n8n.cloud/webhook/lifesync-twilio-incoming` (you'll get this URL after importing Workflow 01 in Phase 4)
   - Method: **HTTP POST**
4. Save

### Step 5: Add Twilio Credentials to n8n

1. In n8n, go to **Credentials** → **Add Credential**
2. Search for **Twilio API**
3. Enter:
   - **Account SID**: Found on your Twilio Console dashboard
   - **Auth Token**: Found on your Twilio Console dashboard
4. Name it: `Twilio`
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
timestamp | message | scheduled_for | phone_number | status
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
| `YOUR_PHONE_NUMBER` | Your personal phone number (e.g., `+15551234567`) |
| `YOUR_TWILIO_PHONE_NUMBER` | Your Twilio/LifeSync number from Phase 1 |
| `TWILIO_CREDENTIAL_ID` | Select your "Twilio" credential |
| `ANTHROPIC_CREDENTIAL_ID` | Select your "Anthropic API Key" credential |
| `GSHEETS_CREDENTIAL_ID` | Select your "Google Sheets" credential |
| `JOSH_PHONE_NUMBER` | Josh's phone number for co-parent notifications (e.g., `+15559876543`) — used in Workflow 10 |

### Import Order:

#### Workflow 01: Twilio Conversation Handler (the brain)
1. In n8n, click **Import from File** → select `01-twilio-conversation-handler.json`
2. Update all credential selections (click each node, select correct credentials)
3. Update the Google Sheet ID in the Load/Save nodes
4. Update your Twilio phone number in the Send SMS node
5. **Activate** the workflow
6. **Copy the webhook URL** and paste it into Twilio's webhook config (Phase 1, Step 4)

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
2. Update the Twilio phone number and your phone number
3. **Activate** the workflow
4. Note the webhook URL — Workflow 01's action router calls this

#### Workflow 07: SMS Monitor (Android)
1. Import `07-sms-monitor.json`
2. Update all placeholders
3. **Activate** the workflow
4. **Copy the webhook URL** — you'll need it for MacroDroid setup (Phase 5)

#### Workflow 08: Twilio Notification Sender (utility)
1. Import `08-twilio-notify.json`
2. Update the Twilio phone number and your phone number
3. **Activate** the workflow

#### Workflow 09: Proactive Outreach Engine
1. Import `09-proactive-outreach.json`
2. Update all placeholders (Twilio numbers, phone numbers, credentials)
3. Adjust cron times if needed:
   - **8:30 AM** — Morning check (reminders, conflicts, alerts)
   - **6:00 PM** — Evening follow-up (nudges for unresolved action items)
   - **8:00 PM Sunday** — Week ahead preview
4. The **Real-Time Alert Webhook** (`/webhook/lifesync-alert`) is called by other workflows for urgent items (schedule conflicts, cancellations, etc.)
5. **Activate** the workflow

#### Workflow 10: Auto-Action & Notification
1. Import `10-auto-action-notify.json`
2. Update all placeholders, including:
   - `JOSH_PHONE_NUMBER` — Josh's phone number for co-parent notifications
   - The webhook URL for the Reminder Workflow trigger
3. Update the `WEBHOOK_BASE_URL` in n8n environment variables, or replace the URL in the "Trigger Reminder Workflow" node
4. **Activate** the workflow
5. **Note**: Workflows 02 (Gmail) and 07 (SMS Monitor) have been updated to call this workflow automatically when they detect events with enough detail to act on

---

## Phase 5: MacroDroid Setup — Android SMS Forwarding (15 minutes)

This is what makes automatic text message monitoring work. MacroDroid runs in the background on your Android phone and forwards every incoming SMS to n8n in real time. Your Google Messages experience is completely unchanged.

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
   - A text from LifeSync in Google Messages with the parsed event details
3. If the text contains an event (like a birthday party invite), you'll see suggested actions

---

## Phase 6: Test Everything (15 minutes)

### Test 1: Talk to LifeSync
1. Open Google Messages and text your LifeSync contact: "What can you do?"
2. You should get a text back from LifeSync within 3-5 seconds
3. Try: "Add Emma's soccer practice to the family calendar for Saturday at 10am"

### Test 2: Gmail
1. Send yourself a test email with subject "Emma's field trip permission slip due Friday"
2. Within 5 minutes, LifeSync should text you with the parsed event

### Test 3: Calendar
1. Add a test event to your Google Calendar
2. You should get a text from LifeSync with a summary

### Test 4: SMS Monitoring
1. Have a friend text you something like "Hey, can Emma come to the park Saturday at 3pm?"
2. LifeSync should text you: "Park playdate Saturday at 3pm. Want me to add it to the calendar?"

### Test 5: Daily Digest
1. In n8n, manually execute the Daily Digest workflow
2. Check Google Messages for the morning briefing from LifeSync

---

## Customization Tips

### Adjust Gmail Filters
In Workflow 02, you can add label or sender filters to the Gmail Trigger to only process emails from specific sources (school, sports leagues, etc.).

### Change Notification Priority
In Workflow 02, edit the "Priority >= Medium?" node to change which emails trigger text notifications vs. just getting logged.

### Add More Calendar Sources
Duplicate Workflow 03 and change the `calendarId` from `primary` to another calendar ID to monitor family, work, or school calendars separately.

### Customize the AI Personality
In Workflow 01, edit the system prompt in the "Build Claude Prompt" node. You can change the assistant's name, tone, and capabilities.

### Filter SMS Monitoring
In MacroDroid, you can change the trigger from "Any Number" to specific contacts only, so LifeSync only monitors texts from school parents, family, etc.

---

## Troubleshooting

| Problem | Solution |
|---|---|
| LifeSync doesn't reply to texts | Check that Workflow 01 is active, Twilio webhook URL is correct, and Twilio credentials work |
| No Gmail notifications | Verify Gmail OAuth permissions include read access; check the trigger is polling |
| Claude API errors | Verify your API key is correct and has credits; check the Header Auth credential |
| Google Sheet errors | Make sure the sheet ID is correct and the tab names match exactly |
| MacroDroid not forwarding | Check battery optimization settings; verify the macro is enabled; test the webhook URL manually |
| Twilio "unverified number" error | On trial accounts, you can only send to verified numbers. Verify your number in the Twilio console, or upgrade to a paid account ($20 to remove the restriction) |

---

## Cost Estimate

| Service | Monthly Cost |
|---|---|
| Twilio phone number | ~$1.15/mo |
| Twilio SMS (send/receive) | ~$0.50-2/mo (at $0.0079/msg) |
| n8n (cloud) | Free tier or ~$20/mo |
| Claude API | ~$1-3/mo (50-100 calls/day with Haiku) |
| Google Sheets | Free |
| Gmail/Calendar APIs | Free |
| MacroDroid | Free |
| **Total** | **~$3-26/mo** |

---

## Architecture Summary

```
Google Messages (your texts)          Gmail / Calendar / Slack
        |                                      |
        v                                      v
   MacroDroid ──HTTP POST──> n8n Workflow 07    n8n Workflows 02-05
   (silent copy)             (SMS Monitor)      (Channel Monitors)
                                   |                    |
                                   v                    v
                              Claude AI (analyze, classify, parse)
                                   |                    |
                          ┌────────┴────────┐           |
                          v                 v           v
                   Event detected?    Twilio SMS ──> Google Messages
                          |           (notify you)
                          v
                   WF10: Auto-Action
                   - Add to calendar
                   - Notify Josh
                   - Set reminders
                   - Text you what it did

   You text LifeSync ──> Twilio webhook ──> n8n Workflow 01
                                            (Claude conversation)
                                                 |
                                                 v
                                            Takes actions:
                                            - Update calendar
                                            - Set reminders
                                            - Notify Josh
                                            - RSVP

   Proactive Outreach (WF09):
   ┌─ 8:30am ── Morning alerts (conflicts, upcoming events, reminders)
   ├─ 6pm ── Evening follow-ups (unresolved action items)
   ├─ Sun 8pm ── Week ahead preview
   └─ Real-time ── Urgent alerts via webhook from any workflow
```
