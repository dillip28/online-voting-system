import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, GripVertical } from 'lucide-react';
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
import * as storage from '@/services/electionService';
import { addAuditLog } from '@/services/auditService';
import AdminLayout from '@/layouts/admin-layout';

const electionTypeOptions = [
  { value: 'presidential', label: 'Presidential' },
  { value: 'parliamentary', label: 'Parliamentary' },
  { value: 'student', label: 'Student' },
  { value: 'organizational', label: 'Organizational' },
  { value: 'custom', label: 'Custom' },
];

interface PositionForm {
  id: string;
  title: string;
  description: string;
  maxSelections: number;
  candidates: CandidateForm[];
}

interface CandidateForm {
  id: string;
  name: string;
  party: string;
  manifesto: string;
  photo: string;
}

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
  positions?: string;
}

const emptyCandidateForm: CandidateForm = {
  id: '',
  name: '',
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

  const [positions, setPositions] = useState<PositionForm[]>([]);
  const [showPositionModal, setShowPositionModal] = useState(false);
  const [editPositionIndex, setEditPositionIndex] = useState<number | null>(null);
  const [positionTitle, setPositionTitle] = useState('');
  const [positionDescription, setPositionDescription] = useState('');
  const [positionErrors, setPositionErrors] = useState<Record<string, string>>({});

  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [candidatePositionIndex, setCandidatePositionIndex] = useState<number | null>(null);
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

    if (positions.length === 0) {
      newErrors.positions = 'At least one position is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const openAddPosition = () => {
    setEditPositionIndex(null);
    setPositionTitle('');
    setPositionDescription('');
    setPositionErrors({});
    setShowPositionModal(true);
  };

  const openEditPosition = (index: number) => {
    setEditPositionIndex(index);
    setPositionTitle(positions[index].title);
    setPositionDescription(positions[index].description);
    setPositionErrors({});
    setShowPositionModal(true);
  };

  const validatePosition = (): boolean => {
    const errs: Record<string, string> = {};
    if (!positionTitle.trim()) errs.title = 'Position title is required';
    setPositionErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSavePosition = () => {
    if (!validatePosition()) return;

    if (editPositionIndex !== null) {
      setPositions((prev) =>
        prev.map((p, i) =>
          i === editPositionIndex ? { ...p, title: positionTitle, description: positionDescription } : p
        )
      );
      toast('success', 'Position updated.');
    } else {
      setPositions((prev) => [
        ...prev,
        {
          id: `pos_${generateId()}`,
          title: positionTitle,
          description: positionDescription,
          maxSelections: 1,
          candidates: [],
        },
      ]);
      toast('success', 'Position added.');
    }

    setShowPositionModal(false);
    setPositionTitle('');
    setPositionDescription('');
    setEditPositionIndex(null);

    if (errors.positions) {
      setErrors((prev) => ({ ...prev, positions: undefined }));
    }
  };

  const handleDeletePosition = (index: number) => {
    setPositions((prev) => prev.filter((_, i) => i !== index));
    toast('success', 'Position removed.');
  };

  const openAddCandidate = (positionIndex: number) => {
    setCandidatePositionIndex(positionIndex);
    setEditCandidateIndex(null);
    setCandidateForm(emptyCandidateForm);
    setCandidateErrors({});
    setShowCandidateModal(true);
  };

  const openEditCandidate = (positionIndex: number, candidateIndex: number) => {
    setCandidatePositionIndex(positionIndex);
    setEditCandidateIndex(candidateIndex);
    setCandidateForm({ ...positions[positionIndex].candidates[candidateIndex] });
    setCandidateErrors({});
    setShowCandidateModal(true);
  };

  const validateCandidate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!candidateForm.name.trim()) errs.name = 'Name is required';
    setCandidateErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveCandidate = () => {
    if (!validateCandidate() || candidatePositionIndex === null) return;

    if (editCandidateIndex !== null) {
      setPositions((prev) =>
        prev.map((p, pi) => {
          if (pi !== candidatePositionIndex) return p;
          return {
            ...p,
            candidates: p.candidates.map((c, ci) =>
              ci === editCandidateIndex ? { ...candidateForm, id: c.id } : c
            ),
          };
        })
      );
      toast('success', 'Candidate updated.');
    } else {
      setPositions((prev) =>
        prev.map((p, pi) => {
          if (pi !== candidatePositionIndex) return p;
          return {
            ...p,
            candidates: [...p.candidates, { ...candidateForm, id: `cand_${generateId()}` }],
          };
        })
      );
      toast('success', 'Candidate added.');
    }

    setShowCandidateModal(false);
    setCandidateForm(emptyCandidateForm);
    setCandidatePositionIndex(null);
    setEditCandidateIndex(null);
  };

  const handleDeleteCandidate = (positionIndex: number, candidateIndex: number) => {
    setPositions((prev) =>
      prev.map((p, pi) => {
        if (pi !== positionIndex) return p;
        return { ...p, candidates: p.candidates.filter((_, ci) => ci !== candidateIndex) };
      })
    );
    toast('success', 'Candidate removed.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const startDateTime = `${form.startDate}T${form.startTime}:00`;
      const endDateTime = `${form.endDate}T${form.endTime}:00`;

      const now = new Date().toISOString();
      const createdPositions = positions.map((p, i) => ({
        id: p.id,
        electionId: '',
        title: p.title,
        description: p.description,
        maxSelections: p.maxSelections,
        order: i,
      }));

      const allCandidates = positions.flatMap((p) =>
        p.candidates.map((c) => ({
          id: c.id,
          electionId: '',
          positionId: p.id,
          name: c.name,
          party: c.party || undefined,
          biography: '',
          manifesto: c.manifesto,
          photo: c.photo || undefined,
          status: 'approved' as const,
          votesReceived: 0,
          createdAt: now,
        }))
      );

      const election = await storage.createElection({
        title: form.title,
        description: form.description,
        type: form.type,
        organization: form.organization,
        startDate: startDateTime,
        endDate: endDateTime,
        enableNota: form.enableNota,
        maxSelections: form.maxSelections,
        createdBy: user?.id || 'admin',
        positions: createdPositions,
        candidates: allCandidates,
      });

      addAuditLog({
        userId: user?.id || 'admin',
        userName: user?.fullName || 'Admin',
        userRole: user?.role || 'admin',
        action: 'election.create',
        resource: 'election',
        resourceId: election.id,
        details: `Created election: ${form.title}`,
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
            Set up a new election with positions and candidates.
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
                      'min-h-[100px] resize-y'
                    )}
                    placeholder="Describe the election purpose and rules..."
                    value={form.description}
                    onChange={(e) => updateField('description', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                  label="Max Selections per Position"
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
                  <h2 className="text-[15px] font-semibold text-surface-900">Positions & Candidates</h2>
                  <p className="mt-0.5 text-xs text-surface-500">
                    Add positions, then add candidates under each position.
                  </p>
                </div>
                <Button type="button" size="sm" onClick={openAddPosition}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Add Position
                </Button>
              </div>

              {errors.positions && (
                <p className="mb-3 text-sm text-danger-500">{errors.positions}</p>
              )}

              {positions.length === 0 ? (
                <EmptyState
                  icon={Plus}
                  title="No positions added"
                  description="Click 'Add Position' to define positions for this election."
                />
              ) : (
                <div className="space-y-4">
                  {positions.map((position, posIndex) => (
                    <div
                      key={position.id}
                      className="rounded-lg border border-surface-200 bg-white"
                    >
                      <div className="flex items-center justify-between border-b border-surface-100 px-4 py-3">
                        <div className="flex items-center gap-3">
                          <GripVertical className="h-4 w-4 text-surface-300" />
                          <div>
                            <h3 className="text-sm font-semibold text-surface-900">
                              {position.title}
                            </h3>
                            {position.description && (
                              <p className="text-xs text-surface-500">{position.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => openAddCandidate(posIndex)}
                          >
                            <Plus className="mr-1 h-3.5 w-3.5" />
                            Candidate
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditPosition(posIndex)}
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePosition(posIndex)}
                          >
                            <Trash2 className="h-4 w-4 text-danger-500" />
                          </Button>
                        </div>
                      </div>

                      {position.candidates.length === 0 ? (
                        <div className="px-4 py-6 text-center text-sm text-surface-400">
                          No candidates yet. Click "Candidate" to add one.
                        </div>
                      ) : (
                        <div className="p-0">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Party</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {position.candidates.map((candidate, candIndex) => (
                                <TableRow key={candidate.id}>
                                  <TableCell className="font-medium text-surface-900">
                                    {candidate.name}
                                  </TableCell>
                                  <TableCell className="text-surface-600">
                                    {candidate.party || 'Independent'}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openEditCandidate(posIndex, candIndex)}
                                      >
                                        Edit
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteCandidate(posIndex, candIndex)}
                                      >
                                        <Trash2 className="h-4 w-4 text-danger-500" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
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
        isOpen={showPositionModal}
        onClose={() => setShowPositionModal(false)}
        title={editPositionIndex !== null ? 'Edit Position' : 'Add Position'}
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Position Title"
            placeholder="e.g., President, Secretary, Treasurer"
            value={positionTitle}
            onChange={(e) => {
              setPositionTitle(e.target.value);
              if (positionErrors.title) setPositionErrors((prev) => ({ ...prev, title: '' }));
            }}
            error={positionErrors.title}
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-surface-700">
              Description (optional)
            </label>
            <textarea
              className={cn(
                'block w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900',
                'placeholder:text-surface-400',
                'hover:border-surface-300',
                'focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500/20',
                'min-h-[80px] resize-y'
              )}
              placeholder="Describe the role or responsibilities..."
              value={positionDescription}
              onChange={(e) => setPositionDescription(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-surface-100">
            <Button variant="outline" type="button" onClick={() => setShowPositionModal(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSavePosition}>
              {editPositionIndex !== null ? 'Save Changes' : 'Add Position'}
            </Button>
          </div>
        </div>
      </Modal>

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
