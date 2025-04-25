-- Add the missing columns to company_settings table
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS survey_generation_prompt TEXT DEFAULT 'As a benefits administrator I would like to create quarterly and annual benefits surveys. Create the questions based on your knowledge as well as the contents of the document uploaded to the assistant. Focus on employee satisfaction, understanding of benefits, and areas for improvement.';

-- Add other missing columns if needed
ALTER TABLE survey_templates ADD COLUMN IF NOT EXISTS created_by_ai BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE survey_templates ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id);
ALTER TABLE survey_templates ADD COLUMN IF NOT EXISTS template_type TEXT DEFAULT 'custom';

ALTER TABLE survey_questions ADD COLUMN IF NOT EXISTS created_by_ai BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE survey_questions ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id);