import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, User, AlertTriangle, CheckCircle, Edit3, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { assignmentService, activityService } from '../../lib/collaboration';
import { storyService } from '../../lib/services';

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const STATUS_COLORS = {
    draft: 'bg-gray-200 text-gray-700',
    pending_review: 'bg-blue-100 text-blue-700',
    approved: 'bg-green-100 text-green-700',
    published: 'bg-green-500 text-white',
    scheduled: 'bg-yellow-100 text-yellow-700'
};

export default function EditorialCalendar({ onSelectStory }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [stories, setStories] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(null);

    useEffect(() => {
        loadData();
    }, [currentDate]);

    const loadData = async () => {
        setLoading(true);
        try {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const startOfMonth = new Date(year, month, 1);
            const endOfMonth = new Date(year, month + 1, 0);

            const [allStories, allAssignments] = await Promise.all([
                storyService.getAllStories(),
                assignmentService.getAssignments()
            ]);

            setStories(allStories);
            setAssignments(allAssignments);
        } catch (e) {
            console.error('Error loading calendar data:', e);
        } finally {
            setLoading(false);
        }
    };

    const navigateMonth = (direction) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() + direction);
            return newDate;
        });
    };

    const getDaysInMonth = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const days = [];

        for (let i = 0; i < firstDay.getDay(); i++) {
            days.push(null);
        }

        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push(new Date(year, month, i));
        }

        return days;
    };

    const getItemsForDate = (date) => {
        if (!date) return [];
        
        const dateStr = date.toISOString().split('T')[0];
        const items = [];

        stories.forEach(story => {
            const publishedDate = story.publishedAt?.split('T')[0];
            const scheduledDate = story.scheduledAt?.split('T')[0];
            
            if (publishedDate === dateStr) {
                items.push({ ...story, itemType: 'published' });
            } else if (scheduledDate === dateStr) {
                items.push({ ...story, itemType: 'scheduled' });
            }
        });

        assignments.forEach(assignment => {
            const deadlineDate = assignment.deadline?.split('T')[0];
            if (deadlineDate === dateStr) {
                items.push({ ...assignment, itemType: 'deadline' });
            }
        });

        return items;
    };

    const getToday = () => {
        const today = new Date();
        return new Date(today.getFullYear(), today.getMonth(), today.getDate());
    };

    const isToday = (date) => {
        if (!date) return false;
        const today = getToday();
        return date.getTime() === today.getTime();
    };

    const isOverdue = (assignment) => {
        if (!assignment.deadline || assignment.status === 'completed') return false;
        return new Date(assignment.deadline) < getToday();
    };

    const days = getDaysInMonth();
    const today = getToday();

    return (
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-black rounded-lg">
                            <CalendarIcon className="w-5 h-5 text-[#FAFF00]" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter">
                                {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                            </h2>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                Editorial Calendar
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => navigateMonth(-1)}
                            className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-all"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setCurrentDate(new Date())}
                            className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                        >
                            Today
                        </button>
                        <button
                            onClick={() => navigateMonth(1)}
                            className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-all"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-7 border-b border-gray-100">
                {DAYS.map(day => (
                    <div key={day} className="p-3 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7">
                {days.map((date, index) => {
                    const items = date ? getItemsForDate(date) : [];
                    const isSelected = selectedDate && date && date.getTime() === selectedDate.getTime();

                    return (
                        <div
                            key={index}
                            onClick={() => date && setSelectedDate(date)}
                            className={`min-h-[100px] p-2 border-b border-r border-gray-100 transition-colors cursor-pointer ${
                                !date ? 'bg-gray-50' :
                                isToday(date) ? 'bg-[#FAFF00]/5' :
                                isSelected ? 'bg-black/5' :
                                'hover:bg-gray-50'
                            }`}
                        >
                            {date && (
                                <>
                                    <div className={`text-xs font-bold mb-2 ${isToday(date) ? 'text-[#FAFF00] bg-black rounded-full w-6 h-6 flex items-center justify-center' : 'text-gray-700'}`}>
                                        {date.getDate()}
                                    </div>
                                    
                                    <div className="space-y-1">
                                        {items.slice(0, 3).map((item, i) => (
                                            <div
                                                key={i}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onSelectStory?.(item);
                                                }}
                                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-80 ${
                                                    item.itemType === 'published' ? 'bg-green-500 text-white' :
                                                    item.itemType === 'scheduled' ? 'bg-yellow-100 text-yellow-700' :
                                                    item.itemType === 'deadline' ? (isOverdue(item) ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700') :
                                                    'bg-gray-200 text-gray-700'
                                                }`}
                                            >
                                                {item.headline || item.storyTitle}
                                            </div>
                                        ))}
                                        {items.length > 3 && (
                                            <div className="text-[9px] text-gray-400 font-bold">
                                                +{items.length - 3} more
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>

            <AnimatePresence>
                {selectedDate && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-gray-100 bg-gray-50 overflow-hidden"
                    >
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-black uppercase tracking-tighter">
                                    {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                                </h3>
                                <button
                                    onClick={() => setSelectedDate(null)}
                                    className="text-[10px] font-bold text-gray-400 hover:text-black transition-colors"
                                >
                                    Close
                                </button>
                            </div>

                            <div className="space-y-2">
                                {getItemsForDate(selectedDate).map((item, i) => (
                                    <div
                                        key={i}
                                        onClick={() => onSelectStory?.(item)}
                                        className="flex items-center gap-3 p-3 bg-white rounded-xl cursor-pointer hover:shadow-md transition-all"
                                    >
                                        <div className={`w-2 h-2 rounded-full ${
                                            item.itemType === 'published' ? 'bg-green-500' :
                                            item.itemType === 'scheduled' ? 'bg-yellow-500' :
                                            isOverdue(item) ? 'bg-red-500' : 'bg-blue-500'
                                        }`} />
                                        
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold truncate">{item.headline || item.storyTitle}</p>
                                            <p className="text-[10px] text-gray-400">
                                                {item.author || item.assignedToName || 'Unassigned'}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                                                STATUS_COLORS[item.workflow_status || item.status] || 'bg-gray-100 text-gray-600'
                                            }`}>
                                                {item.itemType || item.workflow_status || item.status}
                                            </span>
                                            <Edit3 className="w-4 h-4 text-gray-400" />
                                        </div>
                                    </div>
                                ))}

                                {getItemsForDate(selectedDate).length === 0 && (
                                    <div className="text-center py-6 text-gray-400">
                                        <p className="text-xs font-bold uppercase tracking-widest">No items scheduled</p>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => window.location.href = '/admin/edit/new-story'}
                                className="w-full mt-4 py-3 bg-black text-[#FAFF00] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-900 transition-all flex items-center justify-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Create New Dispatch
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export function DeadlineAlerts({ assignments }) {
    const overdue = assignments.filter(isOverdue);
    const upcoming = assignments.filter(a => {
        if (isOverdue(a) || a.status === 'completed') return false;
        const deadline = new Date(a.deadline);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return deadline <= tomorrow;
    });

    if (overdue.length === 0 && upcoming.length === 0) return null;

    return (
        <div className="space-y-3">
            {overdue.map(assignment => (
                <div key={assignment.$id} className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-xs font-bold text-red-700">Overdue: {assignment.storyTitle}</p>
                        <p className="text-[10px] text-red-500">Assigned to {assignment.assignedToName}</p>
                    </div>
                </div>
            ))}
            
            {upcoming.map(assignment => (
                <div key={assignment.$id} className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3">
                    <Clock className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-xs font-bold text-yellow-700">Due Soon: {assignment.storyTitle}</p>
                        <p className="text-[10px] text-yellow-600">Assigned to {assignment.assignedToName}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}