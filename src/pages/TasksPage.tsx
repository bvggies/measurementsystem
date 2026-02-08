import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from '../utils/api';
import { format } from 'date-fns';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

interface Task {
  id: string;
  assignee_id: string;
  assignee_name: string;
  task_type: string;
  resource_type: string;
  resource_id: string | null;
  due_at: string | null;
  status: string;
  measurement_entry_id: string | null;
  customer_name: string | null;
  created_at: string;
}

const TasksPage: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const isDark = theme === 'dark';
  const cardBg = isDark ? 'bg-dark-surface border-dark-border' : 'bg-white border-gray-200';

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/tasks');
      setTasks(res.data?.tasks || []);
    } catch (err: any) {
      if (err.response?.status !== 501) toast(err.response?.data?.error || 'Failed to load tasks', 'error');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await axios.patch(`/api/tasks/${id}`, { status });
      toast(status === 'completed' ? 'Task completed' : 'Task updated', 'success');
      fetchTasks();
    } catch (err: any) {
      toast(err.response?.data?.error || 'Update failed', 'error');
    }
  };

  return (
    <div className="space-y-6 pb-32">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className={`text-3xl font-bold ${isDark ? 'text-dark-text' : 'text-gray-900'}`}>Tasks</h1>
        <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Re-measure, verify, and follow-up assignments
        </p>
      </motion.div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-gold border-t-transparent" />
        </div>
      ) : tasks.length === 0 ? (
        <div className={`${cardBg} rounded-xl border p-8 text-center`}>
          <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>No tasks assigned.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`${cardBg} rounded-xl border p-6`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className={`font-medium ${isDark ? 'text-dark-text' : 'text-gray-900'}`}>
                    {task.task_type.replace('_', ' ')} · {task.resource_type}
                  </p>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {task.measurement_entry_id && (
                      <>
                        <Link to={`/measurements/view/${task.resource_id}`} className="text-primary-gold hover:underline">
                          {task.measurement_entry_id}
                        </Link>
                        {task.customer_name && ` · ${task.customer_name}`}
                      </>
                    )}
                    {task.due_at && ` · Due ${format(new Date(task.due_at), 'MMM dd, yyyy')}`}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <span className={`px-2 py-1 rounded text-xs ${isDark ? 'bg-dark-border' : 'bg-gray-100'}`}>
                    {task.status}
                  </span>
                  {task.resource_id && task.resource_type === 'measurement' && (
                    <Link
                      to={`/measurements/view/${task.resource_id}`}
                      className="px-3 py-1.5 border border-primary-gold text-primary-gold rounded-lg hover:bg-primary-gold/10 text-sm"
                    >
                      View
                    </Link>
                  )}
                  {(user?.role === 'admin' || user?.role === 'manager' || task.assignee_id === user?.id) &&
                    task.status !== 'completed' &&
                    task.status !== 'cancelled' && (
                      <button
                        type="button"
                        onClick={() => updateStatus(task.id, 'completed')}
                        className="px-3 py-1.5 bg-emerald text-white rounded-lg hover:bg-emerald/90 text-sm"
                      >
                        Complete
                      </button>
                    )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TasksPage;
