import Dashboard from './pages/Dashboard';
import Generate from './pages/Generate';
import MyCourses from './pages/MyCourses';
import Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Generate": Generate,
    "MyCourses": MyCourses,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: Layout,
};