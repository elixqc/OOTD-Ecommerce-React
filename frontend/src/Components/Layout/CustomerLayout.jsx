import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

export default function CustomerLayout() {
    return (
        <div className="customer-shell">
            <Header />
            <main className="page-container">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
}
