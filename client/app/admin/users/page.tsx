'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface User {
  id: number;
  name: string;
  email: string;
  role: string | null;
  expected_role: string;
  status: string;
  created_at: string;
}

export default function UsersManagementPage() {
  const { token, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending'>('pending');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'role' | null>(null);
  const [newRole, setNewRole] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const getAuthToken = () => token || localStorage.getItem('token') || '';

  const getAuthHeaders = () => {
    const authToken = getAuthToken();

    return authToken
      ? {
          Authorization: `Bearer ${authToken}`,
        }
      : {};
  };

  const loadUsers = async () => {
    try {
      const authToken = getAuthToken();

      if (!authToken) {
        throw new Error('No auth token found');
      }

      setLoading(true);

      const [allRes, pendingRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/admin/users`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/admin/pending`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }),
      ]);

      if (!allRes.ok || !pendingRes.ok) {
        const allError = await allRes.text();
        const pendingError = await pendingRes.text();
        throw new Error(allError || pendingError || 'Failed to load users');
      }

      const allData = await allRes.json();
      const pendingData = await pendingRes.json();

      setUsers(allData);
      setPendingUsers(pendingData);
    } catch (error) {
      console.error('Load users error:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && (token || localStorage.getItem('token'))) {
      loadUsers();
    }
  }, [token, authLoading]);

  const handleApprove = async (user: User) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/admin/approve/${user.id}`,
        {
          method: 'PATCH',
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to approve user');
      }

      toast.success(`User ${user.name} approved`);
      setDialogOpen(false);
      loadUsers();
    } catch (error) {
      console.error('Approve error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to approve user');
    }
  };

  const handleReject = async (user: User) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/admin/reject/${user.id}`,
        {
          method: 'PATCH',
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to reject user');
      }

      toast.success(`User ${user.name} rejected`);
      setDialogOpen(false);
      loadUsers();
    } catch (error) {
      console.error('Reject error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to reject user');
    }
  };

  const handleUpdateRole = async (user: User) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/admin/users/${user.id}/role`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
          body: JSON.stringify({ role: newRole }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to update role');
      }

      toast.success(`User role updated to ${newRole}`);
      setDialogOpen(false);
      loadUsers();
    } catch (error) {
      console.error('Update role error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update role');
    }
  };

  const openDialog = (user: User, type: 'approve' | 'reject' | 'role') => {
    setSelectedUser(user);
    setActionType(type);
    if (type === 'role') {
      setNewRole(user.role);
    }
    setDialogOpen(true);
  };

  const displayUsers = activeTab === 'pending' ? pendingUsers : users;

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6">
      <h1 className="text-2xl font-bold mb-6">User Management</h1>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-3 px-4 font-medium transition ${
            activeTab === 'pending'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Pending ({pendingUsers.length})
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`pb-3 px-4 font-medium transition ${
            activeTab === 'all'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          All Users ({users.length})
        </button>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Expected Role</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Assigned Role</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayUsers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            ) : (
              displayUsers.map((user) => (
                <tr key={user.id} className="border-t hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{user.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
                      {user.expected_role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {user.role ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        {user.role}
                      </span>
                    ) : (
                      <span className="text-gray-500 text-xs">Not assigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        user.status === 'approved'
                          ? 'bg-green-50 text-green-700'
                          : user.status === 'pending'
                            ? 'bg-yellow-50 text-yellow-700'
                            : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {activeTab === 'pending' && user.status === 'pending' ? (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDialog(user, 'approve')}
                          className="text-green-600 hover:bg-green-50"
                        >
                          <Check size={16} />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDialog(user, 'reject')}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <X size={16} />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openDialog(user, 'role')}
                      >
                        Edit Role
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Dialog */}
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'approve' && `Approve ${selectedUser?.name}?`}
              {actionType === 'reject' && `Reject ${selectedUser?.name}?`}
              {actionType === 'role' && `Update Role for ${selectedUser?.name}`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'approve' && `This user requested the role: ${selectedUser?.expected_role}`}
              {actionType === 'reject' && 'This user will not be able to access the system.'}
              {actionType === 'role' && 'Select a new role for this user.'}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {actionType === 'role' && (
            <div className="mt-4 px-6">
              <label className="block text-sm font-medium mb-2 text-gray-700">Select New Role:</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
              >
                <option value="user">User (Lab Assistant)</option>
                <option value="manager">Manager (Inventory Manager)</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (actionType === 'approve' && selectedUser) {
                  handleApprove(selectedUser);
                } else if (actionType === 'reject' && selectedUser) {
                  handleReject(selectedUser);
                } else if (actionType === 'role' && selectedUser) {
                  handleUpdateRole(selectedUser);
                }
              }}
            >
              {actionType === 'approve' && 'Approve'}
              {actionType === 'reject' && 'Reject'}
              {actionType === 'role' && 'Update'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
