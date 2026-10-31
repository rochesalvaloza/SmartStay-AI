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
    `inline-flex h-10 items-center transition hover:text-violet-700 ${
      isActive ? "font-semibold text-violet-700" : "text-slate-700"
    }`;

  function handleLogout() {
    logoutCustomer();
    setCustomer(null);
    navigate("/");
  }

  return (
    <header className="sticky top-0 z-50 w-full min-h-[72px] shrink-0 border-b border-slate-200 bg-white shadow-sm">
      <nav className="mx-auto flex min-h-[72px] w-full max-w-7xl items-center justify-between px-6">
        <NavLink to="/" className="text-2xl font-bold text-violet-700">
          SmartStay AI
        </NavLink>

        <div className="flex items-center gap-6 text-sm font-medium">
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

              <span className="text-slate-600">
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
      </nav>
    </header>
  );
}