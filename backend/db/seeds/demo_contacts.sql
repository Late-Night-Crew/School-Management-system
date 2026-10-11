-- Demo contact details, loaded after the demo users exist. Every number is fictional
-- and follows a pattern (+265 1 000 1xx for offices, +265 999 000 xxx for people);
-- do not call them.

UPDATE regions rg
SET
    office_phone = '+265100010' || rg.id,
    office_email = lower(rg.name) || '.division@nsms.demo',
    postal_address = 'P.O. Box ' || (100 + rg.id) || ', ' || CASE rg.name
        WHEN 'Northern' THEN 'Mzuzu' WHEN 'Central' THEN 'Lilongwe' ELSE 'Blantyre' END,
    physical_address = rg.name || ' Education Division Offices'
WHERE rg.name IN ('Northern', 'Central', 'Southern');

UPDATE schools sc
SET
    phone = '+2651000' || lpad((150 + n.rank)::text, 3, '0'),
    email = lower(replace(sc.school_number, '-', '')) || '@nsms.demo',
    postal_address = 'P.O. Box ' || (200 + n.rank) || ', ' || d.name,
    head_teacher_name = 'Head Teacher ' || sc.school_number,
    head_teacher_phone = '+265999000' || lpad((300 + n.rank)::text, 3, '0')
FROM (
    SELECT id, row_number() OVER (ORDER BY school_number) AS rank FROM schools WHERE school_number LIKE 'DEMO-%'
) n, districts d
WHERE n.id = sc.id AND d.id = sc.district_id;

UPDATE users u
SET
    phone = '+265999000' || lpad(u.id::text, 3, '0'),
    whatsapp = CASE WHEN u.id % 2 = 0 THEN '+265888000' || lpad(u.id::text, 3, '0') END
WHERE u.email LIKE '%@nsms.demo';
