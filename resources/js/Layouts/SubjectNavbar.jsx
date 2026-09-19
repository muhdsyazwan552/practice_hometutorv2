import StudentNavbar from '@/Components/StudentNavbar';

// Subject pages share the dashboard navbar so learners keep the same
// navigation (and theme colours) while working inside a course.
export default function SubjectNavbar() {
  return <StudentNavbar />;
}
