import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Clock, CheckCircle2, AlertCircle, ArrowRight, Eye, Briefcase, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export const MyTasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const url = statusFilter ? `/tasks?status=${statusFilter}` : '/tasks';
      const res = await api.get(url);
      if (res.data?.success) {
        setTasks(res.data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [statusFilter]);

  const tabs = [
    { label: 'All Tasks', value: '' },
    { label: 'In Progress', value: 'IN_PROGRESS' },
    { label: 'Pending Review', value: 'SUBMITTED' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'Resubmit Required', value: 'RESUBMIT_REQUIRED' },
    { label: 'Rejected', value: 'REJECTED' },
  ];

  return (
    <div className="py-8 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          My Task History
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">
          Review your task submissions, approval statuses, and employer feedback.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-4 py-2 rounded-xl font-semibold whitespace-nowrap transition-colors ${
              statusFilter === tab.value
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-gray-900 border border-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tasks Table / Cards */}
      <div className="glass-panel rounded-3xl overflow-hidden border border-gray-800">
        {loading ? (
          <div className="py-20 text-center text-xs text-gray-500">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent mx-auto mb-3" />
            Loading task records...
          </div>
        ) : tasks.length === 0 ? (
          <div className="py-16 text-center">
            <Briefcase className="h-10 w-10 text-gray-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">No tasks found</h3>
            <p className="text-xs text-gray-400 mt-1">You don't have any tasks matching this status filter.</p>
            <Link to="/jobs" className="text-xs text-indigo-400 font-semibold hover:text-indigo-300 mt-3 inline-block">
              Browse available jobs →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-950/80 border-b border-gray-800 text-gray-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-4 px-6">Job Title</th>
                  <th className="py-4 px-6">Reward</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Started / Submitted</th>
                  <th className="py-4 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-850/50 transition-colors">
                    <td className="py-4 px-6 font-medium text-white max-w-xs truncate">
                      {task.job?.title}
                      <span className="block text-[11px] text-gray-400 font-normal">
                        {task.job?.category?.name || 'General'}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-bold text-emerald-400">
                      ${parseFloat(task.rewardAmount).toFixed(2)}
                    </td>
                    <td className="py-4 px-6">
                      <Badge>{task.status}</Badge>
                      {task.rejectionReason && (
                        <p className="text-[10px] text-rose-400 mt-1 truncate max-w-xs">
                          Reason: {task.rejectionReason}
                        </p>
                      )}
                    </td>
                    <td className="py-4 px-6 text-gray-400">
                      {new Date(task.startedAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => setSelectedTask(task)}
                        className="px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 text-gray-300 hover:text-white hover:bg-gray-800 font-semibold transition-colors"
                      >
                        View Proof
                      </button>

                      {['IN_PROGRESS', 'RESUBMIT_REQUIRED'].includes(task.status) && (
                        <Link
                          to={`/jobs/${task.job?.id}`}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow transition-colors"
                        >
                          Submit Proof
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Task Proof Modal */}
      <Modal
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        title={`Task Proof — ${selectedTask?.job?.title || 'Details'}`}
      >
        {selectedTask && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-950 border border-gray-800">
              <div>
                <span className="text-gray-400 block text-[11px]">Status</span>
                <Badge>{selectedTask.status}</Badge>
              </div>
              <div>
                <span className="text-gray-400 block text-[11px]">Reward</span>
                <span className="font-bold text-emerald-400 text-sm">
                  ${parseFloat(selectedTask.rewardAmount).toFixed(2)}
                </span>
              </div>
            </div>

            {selectedTask.rejectionReason && (
              <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-900/50 text-rose-300">
                <p className="font-bold text-[11px]">Rejection / Feedback Note:</p>
                <p className="mt-0.5">{selectedTask.rejectionReason}</p>
              </div>
            )}

            <div>
              <h4 className="font-bold text-gray-300 mb-2">Submitted Proofs:</h4>
              {selectedTask.proofs?.length === 0 ? (
                <p className="text-gray-500 py-4 text-center">No proofs uploaded yet.</p>
              ) : (
                <div className="space-y-3">
                  {selectedTask.proofs?.map((p) => (
                    <div key={p.id} className="p-3 rounded-xl bg-gray-950 border border-gray-800 space-y-1">
                      <span className="text-[10px] font-bold text-indigo-400 uppercase">{p.type}</span>
                      {p.content && <p className="text-gray-200">{p.content}</p>}
                      {p.fileUrl && (
                        <div className="mt-2">
                          <img
                            src={p.fileUrl}
                            alt="Submitted screenshot"
                            className="max-h-48 rounded-lg object-contain border border-gray-800 bg-black/40"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
