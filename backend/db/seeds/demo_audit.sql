-- Audit entries for the demo transfers in demo.sql, loaded after the demo users exist.
-- The sending school's manager creates (and completes) each transfer and the receiving
-- school's manager decides it, except DEMO-011-005, which the super admin approved
-- on the receiving school's behalf.
WITH demo_events(student_number, action, actor, note, days_ago) AS (VALUES
    ('DEMO-001-003', 'Created', 'from', NULL, 3),
    ('DEMO-007-004', 'Created', 'from', NULL, 1),
    ('DEMO-003-002', 'Created', 'from', NULL, 20),
    ('DEMO-003-002', 'Rejected', 'to', 'No space in Form 2 this term', 18),
    ('DEMO-011-005', 'Created', 'from', NULL, 12),
    ('DEMO-011-005', 'Approved', 'admin', 'Approved on behalf of the receiving school after the head teacher confirmed the boarding place by phone', 10),
    ('DEMO-005-006', 'Created', 'from', NULL, 40),
    ('DEMO-005-006', 'Approved', 'to', NULL, 38),
    ('DEMO-005-006', 'Completed', 'from', NULL, 35)
)
INSERT INTO audit_logs (entity_type, entity_id, action, actor_user_id, actor_name, actor_role, actor_school_id, note, created_at)
SELECT 'transfer', t.id, e.action, u.id, u.name, u.role, u.school_id, e.note, now() - make_interval(days => e.days_ago)
FROM demo_events e
JOIN students s ON s.student_number = e.student_number
JOIN transfers t ON t.student_id = s.id
LEFT JOIN users u ON
    (e.actor = 'from' AND u.role = 'SCHOOL_MANAGER' AND u.school_id = t.from_school)
    OR (e.actor = 'to' AND u.role = 'SCHOOL_MANAGER' AND u.school_id = t.to_school)
    OR (e.actor = 'admin' AND u.role = 'SUPER_ADMIN');
