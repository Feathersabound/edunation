import Dashboard from './pages/Dashboard';
import Generate from './pages/Generate';
import MyCourses from './pages/MyCourses';
import MyBooks from './pages/MyBooks';
import CourseView from './pages/CourseView';
import Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Generate": Generate,
    "MyCourses": MyCourses,
    "MyBooks": MyBooks,
    "CourseView": CourseView,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: Layout,
};