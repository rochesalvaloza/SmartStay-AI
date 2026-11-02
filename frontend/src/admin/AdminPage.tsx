import { useCallback, useEffect, useState, type FormEvent } from 'react';
import './AdminPage.css';

const API_URL = 'http://127.0.0.1:8000/api';

type AdminUser = {
  id: number;
  name: string;
  email: string;
};

type DashboardStats = {
  total_rooms: number;
  available_rooms: number;
  total_bookings: number;
  confirmed_bookings: number;
  pending_bookings: number;
  cancelled_bookings: number;
  estimated_revenue: number;
};

type Room = {
  id: number;
  name: string;
  room_type: string;
  price_per_night: string | number;
};

type Booking = {
  id: number;
  guest_name: string;
  guest_email: string;
  check_in: string;
  check_out: string;
  guests: number;
  total_price: string | number;
  status: string;
  room: Room | null;
};

type PaymentBooking = Booking & {
  payment_method: 'gcash' | 'maya' | 'cash_at_hotel' | null;
  payment_status: 'unrecorded' | 'unpaid' | 'pending' | 'paid' | 'rejected';
  payment_reference: string | null;
  payment_proof_path: string | null;
  payment_verified_at: string | null;
  payment_rejection_reason: string | null;
};

type PaginatedPayments = {
  current_page: number;
  last_page: number;
  data: PaymentBooking[];
  total: number;
};

type PaginatedBookings = {
  current_page: number;
  last_page: number;
  data: Booking[];
  total: number;
};

type ChatMessage = {
  id: number;
  conversation_id: number;
  sender_type: 'customer' | 'admin' | 'ai';
  message: string;
  read_at: string | null;
  created_at: string;
};

type Conversation = {
  id: number;
  user_id: number | null;
  customer_name: string;
  customer_email: string;
  status: string;
  last_message_at: string | null;
  messages: ChatMessage[];
  unread_count: number;
};

type LoginResponse = {
  success: boolean;
  message: string;
  token: string;
  user: AdminUser;
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
};

function formatCurrency(value: number | string): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 2,
  }).format(Number(value));
}

