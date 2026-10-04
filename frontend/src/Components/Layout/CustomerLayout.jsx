import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

export default function CustomerLayout() {
    const { pathname } = useLocation();

    // The shop page (home) uses the full width of the screen
    const wide = pathname === '/';

    return (
        <div className="customer-shell">
            <Header />
            <main className={wide ? 'page-container page-wide' : 'page-container'}>
                <Outlet />
            </main>
            <Footer />
        </div>
    );
}