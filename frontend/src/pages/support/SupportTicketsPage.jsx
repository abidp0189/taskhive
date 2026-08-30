import React, { useState, useEffect } from 'react';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LifeBuoy, PlusCircle, MessageSquare, Send, User } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export const SupportTicketsPage = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  // New ticket modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('Payment / Withdrawal');
  const [message, setMessage] = useState('');
  const [creating, setCreating] = useState(false);

  // View ticket modal state
  const [activeTicket, setActiveTicket] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await api.get('/support');
      if (res.data?.success) setTickets(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.error('Subject and message are required');
      return;
    }

    setCreating(true);
    try {
      const res = await api.post('/support', { subject, category, message });
      if (res.data?.success) {
        toast.success('Support ticket opened!');
        setCreateModalOpen(false);
        setSubject('');
        setMessage('');
        fetchTickets();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create ticket');
    } finally {
      setCreating(false);
    }
  };

  const openTicketView = async (ticketId) => {
    try {
      const res = await api.get(`/support/${ticketId}`);
      if (res.data?.success) {
        setActiveTicket(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load ticket details');
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim() || !activeTicket) return;

    setSendingReply(true);
    try {
      const res = await api.post(`/support/${activeTicket.id}/reply`, { message: replyMessage.trim() });
      if (res.data?.success) {
        toast.success('Reply sent');
        setReplyMessage('');
        openTicketView(activeTicket.id);
      }
    } catch (err) {
      toast.error('Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  return (
    <div className="py-8 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            24/7 Support Desk
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Need assistance with tasks, withdrawals, or escrow? Open a support ticket below.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 text-xs font-bold text-white shadow transition-all hover:scale-105"
        >
          <PlusCircle className="h-4 w-4" /> Open New Ticket
        </button>
      </div>

      {/* Tickets List */}
      <div className="glass-panel rounded-3xl p-6 overflow-hidden border border-gray-800 space-y-4">
        {loading ? (
          <div className="py-16 text-center text-xs text-gray-500">Loading support tickets...</div>
        ) : tickets.length === 0 ? (
          <div className="py-16 text-center text-xs text-gray-400">
            You don't have any support tickets open.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-950/80 border-b border-gray-800 text-gray-400 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-850/50 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white max-w-xs truncate">{t.subject}</td>
                    <td className="py-3.5 px-4 text-gray-300">{t.category}</td>
                    <td className="py-3.5 px-4">
                      <Badge>{t.status}</Badge>
                    </td>
                    <td className="py-3.5 px-4 text-gray-500">{new Date(t.createdAt).toLocaleDateString()}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => openTicketView(t.id)}
                        className="px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 hover:bg-gray-800 text-indigo-400 font-semibold"
                      >
                        View Thread ({t._count?.messages || 1})
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Ticket Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Open Support Ticket"
      >
        <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Issue with task approval"
              className="w-full rounded-xl bg-gray-950 border border-gray-800 p-2.5 text-white focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl bg-gray-950 border border-gray-800 p-2.5 text-white focus:outline-none"
            >
              <option value="Payment / Withdrawal">Payment / Withdrawal</option>
              <option value="Task Dispute / Proof Issue">Task Dispute / Proof Issue</option>
              <option value="Account / Security">Account / Security</option>
              <option value="Employer Campaign Question">Employer Campaign Question</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">Message / Details</label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your issue with all relevant details..."
              className="w-full rounded-xl bg-gray-950 border border-gray-800 p-2.5 text-white focus:outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={creating}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-white shadow disabled:opacity-50 transition-colors"
          >
            {creating ? 'Submitting Ticket...' : 'Submit Support Ticket'}
          </button>
        </form>
      </Modal>

      {/* Ticket View & Chat Modal */}
      <Modal
        isOpen={!!activeTicket}
        onClose={() => setActiveTicket(null)}
        title={`Ticket: ${activeTicket?.subject || ''}`}
        maxWidth="max-w-2xl"
      >
        {activeTicket && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-950 border border-gray-800">
              <span>Category: <strong className="text-white">{activeTicket.category}</strong></span>
              <Badge>{activeTicket.status}</Badge>
            </div>

            {/* Message Thread */}
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {activeTicket.messages?.map((msg) => (
                <div
                  key={msg.id}
                  className="p-3.5 rounded-2xl bg-gray-950 border border-gray-800 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[11px] text-gray-400">
                    <span className="font-semibold text-indigo-400 flex items-center gap-1">
                      <User className="h-3 w-3" /> Message
                    </span>
                    <span>{new Date(msg.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                </div>
              ))}
            </div>

            {/* Reply Input */}
            <form onSubmit={handleSendReply} className="pt-2 flex gap-2">
              <input
                type="text"
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Type your response..."
                className="flex-1 rounded-xl bg-gray-950 border border-gray-800 px-4 py-2.5 text-xs text-white focus:outline-none"
              />
              <button
                type="submit"
                disabled={sendingReply || !replyMessage.trim()}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold disabled:opacity-50 flex items-center gap-1"
              >
                <Send className="h-3.5 w-3.5" /> Send
              </button>
            </form>
          </div>
        )}
      </Modal>
    </div>
  );
};
