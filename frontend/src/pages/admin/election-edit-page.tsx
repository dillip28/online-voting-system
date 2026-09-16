import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import * as storage from '@/services/electionStorage';
import AdminLayout from '@/layouts/admin-layout';

const electionTypeOptions = [
  { value: 'presidential', label: 'Presidential' },
  { value: 'parliamentary', label: 'Parliamentary' },
  { value: 'student', label: 'Student' },
  { value: 'organizational', label: 'Organizational' },
  { value: 'custom', label: 'Custom' },
];

interface FormData {
  title: string;
  description: string;
  type: string;
  organization: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  enableNota: boolean;
  maxSelections: number;
}

interface FormErrors {
  title?: string;
  type?: string;
  organization?: string;
  startDate?: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
}

export default function ElectionEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState<FormErrors>({});
  const [form, setForm] = useState<FormData | null>(null);

  useEffect(() => {
    if (!id) return;
    const timer = setTimeout(() => {
      const election = storage.getElectionById(id);
      if (election) {
        const start = new Date(election.startDate);
        const end = new Date(election.endDate);
        setForm({
          title: election.title,
          description: election.description || '',
          type: election.type,
          organization: election.organization || '',
          startDate: start.toISOString().split('T')[0],
          startTime: start.toTimeString().slice(0, 5),
          endDate: end.toISOString().split('T')[0],
          endTime: end.toTimeString().slice(0, 5),
          enableNota: election.enableNota ?? true,
          maxSelections: election.maxSelections ?? 1,
        });
      }
      setIsLoading(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [id]);

  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : null));
    if (errors[key as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const validate = (): boolean => {
    if (!form) return false;
    const newErrors: FormErrors = {};

    if (!form.title.trim()) newErrors.title = 'Title is required';
    if (!form.type) newErrors.type = 'Election type is required';
    if (!form.organization.trim()) newErrors.organization = 'Organization is required';
    if (!form.startDate) newErrors.startDate = 'Start date is required';
    if (!form.startTime) newErrors.startTime = 'Start time is required';
    if (!form.endDate) newErrors.endDate = 'End date is required';
    if (!form.endTime) newErrors.endTime = 'End time is required';

    if (form.startDate && form.endDate) {
      const start = new Date(`${form.startDate}T${form.startTime || '00:00'}`);
      const end = new Date(`${form.endDate}T${form.endTime || '23:59'}`);
      if (end <= start) {
        newErrors.endDate = 'End date must be after start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !id) return;

    setIsSubmitting(true);
    try {
      const startDateTime = `${form!.startDate}T${form!.startTime}:00`;
      const endDateTime = `${form!.endDate}T${form!.endTime}:00`;

      storage.updateElection(id, {
        title: form!.title,
        description: form!.description,
        type: form!.type as any,
        organization: form!.organization,
        startDate: startDateTime,
        endDate: endDateTime,
        enableNota: form!.enableNota,
        maxSelections: form!.maxSelections,
      });

      toast('success', `"${form!.title}" has been updated successfully.`);
      navigate('/admin/elections');
    } catch {
      toast('error', 'Failed to update election. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
        </div>
      </AdminLayout>
    );
  }

  if (!form) {
    return (
      <AdminLayout>
        <EmptyState
          title="Election not found"
          description="The election you're trying to edit doesn't exist."
          action={{
            children: 'Back to Elections',
            onClick: () => navigate('/admin/elections'),
          }}
        />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-[22px] font-semibold text-surface-900">Edit Election</h1>
          <p className="mt-1 text-sm text-surface-500">
            Update the election details below.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="space-y-6">
            <div>
              <h2 className="mb-4 text-[15px] font-semibold text-surface-900">Basic Information</h2>
              <div className="space-y-4">
                <Input
                  label="Election Title"
                  placeholder="e.g., Student Council President 2026"
                  value={form.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  error={errors.title}
                />
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-surface-700">
                    Description
                  </label>
                  <textarea
                    className={cn(
                      'block w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900',
                      'placeholder:text-surface-400',
                      'hover:border-surface-300',
                      'focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500/20',
                      'disabled:cursor-not-allowed disabled:bg-surface-50 disabled:text-surface-400',
                      'min-h-[100px] resize-y'
                    )}
                    placeholder="Describe the election purpose and rules..."
                    value={form.description}
                    onChange={(e) => updateField('description', e.target.value)}
                  />
                </div>
                <Select
                  label="Election Type"
                  options={electionTypeOptions}
                  placeholder="Select election type"
                  value={form.type}
                  onChange={(e) => updateField('type', e.target.value)}
                  error={errors.type}
                />
                <Input
                  label="Organization"
                  placeholder="e.g., University Student Government"
                  value={form.organization}
                  onChange={(e) => updateField('organization', e.target.value)}
                  error={errors.organization}
                />
              </div>
            </div>

            <div className="border-t border-surface-200 pt-6">
              <h2 className="mb-4 text-[15px] font-semibold text-surface-900">Schedule</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Start Date"
                  type="date"
                  value={form.startDate}
                  onChange={(e) => updateField('startDate', e.target.value)}
                  error={errors.startDate}
                />
                <Input
                  label="Start Time"
                  type="time"
                  value={form.startTime}
                  onChange={(e) => updateField('startTime', e.target.value)}
                  error={errors.startTime}
                />
                <Input
                  label="End Date"
                  type="date"
                  value={form.endDate}
                  onChange={(e) => updateField('endDate', e.target.value)}
                  error={errors.endDate}
                />
                <Input
                  label="End Time"
                  type="time"
                  value={form.endTime}
                  onChange={(e) => updateField('endTime', e.target.value)}
                  error={errors.endTime}
                />
              </div>
            </div>

            <div className="border-t border-surface-200 pt-6">
              <h2 className="mb-4 text-[15px] font-semibold text-surface-900">Settings</h2>
              <div className="space-y-4">
                <Checkbox
                  label="Enable NOTA (None of the Above)"
                  checked={form.enableNota}
                  onChange={(checked) => updateField('enableNota', checked)}
                />
                <Input
                  label="Max Selections"
                  type="number"
                  min={1}
                  max={10}
                  value={form.maxSelections}
                  onChange={(e) => updateField('maxSelections', parseInt(e.target.value) || 1)}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-surface-200 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
              >
                Cancel
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                Save Changes
              </Button>
            </div>
          </Card>
        </form>
      </div>
    </AdminLayout>
  );
}