function formatDate(value: string): string {
  if (!value) return '—';

  const date = new Date(`${value.slice(0, 10)}T00:00:00`);

  return date.toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatMessageTime(value: string): string {
  return new Date(value).toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function paymentMethodLabel(method: PaymentBooking['payment_method']): string {
  if (method === 'gcash') return 'GCash';
  if (method === 'maya') return 'Maya';
  if (method === 'cash_at_hotel') return 'Cash at Hotel';
  return 'Not recorded';
}

export default function AdminPage() {
  const [token, setToken] = useState(
    () => localStorage.getItem('smartstay_admin_token') ?? '',
  );

  const [user, setUser] = useState<AdminUser | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [bookings, setBookings] = useState<PaginatedBookings | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginError, setLoginError] = useState('');

  const [activeSection, setActiveSection] = useState<
    'dashboard' | 'messages' | 'payments'
  >('dashboard');

  // Customer messages
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [conversationMessages, setConversationMessages] = useState<ChatMessage[]>([]);
  const [replyMessage, setReplyMessage] = useState('');
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);

  // Payment verification
  const [payments, setPayments] = useState<PaginatedPayments | null>(null);
  const [paymentSearch, setPaymentSearch] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [paymentPage, setPaymentPage] = useState(1);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentsError, setPaymentsError] = useState('');
  const [paymentActionId, setPaymentActionId] = useState<number | null>(null);
  const [rejectingPayment, setRejectingPayment] =
    useState<PaymentBooking | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [receiptLoadingId, setReceiptLoadingId] = useState<number | null>(null);

  const logout = useCallback(() => {
    const currentToken = localStorage.getItem('smartstay_admin_token');

    if (currentToken) {
      void fetch(`${API_URL}/admin/logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${currentToken}`,
          Accept: 'application/json',
        },
      }).catch(() => undefined);
    }

    localStorage.removeItem('smartstay_admin_token');
    localStorage.removeItem('smartstay_admin');

    setToken('');
    setUser(null);
    setStats(null);
    setBookings(null);
    setConversations([]);
    setSelectedConversation(null);
    setConversationMessages([]);
    setPayments(null);
    setRejectingPayment(null);
    setPassword('');
    setError('');
    setMessagesError('');
    setPaymentsError('');
  }, []);

  // Load dashboard and reservations
  const loadDashboard = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError('');

    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      };

      const [dashboardResponse, bookingsResponse, userResponse] =
        await Promise.all([
          fetch(`${API_URL}/admin/dashboard`, { headers }),
          fetch(
            `${API_URL}/admin/bookings?page=${page}&search=${encodeURIComponent(search)}&status=${encodeURIComponent(status)}`,
            { headers },
          ),
          fetch(`${API_URL}/admin/me`, { headers }),
        ]);

      if (
        [dashboardResponse, bookingsResponse, userResponse].some(
          (response) => response.status === 401 || response.status === 403,
        )
      ) {
        logout();
        setLoginError('Your session expired. Please log in again.');
        return;
      }

      if (!dashboardResponse.ok || !bookingsResponse.ok || !userResponse.ok) {
        throw new Error('Could not load dashboard information.');
      }

      const dashboardJson =
        (await dashboardResponse.json()) as ApiResponse<DashboardStats>;

      const bookingsJson =
        (await bookingsResponse.json()) as ApiResponse<PaginatedBookings>;

      const userJson = (await userResponse.json()) as {
        success: boolean;
        user: AdminUser;
      };

      setStats(dashboardJson.data);
      setBookings(bookingsJson.data);
      setUser(userJson.user);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to connect to the server.',
      );
    } finally {
      setLoading(false);
    }
  }, [token, page, search, status, logout]);

  // Load customer conversations
  const loadConversations = useCallback(async () => {
    if (!token) return;

    setMessagesLoading(true);
    setMessagesError('');

    try {
      const response = await fetch(`${API_URL}/admin/conversations`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (response.status === 401 || response.status === 403) {
        logout();
        setLoginError('Your session expired. Please log in again.');
        return;
      }

      if (!response.ok) {
        throw new Error('Could not load customer conversations.');
      }

      const result = (await response.json()) as {
        success: boolean;
        conversations: Conversation[];
      };

      setConversations(result.conversations ?? []);
    } catch (err) {
      setMessagesError(
        err instanceof Error
          ? err.message
          : 'Unable to load customer messages.',
      );
    } finally {
      setMessagesLoading(false);
    }
  }, [token, logout]);

  // Open one conversation
  const openConversation = useCallback(
    async (conversation: Conversation) => {
      if (!token) return;

      setSelectedConversation(conversation);
      setConversationMessages([]);
      setReplyMessage('');
      setMessagesLoading(true);
      setMessagesError('');

      try {
        const response = await fetch(
          `${API_URL}/admin/conversations/${conversation.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
            },
          },
        );

        if (response.status === 401 || response.status === 403) {
          logout();
          setLoginError('Your session expired. Please log in again.');
          return;
        }

        if (!response.ok) {
          throw new Error('Could not open this conversation.');
        }

        const result = (await response.json()) as {
          success: boolean;
          conversation: Conversation;
        };

        setSelectedConversation(result.conversation);
        setConversationMessages(result.conversation.messages ?? []);

        setConversations((current) =>
          current.map((item) =>
            item.id === result.conversation.id
              ? { ...item, unread_count: 0 }
              : item,
          ),
        );
      } catch (err) {
        setMessagesError(
          err instanceof Error
            ? err.message
            : 'Unable to open conversation.',
        );
      } finally {
        setMessagesLoading(false);
      }
    },
    [token, logout],
  );

  // Send admin reply
  async function handleReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedConversation || !replyMessage.trim() || !token) return;

    setReplyLoading(true);
    setMessagesError('');

    try {
      const response = await fetch(
        `${API_URL}/admin/conversations/${selectedConversation.id}/reply`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({ message: replyMessage.trim() }),
        },
      );

      const result = await response.json();

      if (response.status === 401 || response.status === 403) {
        logout();
        setLoginError('Your session expired. Please log in again.');
        return;
      }

      if (!response.ok) {
        throw new Error(result.message || 'Unable to send your reply.');
      }

      const sentMessage = result.reply as ChatMessage;

      setConversationMessages((current) => [...current, sentMessage]);
      setReplyMessage('');

      setSelectedConversation((current) =>
        current
          ? {
              ...current,
              last_message_at: sentMessage.created_at,
              status: 'open',
            }
          : current,
      );

      await loadConversations();
    } catch (err) {
      setMessagesError(
        err instanceof Error ? err.message : 'Unable to send your reply.',
      );
    } finally {
      setReplyLoading(false);
    }
  }

  // Change conversation status
  async function handleConversationStatus(statusValue: 'open' | 'closed') {
    if (!selectedConversation || !token) return;

    setMessagesError('');

    try {
      const response = await fetch(
        `${API_URL}/admin/conversations/${selectedConversation.id}/status`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({ status: statusValue }),
        },
      );

      const result = await response.json();

      if (response.status === 401 || response.status === 403) {
        logout();
        setLoginError('Your session expired. Please log in again.');
        return;
      }

      if (!response.ok) {
        throw new Error(result.message || 'Could not update conversation.');
      }

      setSelectedConversation((current) =>
        current ? { ...current, status: statusValue } : current,
      );

      setConversations((current) =>
        current.map((item) =>
          item.id === selectedConversation.id
            ? { ...item, status: statusValue }
            : item,
        ),
      );
    } catch (err) {
      setMessagesError(
        err instanceof Error
          ? err.message
          : 'Could not update conversation status.',
      );
    }
  }

  // Load payment records
  const loadPayments = useCallback(async () => {
    if (!token) return;

    setPaymentsLoading(true);
    setPaymentsError('');

    try {
      const params = new URLSearchParams({
        page: String(paymentPage),
      });

      if (paymentSearch.trim()) {
        params.set('search', paymentSearch.trim());
      }

      if (paymentStatus) {
        params.set('status', paymentStatus);
      }

      const response = await fetch(
        `${API_URL}/admin/payments?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        },
      );

      if (response.status === 401 || response.status === 403) {
        logout();
        setLoginError('Your session expired. Please log in again.');
        return;
      }

      if (!response.ok) {
        throw new Error('Could not load payment records.');
      }

      const result = (await response.json()) as ApiResponse<PaginatedPayments>;
      setPayments(result.data);
    } catch (err) {
      setPaymentsError(
        err instanceof Error ? err.message : 'Unable to load payments.',
      );
    } finally {
      setPaymentsLoading(false);
    }
  }, [token, paymentPage, paymentSearch, paymentStatus, logout]);

  // Approve a pending GCash or Maya payment
  async function approvePayment(booking: PaymentBooking) {
    if (!token) return;

    const confirmed = window.confirm(
      `Approve the ${paymentMethodLabel(booking.payment_method)} payment for booking #${booking.id}?`,
    );

    if (!confirmed) return;

    setPaymentActionId(booking.id);
    setPaymentsError('');

    try {
      const response = await fetch(
        `${API_URL}/admin/payments/${booking.id}/approve`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        },
      );

      const result = await response.json();

      if (response.status === 401 || response.status === 403) {
        logout();
        setLoginError('Your session expired. Please log in again.');
        return;
      }

      if (!response.ok) {
        throw new Error(result.message || 'Could not approve this payment.');
      }

      await loadPayments();
    } catch (err) {
      setPaymentsError(
        err instanceof Error ? err.message : 'Unable to approve payment.',
      );
    } finally {
      setPaymentActionId(null);
    }
  }

  // Reject a pending GCash or Maya payment
  async function rejectPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token || !rejectingPayment || !rejectionReason.trim()) return;

    const booking = rejectingPayment;
    setPaymentActionId(booking.id);
    setPaymentsError('');

    try {
      const response = await fetch(
        `${API_URL}/admin/payments/${booking.id}/reject`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({ reason: rejectionReason.trim() }),
        },
      );

      const result = await response.json();

      if (response.status === 401 || response.status === 403) {
        logout();
        setLoginError('Your session expired. Please log in again.');
        return;
      }

      if (!response.ok) {
        throw new Error(result.message || 'Could not reject this payment.');
      }

      setRejectingPayment(null);
      setRejectionReason('');
      await loadPayments();
    } catch (err) {
      setPaymentsError(
        err instanceof Error ? err.message : 'Unable to reject payment.',
      );
    } finally {
      setPaymentActionId(null);
    }
  }

  // Record cash collected at the hotel
  async function collectCash(booking: PaymentBooking) {
    if (!token) return;

    const confirmed = window.confirm(
      `Confirm that ₱${Number(booking.total_price).toLocaleString('en-PH')} has been collected for booking #${booking.id}?`,
    );

    if (!confirmed) return;

    setPaymentActionId(booking.id);
    setPaymentsError('');

    try {
      const response = await fetch(
        `${API_URL}/admin/payments/${booking.id}/collect-cash`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        },
      );

      const result = await response.json();

      if (response.status === 401 || response.status === 403) {
        logout();
        setLoginError('Your session expired. Please log in again.');
        return;
      }

      if (!response.ok) {
        throw new Error(result.message || 'Could not record cash collection.');
      }

      await loadPayments();
    } catch (err) {
      setPaymentsError(
        err instanceof Error ? err.message : 'Unable to record cash collection.',
      );
    } finally {
      setPaymentActionId(null);
    }
  }

  // Open private receipt using the authenticated admin request
  async function viewReceipt(booking: PaymentBooking) {
    if (!token) return;

    setReceiptLoadingId(booking.id);
    setPaymentsError('');

    try {
      const response = await fetch(
        `${API_URL}/admin/payments/${booking.id}/receipt`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/pdf, image/*',
          },
        },
      );

      if (response.status === 401 || response.status === 403) {
        logout();
        setLoginError('Your session expired. Please log in again.');
        return;
      }

      if (!response.ok) {
        throw new Error('Could not open the payment receipt.');
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const receiptWindow = window.open(objectUrl, '_blank');

      if (!receiptWindow) {
        URL.revokeObjectURL(objectUrl);
        throw new Error('Your browser blocked the receipt window. Allow pop-ups and try again.');
      }

      receiptWindow.addEventListener('beforeunload', () => {
        URL.revokeObjectURL(objectUrl);
      });
    } catch (err) {
      setPaymentsError(
        err instanceof Error ? err.message : 'Unable to view receipt.',
      );
    } finally {
      setReceiptLoadingId(null);
    }
  }

  useEffect(() => {
    if (token) {
      void loadDashboard();
    }
  }, [token, loadDashboard]);

  useEffect(() => {
    if (token && activeSection === 'messages') {
      void loadConversations();
    }
  }, [token, activeSection, loadConversations]);

  useEffect(() => {
    if (token && activeSection === 'payments') {
      void loadPayments();
    }
  }, [token, activeSection, loadPayments]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const result = (await response.json()) as Partial<LoginResponse>;

      if (!response.ok || !result.success || !result.token || !result.user) {
        throw new Error(
          result.message || 'Invalid administrator email or password.',
        );
      }

      localStorage.setItem('smartstay_admin_token', result.token);
      localStorage.setItem('smartstay_admin', JSON.stringify(result.user));
      setToken(result.token);
      setUser(result.user);
      setPassword('');
    } catch (err) {
      setLoginError(
        err instanceof Error
          ? err.message
          : 'Unable to log in. Check that Laravel is running.',
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    void loadDashboard();
  }

  function handlePaymentSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPaymentPage(1);
    void loadPayments();
  }

  if (!token) {
    return (
      <main className="admin-login-page">
        <section className="admin-login-card">
          <div className="admin-brand-mark">S</div>
          <p className="admin-eyebrow">SMARTSTAY AI</p>
          <h1>Admin Portal</h1>
          <p className="admin-muted">
            Sign in to manage hotel reservations and view dashboard statistics.
          </p>

          {loginError && (
            <div className="admin-alert admin-alert-error" role="alert">
              {loginError}
            </div>
          )}

          <form className="admin-login-form" onSubmit={handleLogin}>
            <label htmlFor="admin-email">Email address</label>
            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@example.com"
              required
            />

            <label htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              required
            />

            <button className="admin-primary-button" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In to Dashboard'}
            </button>
          </form>

          <a className="admin-back-link" href="/">
            ← Back to hotel website
          </a>
        </section>
      </main>
    );
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <a className="admin-sidebar-brand" href="/admin">
          <span className="admin-brand-mark">S</span>
          <span>
            <strong>SmartStay</strong>
            <small>AI MANAGEMENT</small>
          </span>
        </a>

        <p className="admin-sidebar-label">WORKSPACE</p>

        <button
          type="button"
          className={`admin-nav-link ${activeSection === 'dashboard' ? 'admin-nav-active' : ''}`}
          onClick={() => setActiveSection('dashboard')}
        >
          <span>▦</span> Dashboard
        </button>

        <button
          type="button"
          className={`admin-nav-link ${activeSection === 'messages' ? 'admin-nav-active' : ''}`}
          onClick={() => setActiveSection('messages')}
        >
          <span>✉</span> Customer Messages
          {conversations.some((item) => item.unread_count > 0) && (
            <span style={{ marginLeft: 'auto', color: '#dc2626' }}>
              {conversations.reduce(
                (total, item) => total + item.unread_count,
                0,
              )}
            </span>
          )}
        </button>

        <button
          type="button"
          className={`admin-nav-link ${activeSection === 'payments' ? 'admin-nav-active' : ''}`}
          onClick={() => setActiveSection('payments')}
        >
          <span>₱</span> Payment Verification
        </button>

        <button
          type="button"
          className="admin-nav-link"
          onClick={() => {
            setActiveSection('dashboard');
            document.getElementById('reservations')?.scrollIntoView({
              behavior: 'smooth',
            });
          }}
        >
          <span>▤</span> Reservations
        </button>

        <a className="admin-nav-link" href="/">
          <span>⌂</span> View Hotel Website
        </a>

        <div className="admin-sidebar-bottom">
          <div className="admin-user-card">
            <div className="admin-avatar">
              {(user?.name || 'A').charAt(0).toUpperCase()}
            </div>
            <div className="admin-user-info">
              <strong>{user?.name || 'Administrator'}</strong>
              <small>Administrator</small>
            </div>
          </div>

          <button className="admin-logout-button" onClick={logout}>
            ↪ Log out
          </button>
        </div>
      </aside>

      <main className="admin-main" id="dashboard">
        {activeSection === 'dashboard' ? (
          <>
            <header className="admin-topbar">
              <div>
                <p className="admin-eyebrow">OVERVIEW</p>
                <h1>Dashboard</h1>
              </div>

              <button
                className="admin-refresh-button"
                onClick={() => void loadDashboard()}
                disabled={loading}
              >
                ↻ Refresh data
              </button>
            </header>

            <section className="admin-welcome">
              <div>
                <p className="admin-welcome-label">SMARTSTAY MANAGEMENT</p>
                <h2>Welcome back{user?.name ? `, ${user.name}` : ''}!</h2>
                <p>Here's what's happening with your hotel today.</p>
              </div>
              <div className="admin-welcome-icon">⌂</div>
            </section>

            {error && (
              <div className="admin-alert admin-alert-error" role="alert">
                {error}
              </div>
            )}

            <section className="admin-stats-grid" aria-label="Dashboard statistics">
              <article className="admin-stat-card">
                <div className="admin-stat-top">
                  <span>Total Rooms</span>
                  <span className="admin-stat-icon purple">⌂</span>
                </div>
                <strong>{stats?.total_rooms ?? '—'}</strong>
                <small>{stats?.available_rooms ?? '—'} available</small>
              </article>

              <article className="admin-stat-card">
                <div className="admin-stat-top">
                  <span>Total Bookings</span>
                  <span className="admin-stat-icon blue">▤</span>
                </div>
                <strong>{stats?.total_bookings ?? '—'}</strong>
                <small>All reservations</small>
              </article>

              <article className="admin-stat-card">
                <div className="admin-stat-top">
                  <span>Confirmed</span>
                  <span className="admin-stat-icon green">✓</span>
                </div>
                <strong>{stats?.confirmed_bookings ?? '—'}</strong>
                <small>Confirmed reservations</small>
              </article>

              <article className="admin-stat-card">
                <div className="admin-stat-top">
                  <span>Estimated Revenue</span>
                  <span className="admin-stat-icon orange">₱</span>
                </div>
                <strong className="admin-revenue">
                  {stats ? formatCurrency(stats.estimated_revenue) : '—'}
                </strong>
                <small>Confirmed bookings, not verified payments</small>
              </article>
            </section>

            <section className="admin-secondary-stats">
              <div>
                <span className="admin-status-dot pending-dot" />
                Pending bookings
                <strong>{stats?.pending_bookings ?? '—'}</strong>
              </div>
              <div>
                <span className="admin-status-dot cancelled-dot" />
                Cancelled bookings
                <strong>{stats?.cancelled_bookings ?? '—'}</strong>
              </div>
            </section>

            <section className="admin-bookings-panel" id="reservations">
              <div className="admin-panel-heading">
                <div>
                  <h2>Recent Reservations</h2>
                  <p>Review guest bookings and reservation details.</p>
                </div>
                <span className="admin-booking-count">
                  {bookings?.total ?? 0} total
                </span>
              </div>

              <form className="admin-filter-form" onSubmit={handleSearch}>
                <input
                  aria-label="Search reservations"
                  type="search"
                  placeholder="Search guest, email, or room..."
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                />

                <select
                  aria-label="Filter by booking status"
                  value={status}
                  onChange={(event) => {
                    setStatus(event.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">All statuses</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="pending">Pending</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <button className="admin-primary-button" type="submit">
                  Search
                </button>
              </form>

              <div className="admin-table-wrapper">
                <table className="admin-bookings-table">
                  <thead>
                    <tr>
                      <th>Booking</th>
                      <th>Guest</th>
                      <th>Room</th>
                      <th>Check-in / Check-out</th>
                      <th>Guests</th>
                      <th>Total</th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {loading && !bookings ? (
                      <tr>
                        <td colSpan={7} className="admin-table-empty">
                          Loading reservations...
                        </td>
                      </tr>
                    ) : bookings?.data.length ? (
                      bookings.data.map((booking) => (
                        <tr key={booking.id}>
                          <td><strong>#{booking.id}</strong></td>
                          <td>
                            <strong>{booking.guest_name || 'Guest'}</strong>
                            <small>{booking.guest_email || '—'}</small>
                          </td>
                          <td>
                            <strong>{booking.room?.name || 'Room unavailable'}</strong>
                            <small>{booking.room?.room_type || '—'}</small>
                          </td>
                          <td>
                            <strong>{formatDate(booking.check_in)}</strong>
                            <small>to {formatDate(booking.check_out)}</small>
                          </td>
                          <td>{booking.guests}</td>
                          <td>{formatCurrency(booking.total_price)}</td>
                          <td>
                            <span
                              className={`admin-status-badge ${booking.status.toLowerCase()}`}
                            >
                              {booking.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="admin-table-empty">
                          No reservations found. Try changing your search or filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="admin-pagination">
                <span>
                  Page {bookings?.current_page ?? 1} of {bookings?.last_page ?? 1}
                </span>

                <div>
                  <button
                    type="button"
                    disabled={!bookings || page <= 1 || loading}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                  >
                    Previous
                  </button>

                  <button
                    type="button"
                    disabled={!bookings || page >= bookings.last_page || loading}
                    onClick={() =>
                      setPage((current) =>
                        Math.min(bookings?.last_page ?? current, current + 1),
                      )
                    }
                  >
                    Next
                  </button>
                </div>
              </div>
            </section>
          </>
        ) : activeSection === 'messages' ? (
          <>
            <header className="admin-topbar">
              <div>
                <p className="admin-eyebrow">CUSTOMER SUPPORT</p>
                <h1>Customer Messages</h1>
              </div>

              <button
                className="admin-refresh-button"
                onClick={() => void loadConversations()}
                disabled={messagesLoading}
              >
                ↻ Refresh messages
              </button>
            </header>

            {messagesError && (
              <div className="admin-alert admin-alert-error" role="alert">
                {messagesError}
              </div>
            )}

            <section
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(250px, 0.85fr) minmax(300px, 1.5fr)',
                gap: '20px',
                minHeight: '550px',
                marginTop: '24px',
              }}
            >
              <div
                style={{
                  background: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  overflow: 'hidden',
                }}
              >
                <div style={{ padding: '18px', borderBottom: '1px solid #e5e7eb' }}>
                  <h2 style={{ margin: 0, fontSize: '18px' }}>Inbox</h2>
                  <p style={{ margin: '6px 0 0', color: '#6b7280', fontSize: '13px' }}>
                    Customer conversations
                  </p>
                </div>

                {messagesLoading && conversations.length === 0 ? (
                  <p style={{ padding: '18px', color: '#6b7280' }}>
                    Loading conversations...
                  </p>
                ) : conversations.length === 0 ? (
                  <p style={{ padding: '18px', color: '#6b7280' }}>
                    No customer messages yet.
                  </p>
                ) : (
                  conversations.map((conversation) => {
                    const latestMessage = conversation.messages?.[0];
                    const isSelected =
                      selectedConversation?.id === conversation.id;

                    return (
                      <button
                        key={conversation.id}
                        type="button"
                        onClick={() => void openConversation(conversation)}
                        style={{
                          display: 'block',
                          width: '100%',
                          textAlign: 'left',
                          padding: '16px',
                          border: 'none',
                          borderBottom: '1px solid #f0f0f0',
                          background: isSelected ? '#f5f3ff' : '#fff',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                          <strong style={{ color: '#252238' }}>
                            {conversation.customer_name || 'Customer'}
                          </strong>
                          {conversation.unread_count > 0 && (
                            <span
                              style={{
                                background: '#7c3aed',
                                color: '#fff',
                                borderRadius: '20px',
                                padding: '2px 8px',
                                fontSize: '11px',
                              }}
                            >
                              {conversation.unread_count}
                            </span>
                          )}
                        </div>

                        <p
                          style={{
                            color: '#6b7280',
                            fontSize: '12px',
                            margin: '5px 0',
                          }}
                        >
                          {conversation.customer_email}
                        </p>

                        <p
                          style={{
                            color: '#6b7280',
                            fontSize: '13px',
                            margin: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {latestMessage?.message || 'No messages'}
                        </p>

                        <small style={{ color: '#9ca3af' }}>
                          {conversation.status || 'open'}
                        </small>
                      </button>
                    );
                  })
                )}
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  background: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  minWidth: 0,
                }}
              >
                {selectedConversation ? (
                  <>
                    <div
                      style={{
                        padding: '18px',
                        borderBottom: '1px solid #e5e7eb',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '12px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <div>
                        <h2 style={{ margin: 0, fontSize: '18px' }}>
                          {selectedConversation.customer_name || 'Customer'}
                        </h2>
                        <p style={{ margin: '5px 0 0', color: '#6b7280', fontSize: '13px' }}>
                          {selectedConversation.customer_email}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          void handleConversationStatus(
                            selectedConversation.status === 'closed' ? 'open' : 'closed',
                          )
                        }
                        style={{
                          border: '1px solid #ddd',
                          borderRadius: '8px',
                          padding: '8px 12px',
                          background: '#fff',
                          cursor: 'pointer',
                        }}
                      >
                        {selectedConversation.status === 'closed'
                          ? 'Reopen conversation'
                          : 'Close conversation'}
                      </button>
                    </div>

                    <div
                      style={{
                        flex: 1,
                        minHeight: '300px',
                        maxHeight: '480px',
                        overflowY: 'auto',
                        padding: '20px',
                        background: '#fafafa',
                      }}
                    >
                      {messagesLoading ? (
                        <p style={{ color: '#6b7280' }}>Loading messages...</p>
                      ) : conversationMessages.length === 0 ? (
                        <p style={{ color: '#6b7280' }}>No messages in this conversation.</p>
                      ) : (
                        conversationMessages.map((message) => {
                          const isAdmin = message.sender_type === 'admin';
                          const isAI = message.sender_type === 'ai';

                          return (
                            <div
                              key={message.id}
                              style={{
                                display: 'flex',
                                justifyContent: isAdmin ? 'flex-end' : 'flex-start',
                                marginBottom: '14px',
                              }}
                            >
                              <div
                                style={{
                                  maxWidth: '80%',
                                  padding: '12px 15px',
                                  borderRadius: '12px',
                                  background: isAdmin
                                    ? '#7c3aed'
                                    : isAI
                                      ? '#e0f2fe'
                                      : '#fff',
                                  color: isAdmin ? '#fff' : '#252238',
                                  border: isAdmin ? 'none' : '1px solid #e5e7eb',
                                }}
                              >
                                <strong style={{ display: 'block', fontSize: '11px', marginBottom: '5px' }}>
                                  {isAdmin ? 'You (Admin)' : isAI ? 'SmartStay' : 'Customer'}
                                </strong>
                                <p style={{ margin: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                                  {message.message}
                                </p>
                                <small
                                  style={{
                                    display: 'block',
                                    marginTop: '7px',
                                    opacity: 0.75,
                                    fontSize: '10px',
                                  }}
                                >
                                  {formatMessageTime(message.created_at)}
                                </small>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <form
                      onSubmit={handleReply}
                      style={{
                        display: 'flex',
                        gap: '10px',
                        padding: '16px',
                        borderTop: '1px solid #e5e7eb',
                      }}
                    >
                      <textarea
                        value={replyMessage}
                        onChange={(event) => setReplyMessage(event.target.value)}
                        placeholder="Write a reply to the customer..."
                        rows={2}
                        maxLength={5000}
                        required
                        style={{
                          flex: 1,
                          resize: 'vertical',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          padding: '11px',
                          font: 'inherit',
                        }}
                      />
                      <button
                        type="submit"
                        disabled={replyLoading || !replyMessage.trim()}
                        className="admin-primary-button"
                        style={{ alignSelf: 'flex-end' }}
                      >
                        {replyLoading ? 'Sending...' : 'Send Reply'}
                      </button>
                    </form>
                  </>
                ) : (
                  <div
                    style={{
                      display: 'grid',
                      placeItems: 'center',
                      flex: 1,
                      padding: '30px',
                      textAlign: 'center',
                      color: '#6b7280',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '38px', marginBottom: '12px' }}>✉</div>
                      <h2 style={{ color: '#252238' }}>Select a conversation</h2>
                      <p>Choose a customer from the inbox to read and reply to their messages.</p>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </>
        ) : (
          <>
            <header className="admin-topbar">
              <div>
                <p className="admin-eyebrow">PAYMENT MANAGEMENT</p>
                <h1>Payment Verification</h1>
              </div>

              <button
                className="admin-refresh-button"
                onClick={() => void loadPayments()}
                disabled={paymentsLoading}
              >
                ↻ Refresh payments
              </button>
            </header>

            <section className="admin-welcome">
              <div>
                <p className="admin-welcome-label">SMARTSTAY AI PAYMENTS</p>
                <h2>Manage guest payments</h2>
                <p>Review receipts, verify online payments, and record cash collections.</p>
              </div>
              <div className="admin-welcome-icon">₱</div>
            </section>

            {paymentsError && (
              <div className="admin-alert admin-alert-error" role="alert">
                {paymentsError}
              </div>
            )}

            <section className="admin-bookings-panel" style={{ marginTop: '24px' }}>
              <div className="admin-panel-heading">
                <div>
                  <h2>Payment Records</h2>
                  <p>Only bookings with a recorded payment method are displayed.</p>
                </div>
                <span className="admin-booking-count">
                  {payments?.total ?? 0} payments
                </span>
              </div>

              <form
                className="admin-filter-form"
                onSubmit={handlePaymentSearch}
              >
                <input
                  type="search"
                  aria-label="Search payments"
                  placeholder="Search guest, email, reference, or booking ID..."
                  value={paymentSearch}
                  onChange={(event) => {
                    setPaymentSearch(event.target.value);
                    setPaymentPage(1);
                  }}
                />

                <select
                  aria-label="Filter payment status"
                  value={paymentStatus}
                  onChange={(event) => {
                    setPaymentStatus(event.target.value);
                    setPaymentPage(1);
                  }}
                >
                  <option value="">All payment statuses</option>
                  <option value="pending">Pending verification</option>
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
                  <option value="rejected">Rejected</option>
                  <option value="unrecorded">Unrecorded</option>
                </select>

                <button className="admin-primary-button" type="submit">
                  Search
                </button>
              </form>

              <div className="admin-table-wrapper">
                <table className="admin-bookings-table">
                  <thead>
                    <tr>
                      <th>Booking</th>
                      <th>Guest</th>
                      <th>Payment Method</th>
                      <th>Reference</th>
                      <th>Amount</th>
                      <th>Payment Status</th>
                      <th>Receipt</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {paymentsLoading && !payments ? (
                      <tr>
                        <td colSpan={8} className="admin-table-empty">
                          Loading payment records...
                        </td>
                      </tr>
                    ) : payments?.data.length ? (
                      payments.data.map((booking) => (
                        <tr key={booking.id}>
                          <td>
                            <strong>#{booking.id}</strong>
                            <small>{formatDate(booking.check_in)}</small>
                          </td>

                          <td>
                            <strong>{booking.guest_name || 'Guest'}</strong>
                            <small>{booking.guest_email || '—'}</small>
                          </td>

                          <td>{paymentMethodLabel(booking.payment_method)}</td>

                          <td>
                            {booking.payment_reference || '—'}
                          </td>

                          <td>
                            <strong>{formatCurrency(booking.total_price)}</strong>
                          </td>

                          <td>
                            <span
                              className={`admin-status-badge ${booking.payment_status}`}
                            >
                              {booking.payment_status}
                            </span>
                            {booking.payment_rejection_reason && (
                              <small style={{ display: 'block', maxWidth: '180px' }}>
                                Reason: {booking.payment_rejection_reason}
                              </small>
                            )}
                          </td>

                          <td>
                            {booking.payment_proof_path ? (
                              <button
                                type="button"
                                disabled={receiptLoadingId === booking.id}
                                onClick={() => void viewReceipt(booking)}
                                style={{
                                  border: '1px solid #ddd',
                                  borderRadius: '7px',
                                  padding: '7px 10px',
                                  background: '#fff',
                                  cursor: 'pointer',
                                }}
                              >
                                {receiptLoadingId === booking.id
                                  ? 'Opening...'
                                  : 'View Receipt'}
                              </button>
                            ) : (
                              '—'
                            )}
                          </td>

                          <td>
                            {booking.payment_status === 'pending' &&
                            (booking.payment_method === 'gcash' ||
                              booking.payment_method === 'maya') ? (
                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                <button
                                  type="button"
                                  disabled={paymentActionId === booking.id}
                                  onClick={() => void approvePayment(booking)}
                                  style={{
                                    border: 'none',
                                    borderRadius: '7px',
                                    padding: '7px 10px',
                                    background: '#dcfce7',
                                    color: '#166534',
                                    cursor: 'pointer',
                                  }}
                                >
                                  {paymentActionId === booking.id ? 'Please wait...' : 'Approve'}
                                </button>

                                <button
                                  type="button"
                                  disabled={paymentActionId === booking.id}
                                  onClick={() => {
                                    setRejectingPayment(booking);
                                    setRejectionReason('');
                                  }}
                                  style={{
                                    border: 'none',
                                    borderRadius: '7px',
                                    padding: '7px 10px',
                                    background: '#fee2e2',
                                    color: '#991b1b',
                                    cursor: 'pointer',
                                  }}
                                >
                                  Reject
                                </button>
                              </div>
                            ) : booking.payment_method === 'cash_at_hotel' &&
                              booking.payment_status !== 'paid' ? (
                              <button
                                type="button"
                                disabled={paymentActionId === booking.id}
                                onClick={() => void collectCash(booking)}
                                style={{
                                  border: 'none',
                                  borderRadius: '7px',
                                  padding: '7px 10px',
                                  background: '#dcfce7',
                                  color: '#166534',
                                  cursor: 'pointer',
                                }}
                              >
                                {paymentActionId === booking.id
                                  ? 'Please wait...'
                                  : 'Mark Collected'}
                              </button>
                            ) : (
                              <span style={{ color: '#9ca3af' }}>No action</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="admin-table-empty">
                          No payment records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="admin-pagination">
                <span>
                  Page {payments?.current_page ?? 1} of {payments?.last_page ?? 1}
                </span>

                <div>
                  <button
                    type="button"
                    disabled={!payments || paymentPage <= 1 || paymentsLoading}
                    onClick={() =>
                      setPaymentPage((current) => Math.max(1, current - 1))
                    }
                  >
                    Previous
                  </button>

                  <button
                    type="button"
                    disabled={
                      !payments ||
                      paymentPage >= payments.last_page ||
                      paymentsLoading
                    }
                    onClick={() =>
                      setPaymentPage((current) =>
                        Math.min(payments?.last_page ?? current, current + 1),
                      )
                    }
                  >
                    Next
                  </button>
                </div>
              </div>
            </section>

            {rejectingPayment && (
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="reject-payment-title"
                style={{
                  position: 'fixed',
                  inset: 0,
                  zIndex: 1000,
                  background: 'rgba(15, 23, 42, 0.55)',
                  display: 'grid',
                  placeItems: 'center',
                  padding: '20px',
                }}
              >
                <form
                  onSubmit={rejectPayment}
                  style={{
                    width: '100%',
                    maxWidth: '440px',
                    background: '#fff',
                    borderRadius: '14px',
                    padding: '24px',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.18)',
                  }}
                >
                  <h2 id="reject-payment-title" style={{ marginTop: 0 }}>
                    Reject Payment
                  </h2>

                  <p style={{ color: '#6b7280', fontSize: '14px' }}>
                    Booking #{rejectingPayment.id} · {rejectingPayment.guest_name}
                  </p>

                  <label
                    htmlFor="payment-rejection-reason"
                    style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}
                  >
                    Reason for rejection
                  </label>

                  <textarea
                    id="payment-rejection-reason"
                    value={rejectionReason}
                    onChange={(event) => setRejectionReason(event.target.value)}
                    placeholder="Explain why this payment cannot be verified..."
                    rows={4}
                    maxLength={1000}
                    required
                    style={{
                      boxSizing: 'border-box',
                      width: '100%',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      padding: '12px',
                      font: 'inherit',
                      resize: 'vertical',
                    }}
                  />

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      gap: '10px',
                      marginTop: '18px',
                    }}
                  >
                    <button
                      type="button"
                      disabled={paymentActionId === rejectingPayment.id}
                      onClick={() => {
                        setRejectingPayment(null);
                        setRejectionReason('');
                      }}
                      style={{
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        background: '#fff',
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={
                        paymentActionId === rejectingPayment.id ||
                        !rejectionReason.trim()
                      }
                      style={{
                        border: 'none',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        background: '#dc2626',
                        color: '#fff',
                        cursor: 'pointer',
                      }}
                    >
                      {paymentActionId === rejectingPayment.id
                        ? 'Rejecting...'
                        : 'Confirm Rejection'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </>
        )}

        <footer className="admin-footer">
          SmartStay · Hotel Management Dashboard
        </footer>
      </main>
    </div>
  );
}