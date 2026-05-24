import React, { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    LogOut, Bell, Calendar, CheckSquare,
    AlertCircle, Plus, Trash2, Star,
    TrendingUp, Clock, Sparkles, LayoutDashboard,
    ChevronRight, Filter, Search, Zap,
    Target, Award, Flame, ListTodo, Grid3x3, Menu,
    NotebookPen
} from 'lucide-react';
import api from './services/api';
import toast from 'react-hot-toast';
import { requestNotificationPermission, sendNotification, checkUpcomingReminders } from './utils/notification';
import ReminderModal from './popup/ReminderModal';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [reminders, setReminders] = useState([]);
    const [stats, setStats] = useState({ total: 0, urgent: 0, notUrgent: 0, upcoming: 0 });
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [notificationPermission, setNotificationPermission] = useState(false);
    const [lastNotified, setLastNotified] = useState({});
    const [filter, setFilter] = useState('all');
    const [viewMode, setViewMode] = useState('list');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const initNotification = async () => {
            const granted = await requestNotificationPermission();
            setNotificationPermission(granted);
        };
        initNotification();
    }, []);

    useEffect(() => {
        fetchReminders();
        const interval = setInterval(checkAndNotifyReminders, 30000);
        return () => clearInterval(interval);
    }, [reminders]);

    const fetchReminders = async () => {
        try {
            const response = await api.get('/reminders');
            setReminders(response.data.reminders);
            setStats(response.data.stats);
            checkAndNotifyReminders(response.data.reminders);
        } catch (error) {
            console.error('Error fetching reminders:', error);
            toast.error('Gagal memuat reminder');
        } finally {
            setLoading(false);
        }
    };

    const checkAndNotifyReminders = (reminderList = reminders) => {
        if (!notificationPermission) return;
        const upcoming = checkUpcomingReminders(reminderList);
        upcoming.forEach(reminder => {
            const notifiedKey = `${reminder.id}-${reminder.due_date}`;
            if (lastNotified[notifiedKey]) return;
            const daysText = reminder.daysLeft === 0 ? 'Hari ini!' : `Besok (${reminder.daysLeft} hari lagi)`;
            sendNotification(`Reminder: ${reminder.title}`, {
                body: `Tenggat: ${new Date(reminder.due_date).toLocaleDateString('id-ID')}\n${daysText}`,
                tag: reminder.id,
                requireInteraction: true
            });
            setLastNotified(prev => ({ ...prev, [notifiedKey]: true }));
            api.patch(`/reminders/${reminder.id}/notified`, { is_notified: true }).catch(console.error);
        });
    };

    const handleDeleteReminder = async (id) => {
        if (window.confirm('Yakin ingin menghapus reminder ini?')) {
            try {
                await api.delete(`/reminders/${id}`);
                toast.success('Reminder dihapus');
                fetchReminders();
            } catch (error) {
                toast.error('Gagal menghapus reminder');
            }
        }
    };

    const handleToggleUrgent = async (id, currentStatus) => {
        try {
            await api.patch(`/reminders/${id}/toggle-urgent`, { is_urgent: !currentStatus });
            fetchReminders();
        } catch (error) {
            toast.error('Gagal mengubah status');
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getDaysLeft = (dueDate) => {
        const today = new Date();
        const due = new Date(dueDate);
        const diffTime = due - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const filteredReminders = reminders.filter(r => {
        if (filter === 'urgent' && !r.is_urgent) return false;
        if (filter === 'upcoming') {
            const daysLeft = getDaysLeft(r.due_date);
            if (!(daysLeft <= 3 && daysLeft >= 0)) return false;
        }
        if (filter === 'pending' && r.is_notified) return false;
        if (filter === 'completed' && !r.is_notified) return false;

        if (searchTerm.trim() !== '') {
            const searchLower = searchTerm.toLowerCase();
            return (
                r.title.toLowerCase().includes(searchLower) ||
                (r.description && r.description.toLowerCase().includes(searchLower))
            );
        }

        return true;
    });

    const pendingNotifications = reminders.filter(r => {
        const daysLeft = getDaysLeft(r.due_date);
        return daysLeft <= 1 && daysLeft >= 0 && !r.is_notified;
    }).length;

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
                <div className="w-12 h-12 border-3 border-purple-200 border-t-purple-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-screen pb-32">
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                                <NotebookPen />
                            </div>
                            <div className="hidden sm:block">
                                <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Notepad</h1>
                                <p className="text-xs text-gray-500">Reminder Pro</p>
                            </div>
                            <span className="sm:hidden text-sm font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Notepad</span>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-4">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Cari reminder..."
                                    className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
                                />
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>

                            <div className="h-6 sm:h-8 w-px bg-gray-200 hidden sm:block"></div>

                            <div className="hidden sm:flex items-center gap-3">
                                <div className="text-right">
                                    <p className="text-sm font-semibold text-gray-800">{user?.username || user?.email?.split('@')[0]}</p>
                                    <p className="text-xs text-gray-500">{user?.email}</p>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="p-2 rounded-xl bg-red-50 hover:bg-red-100 transition-all duration-200 text-red-500 hover:text-red-600"
                                >
                                    <LogOut size={18} />
                                </button>
                            </div>

                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="sm:hidden p-2 rounded-xl bg-gray-50"
                            >
                                <Menu size={20} className="text-gray-600" />
                            </button>
                        </div>
                    </div>

                    {mobileMenuOpen && (
                        <div className="sm:hidden mt-3 pt-3 border-t border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-gray-800">{user?.username || user?.email?.split('@')[0]}</p>
                                    <p className="text-xs text-gray-500">{user?.email}</p>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="p-2 rounded-xl bg-red-50 text-red-500"
                                >
                                    <LogOut size={18} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-20 sm:pt-24 pb-12">
                <div className="mb-6 sm:mb-8">
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
                        <LayoutDashboard size={12} className="sm:w-4 sm:h-4" />
                        <span>Dashboard</span>
                        <ChevronRight size={10} className="sm:w-3 sm:h-3" />
                        <span className="text-gray-800 font-medium">Overview</span>
                    </div>
                    <h1 className="text-xl sm:text-3xl md:text-4xl font-bold text-gray-800 tracking-tight">
                        Welcome back, <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{user?.username || user?.email?.split('@')[0]}</span>
                    </h1>
                    <p className="text-sm sm:text-base text-gray-500 mt-1 sm:mt-2">Here's what's happening with your reminders today.</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-6 sm:mb-8">
                    <div className="rounded-xl sm:rounded-2xl bg-white p-4 sm:p-6 shadow-lg border border-gray-100">
                        <div className="flex items-center justify-between mb-2 sm:mb-4">
                            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                                <Calendar size={16} className="sm:w-6 sm:h-6 text-blue-600" />
                            </div>
                            <span className="text-xl sm:text-3xl font-bold text-gray-800">{stats.total}</span>
                        </div>
                        <h3 className="text-sm sm:text-base text-gray-700 font-semibold">Total</h3>
                        <p className="text-xs text-gray-400 mt-0.5 sm:mt-1">All tasks</p>
                    </div>

                    <div className="rounded-xl sm:rounded-2xl bg-white p-4 sm:p-6 shadow-lg border border-gray-100">
                        <div className="flex items-center justify-between mb-2 sm:mb-4">
                            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl bg-red-100 flex items-center justify-center">
                                <Flame size={16} className="sm:w-6 sm:h-6 text-red-600" />
                            </div>
                            <span className="text-xl sm:text-3xl font-bold text-gray-800">{stats.urgent}</span>
                        </div>
                        <h3 className="text-sm sm:text-base text-gray-700 font-semibold">Urgent</h3>
                        <p className="text-xs text-gray-400 mt-0.5 sm:mt-1">Need now</p>
                    </div>

                    <div className="rounded-xl sm:rounded-2xl bg-white p-4 sm:p-6 shadow-lg border border-gray-100">
                        <div className="flex items-center justify-between mb-2 sm:mb-4">
                            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl bg-green-100 flex items-center justify-center">
                                <CheckSquare size={16} className="sm:w-6 sm:h-6 text-green-600" />
                            </div>
                            <span className="text-xl sm:text-3xl font-bold text-gray-800">{stats.notUrgent}</span>
                        </div>
                        <h3 className="text-sm sm:text-base text-gray-700 font-semibold">Not Urgent</h3>
                        <p className="text-xs text-gray-400 mt-0.5 sm:mt-1">Scheduled</p>
                    </div>

                    <div className="rounded-xl sm:rounded-2xl bg-white p-4 sm:p-6 shadow-lg border border-gray-100">
                        <div className="flex items-center justify-between mb-2 sm:mb-4">
                            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                                <Target size={16} className="sm:w-6 sm:h-6 text-purple-600" />
                            </div>
                            <span className="text-xl sm:text-3xl font-bold text-gray-800">{stats.upcoming}</span>
                        </div>
                        <h3 className="text-sm sm:text-base text-gray-700 font-semibold">Upcoming</h3>
                        <p className="text-xs text-gray-400 mt-0.5 sm:mt-1">Deadlines</p>
                    </div>
                </div>

                <div className="rounded-xl sm:rounded-2xl bg-white shadow-xl border border-gray-100 mb-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 sm:p-6 border-b border-gray-100">
                        <div>
                            <h2 className="text-base sm:text-xl font-bold text-gray-800">Your Reminders</h2>
                            <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">Manage all your tasks</p>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-1.5 sm:p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-purple-600' : 'text-gray-500'}`}
                                >
                                    <ListTodo size={16} className="sm:w-[18px] sm:h-[18px]" />
                                </button>
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-1.5 sm:p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-purple-600' : 'text-gray-500'}`}
                                >
                                    <Grid3x3 size={16} className="sm:w-[18px] sm:h-[18px]" />
                                </button>
                            </div>
                            <div className="relative flex-1 sm:flex-initial">
                                <Filter size={14} className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <select
                                    value={filter}
                                    onChange={(e) => setFilter(e.target.value)}
                                    className="pl-8 sm:pl-10 pr-2 sm:pr-4 py-1.5 sm:py-2 bg-gray-100 border-0 rounded-xl text-gray-700 text-xs sm:text-sm focus:ring-2 focus:ring-purple-500 cursor-pointer w-full sm:w-auto"
                                >
                                    <option value="all">All</option>
                                    <option value="urgent">Urgent</option>
                                    <option value="upcoming">Upcoming</option>
                                    <option value="pending">Pending</option>
                                    <option value="completed">Done</option>
                                </select>
                            </div>
                            <button
                                onClick={() => setShowModal(true)}
                                className="flex items-center gap-1 sm:gap-2 px-3 sm:px-5 py-1.5 sm:py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium text-xs sm:text-sm shadow-md"
                            >
                                <Plus size={14} className="sm:w-[18px] sm:h-[18px]" />
                                <span className="hidden sm:inline">New</span>
                            </button>
                        </div>
                    </div>

                    <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 p-4 sm:p-6' : 'divide-y divide-gray-100'}>
                        {filteredReminders.length === 0 ? (
                            <div className="text-center py-12 sm:py-16">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                                    <Sparkles size={24} className="sm:w-8 sm:h-8 text-purple-500" />
                                </div>
                                <p className="text-gray-600 font-medium">No reminders yet</p>
                                <button
                                    onClick={() => setShowModal(true)}
                                    className="mt-3 sm:mt-4 px-4 sm:px-6 py-1.5 sm:py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl text-sm"
                                >
                                    Create Reminder
                                </button>
                            </div>
                        ) : (
                            filteredReminders.map((reminder) => {
                                const daysLeft = getDaysLeft(reminder.due_date);
                                const isNearDeadline = daysLeft <= 1 && daysLeft >= 0;

                                if (viewMode === 'grid') {
                                    return (
                                        <div key={reminder.id} className="p-3 sm:p-4 rounded-xl border border-gray-200 bg-white">
                                            <div className="flex items-start justify-between mb-2">
                                                <button onClick={() => handleToggleUrgent(reminder.id, reminder.is_urgent)}>
                                                    <Star size={14} className={reminder.is_urgent ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'} />
                                                </button>
                                                {isNearDeadline && !reminder.is_notified && (
                                                    <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-orange-100 text-orange-600">Soon</span>
                                                )}
                                            </div>
                                            <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-1 line-clamp-1">{reminder.title}</h3>
                                            {reminder.description && (
                                                <p className="text-gray-500 text-xs mb-2 line-clamp-2">{reminder.description}</p>
                                            )}
                                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                                    <Calendar size={10} />
                                                    {new Date(reminder.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                                </span>
                                                <button onClick={() => handleDeleteReminder(reminder.id)} className="p-2 text-gray-400 hover:text-red-500 transition-all duration-200 rounded-lg hover:bg-red-50 shrink-0">
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                }

                                return (
                                    <div key={reminder.id} className="p-3 sm:p-4 hover:bg-gray-50 transition">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                                    <button onClick={() => handleToggleUrgent(reminder.id, reminder.is_urgent)}>
                                                        <Star size={14} className={reminder.is_urgent ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'} />
                                                    </button>
                                                    <h3 className="text-sm sm:text-base font-semibold text-gray-800 truncate">{reminder.title}</h3>
                                                    {isNearDeadline && !reminder.is_notified && (
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600">Due Soon</span>
                                                    )}
                                                    {reminder.is_urgent && (
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-600">Urgent</span>
                                                    )}
                                                </div>
                                                {reminder.description && (
                                                    <p className="text-gray-500 text-xs mb-1 line-clamp-1">{reminder.description}</p>
                                                )}
                                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar size={10} />
                                                        {new Date(reminder.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock size={10} />
                                                        {daysLeft < 0 ? 'Overdue' : `${daysLeft}d left`}
                                                    </span>
                                                </div>
                                            </div>
                                            <button onClick={() => handleDeleteReminder(reminder.id)} className="p-1.5 text-gray-400 hover:text-red-500">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            <ReminderModal isOpen={showModal} onClose={() => setShowModal(false)} onSuccess={fetchReminders} />
        </div>
    );
};

export default Dashboard;