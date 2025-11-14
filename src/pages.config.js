import Dashboard from './pages/Dashboard';
import Generate from './pages/Generate';
import Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Generate": Generate,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: Layout,
};