import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  getStoredCustomer,
  logoutCustomer,
  type Customer,
} from "../../services/authService";

export default function Navbar() {
  const navigate = useNavigate();

  const [customer, setCustomer] = useState<Customer | null>(
    getStoredCustomer()
  );

  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const updateCustomer = () => {
      setCustomer(getStoredCustomer());
    };

    window.addEventListener("customer-auth-changed", updateCustomer);
    window.addEventListener("storage", updateCustomer);

    return () => {
      window.removeEventListener("customer-auth-changed", updateCustomer);
      window.removeEventListener("storage", updateCustomer);
    };
  }, []);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex w-full items-center py-3 transition hover:text-violet-700
    md:inline-flex md:h-10 md:w-auto md:py-0 ${
      isActive
        ? "font-semibold text-violet-700"
        : "text-slate-700"
    }`;

  function closeMenu() {
    setMenuOpen(false);
  }

  function handleLogout() {
    logoutCustomer();
    setCustomer(null);
    closeMenu();
    navigate("/");
  }

  return (
    <header className="sticky top-0 z-50 w-full shrink-0 border-b border-slate-200 bg-white shadow-sm">

      <nav className="mx-auto flex min-h-[72px] w-full max-w-7xl items-center justify-between px-4 sm:px-6">

        {/* Logo */}
        <NavLink
          to="/"
          onClick={closeMenu}
          className="shrink-0 text-2xl font-bold text-violet-700"
        >
          SmartStay
        </NavLink>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-6 text-sm font-medium md:flex">

          <NavLink to="/" end className={linkClass}>
            Home
          </NavLink>

          <NavLink to="/rooms" className={linkClass}>
            Rooms
          </NavLink>

          <NavLink to="/about" className={linkClass}>
            About
          </NavLink>

          {customer ? (
            <>
              <NavLink to="/my-bookings" className={linkClass}>
                My Bookings
              </NavLink>

              <span className="max-w-36 truncate text-slate-600">
                Hi, {customer.name}
              </span>

              <button
                onClick={handleLogout}
                className="rounded-lg bg-slate-200 px-4 py-2 text-slate-700 transition hover:bg-slate-300"
              >
                Log Out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={linkClass}>
                Log In
              </NavLink>

              <NavLink
                to="/register"
                className="rounded-lg bg-violet-600 px-4 py-2 text-white transition hover:bg-violet-700"
              >
                Register
              </NavLink>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-2xl text-slate-700 transition hover:bg-slate-100 md:hidden"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
        >
          {menuOpen ? "×" : "☰"}
        </button>
      </nav>

      {/* Mobile Navigation */}
      {menuOpen && (
        <div
          id="mobile-navigation"
          className="border-t border-slate-200 bg-white px-5 py-3 shadow-md md:hidden"
        >
          <div className="mx-auto flex w-full max-w-7xl flex-col text-sm font-medium">

            <NavLink
              to="/"
              end
              className={linkClass}
              onClick={closeMenu}
            >
              Home
            </NavLink>

            <NavLink
              to="/rooms"
              className={linkClass}
              onClick={closeMenu}
            >
              Rooms
            </NavLink>

            <NavLink
              to="/about"
              className={linkClass}
              onClick={closeMenu}
            >
              About
            </NavLink>

            {customer ? (
              <>
                <NavLink
                  to="/my-bookings"
                  className={linkClass}
                  onClick={closeMenu}
                >
                  My Bookings
                </NavLink>

                <div className="border-t border-slate-100 py-3 text-slate-600">
                  Hi, {customer.name}
                </div>

                <button
                  onClick={handleLogout}
                  className="mt-2 w-full rounded-lg bg-slate-200 px-4 py-3 text-left text-slate-700 transition hover:bg-slate-300"
                >
                  Log Out
                </button>
              </>
            ) : (
              <>
                <NavLink
                  to="/login"
                  className={linkClass}
                  onClick={closeMenu}
                >
                  Log In
                </NavLink>

                <NavLink
                  to="/register"
                  onClick={closeMenu}
                  className="mt-2 flex w-full items-center justify-center rounded-lg bg-violet-600 px-4 py-3 text-white transition hover:bg-violet-700"
                >
                  Register
                </NavLink>
              </>
            )}

          </div>
        </div>
      )}
    </header>
  );
}