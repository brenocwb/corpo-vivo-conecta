-- Update existing profiles to associate with the church
UPDATE profiles 
SET church_id = 'e4f2e4b8-6704-4206-8107-a11225da78e2' 
WHERE church_id IS NULL;

-- Set church admin
UPDATE churches 
SET admin_id = (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)
WHERE admin_id IS NULL;