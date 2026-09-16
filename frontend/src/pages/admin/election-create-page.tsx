import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { generateId } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { useAuthStore } from '@/store/auth-store';
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
  candidates?: string;
}

interface CandidateForm {
  name: string;
  position: string;
  party: string;
  manifesto: string;
  photo: string;
}

const emptyCandidateForm: CandidateForm = {
  name: '',
  position: '',
  party: '',
  manifesto: '',
  photo: '',
};

export default function ElectionCreatePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [form, setForm] = useState<FormData>({
    title: '',
    description: '',
    type: '',
    organization: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    enableNota: false,
    maxSelections: 1,
  });

  const [candidates, setCandidates] = useState<(CandidateForm & { id: string })[]>([]);
  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [editCandidateIndex, setEditCandidateIndex] = useState<number | null>(null);
  const [candidateForm, setCandidateForm] = useState<CandidateForm>(emptyCandidateForm);
  const [candidateErrors, setCandidateErrors] = useState<Record<string, string>>({});

  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const validate = (): boolean => {
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

    if (candidates.length === 0) {
      newErrors.candidates = 'At least one candidate is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const openAddCandidate = () => {
    setEditCandidateIndex(null);
    setCandidateForm(emptyCandidateForm);
    setCandidateErrors({});
    setShowCandidateModal(true);
  };

  const openEditCandidate = (index: number) => {
    setEditCandidateIndex(index);
    setCandidateForm({ ...candidates[index] });
    setCandidateErrors({});
    setShowCandidateModal(true);
  };

  const validateCandidate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!candidateForm.name.trim()) errs.name = 'Name is required';
    if (!candidateForm.position.trim()) errs.position = 'Position is required';
    setCandidateErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveCandidate = () => {
    if (!validateCandidate()) return;

    if (editCandidateIndex !== null) {
      setCandidates((prev) =>
        prev.map((c, i) => (i === editCandidateIndex ? { ...candidateForm, id: c.id } : c))
      );
      toast('success', 'Candidate updated.');
    } else {
      setCandidates((prev) => [...prev, { ...candidateForm, id: `cand_${generateId()}` }]);
      toast('success', 'Candidate added.');
    }

    setShowCandidateModal(false);
    setCandidateForm(emptyCandidateForm);
    setEditCandidateIndex(null);

    if (errors.candidates) {
      setErrors((prev) => ({ ...prev, candidates: undefined }));
    }
  };

  const handleDeleteCandidate = (index: number) => {
    setCandidates((prev) => prev.filter((_, i) => i !== index));
    toast('success', 'Candidate removed.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const startDateTime = `${form.startDate}T${form.startTime}:00`;
      const endDateTime = `${form.endDate}T${form.endTime}:00`;

      const positionId = `pos_${generateId()}`;
      const position = {
        id: positionId,
        electionId: '',
        title: 'Main Position',
        description: 'Default position for this election',
        maxSelections: form.maxSelections,
        order: 0,
      };

      const electionCandidates = candidates.map((c) => ({
        id: c.id,
        electionId: '',
        positionId,
        name: c.name,
        party: c.party || undefined,
        biography: '',
        manifesto: c.manifesto,
        photo: c.photo || undefined,
        status: 'approved' as const,
        votesReceived: 0,
        createdAt: new Date().toISOString(),
        position: undefined,
      }));

      storage.createElection({
        title: form.title,
        description: form.description,
        type: form.type,
        organization: form.organization,
        startDate: startDateTime,
        endDate: endDateTime,
        enableNota: form.enableNota,
        maxSelections: form.maxSelections,
        createdBy: user?.id || 'admin',
        positions: [position],
        candidates: electionCandidates,
      });

      toast('success', `"${form.title}" has been created successfully.`);
      navigate('/admin/elections');
    } catch {
      toast('error', 'Failed to create election. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <h1 className="text-[22px] font-semibold text-surface-900">Create Election</h1>
          <p className="mt-1 text-sm text-surface-500">
            Set up a new election with all the required details.
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

            <div className="border-t border-surface-200 pt-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-[15px] font-semibold text-surface-900">Candidates</h2>
                  <p className="mt-0.5 text-xs text-surface-500">
                    Add at least one candidate for this election.
                  </p>
                </div>
                <Button type="button" size="sm" onClick={openAddCandidate}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Add Candidate
                </Button>
              </div>

              {errors.candidates && (
                <p className="mb-3 text-sm text-danger-500">{errors.candidates}</p>
              )}

              {candidates.length === 0 ? (
                <EmptyState
                  icon={UserPlus}
                  title="No candidates added"
                  description="Click 'Add Candidate' to add candidates to this election."
                />
              ) : (
                <Card className="!p-0 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead>Party</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {candidates.map((candidate, index) => (
                        <TableRow key={candidate.id}>
                          <TableCell className="font-medium text-surface-900">
                            {candidate.name}
                          </TableCell>
                          <TableCell className="text-surface-600">{candidate.position}</TableCell>
                          <TableCell className="text-surface-600">{candidate.party || 'Independent'}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditCandidate(index)}
                              >
                                Edit
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteCandidate(index)}
                              >
                                <Trash2 className="h-4 w-4 text-danger-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              )}
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
                Create Election
              </Button>
            </div>
          </Card>
        </form>
      </div>

      <Modal
        isOpen={showCandidateModal}
        onClose={() => setShowCandidateModal(false)}
        title={editCandidateIndex !== null ? 'Edit Candidate' : 'Add Candidate'}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Candidate Name"
            placeholder="e.g., John Smith"
            value={candidateForm.name}
            onChange={(e) => {
              setCandidateForm((prev) => ({ ...prev, name: e.target.value }));
              if (candidateErrors.name) setCandidateErrors((prev) => ({ ...prev, name: '' }));
            }}
            error={candidateErrors.name}
          />
          <Input
            label="Position"
            placeholder="e.g., President"
            value={candidateForm.position}
            onChange={(e) => {
              setCandidateForm((prev) => ({ ...prev, position: e.target.value }));
              if (candidateErrors.position) setCandidateErrors((prev) => ({ ...prev, position: '' }));
            }}
            error={candidateErrors.position}
          />
          <Input
            label="Party / Group"
            placeholder="Optional - e.g., Progressive Alliance"
            value={candidateForm.party}
            onChange={(e) => setCandidateForm((prev) => ({ ...prev, party: e.target.value }))}
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-surface-700">
              Manifesto / Description
            </label>
            <textarea
              className={cn(
                'block w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900',
                'placeholder:text-surface-400',
                'hover:border-surface-300',
                'focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500/20',
                'min-h-[80px] resize-y'
              )}
              placeholder="Describe the candidate's platform..."
              value={candidateForm.manifesto}
              onChange={(e) => setCandidateForm((prev) => ({ ...prev, manifesto: e.target.value }))}
            />
          </div>
          <Input
            label="Photo URL"
            placeholder="Optional - image URL for the candidate"
            value={candidateForm.photo}
            onChange={(e) => setCandidateForm((prev) => ({ ...prev, photo: e.target.value }))}
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-surface-100">
            <Button variant="outline" type="button" onClick={() => setShowCandidateModal(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveCandidate}>
              {editCandidateIndex !== null ? 'Save Changes' : 'Add Candidate'}
            </Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
