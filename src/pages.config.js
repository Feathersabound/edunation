import Dashboard from './pages/Dashboard';
import Generate from './pages/Generate';
import MyCourses from './pages/MyCourses';
import MyBooks from './pages/MyBooks';
import CourseView from './pages/CourseView';
import BookView from './pages/BookView';
import Profile from './pages/Profile';
import CourseAuthor from './pages/CourseAuthor';
import BookAuthor from './pages/BookAuthor';
import AdminDashboard from './pages/AdminDashboard';
import Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Generate": Generate,
    "MyCourses": MyCourses,
    "MyBooks": MyBooks,
    "CourseView": CourseView,
    "BookView": BookView,
    "Profile": Profile,
    "CourseAuthor": CourseAuthor,
    "BookAuthor": BookAuthor,
    "AdminDashboard": AdminDashboard,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: Layout,
};