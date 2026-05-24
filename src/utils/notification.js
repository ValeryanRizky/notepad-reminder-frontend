// Request izin notifikasi
export const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
        console.log('Browser tidak mendukung notifikasi');
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    return false;
};

// Kirim notifikasi
export const sendNotification = (title, options = {}) => {
    if (!('Notification' in window)) {
        console.log('Browser tidak mendukung notifikasi');
        return;
    }

    if (Notification.permission === 'granted') {
        const defaultOptions = {
            body: options.body || 'Jangan lupa!',
            icon: options.icon || '/notepad-icon.png',
            badge: options.badge || '/notepad-icon.png',
            tag: options.tag || 'reminder',
            requireInteraction: options.requireInteraction || true, // Notifikasi tetap sampai diklik
            silent: options.silent || false,
            vibrate: options.vibrate || [200, 100, 200]
        };

        const notification = new Notification(title, { ...defaultOptions, ...options });

        // Klik notifikasi untuk membuka aplikasi
        notification.onclick = () => {
            window.focus();
            notification.close();
        };

        // Notifikasi otomatis tutup setelah 15 detik
        setTimeout(() => notification.close(), 15000);

        return notification;
    }
};

// Cek reminder yang mendekati tenggat
export const checkUpcomingReminders = (reminders) => {
    const now = new Date();
    const upcomingReminders = [];

    reminders.forEach(reminder => {
        const dueDate = new Date(reminder.due_date);
        const daysLeft = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));

        // Notifikasi untuk reminder dengan sisa 1 hari atau kurang (belum ter-notify)
        if (daysLeft <= 1 && daysLeft >= 0 && !reminder.is_notified) {
            upcomingReminders.push({
                ...reminder,
                daysLeft
            });
        }
    });

    return upcomingReminders;
};