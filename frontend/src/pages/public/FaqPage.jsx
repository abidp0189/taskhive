import React, { useState } from 'react';
import { ChevronDown, HelpCircle, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

const FAQS = [
  {
    q: 'How do workers receive their payments?',
    a: 'Once an employer approves your submitted proof, the task reward is credited immediately to your available wallet balance. You can withdraw your earnings via manual payout channels (such as bKash, Nagad, Crypto, Bank Transfer, PayPal) once your balance reaches the minimum threshold (default $1.00).'
  },
  {
    q: 'How does escrow protection work for employers?',
    a: 'When you create a job campaign, the required task budget plus a small platform fee is reserved in locked escrow from your deposit balance. Funds are only spent when you approve a submission. If you cancel a job, any unused budget is instantly returned to your deposit wallet.'
  },
  {
    q: 'Can a worker complete the same job multiple times?',
    a: 'By default, workers are strictly limited to one completion per job campaign to prevent spam and duplicate rewards. This is enforced atomically at the database level.'
  },
  {
    q: 'What happens if a worker submission is rejected?',
    a: 'When an employer rejects a submission, they must provide an explanatory reason. The reserved slot is automatically released back to the job so other workers can attempt it. Employers may also request a resubmission if a minor correction is needed.'
  },
  {
    q: 'How does the 5% referral program work?',
    a: 'Every user is assigned a unique referral link and code. When visitors register through your referral link, you earn a 5% commission on all their future completed task earnings, automatically credited to your wallet.'
  },
  {
    q: 'How long do workers have to complete a reserved task?',
    a: 'By default, workers have 48 hours to execute instructions and submit required evidence. If the timer expires without submission, the reservation expires and the slot is freed up.'
  }
];

export const FaqPage = () => {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="py-16 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-950/80 border border-indigo-800 text-indigo-400 mb-4 shadow">
          <HelpCircle className="h-6 w-6" />
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Frequently Asked Questions
        </h1>
        <p className="mt-4 text-sm text-gray-400">
          Everything you need to know about our marketplace policies, escrow guarantees, and payouts.
        </p>
      </div>

      <div className="space-y-4">
        {FAQS.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={index}
              className="glass-card rounded-2xl border border-gray-800/80 overflow-hidden transition-colors"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? -1 : index)}
                className="w-full flex items-center justify-between p-5 text-left font-semibold text-sm sm:text-base text-white hover:text-indigo-400 transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 text-indigo-400' : ''
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-5 pb-5 text-xs sm:text-sm text-gray-400 leading-relaxed border-t border-gray-800/60 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Still Have Questions */}
      <div className="mt-16 text-center glass-panel rounded-3xl p-8 border-gray-800">
        <h3 className="text-base font-bold text-white mb-2">Still have questions?</h3>
        <p className="text-xs text-gray-400 mb-6">Our 24/7 support desk is available to assist both workers and employers.</p>
        <Link
          to="/support"
          className="inline-flex items-center gap-2 rounded-xl bg-gray-900 border border-gray-800 px-6 py-2.5 text-xs font-semibold text-gray-200 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <Mail className="h-4 w-4 text-indigo-400" /> Open a Support Ticket
        </Link>
      </div>
    </div>
  );
};
