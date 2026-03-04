/* ============================================================
   LifeSync — Life Event Tracker Engine
   ============================================================ */

(function() {
    'use strict';

    // ==================== DATA MODEL ====================

    const CHANNELS = {
        'work-email':     { name: 'Work Email',         icon: '&#9993;',   color: '#1a73e8', bg: '#e8f0fe' },
        'personal-email': { name: 'Personal Email',     icon: '&#9993;',   color: '#43a047', bg: '#e8f5e9' },
        'family-email':   { name: 'Family Email',       icon: '&#9993;',   color: '#8e24aa', bg: '#f3e5f5' },
        'work-cal':       { name: 'Work Calendar',      icon: '&#128197;', color: '#1a73e8', bg: '#e8f0fe' },
        'personal-cal':   { name: 'Personal Calendar',  icon: '&#128197;', color: '#43a047', bg: '#e8f5e9' },
        'school':         { name: "St. Patrick School",  icon: '&#127979;', color: '#e53935', bg: '#fce4ec' },
        'text':           { name: 'Text Messages',      icon: '&#128172;', color: '#f9a825', bg: '#fef3e0' },
        'slack':          { name: 'Work Slack',          icon: '&#128488;', color: '#611f69', bg: '#f3e5f5' }
    };

    // Calendar event types
    const CAL_TYPES = {
        work: '#1a73e8',
        personal: '#43a047',
        family: '#f9a825',
        school: '#e53935'
    };

    // ==================== STATE ====================

    const state = {
        messages: [],
        calendarEvents: [],
        automationRules: [],
        automationLog: [],
        homework: [],
        schoolFeed: [],
        familyActions: [],
        unreadCount: 0,
        automationsRun: 0,
        actionItemCount: 0,
        currentView: 'dashboard',
        calendarMonth: new Date().getMonth(),
        calendarYear: new Date().getFullYear(),
        selectedDate: new Date(),
        smsChat: [],
        smsActionLog: []
    };

    // ==================== SEED DATA ====================

    function seedData() {
        const today = new Date();
        const todayStr = formatDate(today);
        const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
        const dayAfter = new Date(today); dayAfter.setDate(today.getDate() + 2);
        const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);

        // Seed messages
        state.messages = [
            {
                id: 'm1', channel: 'text', sender: 'Sarah Chen', subject: 'Birthday Party',
                preview: "Hi! Lily is having a birthday party on Saturday at 2pm at Jump Zone. Can Emma come?",
                body: "Hi! Lily is having a birthday party on Saturday March 7th at 2pm at Jump Zone (1234 Fun Ave). Can Emma come? Please RSVP by Thursday. Let me know if she has any food allergies! It's going to be a unicorn theme 🦄",
                time: minutesAgo(12), unread: true, starred: false,
                aiSuggestion: {
                    summary: "Birthday party invitation for Emma — Lily's party at Jump Zone, Saturday March 7th at 2pm.",
                    actions: [
                        { label: 'Add to Personal Calendar', action: 'add-personal-cal', done: false },
                        { label: 'Add to Family Calendar', action: 'add-family-cal', done: false },
                        { label: 'Text Josh about it', action: 'notify-josh', done: false },
                        { label: 'RSVP to Sarah', action: 'rsvp', done: false }
                    ]
                }
            },
            {
                id: 'm2', channel: 'school', sender: 'St. Patrick School', subject: 'Weekly Newsletter — March 2-6',
                preview: "Dear Parents, here is this week's newsletter with homework assignments and upcoming events...",
                body: "Dear Parents,\n\nHere is this week's update:\n\nHOMEWORK:\n- Monday: Math worksheet (Ch. 5 review) + 20 min reading\n- Tuesday: Spelling words practice + Science journal entry\n- Wednesday: Math worksheet (fractions) + 20 min reading\n- Thursday: Book report outline due\n- Friday: No homework — early release day!\n\nUPCOMING:\n- March 10: Parent-Teacher Conference sign-ups open\n- March 14: St. Patrick's Day celebration (wear green!)\n- March 17: No school — teacher in-service day\n\nPlease ensure all permission slips for the March 20 field trip to the Science Museum are returned by March 13.\n\nBest,\nMs. Rodriguez\n3rd Grade, Room 204",
                time: minutesAgo(45), unread: true, starred: false,
                aiSuggestion: {
                    summary: "School newsletter with homework schedule and upcoming events extracted.",
                    actions: [
                        { label: 'Update Homework Tracker', action: 'update-homework', done: false },
                        { label: 'Add School Events to Calendar', action: 'add-school-events', done: false },
                        { label: 'Set Reminder: Permission Slip by Mar 13', action: 'reminder-permission', done: false }
                    ]
                }
            },
            {
                id: 'm3', channel: 'work-email', sender: 'David Park', subject: 'Q1 Review Meeting — Rescheduled',
                preview: "Hi, the Q1 review has been moved to Thursday at 3pm. Please update your calendar...",
                body: "Hi,\n\nJust a heads up — the Q1 review meeting has been rescheduled from Wednesday to Thursday at 3:00 PM in Conference Room B. The agenda remains the same:\n\n1. Q1 metrics overview\n2. Budget reconciliation\n3. Q2 planning discussion\n\nPlease come prepared with your department's numbers. Let me know if the new time doesn't work.\n\nThanks,\nDavid",
                time: minutesAgo(90), unread: true, starred: false,
                aiSuggestion: {
                    summary: "Q1 review meeting rescheduled to Thursday 3pm in Conference Room B.",
                    actions: [
                        { label: 'Update Work Calendar', action: 'update-work-cal', done: false },
                        { label: 'Remove Old Calendar Entry', action: 'remove-old-entry', done: false }
                    ]
                }
            },
            {
                id: 'm4', channel: 'slack', sender: '#design-team', subject: 'New mockups ready for review',
                preview: "Hey team, I just uploaded the latest mockups for the dashboard redesign...",
                body: "Hey team, I just uploaded the latest mockups for the dashboard redesign to Figma. Can everyone take a look and leave comments by EOD tomorrow? We need to finalize the direction before the sprint planning on Monday.\n\nFigma link: [Dashboard Redesign v3]\n\nKey changes:\n- Simplified navigation\n- New color palette\n- Updated data visualization components\n\nThanks! — Jamie",
                time: minutesAgo(120), unread: false, starred: false,
                aiSuggestion: {
                    summary: "Design mockups review requested by tomorrow EOD.",
                    actions: [
                        { label: 'Add Review Task to Calendar', action: 'add-review-task', done: false }
                    ]
                }
            },
            {
                id: 'm5', channel: 'personal-email', sender: 'Dr. Martinez Office', subject: 'Appointment Confirmation',
                preview: "This is a reminder that you have an appointment scheduled for March 10 at 10:30 AM...",
                body: "Dear Patient,\n\nThis is a confirmation of your upcoming appointment:\n\nDate: March 10, 2026\nTime: 10:30 AM\nProvider: Dr. Elena Martinez\nLocation: 456 Health Blvd, Suite 200\n\nPlease arrive 15 minutes early. If you need to reschedule, call us at (555) 234-5678 at least 24 hours in advance.\n\nThank you,\nMartinez Family Practice",
                time: minutesAgo(180), unread: true, starred: false,
                aiSuggestion: {
                    summary: "Doctor appointment on March 10 at 10:30 AM.",
                    actions: [
                        { label: 'Add to Personal Calendar', action: 'add-personal-cal', done: false },
                        { label: 'Set Reminder: Day Before', action: 'set-reminder', done: false }
                    ]
                }
            },
            {
                id: 'm6', channel: 'family-email', sender: 'Josh', subject: "Re: Emma's soccer schedule",
                preview: "Got it, I can do the Tuesday practices. Can you handle Thursday this week?",
                body: "Got it, I can do the Tuesday practices. Can you handle Thursday this week? Also, coach said they're moving the Saturday game to 10am instead of 9am.\n\nAlso — did you see the note from school about the field trip permission slip? I think we need to sign and return it.\n\nThanks,\nJosh",
                time: minutesAgo(240), unread: false, starred: false,
                aiSuggestion: {
                    summary: "Josh confirming soccer schedule — Saturday game moved to 10am.",
                    actions: [
                        { label: 'Update Soccer Game Time', action: 'update-soccer', done: false },
                        { label: 'Add Thursday Practice Reminder', action: 'add-practice', done: false }
                    ]
                }
            },
            {
                id: 'm7', channel: 'text', sender: 'Mom', subject: '',
                preview: "Can we do dinner Sunday? Dad wants to see Emma. Maybe 5pm?",
                body: "Can we do dinner Sunday? Dad wants to see Emma. Maybe 5pm? We can come to you or meet at Olive Garden. Let me know! Love you.",
                time: minutesAgo(300), unread: true, starred: false,
                aiSuggestion: {
                    summary: "Dinner with grandparents proposed for Sunday at 5pm.",
                    actions: [
                        { label: 'Add to Family Calendar', action: 'add-family-cal', done: false },
                        { label: 'Text Mom Back', action: 'reply', done: false }
                    ]
                }
            },
            {
                id: 'm8', channel: 'slack', sender: '#general', subject: 'Office closed March 17',
                preview: "Reminder: The office will be closed on March 17 for St. Patrick's Day...",
                body: "Reminder: The office will be closed on Tuesday, March 17 in observance of St. Patrick's Day. If you have any urgent deadlines, please plan accordingly. Enjoy the long weekend!",
                time: minutesAgo(400), unread: false, starred: false,
                aiSuggestion: {
                    summary: "Office closed March 17 — St. Patrick's Day.",
                    actions: [
                        { label: 'Block Work Calendar', action: 'block-work-cal', done: false }
                    ]
                }
            }
        ];

        // Seed calendar events
        state.calendarEvents = [
            { id: 'e1', title: 'Team Standup', date: todayStr, time: '9:00 AM', type: 'work', calendar: 'work' },
            { id: 'e2', title: "Emma's Soccer Practice", date: todayStr, time: '4:30 PM', type: 'family', calendar: 'family' },
            { id: 'e3', title: 'Q1 Review Meeting', date: formatDate(dayAfter), time: '3:00 PM', type: 'work', calendar: 'work' },
            { id: 'e4', title: "Lily's Birthday Party", date: '2026-03-07', time: '2:00 PM', type: 'family', calendar: 'personal' },
            { id: 'e5', title: 'Dr. Martinez Appointment', date: '2026-03-10', time: '10:30 AM', type: 'personal', calendar: 'personal' },
            { id: 'e6', title: 'Parent-Teacher Conference Signups', date: '2026-03-10', time: 'All Day', type: 'school', calendar: 'school' },
            { id: 'e7', title: "St. Patrick's Day Celebration", date: '2026-03-14', time: 'All Day', type: 'school', calendar: 'school' },
            { id: 'e8', title: 'Office Closed', date: '2026-03-17', time: 'All Day', type: 'work', calendar: 'work' },
            { id: 'e9', title: 'No School — In-Service Day', date: '2026-03-17', time: 'All Day', type: 'school', calendar: 'school' },
            { id: 'e10', title: 'Science Museum Field Trip', date: '2026-03-20', time: '8:30 AM', type: 'school', calendar: 'school' },
            { id: 'e11', title: 'Soccer Game', date: '2026-03-07', time: '10:00 AM', type: 'family', calendar: 'family' },
            { id: 'e12', title: 'Dinner with Grandparents', date: '2026-03-08', time: '5:00 PM', type: 'family', calendar: 'family' },
            { id: 'e13', title: 'Grocery Shopping', date: formatDate(tomorrow), time: '11:00 AM', type: 'personal', calendar: 'personal' },
        ];

        // Seed homework
        state.homework = [
            { id: 'h1', subject: 'Math', desc: 'Chapter 5 review worksheet', due: 'Monday', done: true },
            { id: 'h2', subject: 'Reading', desc: '20 minutes independent reading', due: 'Monday', done: true },
            { id: 'h3', subject: 'Spelling', desc: 'Practice spelling words (list 12)', due: 'Tuesday', done: false },
            { id: 'h4', subject: 'Science', desc: 'Journal entry: weather observations', due: 'Tuesday', done: false },
            { id: 'h5', subject: 'Math', desc: 'Fractions worksheet', due: 'Wednesday', done: false },
            { id: 'h6', subject: 'Reading', desc: '20 minutes independent reading', due: 'Wednesday', done: false },
            { id: 'h7', subject: 'English', desc: 'Book report outline due', due: 'Thursday', done: false },
        ];

        // Seed school feed
        state.schoolFeed = [
            { id: 's1', icon: '&#128218;', title: 'Weekly Newsletter Posted', desc: 'Homework schedule + upcoming events for March 2-6', date: 'Today' },
            { id: 's2', icon: '&#9917;', title: 'Soccer Practice Schedule Update', desc: 'Thursday practices moved to 4:30 PM starting this week', date: 'Yesterday' },
            { id: 's3', icon: '&#128221;', title: 'Permission Slip Required', desc: 'Science Museum field trip on March 20 — due March 13', date: '2 days ago' },
            { id: 's4', icon: '&#127922;', title: "St. Patrick's Day Celebration", desc: 'Wear green on March 14! Sign up to volunteer.', date: '3 days ago' },
            { id: 's5', icon: '&#128196;', title: 'Report Cards Available', desc: 'Q2 report cards can be viewed in the parent portal', date: '1 week ago' },
        ];

        // Seed family actions
        state.familyActions = [
            { id: 'a1', title: 'RSVP to Lily\'s Birthday Party', desc: 'By Thursday — text Sarah Chen', priority: 'danger' },
            { id: 'a2', title: 'Sign Permission Slip', desc: 'Science Museum field trip — due March 13', priority: 'warning' },
            { id: 'a3', title: 'Confirm Dinner with Grandparents', desc: 'Sunday 5pm — reply to Mom', priority: 'primary' },
            { id: 'a4', title: 'Review Emma\'s Report Card', desc: 'Available in parent portal', priority: 'success' },
        ];

        // Seed automation rules
        state.automationRules = [
            {
                id: 'r1', name: 'Birthday Party Invitations',
                triggerChannel: 'text', keywords: ['birthday', 'party', 'invitation', 'invited'],
                actions: ['add-personal-cal', 'add-family-cal', 'notify-josh'],
                enabled: true, timesTriggered: 1
            },
            {
                id: 'r2', name: 'School Updates to Family',
                triggerChannel: 'school', keywords: ['homework', 'newsletter', 'schedule', 'event'],
                actions: ['add-family-cal', 'flag-action'],
                enabled: true, timesTriggered: 3
            },
            {
                id: 'r3', name: 'Work Meeting Changes',
                triggerChannel: 'work-email', keywords: ['rescheduled', 'meeting', 'moved', 'cancelled'],
                actions: ['add-work-cal'],
                enabled: true, timesTriggered: 1
            },
            {
                id: 'r4', name: 'Doctor Appointments',
                triggerChannel: 'personal-email', keywords: ['appointment', 'doctor', 'confirmation', 'reminder'],
                actions: ['add-personal-cal'],
                enabled: true, timesTriggered: 1
            },
        ];

        // Seed automation log
        state.automationLog = [
            {
                id: 'al1', rule: 'Birthday Party Invitations', time: minutesAgo(11),
                desc: "Detected birthday party invitation from Sarah Chen. Added to Personal + Family calendars. Texted Josh: \"Lily's birthday party Sat March 7 at 2pm — Jump Zone\"."
            },
            {
                id: 'al2', rule: 'School Updates to Family', time: minutesAgo(44),
                desc: "Extracted homework assignments from St. Patrick newsletter. Updated homework tracker with 7 items."
            },
            {
                id: 'al3', rule: 'School Updates to Family', time: minutesAgo(44),
                desc: "Detected 4 school events. Added Parent-Teacher Conference, St. Patrick's Day celebration, in-service day, and field trip to calendar."
            },
            {
                id: 'al4', rule: 'Work Meeting Changes', time: minutesAgo(89),
                desc: "Detected meeting reschedule from David Park. Updated Q1 Review Meeting to Thursday 3:00 PM."
            },
            {
                id: 'al5', rule: 'Doctor Appointments', time: minutesAgo(179),
                desc: "Detected appointment confirmation. Added Dr. Martinez appointment March 10 at 10:30 AM to Personal Calendar."
            },
        ];

        // Counts
        state.unreadCount = state.messages.filter(m => m.unread).length;
        state.automationsRun = state.automationLog.length;
        state.actionItemCount = state.familyActions.length;
    }

    // ==================== UTILITY ====================

    function minutesAgo(n) {
        return new Date(Date.now() - n * 60000);
    }

    function formatDate(d) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function formatTimeAgo(date) {
        const diff = Math.floor((Date.now() - date.getTime()) / 60000);
        if (diff < 1) return 'Just now';
        if (diff < 60) return `${diff}m ago`;
        if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
        return `${Math.floor(diff / 1440)}d ago`;
    }

    function formatTime12(date) {
        let h = date.getHours(), m = date.getMinutes();
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        return `${h}:${String(m).padStart(2, '0')} ${ampm}`;
    }

    function $(sel) { return document.querySelector(sel); }
    function $$(sel) { return document.querySelectorAll(sel); }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ==================== TOAST NOTIFICATIONS ====================

    function showToast(title, desc, type) {
        type = type || 'info';
        const container = $('#toastContainer');
        const icons = { info: '&#128276;', success: '&#9989;', warning: '&#9888;', error: '&#10060;' };
        const toast = document.createElement('div');
        toast.className = 'toast ' + type;
        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || icons.info}</span>
            <div class="toast-body">
                <div class="toast-title">${escapeHtml(title)}</div>
                <div class="toast-desc">${escapeHtml(desc)}</div>
            </div>
            <button class="toast-close">&times;</button>
        `;
        toast.querySelector('.toast-close').addEventListener('click', function() { toast.remove(); });
        container.appendChild(toast);
        setTimeout(function() { if (toast.parentNode) toast.remove(); }, 6000);
    }

    // ==================== NAVIGATION ====================

    function initNav() {
        $$('.nav-item').forEach(function(item) {
            item.addEventListener('click', function() {
                navigateTo(item.dataset.view);
            });
        });

        $$('.view-all-link').forEach(function(link) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                navigateTo(link.dataset.navigate);
            });
        });

        $('#mobileMenuBtn').addEventListener('click', function() {
            $('#sidebar').classList.toggle('open');
        });

        // Close sidebar on outside click (mobile)
        document.addEventListener('click', function(e) {
            if (window.innerWidth <= 768 && !e.target.closest('.sidebar') && !e.target.closest('#mobileMenuBtn')) {
                $('#sidebar').classList.remove('open');
            }
        });
    }

    function navigateTo(view) {
        state.currentView = view;
        $$('.nav-item').forEach(function(el) { el.classList.remove('active'); });
        $$('.view').forEach(function(el) { el.classList.remove('active'); });
        var navItem = document.querySelector('.nav-item[data-view="' + view + '"]');
        if (navItem) navItem.classList.add('active');
        var viewEl = document.getElementById('view-' + view);
        if (viewEl) viewEl.classList.add('active');
        var titles = {
            dashboard: 'Dashboard', inbox: 'Unified Inbox', sms: 'SMS Chat', channels: 'Channels',
            automations: 'Automations', calendar: 'Calendar', family: 'Family Hub', settings: 'Settings'
        };
        $('#pageTitle').textContent = titles[view] || 'Dashboard';
        // Refresh views
        if (view === 'dashboard') renderDashboard();
        if (view === 'inbox') renderInbox();
        if (view === 'sms') {
            renderSmsChat();
            var badge = $('#smsBadge');
            if (badge) { badge.textContent = '0'; badge.style.display = 'none'; }
        }
        if (view === 'channels') renderChannels();
        if (view === 'automations') renderAutomations();
        if (view === 'calendar') renderCalendar();
        if (view === 'family') renderFamily();
        if (view === 'settings') renderSettings();
    }

    // ==================== DASHBOARD ====================

    function renderDashboard() {
        // Stats
        $('#statUnread').textContent = state.unreadCount;
        var todayEvents = state.calendarEvents.filter(function(e) { return e.date === formatDate(new Date()); });
        $('#statEvents').textContent = todayEvents.length;
        $('#statAutomations').textContent = state.automationsRun;
        $('#statActionItems').textContent = state.actionItemCount;

        // Activity feed (recent messages)
        var feed = $('#activityFeed');
        feed.innerHTML = '';
        var sorted = state.messages.slice().sort(function(a, b) { return b.time - a.time; });
        sorted.forEach(function(msg) {
            var ch = CHANNELS[msg.channel];
            feed.innerHTML += `
                <div class="activity-item" data-msg-id="${msg.id}">
                    <div class="activity-dot" style="background:${ch.color}"></div>
                    <div class="activity-body">
                        <div class="activity-title">${escapeHtml(msg.sender)}
                            <span class="activity-channel-tag" style="background:${ch.bg};color:${ch.color}">${ch.name}</span>
                        </div>
                        <div class="activity-desc">${escapeHtml(msg.subject || msg.preview)}</div>
                    </div>
                    <span class="activity-time">${formatTimeAgo(msg.time)}</span>
                </div>
            `;
        });

        // Activity items click -> open inbox detail
        feed.querySelectorAll('.activity-item').forEach(function(el) {
            el.addEventListener('click', function() {
                navigateTo('inbox');
                setTimeout(function() { openMessageDetail(el.dataset.msgId); }, 100);
            });
        });

        // Upcoming today
        var upcoming = $('#upcomingList');
        upcoming.innerHTML = '';
        if (todayEvents.length === 0) {
            upcoming.innerHTML = '<div class="empty-state"><div class="empty-state-icon">&#128197;</div><div class="empty-state-text">No events scheduled for today</div></div>';
        } else {
            todayEvents.sort(function(a, b) { return a.time.localeCompare(b.time); });
            todayEvents.forEach(function(ev) {
                upcoming.innerHTML += `
                    <div class="upcoming-item">
                        <span class="upcoming-time">${ev.time}</span>
                        <div class="upcoming-info">
                            <div class="upcoming-title">${escapeHtml(ev.title)}</div>
                            <div class="upcoming-meta">${ev.calendar} calendar</div>
                        </div>
                        <div class="upcoming-cal-dot" style="background:${CAL_TYPES[ev.type] || '#999'}"></div>
                    </div>
                `;
            });
        }

        // Channel status
        renderChannelStatus();

        // Recent automation log
        renderAutomationLog('#dashAutomationLog', 3);

        // Inbox badge
        $('#inboxBadge').textContent = state.unreadCount;
        if (state.unreadCount > 0) {
            $('#inboxBadge').style.display = 'inline-block';
            $('#notifDot').classList.add('active');
        } else {
            $('#inboxBadge').style.display = 'none';
            $('#notifDot').classList.remove('active');
        }
    }

    function renderChannelStatus() {
        var grid = $('#channelStatusGrid');
        grid.innerHTML = '';
        var channelKeys = ['work-email', 'personal-email', 'family-email', 'text', 'slack', 'school', 'work-cal', 'personal-cal'];
        channelKeys.forEach(function(key) {
            var ch = CHANNELS[key];
            var msgCount = state.messages.filter(function(m) { return m.channel === key; }).length;
            var unreadCount = state.messages.filter(function(m) { return m.channel === key && m.unread; }).length;
            var detail = msgCount > 0 ? msgCount + ' messages' + (unreadCount > 0 ? ' (' + unreadCount + ' new)' : '') : 'Connected';
            grid.innerHTML += `
                <div class="channel-status-item">
                    <div class="channel-status-icon" style="background:${ch.bg};color:${ch.color}">${ch.icon}</div>
                    <div class="channel-status-info">
                        <div class="channel-status-name">${ch.name}</div>
                        <div class="channel-status-detail">${detail}</div>
                    </div>
                    <div class="channel-pulse"></div>
                </div>
            `;
        });
    }

    // ==================== INBOX ====================

    function renderInbox(filter) {
        filter = filter || 'all';
        var list = $('#inboxList');
        list.innerHTML = '';
        var filtered = filter === 'all' ? state.messages : state.messages.filter(function(m) { return m.channel === filter; });
        filtered.sort(function(a, b) { return b.time - a.time; });

        if (filtered.length === 0) {
            list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">&#128232;</div><div class="empty-state-text">No messages in this channel</div></div>';
            return;
        }

        filtered.forEach(function(msg) {
            var ch = CHANNELS[msg.channel];
            list.innerHTML += `
                <div class="inbox-item ${msg.unread ? 'unread' : ''}" data-msg-id="${msg.id}">
                    <div class="inbox-channel-icon" style="background:${ch.bg};color:${ch.color}">${ch.icon}</div>
                    <div class="inbox-body">
                        <div class="inbox-sender">${escapeHtml(msg.sender)}</div>
                        <div class="inbox-subject">${escapeHtml(msg.subject || msg.preview)}</div>
                        <div class="inbox-preview">${escapeHtml(msg.preview)}</div>
                    </div>
                    <div class="inbox-meta">
                        <div class="inbox-time">${formatTimeAgo(msg.time)}</div>
                        <span class="inbox-tag" style="background:${ch.bg};color:${ch.color}">${ch.name}</span>
                    </div>
                </div>
            `;
        });

        // Click to open detail
        list.querySelectorAll('.inbox-item').forEach(function(el) {
            el.addEventListener('click', function() {
                openMessageDetail(el.dataset.msgId);
            });
        });
    }

    function openMessageDetail(msgId) {
        var msg = state.messages.find(function(m) { return m.id === msgId; });
        if (!msg) return;

        // Mark as read
        if (msg.unread) {
            msg.unread = false;
            state.unreadCount = state.messages.filter(function(m) { return m.unread; }).length;
            $('#inboxBadge').textContent = state.unreadCount;
        }

        var ch = CHANNELS[msg.channel];
        var detail = $('#detailContent');
        var aiHtml = '';
        if (msg.aiSuggestion) {
            var actionsHtml = msg.aiSuggestion.actions.map(function(a) {
                return '<button class="btn btn-sm ' + (a.done ? 'btn-success' : 'btn-primary') + '" data-action="' + a.action + '" ' + (a.done ? 'disabled' : '') + '>' + (a.done ? '&#10003; ' : '') + escapeHtml(a.label) + '</button>';
            }).join('');
            aiHtml = `
                <div class="detail-ai-box">
                    <h4>&#9889; LifeSync AI Detected</h4>
                    <p>${escapeHtml(msg.aiSuggestion.summary)}</p>
                    <div class="detail-ai-actions">${actionsHtml}</div>
                </div>
            `;
        }

        detail.innerHTML = `
            <div class="detail-from">${escapeHtml(msg.sender)}</div>
            <div class="detail-date">
                <span class="inbox-tag" style="background:${ch.bg};color:${ch.color}">${ch.name}</span>
                &nbsp; ${formatTimeAgo(msg.time)}
            </div>
            ${msg.subject ? '<h3 style="margin-bottom:12px;">' + escapeHtml(msg.subject) + '</h3>' : ''}
            <div class="detail-message">${escapeHtml(msg.body).replace(/\n/g, '<br>')}</div>
            ${aiHtml}
        `;

        // AI action buttons
        detail.querySelectorAll('.detail-ai-actions .btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var action = btn.dataset.action;
                executeAiAction(msg, action, btn);
            });
        });

        $('#messageDetailPanel').classList.add('open');
    }

    function executeAiAction(msg, action, btn) {
        // Mark action as done
        if (msg.aiSuggestion) {
            msg.aiSuggestion.actions.forEach(function(a) {
                if (a.action === action) a.done = true;
            });
        }
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-success');
        btn.disabled = true;
        btn.innerHTML = '&#10003; ' + btn.textContent;

        var actionLabels = {
            'add-personal-cal': 'Added to Personal Calendar',
            'add-family-cal': 'Added to Family Calendar',
            'add-work-cal': 'Added to Work Calendar',
            'notify-josh': 'Text sent to Josh',
            'rsvp': 'RSVP action created',
            'update-homework': 'Homework tracker updated',
            'add-school-events': 'School events added to calendar',
            'reminder-permission': 'Reminder set for permission slip',
            'update-work-cal': 'Work calendar updated',
            'remove-old-entry': 'Old calendar entry removed',
            'add-review-task': 'Review task added',
            'set-reminder': 'Reminder set',
            'update-soccer': 'Soccer game time updated',
            'add-practice': 'Practice reminder added',
            'block-work-cal': 'Work calendar blocked',
            'reply': 'Reply drafted'
        };

        showToast('Action Completed', actionLabels[action] || 'Action executed', 'success');

        // Add to automation log
        state.automationLog.unshift({
            id: 'al-' + Date.now(),
            rule: 'Manual Action',
            time: new Date(),
            desc: (actionLabels[action] || 'Action executed') + ' — triggered from ' + msg.sender + "'s message."
        });
        state.automationsRun++;
    }

    // ==================== CHANNELS ====================

    function renderChannels() {
        var grid = $('#channelsGrid');
        grid.innerHTML = '';
        var channelKeys = ['work-email', 'personal-email', 'family-email', 'text', 'slack', 'school', 'work-cal', 'personal-cal'];
        channelKeys.forEach(function(key) {
            var ch = CHANNELS[key];
            var total = state.messages.filter(function(m) { return m.channel === key; }).length;
            var unread = state.messages.filter(function(m) { return m.channel === key && m.unread; }).length;
            var rules = state.automationRules.filter(function(r) { return r.triggerChannel === key || r.triggerChannel === 'any'; }).length;
            grid.innerHTML += `
                <div class="channel-card">
                    <div class="channel-card-header">
                        <div class="channel-card-icon" style="background:${ch.bg};color:${ch.color}">${ch.icon}</div>
                        <div class="channel-card-info">
                            <h3>${ch.name}</h3>
                            <p>Monitoring active</p>
                        </div>
                    </div>
                    <div class="channel-card-stats">
                        <div class="channel-stat">
                            <span class="channel-stat-num">${total}</span>
                            <span class="channel-stat-label">Total</span>
                        </div>
                        <div class="channel-stat">
                            <span class="channel-stat-num">${unread}</span>
                            <span class="channel-stat-label">Unread</span>
                        </div>
                        <div class="channel-stat">
                            <span class="channel-stat-num">${rules}</span>
                            <span class="channel-stat-label">Rules</span>
                        </div>
                    </div>
                    <div class="channel-card-status">
                        <span class="status-indicator connected"></span>
                        Connected
                    </div>
                </div>
            `;
        });
    }

    // ==================== AUTOMATIONS ====================

    function renderAutomations() {
        var list = $('#automationsList');
        list.innerHTML = '';
        state.automationRules.forEach(function(rule) {
            var ch = rule.triggerChannel === 'any' ? { name: 'Any Channel' } : CHANNELS[rule.triggerChannel];
            var actionLabels = {
                'add-personal-cal': 'Add to Personal Cal',
                'add-family-cal': 'Add to Family Cal',
                'add-work-cal': 'Add to Work Cal',
                'notify-josh': 'Text Josh',
                'flag-action': 'Flag as Action'
            };
            var actionsStr = rule.actions.map(function(a) { return actionLabels[a] || a; }).join(', ');
            list.innerHTML += `
                <div class="automation-rule" data-rule-id="${rule.id}">
                    <div class="automation-rule-icon">&#9889;</div>
                    <div class="automation-rule-body">
                        <div class="automation-rule-name">${escapeHtml(rule.name)}</div>
                        <div class="automation-rule-desc">
                            When <strong>${ch ? ch.name : rule.triggerChannel}</strong> contains
                            "<em>${rule.keywords.join(', ')}</em>"
                            &rarr; ${actionsStr}
                            &nbsp; <span style="color:var(--text-muted);">(triggered ${rule.timesTriggered}x)</span>
                        </div>
                    </div>
                    <div class="automation-rule-actions">
                        <label class="automation-toggle">
                            <input type="checkbox" ${rule.enabled ? 'checked' : ''} data-rule-id="${rule.id}">
                            <span class="slider"></span>
                        </label>
                    </div>
                </div>
            `;
        });

        // Toggle handlers
        list.querySelectorAll('.automation-toggle input').forEach(function(toggle) {
            toggle.addEventListener('change', function() {
                var rule = state.automationRules.find(function(r) { return r.id === toggle.dataset.ruleId; });
                if (rule) rule.enabled = toggle.checked;
                showToast('Automation ' + (toggle.checked ? 'Enabled' : 'Disabled'), rule.name, toggle.checked ? 'success' : 'warning');
            });
        });

        renderAutomationLog('#automationLog', 20);
    }

    function renderAutomationLog(selector, limit) {
        var container = document.querySelector(selector);
        container.innerHTML = '';
        var logs = state.automationLog.slice(0, limit);
        if (logs.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">&#9889;</div><div class="empty-state-text">No automations have run yet</div></div>';
            return;
        }
        logs.forEach(function(log) {
            container.innerHTML += `
                <div class="auto-log-item">
                    <div class="auto-log-icon" style="background:var(--success-light);color:var(--success)">&#10003;</div>
                    <div class="auto-log-body">
                        <div class="auto-log-title">${escapeHtml(log.rule)}</div>
                        <div class="auto-log-desc">${escapeHtml(log.desc)}</div>
                        <div class="auto-log-time">${formatTimeAgo(log.time)}</div>
                    </div>
                </div>
            `;
        });
    }

    // ==================== CALENDAR ====================

    function renderCalendar() {
        var grid = $('#calendarGrid');
        grid.innerHTML = '';
        var year = state.calendarYear;
        var month = state.calendarMonth;

        // Month/year display
        var monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        $('#calMonthYear').textContent = monthNames[month] + ' ' + year;

        // Day headers
        var days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
        days.forEach(function(d) {
            grid.innerHTML += '<div class="cal-header-cell">' + d + '</div>';
        });

        // Get first day and number of days
        var firstDay = new Date(year, month, 1).getDay();
        var daysInMonth = new Date(year, month + 1, 0).getDate();
        var daysInPrev = new Date(year, month, 0).getDate();

        var todayStr = formatDate(new Date());
        var selectedStr = formatDate(state.selectedDate);

        // Previous month filler
        for (var i = firstDay - 1; i >= 0; i--) {
            var d = daysInPrev - i;
            grid.innerHTML += '<div class="cal-cell other-month"><span class="cal-date">' + d + '</span></div>';
        }

        // Current month
        for (var day = 1; day <= daysInMonth; day++) {
            var dateStr = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
            var eventsOnDay = state.calendarEvents.filter(function(e) { return e.date === dateStr; });
            var isToday = dateStr === todayStr;
            var isSelected = dateStr === selectedStr;
            var dotsHtml = eventsOnDay.map(function(e) {
                return '<div class="cal-event-dot" style="background:' + (CAL_TYPES[e.type] || '#999') + '"></div>';
            }).join('');
            grid.innerHTML += `
                <div class="cal-cell ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}" data-date="${dateStr}">
                    <span class="cal-date">${day}</span>
                    <div class="cal-event-dots">${dotsHtml}</div>
                </div>
            `;
        }

        // Next month filler
        var totalCells = firstDay + daysInMonth;
        var remaining = (7 - (totalCells % 7)) % 7;
        for (var j = 1; j <= remaining; j++) {
            grid.innerHTML += '<div class="cal-cell other-month"><span class="cal-date">' + j + '</span></div>';
        }

        // Cell clicks
        grid.querySelectorAll('.cal-cell:not(.other-month)').forEach(function(cell) {
            cell.addEventListener('click', function() {
                grid.querySelectorAll('.cal-cell').forEach(function(c) { c.classList.remove('selected'); });
                cell.classList.add('selected');
                state.selectedDate = new Date(cell.dataset.date + 'T12:00:00');
                renderCalendarEvents(cell.dataset.date);
            });
        });

        // Nav
        $('#calPrev').onclick = function() {
            state.calendarMonth--;
            if (state.calendarMonth < 0) { state.calendarMonth = 11; state.calendarYear--; }
            renderCalendar();
        };
        $('#calNext').onclick = function() {
            state.calendarMonth++;
            if (state.calendarMonth > 11) { state.calendarMonth = 0; state.calendarYear++; }
            renderCalendar();
        };

        // Show events for selected/today
        renderCalendarEvents(selectedStr);
    }

    function renderCalendarEvents(dateStr) {
        var list = $('#calEventsList');
        var dateObj = new Date(dateStr + 'T12:00:00');
        var options = { weekday: 'long', month: 'long', day: 'numeric' };
        $('#calSelectedDate').textContent = dateObj.toLocaleDateString('en-US', options);

        var events = state.calendarEvents.filter(function(e) { return e.date === dateStr; });
        if (events.length === 0) {
            list.innerHTML = '<div class="empty-state"><div class="empty-state-text">No events on this day</div></div>';
            return;
        }
        list.innerHTML = '';
        events.forEach(function(ev) {
            list.innerHTML += `
                <div class="cal-event-item">
                    <div class="cal-event-color" style="background:${CAL_TYPES[ev.type] || '#999'}"></div>
                    <div class="cal-event-info">
                        <div class="cal-event-title">${escapeHtml(ev.title)}</div>
                        <div class="cal-event-time">${ev.time} &middot; ${ev.calendar} calendar</div>
                    </div>
                </div>
            `;
        });
    }

    // ==================== FAMILY HUB ====================

    function renderFamily() {
        // School feed
        var feed = $('#schoolFeed');
        feed.innerHTML = '';
        state.schoolFeed.forEach(function(item) {
            feed.innerHTML += `
                <div class="school-item">
                    <div class="school-item-icon">${item.icon}</div>
                    <div class="school-item-body">
                        <div class="school-item-title">${escapeHtml(item.title)}</div>
                        <div class="school-item-desc">${escapeHtml(item.desc)}</div>
                        <div class="school-item-date">${item.date}</div>
                    </div>
                </div>
            `;
        });

        // Homework
        var hwList = $('#homeworkList');
        hwList.innerHTML = '';
        state.homework.forEach(function(hw) {
            hwList.innerHTML += `
                <div class="homework-item">
                    <div class="hw-check ${hw.done ? 'done' : ''}" data-hw-id="${hw.id}">${hw.done ? '&#10003;' : ''}</div>
                    <div class="homework-info">
                        <div class="homework-subject">${escapeHtml(hw.subject)}</div>
                        <div class="homework-desc">${escapeHtml(hw.desc)}</div>
                    </div>
                    <div class="homework-due">Due: ${hw.due}</div>
                </div>
            `;
        });

        // Homework check toggles
        hwList.querySelectorAll('.hw-check').forEach(function(el) {
            el.addEventListener('click', function() {
                var hw = state.homework.find(function(h) { return h.id === el.dataset.hwId; });
                if (hw) {
                    hw.done = !hw.done;
                    el.classList.toggle('done');
                    el.innerHTML = hw.done ? '&#10003;' : '';
                    showToast(hw.done ? 'Homework Completed' : 'Homework Unmarked', hw.subject + ': ' + hw.desc, hw.done ? 'success' : 'info');
                }
            });
        });

        // Family events (upcoming week)
        var famEvents = $('#familyEvents');
        famEvents.innerHTML = '';
        var familyEvts = state.calendarEvents.filter(function(e) {
            return e.type === 'family' || e.type === 'school';
        }).sort(function(a, b) { return a.date.localeCompare(b.date); });
        familyEvts.forEach(function(ev) {
            famEvents.innerHTML += `
                <div class="family-event-item">
                    <div class="family-event-dot" style="background:${CAL_TYPES[ev.type]}"></div>
                    <div class="family-event-body">
                        <div class="family-event-title">${escapeHtml(ev.title)}</div>
                        <div class="family-event-date">${ev.date} at ${ev.time}</div>
                    </div>
                </div>
            `;
        });

        // Family actions
        var actions = $('#familyActions');
        actions.innerHTML = '';
        state.familyActions.forEach(function(a) {
            actions.innerHTML += `
                <div class="family-action-item">
                    <div class="action-priority" style="background:var(--${a.priority})"></div>
                    <div class="action-body">
                        <div class="action-title">${escapeHtml(a.title)}</div>
                        <div class="action-desc">${escapeHtml(a.desc)}</div>
                    </div>
                    <button class="action-btn" data-action-id="${a.id}">Done</button>
                </div>
            `;
        });

        // Action done buttons
        actions.querySelectorAll('.action-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                state.familyActions = state.familyActions.filter(function(a) { return a.id !== btn.dataset.actionId; });
                state.actionItemCount = state.familyActions.length;
                showToast('Action Completed', 'Item removed from pending actions', 'success');
                renderFamily();
            });
        });
    }

    // ==================== SETTINGS ====================

    function renderSettings() {
        var container = $('#settingsChannels');
        container.innerHTML = '';
        var channelKeys = ['work-email', 'personal-email', 'family-email', 'text', 'slack', 'school', 'work-cal', 'personal-cal'];
        channelKeys.forEach(function(key) {
            var ch = CHANNELS[key];
            container.innerHTML += `
                <div class="settings-channel-item">
                    <div class="settings-channel-icon" style="background:${ch.bg};color:${ch.color}">${ch.icon}</div>
                    <div class="settings-channel-info">
                        <div class="settings-channel-name">${ch.name}</div>
                        <div class="settings-channel-status" style="color:var(--success);">&#9679; Connected</div>
                    </div>
                    <button class="btn btn-sm">Configure</button>
                </div>
            `;
        });
    }

    // ==================== MODALS ====================

    function initModals() {
        // Quick add event modal
        $('#quickAddBtn').addEventListener('click', function() {
            $('#quickAddModal').classList.add('open');
            $('#qaDate').value = formatDate(new Date());
        });
        $('#quickAddClose').addEventListener('click', function() { $('#quickAddModal').classList.remove('open'); });
        $('#qaCancel').addEventListener('click', function() { $('#quickAddModal').classList.remove('open'); });
        $('#qaSave').addEventListener('click', function() {
            var title = $('#qaTitle').value.trim();
            if (!title) { showToast('Error', 'Please enter an event title', 'error'); return; }
            var date = $('#qaDate').value;
            var time = $('#qaTime').value;
            var calendar = $('#qaCalendar').value;
            var typeMap = { personal: 'personal', work: 'work', family: 'family', school: 'school' };
            var timeStr = time ? formatTime12FromInput(time) : 'All Day';
            state.calendarEvents.push({
                id: 'e-' + Date.now(),
                title: title,
                date: date,
                time: timeStr,
                type: typeMap[calendar],
                calendar: calendar
            });
            showToast('Event Created', title + ' on ' + date, 'success');
            $('#quickAddModal').classList.remove('open');
            $('#qaTitle').value = '';
            if (state.currentView === 'calendar') renderCalendar();
            if (state.currentView === 'dashboard') renderDashboard();
        });

        // Automation modal
        $('#addAutomationBtn').addEventListener('click', function() { $('#automationModal').classList.add('open'); });
        $('#automationModalClose').addEventListener('click', function() { $('#automationModal').classList.remove('open'); });
        $('#arCancel').addEventListener('click', function() { $('#automationModal').classList.remove('open'); });
        $('#arSave').addEventListener('click', function() {
            var name = $('#arName').value.trim();
            if (!name) { showToast('Error', 'Please enter a rule name', 'error'); return; }
            var triggerChannel = $('#arTriggerChannel').value;
            var keywords = $('#arKeywords').value.split(',').map(function(k) { return k.trim(); }).filter(Boolean);
            var actions = [];
            $$('#automationModal .checkbox-group input:checked').forEach(function(cb) { actions.push(cb.value); });
            if (keywords.length === 0) { showToast('Error', 'Please enter at least one keyword', 'error'); return; }
            if (actions.length === 0) { showToast('Error', 'Please select at least one action', 'error'); return; }

            state.automationRules.push({
                id: 'r-' + Date.now(),
                name: name,
                triggerChannel: triggerChannel,
                keywords: keywords,
                actions: actions,
                enabled: true,
                timesTriggered: 0
            });
            showToast('Rule Created', name, 'success');
            $('#automationModal').classList.remove('open');
            $('#arName').value = '';
            $('#arKeywords').value = '';
            $$('#automationModal .checkbox-group input').forEach(function(cb) { cb.checked = false; });
            renderAutomations();
        });

        // Detail panel
        $('#detailBackBtn').addEventListener('click', function() {
            $('#messageDetailPanel').classList.remove('open');
        });

        // Close modals on overlay click
        $$('.modal-overlay').forEach(function(overlay) {
            overlay.addEventListener('click', function(e) {
                if (e.target === overlay) overlay.classList.remove('open');
            });
        });
    }

    function formatTime12FromInput(timeStr) {
        var parts = timeStr.split(':');
        var h = parseInt(parts[0], 10);
        var m = parts[1];
        var ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        return h + ':' + m + ' ' + ampm;
    }

    // ==================== INBOX FILTERS ====================

    function initInboxFilters() {
        $$('.filter-tab').forEach(function(tab) {
            tab.addEventListener('click', function() {
                $$('.filter-tab').forEach(function(t) { t.classList.remove('active'); });
                tab.classList.add('active');
                renderInbox(tab.dataset.filter);
            });
        });

        $('#markAllReadBtn').addEventListener('click', function() {
            state.messages.forEach(function(m) { m.unread = false; });
            state.unreadCount = 0;
            showToast('All Read', 'All messages marked as read', 'success');
            renderInbox();
            $('#inboxBadge').textContent = '0';
            $('#inboxBadge').style.display = 'none';
            $('#notifDot').classList.remove('active');
        });
    }

    // ==================== SEARCH ====================

    function initSearch() {
        $('#globalSearch').addEventListener('input', function() {
            var query = this.value.toLowerCase().trim();
            if (!query) {
                if (state.currentView === 'inbox') renderInbox();
                return;
            }
            if (state.currentView !== 'inbox') navigateTo('inbox');
            var list = $('#inboxList');
            list.innerHTML = '';
            var results = state.messages.filter(function(m) {
                return m.sender.toLowerCase().includes(query) ||
                    (m.subject && m.subject.toLowerCase().includes(query)) ||
                    m.preview.toLowerCase().includes(query) ||
                    m.body.toLowerCase().includes(query);
            });
            if (results.length === 0) {
                list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">&#128269;</div><div class="empty-state-text">No results for "' + escapeHtml(query) + '"</div></div>';
                return;
            }
            results.forEach(function(msg) {
                var ch = CHANNELS[msg.channel];
                list.innerHTML += `
                    <div class="inbox-item ${msg.unread ? 'unread' : ''}" data-msg-id="${msg.id}">
                        <div class="inbox-channel-icon" style="background:${ch.bg};color:${ch.color}">${ch.icon}</div>
                        <div class="inbox-body">
                            <div class="inbox-sender">${escapeHtml(msg.sender)}</div>
                            <div class="inbox-subject">${escapeHtml(msg.subject || msg.preview)}</div>
                            <div class="inbox-preview">${escapeHtml(msg.preview)}</div>
                        </div>
                        <div class="inbox-meta">
                            <div class="inbox-time">${formatTimeAgo(msg.time)}</div>
                            <span class="inbox-tag" style="background:${ch.bg};color:${ch.color}">${ch.name}</span>
                        </div>
                    </div>
                `;
            });
            list.querySelectorAll('.inbox-item').forEach(function(el) {
                el.addEventListener('click', function() { openMessageDetail(el.dataset.msgId); });
            });
        });
    }

    // ==================== LIVE SIMULATION ====================

    var simulationMessages = [
        {
            channel: 'slack', sender: '#engineering', subject: 'Deploy notification',
            preview: 'Production deploy v2.4.1 completed successfully. All health checks passing.',
            body: 'Production deploy v2.4.1 completed successfully at 2:34 PM. All health checks passing. Changes include: updated user dashboard, fixed pagination bug, improved API response times.'
        },
        {
            channel: 'text', sender: 'Josh', subject: '',
            preview: 'Hey, can I pick up Emma 30 min early on Thursday? Need to get to soccer on time.',
            body: 'Hey, can I pick up Emma 30 min early on Thursday? Need to get to soccer on time. Coach wants them there by 4:15 for warm-ups.'
        },
        {
            channel: 'school', sender: 'St. Patrick School', subject: 'Early Release Reminder',
            preview: 'Reminder: This Friday is an early release day. Dismissal at 12:30 PM.',
            body: 'Dear Parents,\n\nThis is a reminder that Friday is an early release day. Dismissal will be at 12:30 PM instead of the usual 3:15 PM. After-school programs are cancelled for Friday.\n\nPlease make arrangements for early pickup.\n\nThank you,\nSt. Patrick Administration'
        },
        {
            channel: 'work-email', sender: 'HR Team', subject: 'Benefits Enrollment Deadline',
            preview: 'Open enrollment closes March 15. Please review and update your selections.',
            body: 'Hi Team,\n\nThis is a reminder that the benefits open enrollment period closes on March 15. Please log into the benefits portal to review and update your selections for the new plan year.\n\nKey changes this year:\n- New dental provider options\n- Increased FSA contribution limits\n- Updated vision coverage\n\nQuestions? Contact HR at benefits@company.com.'
        },
        {
            channel: 'personal-email', sender: 'Amazon', subject: 'Your order has shipped',
            preview: 'Your order #112-3456789 has shipped and will arrive by Thursday.',
            body: 'Your order #112-3456789 has shipped!\n\nEstimated delivery: Thursday, March 5\nTracking number: 1Z999AA10123456784\n\nItems:\n- Kid\'s Watercolor Paint Set\n- Science Experiment Kit for Kids\n\nThank you for shopping with us!'
        },
        {
            channel: 'text', sender: 'Coach Williams', subject: '',
            preview: 'Hi parents! Saturday game moved to Field B due to maintenance. Same time 10am.',
            body: 'Hi parents! Saturday game has been moved to Field B (behind the rec center) due to maintenance on Field A. Same time — 10am. Please make sure kids bring extra water, going to be a warm one!'
        }
    ];

    var simIndex = 0;
    function simulateIncoming() {
        if (simIndex >= simulationMessages.length) simIndex = 0;
        var template = simulationMessages[simIndex];
        simIndex++;

        var msg = {
            id: 'm-' + Date.now(),
            channel: template.channel,
            sender: template.sender,
            subject: template.subject,
            preview: template.preview,
            body: template.body,
            time: new Date(),
            unread: true,
            starred: false,
            aiSuggestion: null
        };

        // Auto-generate AI suggestion
        var body = msg.body.toLowerCase();
        msg.aiSuggestion = {
            summary: 'New message from ' + msg.sender + ' via ' + (CHANNELS[msg.channel] ? CHANNELS[msg.channel].name : msg.channel) + '.',
            actions: []
        };

        // Smart detection
        if (body.includes('birthday') || body.includes('party') || body.includes('invitation')) {
            msg.aiSuggestion.actions.push({ label: 'Add to Family Calendar', action: 'add-family-cal', done: false });
            msg.aiSuggestion.actions.push({ label: 'Text Josh', action: 'notify-josh', done: false });
        }
        if (body.includes('appointment') || body.includes('meeting') || body.includes('schedule')) {
            msg.aiSuggestion.actions.push({ label: 'Add to Calendar', action: 'add-personal-cal', done: false });
        }
        if (body.includes('homework') || body.includes('school') || body.includes('early release') || body.includes('dismissal')) {
            msg.aiSuggestion.actions.push({ label: 'Update Family Calendar', action: 'add-family-cal', done: false });
            msg.aiSuggestion.actions.push({ label: 'Notify Josh', action: 'notify-josh', done: false });
        }
        if (body.includes('deadline') || body.includes('enrollment') || body.includes('due')) {
            msg.aiSuggestion.actions.push({ label: 'Set Reminder', action: 'set-reminder', done: false });
        }
        if (body.includes('game') || body.includes('practice') || body.includes('soccer')) {
            msg.aiSuggestion.actions.push({ label: 'Update Sports Calendar', action: 'add-family-cal', done: false });
        }
        if (msg.aiSuggestion.actions.length === 0) {
            msg.aiSuggestion.actions.push({ label: 'Archive', action: 'archive', done: false });
        }

        state.messages.unshift(msg);
        state.unreadCount++;

        // Check automation rules
        state.automationRules.forEach(function(rule) {
            if (!rule.enabled) return;
            if (rule.triggerChannel !== 'any' && rule.triggerChannel !== msg.channel) return;
            var matched = rule.keywords.some(function(kw) {
                return body.includes(kw.toLowerCase());
            });
            if (matched) {
                rule.timesTriggered++;
                state.automationsRun++;
                var actionDesc = rule.actions.map(function(a) {
                    var labels = {
                        'add-personal-cal': 'added to Personal Calendar',
                        'add-family-cal': 'added to Family Calendar',
                        'add-work-cal': 'added to Work Calendar',
                        'notify-josh': 'texted Josh',
                        'flag-action': 'flagged as action item'
                    };
                    return labels[a] || a;
                }).join(', ');
                state.automationLog.unshift({
                    id: 'al-' + Date.now(),
                    rule: rule.name,
                    time: new Date(),
                    desc: 'Auto-triggered: ' + msg.sender + '\'s message matched "' + rule.keywords.join(', ') + '". Actions: ' + actionDesc + '.'
                });
                showToast('Automation: ' + rule.name, 'Triggered by message from ' + msg.sender, 'success');
            }
        });

        // Show incoming notification
        var ch = CHANNELS[msg.channel];
        showToast('New ' + ch.name + ' Message', msg.sender + ': ' + msg.preview.substring(0, 60) + '...', 'info');

        // Refresh current view
        if (state.currentView === 'dashboard') renderDashboard();
        if (state.currentView === 'inbox') {
            var activeFilter = document.querySelector('.filter-tab.active');
            renderInbox(activeFilter ? activeFilter.dataset.filter : 'all');
        }

        // Update badge
        $('#inboxBadge').textContent = state.unreadCount;
        $('#inboxBadge').style.display = 'inline-block';
        $('#notifDot').classList.add('active');
    }

    // ==================== SMS CHAT ENGINE ====================

    function initSmsChat() {
        // Seed initial welcome messages
        state.smsChat = [
            { type: 'date', text: 'Today' },
            {
                type: 'incoming', time: minutesAgo(60),
                text: "Hey! I'm LifeSync, your life command center. I'm monitoring all 8 of your channels right now. Text me anytime to check on things or tell me what to do."
            },
            {
                type: 'incoming', time: minutesAgo(45),
                text: "NEW from Sarah Chen (Text): Lily's birthday party invitation for Emma — Saturday March 7 at 2pm at Jump Zone.",
                action: {
                    title: 'Birthday Party Detected',
                    desc: 'I can add this to your calendars and notify Josh.',
                    buttons: [
                        { label: 'Add to both calendars', id: 'sms-add-cal-party' },
                        { label: 'Text Josh', id: 'sms-notify-josh-party' },
                        { label: 'RSVP to Sarah', id: 'sms-rsvp-sarah' }
                    ]
                }
            },
            {
                type: 'incoming', time: minutesAgo(30),
                text: "NEW from St. Patrick School: Weekly newsletter posted. I extracted Emma's homework for the week:\n\n Mon: Math Ch.5 + reading\n Tue: Spelling + science journal\n Wed: Math fractions + reading\n Thu: Book report outline\n Fri: No homework!\n\nAlso: permission slip for March 20 field trip due by March 13."
            },
            {
                type: 'incoming', time: minutesAgo(15),
                text: "HEADS UP: David Park (Work Email) rescheduled the Q1 review to Thursday at 3pm. I've already updated your work calendar."
            }
        ];

        // Input handling
        var input = $('#smsInput');
        var sendBtn = $('#smsSendBtn');

        function handleSend() {
            var text = input.value.trim();
            if (!text) return;
            input.value = '';
            addSmsBubble('outgoing', text);
            processUserMessage(text);
        }

        sendBtn.addEventListener('click', handleSend);
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') { e.preventDefault(); handleSend(); }
        });

        // Quick action button
        $('#smsQuickActions').addEventListener('click', function() {
            addSmsBubble('outgoing', "What are my action items?");
            processUserMessage("What are my action items?");
        });

        // Suggestion buttons
        $$('.sms-suggestion-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var text = btn.textContent;
                addSmsBubble('outgoing', text);
                processUserMessage(text);
                input.focus();
            });
        });
    }

    function renderSmsChat() {
        var container = $('#smsMessages');
        container.innerHTML = '';
        state.smsChat.forEach(function(msg) {
            if (msg.type === 'date') {
                container.innerHTML += '<div class="sms-date-divider">' + msg.text + '</div>';
                return;
            }
            var wrapper = document.createElement('div');
            wrapper.className = 'sms-bubble-wrapper ' + msg.type;

            var label = msg.type === 'incoming' ? 'LifeSync' : 'You';
            var timeStr = msg.time ? formatTime12(msg.time) : '';

            var html = '<div class="sms-bubble-label">' + label + '</div>';
            html += '<div class="sms-bubble">' + escapeHtml(msg.text).replace(/\n/g, '<br>') + '</div>';

            if (msg.action) {
                html += '<div class="sms-action-bubble">';
                html += '<div class="sms-action-bubble-title">' + escapeHtml(msg.action.title) + '</div>';
                html += '<div class="sms-action-bubble-desc">' + escapeHtml(msg.action.desc) + '</div>';
                html += '<div class="sms-action-bubble-btns">';
                msg.action.buttons.forEach(function(b) {
                    html += '<button class="sms-action-btn' + (b.done ? ' done' : '') + '" data-sms-action="' + b.id + '">' + (b.done ? '\u2713 ' : '') + escapeHtml(b.label) + '</button>';
                });
                html += '</div></div>';
            }

            html += '<div class="sms-bubble-time">' + timeStr + '</div>';
            wrapper.innerHTML = html;
            container.appendChild(wrapper);
        });

        // Bind action buttons
        container.querySelectorAll('.sms-action-btn:not(.done)').forEach(function(btn) {
            btn.addEventListener('click', function() {
                executeSmsAction(btn.dataset.smsAction, btn);
            });
        });

        scrollSmsToBottom();
    }

    function addSmsBubble(type, text, action) {
        state.smsChat.push({ type: type, time: new Date(), text: text, action: action || null });
        if ($('#view-sms').classList.contains('active')) {
            renderSmsChat();
        }
    }

    function scrollSmsToBottom() {
        var container = $('#smsMessages');
        if (container) container.scrollTop = container.scrollHeight;
    }

    function showTypingThenReply(replyText, action, delay) {
        delay = delay || 800 + Math.random() * 1200;
        // Add typing indicator
        var container = $('#smsMessages');
        if (container) {
            var typing = document.createElement('div');
            typing.className = 'sms-typing active';
            typing.id = 'smsTypingIndicator';
            typing.innerHTML = '<div class="sms-typing-dot"></div><div class="sms-typing-dot"></div><div class="sms-typing-dot"></div>';
            container.appendChild(typing);
            scrollSmsToBottom();
        }
        setTimeout(function() {
            var indicator = document.getElementById('smsTypingIndicator');
            if (indicator) indicator.remove();
            addSmsBubble('incoming', replyText, action);
            addSmsActionLog(replyText.substring(0, 60) + (replyText.length > 60 ? '...' : ''));
        }, delay);
    }

    function addSmsActionLog(text) {
        state.smsActionLog.unshift({ text: text, time: new Date() });
        var container = $('#smsRecentActions');
        if (container) {
            container.innerHTML = '';
            state.smsActionLog.slice(0, 8).forEach(function(item) {
                container.innerHTML += '<div class="sms-action-item"><span class="sms-action-dot" style="background:var(--success);"></span><span>' + escapeHtml(item.text) + '</span></div>';
            });
        }
    }

    function executeSmsAction(actionId, btn) {
        btn.classList.add('done');
        btn.innerHTML = '\u2713 ' + btn.textContent;

        // Mark in state
        state.smsChat.forEach(function(msg) {
            if (msg.action && msg.action.buttons) {
                msg.action.buttons.forEach(function(b) {
                    if (b.id === actionId) b.done = true;
                });
            }
        });

        var responses = {
            'sms-add-cal-party': "Done! Added \"Lily's Birthday Party\" to your Personal Calendar and Family Calendar for Saturday March 7 at 2pm.",
            'sms-notify-josh-party': "Texted Josh: \"Heads up — Lily's birthday party for Emma is Saturday March 7 at 2pm at Jump Zone. Can you make it?\"",
            'sms-rsvp-sarah': "Texted Sarah: \"Emma would love to come! No food allergies. See you Saturday at 2!\" \u2014 Want me to change this?"
        };

        var reply = responses[actionId] || 'Done!';
        showTypingThenReply(reply);
        showToast('SMS Action', reply.substring(0, 60) + '...', 'success');
    }

    // ==================== NATURAL LANGUAGE PROCESSOR ====================

    function processUserMessage(text) {
        var lower = text.toLowerCase().trim();

        // ---- HOMEWORK ----
        if (lower.includes('homework') || lower.includes('hw') || (lower.includes('emma') && lower.includes('assignment'))) {
            if (lower.includes('mark') || lower.includes('done') || lower.includes('complete') || lower.includes('finish')) {
                return handleMarkHomework(lower);
            }
            return handleHomeworkQuery(lower);
        }

        // ---- CALENDAR / SCHEDULE / TODAY ----
        if (lower.includes('calendar') || lower.includes('schedule') || lower.includes("what's on") || lower.includes('whats on') ||
            (lower.includes('today') && !lower.includes('school')) || lower.includes('tomorrow') || lower.includes('this week') || lower.includes('weekend')) {
            return handleCalendarQuery(lower);
        }

        // ---- SCHOOL ----
        if (lower.includes('school') || lower.includes('st. patrick') || lower.includes('st patrick') || lower.includes('newsletter') ||
            lower.includes('ms. rodriguez') || lower.includes('ms rodriguez')) {
            return handleSchoolQuery(lower);
        }

        // ---- FIELD TRIP / PERMISSION ----
        if (lower.includes('field trip') || lower.includes('permission slip') || lower.includes('science museum')) {
            showTypingThenReply("The Science Museum field trip is on March 20 at 8:30 AM. The permission slip needs to be returned by March 13. Josh also mentioned it in his last email — want me to set a reminder?", {
                title: 'Field Trip Info',
                desc: 'Permission slip due March 13.',
                buttons: [
                    { label: 'Set reminder for March 12', id: 'sms-remind-permission' },
                    { label: 'Add to calendar', id: 'sms-add-fieldtrip' }
                ]
            });
            return;
        }

        // ---- ADD TO CALENDAR / BOTH CALENDARS ----
        if (lower.includes('add') && (lower.includes('calendar') || lower.includes('cal'))) {
            return handleAddToCalendar(lower);
        }

        // ---- TEXT/NOTIFY JOSH ----
        if ((lower.includes('text josh') || lower.includes('tell josh') || lower.includes('notify josh') || lower.includes('message josh') || lower.includes('let josh know'))) {
            return handleTextJosh(lower);
        }

        // ---- RSVP ----
        if (lower.includes('rsvp')) {
            return handleRsvp(lower);
        }

        // ---- ACTION ITEMS ----
        if (lower.includes('action item') || lower.includes('to do') || lower.includes('todo') || lower.includes('pending') || lower.includes('what do i need')) {
            return handleActionItems();
        }

        // ---- WORK MESSAGES ----
        if ((lower.includes('work') || lower.includes('slack') || lower.includes('office')) && (lower.includes('message') || lower.includes('new') || lower.includes('email') || lower.includes('update'))) {
            return handleWorkMessages();
        }

        // ---- REMINDER ----
        if (lower.includes('remind') || lower.includes('reminder')) {
            return handleReminder(lower);
        }

        // ---- UNREAD / NEW MESSAGES ----
        if (lower.includes('unread') || lower.includes('new message') || lower.includes('anything new') || lower.includes("what'd i miss") || lower.includes('what did i miss') || lower.includes('catch me up')) {
            return handleUnreadSummary();
        }

        // ---- BIRTHDAY PARTY specifics ----
        if (lower.includes('birthday') || lower.includes('lily') || lower.includes('jump zone') || lower.includes('party')) {
            showTypingThenReply("Lily's birthday party is Saturday March 7 at 2pm at Jump Zone (1234 Fun Ave). It's a unicorn theme! Sarah Chen asked you to RSVP by Thursday. Currently on your Personal Calendar and Family Calendar.", {
                title: 'Party Details',
                desc: 'RSVP deadline: Thursday',
                buttons: [
                    { label: 'RSVP yes to Sarah', id: 'sms-rsvp-sarah-2' },
                    { label: 'Text Josh about it', id: 'sms-notify-josh-party-2' }
                ]
            });
            return;
        }

        // ---- DINNER / GRANDPARENTS ----
        if (lower.includes('dinner') || lower.includes('grandparent') || lower.includes('mom') || lower.includes('olive garden')) {
            showTypingThenReply("Mom texted asking about dinner Sunday at 5pm. She offered to come to you or meet at Olive Garden. Want me to reply?", {
                title: 'Sunday Dinner',
                desc: 'Grandparents want to see Emma',
                buttons: [
                    { label: 'Reply: Olive Garden works!', id: 'sms-reply-mom-og' },
                    { label: 'Reply: Come to our place', id: 'sms-reply-mom-home' },
                    { label: 'Add to family calendar', id: 'sms-add-dinner' }
                ]
            });
            return;
        }

        // ---- SOCCER ----
        if (lower.includes('soccer') || lower.includes('practice') || lower.includes('game') || lower.includes('coach')) {
            showTypingThenReply("Soccer update:\n- Practice: Today at 4:30 PM (Emma's on your schedule)\n- Saturday game: 10:00 AM at Field B (moved from Field A for maintenance)\n- Josh is handling Tuesday practices, asked if you can do Thursday this week.\n\nCoach Williams also noted kids should bring extra water for Saturday.");
            return;
        }

        // ---- DOCTOR ----
        if (lower.includes('doctor') || lower.includes('dr. martinez') || lower.includes('appointment') || lower.includes('medical')) {
            showTypingThenReply("You have an appointment with Dr. Martinez on March 10 at 10:30 AM at 456 Health Blvd, Suite 200. They ask you to arrive 15 min early. Need to reschedule? Call (555) 234-5678 at least 24 hours in advance.");
            return;
        }

        // ---- BENEFITS / ENROLLMENT ----
        if (lower.includes('benefit') || lower.includes('enrollment') || lower.includes('hr')) {
            showTypingThenReply("HR sent a reminder: benefits open enrollment closes March 15. Key changes this year: new dental options, increased FSA limits, updated vision coverage. Log into the benefits portal to review. Want me to set a reminder before the deadline?", {
                title: 'Benefits Deadline',
                desc: 'Open enrollment closes March 15',
                buttons: [
                    { label: 'Remind me March 14', id: 'sms-remind-benefits' },
                    { label: 'Add deadline to work cal', id: 'sms-add-benefits-cal' }
                ]
            });
            return;
        }

        // ---- THANK YOU / OK / GREAT ----
        if (lower.match(/^(thanks|thank you|ok|okay|great|perfect|got it|cool|nice|awesome|good|👍)/)) {
            var acks = [
                "You got it! I'm here whenever you need me.",
                "Anytime! Just text me if anything comes up.",
                "Happy to help! I'll keep monitoring everything.",
                "No problem! I'll ping you if anything new comes in."
            ];
            showTypingThenReply(acks[Math.floor(Math.random() * acks.length)]);
            return;
        }

        // ---- HI / HELLO ----
        if (lower.match(/^(hi|hello|hey|sup|yo|good morning|good afternoon|good evening)/)) {
            showTypingThenReply("Hey! Here's your quick status:\n\n" + state.unreadCount + " unread messages across channels\n" +
                state.calendarEvents.filter(function(e) { return e.date === formatDate(new Date()); }).length + " events on today's calendar\n" +
                state.familyActions.length + " pending action items\n\nWhat can I help with?");
            return;
        }

        // ---- HELP ----
        if (lower.includes('help') || lower.includes('what can you do') || lower.includes('commands')) {
            showTypingThenReply("Here's what I can do:\n\n" +
                "- Check homework: \"What's Emma's homework tonight?\"\n" +
                "- Calendar: \"What's on my calendar today/tomorrow/this weekend?\"\n" +
                "- School updates: \"What did the school send today?\"\n" +
                "- Add events: \"Add the birthday party to both calendars\"\n" +
                "- Notify people: \"Text Josh about the party\"\n" +
                "- RSVP: \"RSVP yes to Lily's party\"\n" +
                "- Action items: \"What are my action items?\"\n" +
                "- Messages: \"Any new messages from work?\"\n" +
                "- Reminders: \"Remind me about the permission slip\"\n" +
                "- Mark done: \"Mark spelling homework as done\"\n\nJust text naturally — I'll figure out what you mean!");
            return;
        }

        // ---- FALLBACK ----
        showTypingThenReply("I'm not sure I understood that. Try asking about:\n- Homework, calendar, school updates\n- Action items or pending tasks\n- Specific events (birthday party, field trip, soccer)\n- Or tell me to text Josh, add something to a calendar, or set a reminder.\n\nText \"help\" for all my commands!");
    }

    // ---- HANDLER FUNCTIONS ----

    function handleHomeworkQuery(lower) {
        var tonight = '';
        var dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
        var today = dayNames[new Date().getDay()];

        if (lower.includes('tonight') || lower.includes('today') || lower.includes("what's emma")) {
            var todayHw = state.homework.filter(function(h) { return h.due === today; });
            if (todayHw.length === 0) {
                tonight = "No homework due today (" + today + ")! ";
                // Show next day
                var tomorrowIdx = (new Date().getDay() + 1) % 7;
                var tomorrowName = dayNames[tomorrowIdx];
                var tomorrowHw = state.homework.filter(function(h) { return h.due === tomorrowName; });
                if (tomorrowHw.length > 0) {
                    tonight += "Tomorrow's homework:\n";
                    tomorrowHw.forEach(function(h) {
                        tonight += (h.done ? '\u2713' : '\u25CB') + ' ' + h.subject + ': ' + h.desc + '\n';
                    });
                }
            } else {
                tonight = "Emma's homework for " + today + ":\n\n";
                todayHw.forEach(function(h) {
                    tonight += (h.done ? '\u2713' : '\u25CB') + ' ' + h.subject + ': ' + h.desc + '\n';
                });
            }
        } else {
            tonight = "Emma's homework this week:\n\n";
            state.homework.forEach(function(h) {
                tonight += (h.done ? '\u2713' : '\u25CB') + ' ' + h.due + ' — ' + h.subject + ': ' + h.desc + '\n';
            });
            var done = state.homework.filter(function(h) { return h.done; }).length;
            tonight += '\n' + done + '/' + state.homework.length + ' completed.';
        }
        showTypingThenReply(tonight.trim());
    }

    function handleMarkHomework(lower) {
        var matched = null;
        state.homework.forEach(function(h) {
            if (lower.includes(h.subject.toLowerCase()) || lower.includes(h.desc.toLowerCase().substring(0, 15))) {
                if (!h.done) matched = h;
            }
        });
        if (matched) {
            matched.done = true;
            showTypingThenReply("Marked as done: " + matched.subject + " — " + matched.desc + "\n\n" +
                state.homework.filter(function(h) { return h.done; }).length + "/" + state.homework.length + " homework items completed this week!");
            showToast('Homework Done', matched.subject + ': ' + matched.desc, 'success');
        } else {
            // Try to mark next incomplete one
            var next = state.homework.find(function(h) { return !h.done; });
            if (next) {
                next.done = true;
                showTypingThenReply("Marked as done: " + next.subject + " — " + next.desc + " (next incomplete item).\n\n" +
                    state.homework.filter(function(h) { return h.done; }).length + "/" + state.homework.length + " completed this week!");
                showToast('Homework Done', next.subject + ': ' + next.desc, 'success');
            } else {
                showTypingThenReply("All homework is already marked as done! Emma's on top of it this week.");
            }
        }
    }

    function handleCalendarQuery(lower) {
        var targetDate, label;
        var today = new Date();

        if (lower.includes('tomorrow')) {
            targetDate = new Date(today);
            targetDate.setDate(today.getDate() + 1);
            label = 'Tomorrow';
        } else if (lower.includes('weekend') || lower.includes('saturday') || lower.includes('sunday')) {
            // Show Sat + Sun
            var sat = new Date(today);
            sat.setDate(today.getDate() + (6 - today.getDay()));
            var sun = new Date(sat);
            sun.setDate(sat.getDate() + 1);
            var satStr = formatDate(sat);
            var sunStr = formatDate(sun);
            var weekendEvents = state.calendarEvents.filter(function(e) { return e.date === satStr || e.date === sunStr; });
            if (weekendEvents.length === 0) {
                showTypingThenReply("Your weekend is clear! No events on Saturday or Sunday. Want me to add something?");
            } else {
                var reply = "This weekend:\n\n";
                weekendEvents.sort(function(a, b) { return a.date.localeCompare(b.date) || a.time.localeCompare(b.time); });
                weekendEvents.forEach(function(e) {
                    var dayLabel = e.date === satStr ? 'Sat' : 'Sun';
                    reply += dayLabel + ' ' + e.time + ' — ' + e.title + ' (' + e.calendar + ')\n';
                });
                showTypingThenReply(reply.trim());
            }
            return;
        } else if (lower.includes('this week')) {
            var events = [];
            for (var i = 0; i < 7; i++) {
                var d = new Date(today);
                d.setDate(today.getDate() + i);
                var ds = formatDate(d);
                state.calendarEvents.forEach(function(e) {
                    if (e.date === ds) events.push({ event: e, dateStr: ds, dayName: d.toLocaleDateString('en-US', { weekday: 'short' }) });
                });
            }
            if (events.length === 0) {
                showTypingThenReply("Nothing on the calendar this week! That's unusual. Want to add something?");
            } else {
                var reply = "This week's schedule:\n\n";
                events.forEach(function(item) {
                    reply += item.dayName + ' ' + item.event.time + ' — ' + item.event.title + '\n';
                });
                showTypingThenReply(reply.trim());
            }
            return;
        } else {
            targetDate = today;
            label = 'Today';
        }

        var dateStr = formatDate(targetDate);
        var dayEvents = state.calendarEvents.filter(function(e) { return e.date === dateStr; });
        if (dayEvents.length === 0) {
            showTypingThenReply(label + "'s calendar is clear! No events scheduled.");
        } else {
            var reply = label + "'s schedule:\n\n";
            dayEvents.sort(function(a, b) { return a.time.localeCompare(b.time); });
            dayEvents.forEach(function(e) {
                reply += e.time + ' — ' + e.title + ' (' + e.calendar + ' cal)\n';
            });
            showTypingThenReply(reply.trim());
        }
    }

    function handleSchoolQuery() {
        var reply = "Latest from St. Patrick School:\n\n";
        state.schoolFeed.slice(0, 4).forEach(function(item) {
            reply += '- ' + item.title + ': ' + item.desc + ' (' + item.date + ')\n';
        });
        reply += "\nWant details on any of these?";
        showTypingThenReply(reply.trim());
    }

    function handleAddToCalendar(lower) {
        var both = lower.includes('both');
        var personal = lower.includes('personal') || both;
        var family = lower.includes('family') || lower.includes('home') || both;
        var work = lower.includes('work');

        // Try to detect which event
        var eventName = 'the event';
        if (lower.includes('birthday') || lower.includes('party') || lower.includes('lily')) {
            eventName = "Lily's Birthday Party (Sat March 7, 2pm)";
        } else if (lower.includes('dinner') || lower.includes('grandparent')) {
            eventName = "Dinner with Grandparents (Sun 5pm)";
        } else if (lower.includes('soccer') || lower.includes('game')) {
            eventName = "Soccer Game (Sat 10am, Field B)";
        } else if (lower.includes('doctor') || lower.includes('appointment')) {
            eventName = "Dr. Martinez Appointment (March 10, 10:30 AM)";
        }

        var cals = [];
        if (personal) cals.push('Personal');
        if (family) cals.push('Family');
        if (work) cals.push('Work');
        if (cals.length === 0) cals = ['Personal', 'Family'];

        showTypingThenReply("Done! Added \"" + eventName + "\" to your " + cals.join(' + ') + " calendar" + (cals.length > 1 ? 's' : '') + ".");
        showToast('Calendar Updated', eventName + ' added', 'success');
    }

    function handleTextJosh(lower) {
        var about = '';
        if (lower.includes('birthday') || lower.includes('party') || lower.includes('lily')) {
            about = "Lily's birthday party for Emma is Saturday March 7 at 2pm at Jump Zone. Can you make it?";
        } else if (lower.includes('soccer') || lower.includes('game')) {
            about = "Saturday soccer game moved to 10am at Field B. Coach says bring extra water!";
        } else if (lower.includes('dinner') || lower.includes('grandparent') || lower.includes('sunday')) {
            about = "Mom wants to do dinner Sunday at 5pm. Olive Garden or our place? Let me know!";
        } else if (lower.includes('field trip') || lower.includes('permission')) {
            about = "Reminder: Emma's field trip permission slip is due March 13. Did you sign it?";
        } else if (lower.includes('school') || lower.includes('homework')) {
            about = "School update: Emma has spelling + science journal due Tuesday, math + reading Wednesday, book report outline Thursday.";
        } else {
            about = "Hey, quick update from LifeSync — checking in. Give me a call when you get a chance!";
        }

        showTypingThenReply("Texted Josh: \"" + about + "\"\n\nI'll let you know when he replies.", {
            title: 'Text Sent to Josh',
            desc: about.substring(0, 80) + '...',
            buttons: [
                { label: 'Edit and resend', id: 'sms-edit-josh-' + Date.now() }
            ]
        });
        showToast('Text Sent', 'Message sent to Josh', 'success');
    }

    function handleRsvp(lower) {
        var yes = lower.includes('yes') || lower.includes('accept') || lower.includes('confirm');
        var no = lower.includes('no') || lower.includes('decline') || lower.includes('cancel');

        if (lower.includes('lily') || lower.includes('birthday') || lower.includes('party') || lower.includes('sarah')) {
            if (yes) {
                showTypingThenReply("Texted Sarah Chen: \"Emma would love to come to Lily's party! No food allergies. See you Saturday at 2pm!\"\n\nI'll also add a reminder for Saturday morning to prep.");
                showToast('RSVP Sent', 'Accepted Lily\'s birthday party', 'success');
            } else if (no) {
                showTypingThenReply("Texted Sarah Chen: \"Thanks so much for the invite! Unfortunately Emma can't make it this Saturday. Hope Lily has a great birthday!\"\n\nRemoved from calendars.");
            } else {
                showTypingThenReply("Got it. Do you want to RSVP yes or no to Lily's birthday party?", {
                    title: 'RSVP to Lily\'s Party',
                    desc: 'Saturday March 7 at 2pm',
                    buttons: [
                        { label: 'Yes, she can come!', id: 'sms-rsvp-yes-' + Date.now() },
                        { label: 'No, can\'t make it', id: 'sms-rsvp-no-' + Date.now() }
                    ]
                });
            }
        } else {
            showTypingThenReply("Which event do you want to RSVP to? I have:\n- Lily's Birthday Party (Sat March 7)\n- Dinner with Grandparents (Sunday)\n\nJust say which one!");
        }
    }

    function handleActionItems() {
        if (state.familyActions.length === 0) {
            showTypingThenReply("You're all caught up! No pending action items. Nice work.");
            return;
        }
        var reply = "Your pending action items (" + state.familyActions.length + "):\n\n";
        state.familyActions.forEach(function(a, i) {
            reply += (i + 1) + '. ' + a.title + ' — ' + a.desc + '\n';
        });
        reply += "\nText me to handle any of these (e.g., \"RSVP to Lily's party\" or \"remind me about the permission slip\").";
        showTypingThenReply(reply.trim());
    }

    function handleWorkMessages() {
        var workMsgs = state.messages.filter(function(m) {
            return m.channel === 'work-email' || m.channel === 'slack';
        }).sort(function(a, b) { return b.time - a.time; });

        if (workMsgs.length === 0) {
            showTypingThenReply("No work messages right now. Enjoy the quiet!");
            return;
        }
        var unread = workMsgs.filter(function(m) { return m.unread; });
        var reply = '';
        if (unread.length > 0) {
            reply = unread.length + " unread work message" + (unread.length > 1 ? 's' : '') + ":\n\n";
            unread.slice(0, 5).forEach(function(m) {
                var ch = CHANNELS[m.channel];
                reply += '- ' + m.sender + ' (' + ch.name + '): ' + (m.subject || m.preview.substring(0, 50)) + '\n';
            });
        } else {
            reply = "No new unread work messages. Recent:\n\n";
            workMsgs.slice(0, 3).forEach(function(m) {
                var ch = CHANNELS[m.channel];
                reply += '- ' + m.sender + ' (' + ch.name + '): ' + (m.subject || m.preview.substring(0, 50)) + ' — ' + formatTimeAgo(m.time) + '\n';
            });
        }
        showTypingThenReply(reply.trim());
    }

    function handleReminder(lower) {
        var about = 'that';
        if (lower.includes('permission') || lower.includes('field trip')) about = 'the permission slip (due March 13)';
        else if (lower.includes('birthday') || lower.includes('party') || lower.includes('rsvp')) about = "RSVP to Lily's birthday party (due Thursday)";
        else if (lower.includes('doctor') || lower.includes('appointment')) about = 'Dr. Martinez appointment (March 10)';
        else if (lower.includes('benefit') || lower.includes('enrollment')) about = 'benefits enrollment deadline (March 15)';
        else if (lower.includes('book report')) about = "Emma's book report outline (due Thursday)";

        showTypingThenReply("Reminder set for " + about + ". I'll text you the day before so you don't forget.");
        showToast('Reminder Set', about, 'success');
    }

    function handleUnreadSummary() {
        var unread = state.messages.filter(function(m) { return m.unread; });
        if (unread.length === 0) {
            showTypingThenReply("You're all caught up! No unread messages across any channel.");
            return;
        }
        var reply = state.unreadCount + " unread message" + (state.unreadCount > 1 ? 's' : '') + " across your channels:\n\n";
        var byChannel = {};
        unread.forEach(function(m) {
            if (!byChannel[m.channel]) byChannel[m.channel] = [];
            byChannel[m.channel].push(m);
        });
        Object.keys(byChannel).forEach(function(ch) {
            var chName = CHANNELS[ch] ? CHANNELS[ch].name : ch;
            reply += chName + ' (' + byChannel[ch].length + '):\n';
            byChannel[ch].forEach(function(m) {
                reply += '  - ' + m.sender + ': ' + (m.subject || m.preview.substring(0, 40)) + '\n';
            });
        });
        reply += '\nWant me to go into detail on any of these?';
        showTypingThenReply(reply.trim());
    }

    // ---- PROACTIVE SMS NOTIFICATIONS ----
    // When the live simulation adds a new message, also send an SMS notification
    var originalSimulateIncoming = simulateIncoming;
    simulateIncoming = function() {
        var prevCount = state.messages.length;
        originalSimulateIncoming();
        if (state.messages.length > prevCount) {
            var newMsg = state.messages[0]; // newest is first after unshift
            var ch = CHANNELS[newMsg.channel];
            var smsText = "NEW from " + newMsg.sender + " (" + ch.name + "): " + (newMsg.subject ? newMsg.subject + " — " : '') + newMsg.preview;

            // Auto-detect and suggest actions
            var action = null;
            var bodyLower = newMsg.body.toLowerCase();
            if (bodyLower.includes('early release') || bodyLower.includes('dismissal') || bodyLower.includes('school')) {
                action = {
                    title: 'School Alert',
                    desc: 'This may affect your schedule.',
                    buttons: [
                        { label: 'Add to calendar', id: 'sms-auto-cal-' + Date.now() },
                        { label: 'Notify Josh', id: 'sms-auto-josh-' + Date.now() }
                    ]
                };
            } else if (bodyLower.includes('game') || bodyLower.includes('practice') || bodyLower.includes('soccer')) {
                action = {
                    title: 'Sports Update',
                    desc: 'Schedule change detected.',
                    buttons: [
                        { label: 'Update calendar', id: 'sms-auto-cal-' + Date.now() },
                        { label: 'Tell Josh', id: 'sms-auto-josh-' + Date.now() }
                    ]
                };
            } else if (bodyLower.includes('deadline') || bodyLower.includes('enrollment') || bodyLower.includes('due')) {
                action = {
                    title: 'Deadline Detected',
                    desc: 'Want me to set a reminder?',
                    buttons: [
                        { label: 'Set reminder', id: 'sms-auto-remind-' + Date.now() },
                        { label: 'Add to calendar', id: 'sms-auto-cal-' + Date.now() }
                    ]
                };
            }

            addSmsBubble('incoming', smsText, action);

            // Update SMS badge
            var badge = $('#smsBadge');
            if (badge && state.currentView !== 'sms') {
                var count = parseInt(badge.textContent || '0', 10) + 1;
                badge.textContent = count;
                badge.style.display = 'inline-block';
            }
        }
    };

    // ==================== INIT ====================

    function init() {
        seedData();
        initNav();
        initModals();
        initInboxFilters();
        initSearch();
        initSmsChat();
        renderDashboard();

        // Start live simulation — new message every 30-60 seconds
        setTimeout(function scheduleNext() {
            simulateIncoming();
            setTimeout(scheduleNext, 30000 + Math.random() * 30000);
        }, 15000);
    }

    document.addEventListener('DOMContentLoaded', init);

})();
