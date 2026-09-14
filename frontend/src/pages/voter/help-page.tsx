import { useState } from 'react';
import {
  Search,
  ChevronDown,
  ChevronUp,
  Mail,
  MessageSquare,
  Vote,
  UserCog,
  Info,
} from 'lucide-react';
import { Card, Input } from '@/components/ui';
import DashboardLayout from '@/layouts/dashboard-layout';

const faqItems = [
  {
    question: 'How do I vote?',
    answer:
      'Navigate to the Elections page, select an active election, and click "Start Voting". Follow the step-by-step process to select your candidates, review your choices, and submit your vote.',
  },
  {
    question: 'Can I change my vote after submitting?',
    answer:
      'No, once your vote is submitted, it cannot be changed or withdrawn. Please review your selections carefully before confirming.',
  },
  {
    question: 'How do I know my vote was counted?',
    answer:
      'After submitting your vote, you will receive a confirmation ID. You can use this ID to verify that your vote was recorded. Your vote history is also available in the Vote History section.',
  },
  {
    question: 'What is NOTA?',
    answer:
      'NOTA stands for "None of the Above". It is an option that allows voters to indicate that they do not support any of the candidates running for a particular position.',
  },
  {
    question: 'Is my vote anonymous?',
    answer:
      'Yes, your vote is completely anonymous. While the system records that you voted (for audit purposes), your actual selections are encrypted and cannot be traced back to you.',
  },
  {
    question: 'What happens if I experience technical issues while voting?',
    answer:
      'If you experience technical issues, try refreshing the page. Your selections are saved locally, so you won\'t lose progress. If the issue persists, contact support using the information below.',
  },
  {
    question: 'How do I enable two-factor authentication?',
    answer:
      'Go to your Profile page and toggle the Two-Factor Authentication switch. You will be guided through the setup process to secure your account.',
  },
];

const quickLinks = [
  {
    icon: Vote,
    title: 'How to Vote',
    description: 'Step-by-step guide to casting your vote',
  },
  {
    icon: UserCog,
    title: 'Account Issues',
    description: 'Help with login, password, and account settings',
  },
  {
    icon: Info,
    title: 'Election Info',
    description: 'Learn about election rules and procedures',
  },
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  const filteredFaq = faqItems.filter(
    (item) =>
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Help Center</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Find answers to common questions or contact support
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search help topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {quickLinks.map((link) => (
            <Card key={link.title} hover className="cursor-pointer text-center">
              <link.icon className="mx-auto mb-2 h-8 w-8 text-primary-600 dark:text-primary-400" />
              <h3 className="font-medium text-gray-900 dark:text-white">{link.title}</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {link.description}
              </p>
            </Card>
          ))}
        </div>

        <Card>
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Frequently Asked Questions
          </h2>
          <div className="space-y-2">
            {filteredFaq.map((item) => (
              <div
                key={item.question}
                className="rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <button
                  type="button"
                  onClick={() =>
                    setExpandedFaq(expandedFaq === item.question ? null : item.question)
                  }
                  className="flex w-full items-center justify-between p-4 text-left"
                >
                  <span className="font-medium text-gray-900 dark:text-white">
                    {item.question}
                  </span>
                  {expandedFaq === item.question ? (
                    <ChevronUp className="h-5 w-5 shrink-0 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 shrink-0 text-gray-400" />
                  )}
                </button>
                {expandedFaq === item.question && (
                  <div className="border-t border-gray-200 px-4 pb-4 pt-3 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {item.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
            {filteredFaq.length === 0 && (
              <p className="py-8 text-center text-gray-500">
                No matching questions found. Try a different search term.
              </p>
            )}
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Contact Support
          </h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                <Mail className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Email</p>
                <p className="text-sm text-gray-500">support@votesecure.com</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                <MessageSquare className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Live Chat</p>
                <p className="text-sm text-gray-500">Available Mon-Fri, 9AM-5PM EST</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
