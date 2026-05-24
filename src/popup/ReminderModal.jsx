import React, { useState } from 'react';
import { X, Star, Calendar, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const ReminderModal = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        due_date: '',
        is_urgent: false
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/reminders', formData);
            toast.success('Reminder created successfully!');
            onSuccess();
            handleClose();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to create reminder');
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        setFormData({ title: '', description: '', due_date: '', is_urgent: false });
        onClose();
    };

    const getMinDate = () => {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl mx-4">
                <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-4 text-white">
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 text-white/70 hover:text-white transition p-1 rounded-lg hover:bg-white/10"
                    >
                        <X size={20} />
                    </button>
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-2">
                        <span className="text-xl">📝</span>
                    </div>
                    <h2 className="text-lg font-bold">Create New Reminder</h2>
                    <p className="text-white/80 text-xs mt-0.5">Add a task or deadline</p>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Title
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-4 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-all text-sm"
                            placeholder="e.g., Complete project report"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Description
                            <span className="text-gray-400 text-xs font-normal ml-2">(optional)</span>
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows="2"
                            className="w-full px-4 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-sm"
                            placeholder="Add more details..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Due Date
                        </label>
                        <div className="relative">
                            <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="date"
                                value={formData.due_date}
                                min={getMinDate()}
                                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-sm"
                                required
                            />
                        </div>
                        <div className="flex items-center gap-1.5 mt-1.5">
                            <Clock size={11} className="text-gray-400" />
                            <p className="text-xs text-gray-500">
                                Reminder <span className="font-medium text-blue-600">1 day before</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100">
                        <input
                            type="checkbox"
                            id="is_urgent"
                            checked={formData.is_urgent}
                            onChange={(e) => setFormData({ ...formData, is_urgent: e.target.checked })}
                            className="w-4 h-4 rounded border-gray-300 text-red-500 focus:ring-red-500"
                        />
                        <label htmlFor="is_urgent" className="flex-1 cursor-pointer">
                            <div className="flex items-center gap-2">
                                <AlertCircle size={14} className={formData.is_urgent ? 'text-red-500' : 'text-gray-400'} />
                                <span className="font-medium text-gray-700 text-sm">Mark as Urgent</span>
                            </div>
                        </label>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                        >
                            {submitting ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <CheckCircle size={14} />
                                    Create
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReminderModal;