-- ─────────────────────────────────────────────────────────────────────────────
-- Staff directory — sample data (run after 01_schema.sql)
-- • 50 departments (10 functions × 5 cities) matching departmentid 1–50
-- • 1,000,000 generated employees, ONLY if the table is empty
-- • Fills joined_on for existing rows, so "this month" questions work
-- All names are generated from common first/last names — no real people.
-- Takes about 1–3 minutes on Neon for 1M rows. To start smaller, change
-- 1000000 below to 100000.
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO departments (id, name)
SELECT
  (f.i - 1) * 5 + c.j AS id,
  f.name || ' – ' || c.name AS name
FROM unnest(ARRAY['Engineering','Finance','Human Resources','Sales','Marketing',
                  'Operations','Support','Legal','Research','Design'])
       WITH ORDINALITY AS f(name, i)
CROSS JOIN unnest(ARRAY['Hyderabad','Bengaluru','Chennai','Pune','Visakhapatnam'])
       WITH ORDINALITY AS c(name, j)
ON CONFLICT (id) DO NOTHING;

INSERT INTO employees (name, salary, age, departmentid, joined_on)
SELECT
    (ARRAY['Sandeep','Ravi','Priya','Kiran','Anitha','Mahesh','Teja','Lakshmi','Vijay','Suresh',
           'Deepika','Arjun','Sneha','Rahul','Naveen','Pooja','Harsha','Keerthi','Ramesh','Divya',
           'Ajay','Bhavana','Chandra','Madhavi','Sai','Nikhil','Akhila','Vamsi','Gayathri','Praveen',
           'Swathi','Abhishek','Sanjana','Tarun','Manasa','Karthik','Shalini','Yash','Neha','Rohit',
           'Pavani','Ashok','Sravani','Mohan','Jyothi','Ganesh','Meghana','Vinay','Kavya','Rajesh',
           'Anil','Sunitha','Vikram','Pallavi','Srinivas','Aishwarya','Manoj','Radhika','Sunil','Kavitha'])[floor(random() * 60 + 1)::int]
    || ' ' ||
    (ARRAY['Kumar','Reddy','Sharma','Rao','Babu','Devi','Krishna','Nair','Varma','Gupta',
           'Jain','Singh','Vardhan','Naidu','Patel','Sekhar','Verma','Iyer','Pillai','Menon'])[floor(random() * 20 + 1)::int]
    || ' ' || i::text                                   AS name,
    (45000 + floor(random() * 105000))::numeric(10,2)   AS salary,
    (22 + floor(random() * 37))::int                    AS age,
    (1 + floor(random() * 50))::int                     AS departmentid,
    (current_date - floor(random() * 1095)::int)        AS joined_on   -- last 3 years
FROM generate_series(1, 1000000) AS i
WHERE NOT EXISTS (SELECT 1 FROM employees);

-- Existing rows from the old script have no joining date yet
UPDATE employees
SET joined_on = current_date - floor(random() * 1095)::int
WHERE joined_on IS NULL;

-- A few deliberate outliers so "anything unusual?" has something to find
UPDATE employees SET salary = 950000 WHERE id IN (101, 202020, 777777) AND salary < 900000;

-- Refresh planner statistics after the bulk load
ANALYZE departments;
ANALYZE employees;

-- Quick check
SELECT
  (SELECT count(*) FROM departments) AS departments,
  (SELECT count(*) FROM employees)   AS employees;
