import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Vote,
  BarChart3,
  Clock,
  FileText,
  Smartphone,
  Lock,
  Users,
  Eye,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  CheckCircle,
  UserCheck,
  ListChecks,
  MousePointerClick,
  ClipboardCheck,
  Send,
  PartyPopper,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, Card } from '@/components/ui';

const features = [
  {
    icon: Shield,
    title: 'Secure Authentication',
    description:
      'Multi-factor authentication and encrypted sessions keep your account safe from unauthorized access.',
  },
  {
    icon: Vote,
    title: 'One Person One Vote',
    description:
      'Strict identity verification ensures every eligible voter can cast exactly one vote per election.',
  },
  {
    icon: BarChart3,
    title: 'Transparent Results',
    description:
      'Real-time result dashboards with cryptographic verification let everyone trust the outcome.',
  },
  {
    icon: Clock,
    title: 'Real-Time Status',
    description:
      'Track election status instantly — see live turnout, active elections, and submission confirmations.',
  },
  {
    icon: FileText,
    title: 'Audit Logging',
    description:
      'Comprehensive audit trails record every action for full accountability and compliance.',
  },
  {
    icon: Smartphone,
    title: 'Mobile Friendly',
    description:
      'Vote from any device — the fully responsive design works seamlessly on phones, tablets, and desktops.',
  },
];

const steps = [
  {
    number: 1,
    title: 'Register',
    description: 'Create your account with your institutional email address.',
    icon: UserCheck,
  },
  {
    number: 2,
    title: 'Verify Identity',
    description: 'Confirm your identity through our secure verification process.',
    icon: Shield,
  },
  {
    number: 3,
    title: 'View Elections',
    description: 'Browse active elections and see candidate details and positions.',
    icon: ListChecks,
  },
  {
    number: 4,
    title: 'Select Candidate',
    description: 'Choose your preferred candidate for each position on the ballot.',
    icon: MousePointerClick,
  },
  {
    number: 5,
    title: 'Review Vote',
    description: 'Double-check your selections before final submission.',
    icon: ClipboardCheck,
  },
  {
    number: 6,
    title: 'Submit Vote',
    description: 'Cast your ballot securely with encrypted transmission.',
    icon: Send,
  },
  {
    number: 7,
    title: 'Receive Confirmation',
    description: 'Get a unique confirmation code as proof of your submitted vote.',
    icon: PartyPopper,
  },
];

const trustItems = [
  {
    icon: Shield,
    title: 'Secure Authentication',
    description:
      'Industry-standard encryption and multi-factor authentication protect every login and session.',
  },
  {
    icon: Lock,
    title: 'Vote Integrity',
    description:
      'Cryptographic hashing ensures votes cannot be altered, tampered with, or duplicated after submission.',
  },
  {
    icon: Users,
    title: 'Role-Based Access',
    description:
      'Granular permissions ensure voters, officials, and admins only access what they are authorized to see.',
  },
  {
    icon: Eye,
    title: 'Audit Trails',
    description:
      'Every action is logged immutably, providing a transparent and verifiable record of all activity.',
  },
];

const faqs = [
  {
    question: 'How do I vote?',
    answer:
      'Register for an account using your institutional email, verify your identity, then navigate to the active elections page. Select your candidates, review your choices, and click submit. You will receive a confirmation code upon successful submission.',
  },
  {
    question: 'Is my vote secret?',
    answer:
      'Yes. Your vote is encrypted and stored separately from your personal identity. While the system records that you voted to prevent duplicates, the content of your ballot remains anonymous and cannot be traced back to you.',
  },
  {
    question: 'Can I change my vote?',
    answer:
      'Once a vote is submitted, it cannot be changed. This ensures the integrity of the election process. You may review your selections carefully before submitting, and the review step gives you a final opportunity to make changes.',
  },
  {
    question: 'How are results verified?',
    answer:
      'Results are computed using tamper-proof aggregation and can be independently verified through the audit log. Election officials can publish cryptographic proofs that confirm the tally matches all recorded ballots.',
  },
  {
    question: 'Who can access the system?',
    answer:
      'Only registered and verified members of the institution can participate. Administrators control voter registration and eligibility. Each account is tied to a verified identity to prevent unauthorized access.',
  },
];

