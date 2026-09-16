import { useState, useEffect, useMemo, type FormEvent } from 'react';
import {
  Search,
  Plus,
  MoreHorizontal,
  Shield,
  UserCheck,
  UserX,
  Trash2,
  Edit,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import AdminLayout from '@/layouts/admin-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Dropdown } from '@/components/ui/dropdown';
import { Pagination } from '@/components/ui/pagination';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useToast } from '@/components/ui/toast';
import type { User } from '@/types';

const DEMO_ADMINS: User[] = [
  {
    id: 'usr_001',
    email: 'admin@test.com',
    fullName: 'Sarah Williams',
    role: 'admin',
    isVerified: true,
    isActive: true,
    twoFactorEnabled: false,
    createdAt: '2026-08-01T10:00:00Z',
    updatedAt: '2026-08-01T10:00:00Z',
  },
  {
    id: 'usr_004',
    email: 'superadmin@test.com',
    fullName: 'David Admin',
    role: 'super_admin',
    isVerified: true,
    isActive: true,
    twoFactorEnabled: false,
    createdAt: '2026-07-01T10:00:00Z',
    updatedAt: '2026-07-01T10:00:00Z',
  },
];

const ITEMS_PER_PAGE = 8;

export default function AdminsPage() {
  const { toast } = useToast();
  const [admins, setAdmins] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<User | null>(null);

  const [newAdmin, setNewAdmin] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'admin' as 'admin' | 'super_admin',
  });
  const [editRole, setEditRole] = useState<'admin' | 'super_admin'>('admin');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const timer = setTimeout(() => {
      setAdmins(DEMO_ADMINS);
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const filtered = useMemo(() => {
    return admins.filter((admin) => {
      const matchesSearch =
        admin.fullName.toLowerCase().includes(search.toLowerCase()) ||
        admin.email.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === 'all' || admin.role === roleFilter;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && admin.isActive) ||
        (statusFilter === 'inactive' && !admin.isActive);
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [admins, search, roleFilter, statusFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedAdmins = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const validateAdd = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!newAdmin.fullName.trim()) newErrors.fullName = 'Name is required';
    if (!newAdmin.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newAdmin.email))
      newErrors.email = 'Invalid email format';
    if (!newAdmin.password) newErrors.password = 'Password is required';
    else if (newAdmin.password.length < 8)
      newErrors.password = 'Password must be at least 8 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddAdmin = (e: FormEvent) => {
    e.preventDefault();
    if (!validateAdd()) return;

    const admin: User = {
      id: `usr_${Date.now()}`,
      email: newAdmin.email,
      fullName: newAdmin.fullName,
      role: newAdmin.role,
      isVerified: true,
      isActive: true,
      twoFactorEnabled: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setAdmins((prev) => [...prev, admin]);
    setAddModalOpen(false);
    setNewAdmin({ fullName: '', email: '', password: '', role: 'admin' });
    toast('success', 'Admin created successfully');
  };

  const handleEditAdmin = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedAdmin) return;

    setAdmins((prev) =>
      prev.map((a) =>
        a.id === selectedAdmin.id
          ? { ...a, role: editRole, updatedAt: new Date().toISOString() }
          : a
      )
    );
    setEditModalOpen(false);
    setSelectedAdmin(null);
    toast('success', 'Admin updated successfully');
  };

  const handleToggleActive = (admin: User) => {
    setAdmins((prev) =>
      prev.map((a) =>
        a.id === admin.id
          ? { ...a, isActive: !a.isActive, updatedAt: new Date().toISOString() }
          : a
      )
    );
    toast(
      'success',
      `Admin ${admin.isActive ? 'deactivated' : 'activated'} successfully`
    );
  };

  const handleDeleteAdmin = () => {
    if (!selectedAdmin) return;
    setAdmins((prev) => prev.filter((a) => a.id !== selectedAdmin.id));
    setDeleteDialogOpen(false);
    setSelectedAdmin(null);
    toast('success', 'Admin removed successfully');
  };

  function openEdit(admin: User) {
    setSelectedAdmin(admin);
    setEditRole(admin.role as 'admin' | 'super_admin');
    setEditModalOpen(true);
  }

  function openDelete(admin: User) {
    setSelectedAdmin(admin);
    setDeleteDialogOpen(true);
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-surface-500">Loading administrators...</p>
          </div>
        ) : (
        <>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-[22px] font-semibold text-primary-700">
              Administrator Management
            </h1>
            <p className="mt-1 text-[14px] text-surface-500">
              Manage system administrators and their permissions
            </p>
          </div>
          <Button onClick={() => setAddModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Admin
          </Button>
        </div>

        <Card className="!p-0">
          <div className="flex flex-col gap-4 border-b border-surface-100 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
              <Input
                placeholder="Search admins..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-3">
              <Select
                options={[
                  { value: 'all', label: 'All Roles' },
                  { value: 'admin', label: 'Admin' },
                  { value: 'super_admin', label: 'Super Admin' },
                ]}
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-40"
              />
              <Select
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                ]}
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-40"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-[14px]">
              <thead>
                <tr className="border-b border-surface-100">
                  <th className="px-4 py-3 text-left font-medium text-surface-500">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-surface-500">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-surface-500">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-surface-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-surface-500">
                    Created
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-surface-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedAdmins.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-12 text-center text-surface-500"
                    >
                      No administrators found
                    </td>
                  </tr>
                ) : (
                  paginatedAdmins.map((admin) => (
                    <tr
                      key={admin.id}
                      className="border-b border-surface-100 transition-colors hover:bg-surface-50"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-50 text-xs font-semibold text-primary-600 border border-primary-100">
                            {admin.fullName
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .toUpperCase()
                              .slice(0, 2)}
                          </div>
                          <span className="font-medium text-surface-800">
                            {admin.fullName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-surface-500">
                        {admin.email}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            admin.role === 'super_admin' ? 'info' : 'default'
                          }
                        >
                          {admin.role === 'super_admin' ? (
                            <Shield className="mr-1 h-3 w-3" />
                          ) : null}
                          {admin.role === 'super_admin'
                            ? 'Super Admin'
                            : 'Admin'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={admin.isActive ? 'success' : 'danger'}
                        >
                          {admin.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-surface-500">
                        {formatDate(admin.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Dropdown
                          trigger={
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4 text-surface-500" />
                            </Button>
                          }
                          items={[
                            {
                              label: 'Edit',
                              onClick: () => openEdit(admin),
                              icon: Edit,
                            },
                            {
                              label: admin.isActive
                                ? 'Deactivate'
                                : 'Activate',
                              onClick: () => handleToggleActive(admin),
                              icon: admin.isActive ? UserX : UserCheck,
                            },
                            {
                              label: 'Remove',
                              onClick: () => openDelete(admin),
                              icon: Trash2,
                              danger: true,
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-surface-100 px-4 py-3">
              <p className="text-[14px] text-surface-500">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
                {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of{' '}
                {filtered.length} admins
              </p>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </Card>

        <Modal
          isOpen={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          title="Add Administrator"
          size="md"
        >
          <form onSubmit={handleAddAdmin} className="space-y-4">
            <Input
              label="Full Name"
              placeholder="Enter full name"
              value={newAdmin.fullName}
              onChange={(e) =>
                setNewAdmin((prev) => ({ ...prev, fullName: e.target.value }))
              }
              error={errors.fullName}
            />
            <Input
              label="Email"
              type="email"
              placeholder="admin@example.com"
              value={newAdmin.email}
              onChange={(e) =>
                setNewAdmin((prev) => ({ ...prev, email: e.target.value }))
              }
              error={errors.email}
            />
            <Input
              label="Password"
              type="password"
              placeholder="Minimum 8 characters"
              value={newAdmin.password}
              onChange={(e) =>
                setNewAdmin((prev) => ({ ...prev, password: e.target.value }))
              }
              error={errors.password}
            />
            <Select
              label="Role"
              options={[
                { value: 'admin', label: 'Admin' },
                { value: 'super_admin', label: 'Super Admin' },
              ]}
              value={newAdmin.role}
              onChange={(e) =>
                setNewAdmin((prev) => ({
                  ...prev,
                  role: e.target.value as 'admin' | 'super_admin',
                }))
              }
            />
            <div className="flex justify-end gap-3 pt-2 border-t border-surface-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Create Admin</Button>
            </div>
          </form>
        </Modal>

        <Modal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          title="Edit Administrator"
          size="md"
        >
          <form onSubmit={handleEditAdmin} className="space-y-4">
            <div>
              <label className="mb-1 block text-[14px] font-medium text-surface-700">
                Name
              </label>
              <p className="text-[14px] text-surface-800">
                {selectedAdmin?.fullName}
              </p>
            </div>
            <div>
              <label className="mb-1 block text-[14px] font-medium text-surface-700">
                Email
              </label>
              <p className="text-[14px] text-surface-800">
                {selectedAdmin?.email}
              </p>
            </div>
            <Select
              label="Role"
              options={[
                { value: 'admin', label: 'Admin' },
                { value: 'super_admin', label: 'Super Admin' },
              ]}
              value={editRole}
              onChange={(e) =>
                setEditRole(e.target.value as 'admin' | 'super_admin')
              }
            />
            <div className="flex justify-end gap-3 pt-2 border-t border-surface-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </Modal>

        <ConfirmationDialog
          isOpen={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          onConfirm={handleDeleteAdmin}
          title="Remove Administrator"
          message={`Are you sure you want to remove ${selectedAdmin?.fullName}? This action cannot be undone.`}
          confirmLabel="Remove"
          confirmVariant="danger"
        />
        </>
        )}
      </div>
    </AdminLayout>
  );
}
