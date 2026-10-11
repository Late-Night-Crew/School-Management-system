-- Demo notices and conversations, loaded after the demo users exist.

-- Ministry notice to every demo school with a due date: the first four schools have
-- marked it done and the next four have read it, so the progress view has data.
WITH sender AS (
    SELECT id, name, role FROM users WHERE role = 'SUPER_ADMIN' LIMIT 1
),
notice AS (
    INSERT INTO notices (sender_user_id, sender_name, sender_role, sender_party_type, sender_party_id,
        title, body, priority, due_date, audience_type, created_at)
    SELECT id, name, role, 'SUPER_ADMIN', 0,
        'Submit Term 1 marks',
        'All secondary schools must enter Term 1 marks for every student in NSMS before the due date. '
            || 'Contact your regional office if a subject or student is missing.',
        'Normal', CURRENT_DATE + 14, 'SCHOOLS_ALL', now() - interval '3 days'
    FROM sender
    RETURNING id
),
ranked AS (
    SELECT sc.id, row_number() OVER (ORDER BY sc.school_number) AS n
    FROM schools sc WHERE sc.school_number LIKE 'DEMO-%'
)
INSERT INTO notice_recipients (notice_id, party_type, party_id, read_at, read_by_user_id, done_at, done_by_user_id)
SELECT notice.id, 'SCHOOL', ranked.id,
    CASE WHEN ranked.n <= 8 THEN now() - interval '2 days' END,
    CASE WHEN ranked.n <= 8 THEN u.id END,
    CASE WHEN ranked.n <= 4 THEN now() - interval '1 day' END,
    CASE WHEN ranked.n <= 4 THEN u.id END
FROM notice CROSS JOIN ranked
LEFT JOIN users u ON u.role = 'SCHOOL_MANAGER' AND u.school_id = ranked.id;

-- Urgent notice from the Northern regional office to the schools in its region.
WITH sender AS (
    SELECT u.id, u.name, u.role, u.region_id FROM users u
    JOIN regions rg ON rg.id = u.region_id
    WHERE u.role = 'REGIONAL_ADMIN' AND rg.name = 'Northern'
),
notice AS (
    INSERT INTO notices (sender_user_id, sender_name, sender_role, sender_party_type, sender_party_id,
        title, body, priority, audience_type, audience_id, created_at)
    SELECT id, name, role, 'REGION', region_id,
        'Head teachers meeting moved to Mzuzu',
        'The Northern Region head teachers meeting on Friday will now take place at the Mzuzu regional office at 9:00.',
        'Urgent', 'SCHOOLS_IN_REGION', region_id, now() - interval '1 day'
    FROM sender
    RETURNING id, audience_id
)
INSERT INTO notice_recipients (notice_id, party_type, party_id)
SELECT notice.id, 'SCHOOL', sc.id
FROM notice
JOIN districts d ON d.region_id = notice.audience_id
JOIN schools sc ON sc.district_id = d.id;

-- Ministry notice to all regional admins.
WITH sender AS (
    SELECT id, name, role FROM users WHERE role = 'SUPER_ADMIN' LIMIT 1
),
notice AS (
    INSERT INTO notices (sender_user_id, sender_name, sender_role, sender_party_type, sender_party_id,
        title, body, priority, due_date, audience_type, created_at)
    SELECT id, name, role, 'SUPER_ADMIN', 0,
        'Regional transfer summaries',
        'Please review the pending transfers in your region and follow up with schools that have not responded.',
        'Normal', CURRENT_DATE + 7, 'REGIONAL_ADMINS', now() - interval '2 days'
    FROM sender
    RETURNING id
)
INSERT INTO notice_recipients (notice_id, party_type, party_id)
SELECT notice.id, 'REGION', rg.id FROM notice CROSS JOIN regions rg;

-- Two conversations: a school asking its regional office for help, and two schools
-- coordinating the pending Lilongwe -> Mzuzu transfer.
WITH demo_conversations(key, subject, party_a_type, party_a_school, party_a_region, party_b_type, party_b_school, party_b_region, days_ago) AS (VALUES
    ('help', 'Missing Biology teacher allocation', 'SCHOOL', 'DEMO-003', NULL, 'REGION', NULL, 'Northern', 2),
    ('transfer', 'Transfer of Mphatso Kumwenda', 'SCHOOL', 'DEMO-007', NULL, 'SCHOOL', 'DEMO-009', NULL, 1)
),
parties AS (
    SELECT dc.*,
        COALESCE(sa.id, ra.id) AS a_id,
        COALESCE(sb.id, rb.id) AS b_id
    FROM demo_conversations dc
    LEFT JOIN schools sa ON sa.school_number = dc.party_a_school
    LEFT JOIN regions ra ON ra.name = dc.party_a_region
    LEFT JOIN schools sb ON sb.school_number = dc.party_b_school
    LEFT JOIN regions rb ON rb.name = dc.party_b_region
),
created AS (
    INSERT INTO conversations (subject, created_at, last_message_at)
    SELECT subject, now() - make_interval(days => days_ago), now() - make_interval(days => days_ago) + interval '3 hours'
    FROM parties
    RETURNING id, subject
),
participants AS (
    INSERT INTO conversation_participants (conversation_id, party_type, party_id, last_read_at)
    SELECT c.id, p.party_a_type, p.a_id, now() FROM created c JOIN parties p ON p.subject = c.subject
    UNION ALL
    SELECT c.id, p.party_b_type, p.b_id, NULL FROM created c JOIN parties p ON p.subject = c.subject
    RETURNING 1
),
demo_messages(subject, from_side, body, hours_after) AS (VALUES
    ('Missing Biology teacher allocation', 'a', 'Good morning. We still have no Biology teacher for Form 3 this term. Can the regional office advise on the posting?', 0),
    ('Missing Biology teacher allocation', 'b', 'Thank you for raising this. The posting list is with the ministry; we expect it by the end of next week.', 2),
    ('Missing Biology teacher allocation', 'a', 'Noted, thank you. We will cover with the Chemistry teacher until then.', 3),
    ('Transfer of Mphatso Kumwenda', 'a', 'Hello, we have sent a transfer request for Mphatso Kumwenda. The family moves to Mzuzu at the end of the month.', 0),
    ('Transfer of Mphatso Kumwenda', 'b', 'Received. Could you share the student''s Term 1 report card when you finalize?', 3)
)
INSERT INTO messages (conversation_id, sender_user_id, sender_name, sender_role, sender_party_type, sender_party_id, body, created_at)
SELECT c.id, u.id, u.name, u.role,
    CASE m.from_side WHEN 'a' THEN p.party_a_type ELSE p.party_b_type END,
    CASE m.from_side WHEN 'a' THEN p.a_id ELSE p.b_id END,
    m.body,
    now() - make_interval(days => p.days_ago) + make_interval(hours => m.hours_after)
FROM demo_messages m
JOIN created c ON c.subject = m.subject
JOIN parties p ON p.subject = m.subject
LEFT JOIN users u ON
    (CASE m.from_side WHEN 'a' THEN p.party_a_type ELSE p.party_b_type END) = 'SCHOOL'
        AND u.role = 'SCHOOL_MANAGER' AND u.school_id = (CASE m.from_side WHEN 'a' THEN p.a_id ELSE p.b_id END)
    OR (CASE m.from_side WHEN 'a' THEN p.party_a_type ELSE p.party_b_type END) = 'REGION'
        AND u.role = 'REGIONAL_ADMIN' AND u.region_id = (CASE m.from_side WHEN 'a' THEN p.a_id ELSE p.b_id END);