function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
        <div className="relative mx-auto max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/50 px-4 py-1.5 text-sm text-slate-300 backdrop-blur-sm">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                Trusted by 10,000+ voters nationwide
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                Secure. Transparent.{' '}
                <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                  Simple Voting.
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-300">
                A modern digital voting platform designed for colleges, organizations, and
                institutions. Cast your vote with confidence.
              </p>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Link to="/register">
                  <Button size="lg" className="w-full sm:w-auto">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <a href="#how-it-works">
                  <Button variant="outline" size="lg" className="w-full border-slate-600 text-slate-200 hover:bg-slate-700 sm:w-auto">
                    How It Works
                  </Button>
                </a>
              </div>
            </div>

            {/* CSS Illustration */}
            <div className="hidden lg:block">
              <div className="relative mx-auto h-80 w-80">
                <div className="absolute left-8 top-0 h-64 w-52 rotate-[-8deg] rounded-2xl border border-slate-600/50 bg-gradient-to-br from-slate-700/80 to-slate-800/80 p-5 shadow-2xl backdrop-blur-sm">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-400" />
                    <div className="h-3 w-3 rounded-full bg-yellow-400" />
                    <div className="h-3 w-3 rounded-full bg-green-400" />
                  </div>
                  <div className="space-y-3">
                    <div className="h-3 w-3/4 rounded bg-slate-600/60" />
                    <div className="h-3 w-1/2 rounded bg-slate-600/40" />
                    <div className="flex items-center gap-2 pt-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded bg-emerald-500/20">
                        <Vote className="h-3 w-3 text-emerald-400" />
                      </div>
                      <div className="h-2.5 w-20 rounded bg-slate-600/50" />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-500/20">
                        <Shield className="h-3 w-3 text-blue-400" />
                      </div>
                      <div className="h-2.5 w-16 rounded bg-slate-600/50" />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded bg-violet-500/20">
                        <Lock className="h-3 w-3 text-violet-400" />
                      </div>
                      <div className="h-2.5 w-24 rounded bg-slate-600/50" />
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-0 right-0 h-56 w-48 rotate-[5deg] rounded-2xl border border-slate-600/50 bg-gradient-to-br from-blue-900/60 to-indigo-900/60 p-5 shadow-2xl backdrop-blur-sm">
                  <div className="mb-3 flex items-center justify-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20">
                      <CheckCircle className="h-6 w-6 text-emerald-400" />
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="mx-auto mb-2 h-3 w-24 rounded bg-slate-500/50" />
                    <div className="mx-auto h-2 w-16 rounded bg-slate-500/30" />
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="h-2 w-full rounded bg-slate-500/40" />
                    <div className="h-2 w-3/4 rounded bg-slate-500/30" />
                    <div className="h-2 w-1/2 rounded bg-slate-500/20" />
                  </div>
                </div>
                <div className="absolute bottom-8 left-0 h-36 w-32 rotate-[12deg] rounded-xl border border-slate-600/40 bg-gradient-to-br from-slate-700/60 to-slate-800/60 p-4 shadow-xl backdrop-blur-sm">
                  <div className="mb-2 flex items-center gap-1.5">
                    <BarChart3 className="h-4 w-4 text-blue-400" />
                    <div className="h-2 w-12 rounded bg-slate-600/50" />
                  </div>
                  <div className="flex items-end gap-1.5 pt-3">
                    <div className="h-8 w-3 rounded-t bg-blue-500/40" />
                    <div className="h-12 w-3 rounded-t bg-emerald-500/40" />
                    <div className="h-6 w-3 rounded-t bg-violet-500/40" />
                    <div className="h-10 w-3 rounded-t bg-blue-500/40" />
                    <div className="h-14 w-3 rounded-t bg-emerald-500/40" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-white px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need for secure elections
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              A complete voting solution with enterprise-grade security, real-time analytics, and
              an intuitive interface.
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-5xl gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} hover className="group">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600 transition-colors group-hover:bg-primary-100">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">
                    {feature.description}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="bg-slate-50 px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              How it works
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Seven simple steps from registration to confirmation. Voting has never been easier.
            </p>
          </div>
          <div className="relative mt-16">
            <div className="absolute left-8 top-8 bottom-8 hidden w-0.5 bg-gray-200 lg:left-1/2 lg:block" />
            <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide lg:grid lg:grid-cols-7 lg:gap-0 lg:overflow-visible lg:pb-0">
              {steps.map((step) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.number}
                    className="flex min-w-[160px] flex-col items-center text-center lg:min-w-0"
                  >
                    <div className="relative z-10 mb-4 flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-primary-600 text-white shadow-lg">
                      <Icon className="h-7 w-7" />
                    </div>
                    <div className="mb-1 text-xs font-bold uppercase tracking-widest text-primary-600">
                      Step {step.number}
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900">{step.title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-gray-500">
                      {step.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Security Section */}
      <section id="trust" className="bg-white px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Built on Trust
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Our platform is engineered from the ground up to prioritize security, privacy, and
              integrity at every level.
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-5xl gap-8 sm:grid-cols-2">
            {trustItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="flex gap-5 rounded-2xl border border-gray-100 bg-slate-50 p-6 transition-colors hover:bg-slate-100"
                >
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="bg-slate-50 px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Frequently Asked Questions
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Have questions? We have answers.
            </p>
          </div>
          <div className="mt-12 space-y-3">
            {faqs.map((faq, index) => (
              <div
                key={faq.question}
                className="overflow-hidden rounded-xl border border-gray-200 bg-white"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(index)}
                  className="flex w-full items-center justify-between px-6 py-5 text-left transition-colors hover:bg-gray-50"
                >
                  <span className="text-base font-medium text-gray-900">{faq.question}</span>
                  {openFaq === index ? (
                    <ChevronUp className="h-5 w-5 flex-shrink-0 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 flex-shrink-0 text-gray-500" />
                  )}
                </button>
                <div
                  className={cn(
                    'overflow-hidden transition-all duration-300',
                    openFaq === index ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'
                  )}
                >
                  <div className="border-t border-gray-100 px-6 pb-5 pt-4">
                    <p className="text-sm leading-relaxed text-gray-600">{faq.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-700 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to modernize your elections?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-primary-100">
            Join thousands of institutions that trust VoteSecure for their elections. Get started in
            minutes — no setup fees, no complex configuration.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link to="/register">
              <Button
                size="lg"
                className="w-full bg-white text-primary-700 hover:bg-primary-50 sm:w-auto"
              >
                Create Free Account
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button
                variant="outline"
                size="lg"
                className="w-full border-primary-300 text-white hover:bg-primary-600 sm:w-auto"
              >
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default LandingPage;
