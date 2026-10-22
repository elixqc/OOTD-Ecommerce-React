// CORE + U2 · UI — storefront shell.
// Wraps the public/customer routes with the header and footer via <Outlet/>.
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

export default function CustomerLayout() {
    const { pathname } = useLocation();

    // The shop page (home) uses the full width of the screen
    const wide = pathname === '/';

    // The login/register and password-reset pages are focused screens, so they have no footer
    const hideFooter = /^\/(login|register|forgot-password)(\/|$)/.test(pathname);

    return (
        <div className="customer-shell">
            <Header />
            <main className={wide ? 'page-container page-wide' : 'page-container'}>
                <Outlet />
            </main>
            {!hideFooter && <Footer />}
        </div>
    );
}
