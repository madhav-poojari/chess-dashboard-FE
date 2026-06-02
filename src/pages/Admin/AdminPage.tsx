import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import {
  fetchUnapprovedUsers,
  fetchAllUsers,
  approveUser,
  createUser,
  setUserActive,
} from "../../api/admin/service";
import { User, UserRole } from "../../api/user/dto";
import { queryKeys } from "../../constants/queryKeys";
import Button from "../../components/ui/button/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import Badge from "../../components/ui/badge/Badge";
import Select from "../../components/form/Select";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import { useAuth } from "../../context/AuthContext";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import AddRelationshipModal from "../../components/ReferralGraph/AddRelationshipModal";
import AssignCoachTab from "./AssignCoachTab";
import AssignMentorTab from "./AssignMentorTab";

type TabType = "pending" | "students" | "coaches" | "add-user" | "add-referral" | "manage-users";

export default function AdminPage() {
  const { user } = useAuth();
  const isAdmin = user?.role?.toLowerCase() === UserRole.ADMIN;
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>("pending");
  const [newUserForm, setNewUserForm] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    role: "student",
    phone: "",
    dob: "",
    bio: "",
    personal_meet_link: "",
    syllabus_url: "",
    added_in_whatsapp: false,
    city: "",
    state: "",
    country: "",
    zipcode: "",
    lichess_username: "",
    chesscom_username: "",
    uscf_id: "",
    fide_id: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [manageRoleFilter, setManageRoleFilter] = useState<string>("all");
  const [creatingUser, setCreatingUser] = useState(false);
  const [showAddRelationshipModal, setShowAddRelationshipModal] = useState(false);

  const { data: unapprovedUsers = [], isLoading } = useQuery<User[]>({
    queryKey: queryKeys.admin.unapprovedUsers(),
    queryFn: fetchUnapprovedUsers,
    enabled: !!user && isAdmin,
  });

  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: queryKeys.admin.allUsers(),
    queryFn: fetchAllUsers,
    enabled: !!user && isAdmin,
  });

  const approveMutation = useMutation({
    mutationFn: approveUser,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.unapprovedUsers() });
    },
  });

  const createUserMutation = useMutation({
    mutationFn: createUser,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.unapprovedUsers() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.students() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.coaches() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.coachesPicker() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.mentorsPicker() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.allUsers() });
      setNewUserForm({
        email: "",
        password: "",
        first_name: "",
        last_name: "",
        role: UserRole.STUDENT,
        phone: "",
        dob: "",
        bio: "",
        personal_meet_link: "",
        syllabus_url: "",
        added_in_whatsapp: false,
        city: "",
        state: "",
        country: "",
        zipcode: "",
        lichess_username: "",
        chesscom_username: "",
        uscf_id: "",
        fide_id: "",
      });
      alert("User created successfully!");
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async (vars: { userId: string; active: boolean }) =>
      setUserActive(vars.userId, vars.active),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.allUsers() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.students() });
    },
  });

  const handleApprove = async (userId: string) => {
    try {
      await approveMutation.mutateAsync(userId);
    } catch (error) {
      console.error("Error approving user:", error);
      alert("Failed to approve user");
    }
  };

  if (isLoading) {
    return (
      <div>
        <PageMeta
          title="Admin Dashboard | Chess Dashboard"
          description="Admin dashboard for managing users, students, and coaches"
        />
        <PageBreadcrumb pageTitle="Admin Dashboard" />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  const getTabButtonClass = (tab: TabType) =>
    activeTab === tab
      ? "shadow-theme-xs text-gray-900 dark:text-white bg-white dark:bg-gray-800"
      : "text-gray-500 dark:text-gray-400";

  return (
    <div>
      <PageMeta
        title="Admin Dashboard | Chess Dashboard"
        description="Admin dashboard for managing users, students, and coaches"
      />
      <PageBreadcrumb pageTitle="Admin Dashboard" />

      {/* Tab Navigation */}
      <div className="mt-6 mb-6">
        <div className="flex items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900 max-w-4xl">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-6 py-2.5 font-medium flex-1 rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white transition-colors whitespace-nowrap ${getTabButtonClass("pending")}`}
          >
            Pending Approvals
            {unapprovedUsers.length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                {unapprovedUsers.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("students")}
            className={`px-6 py-2.5 font-medium flex-1 rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white transition-colors whitespace-nowrap ${getTabButtonClass("students")}`}
          >
            Assign Coach
          </button>
          <button
            onClick={() => setActiveTab("coaches")}
            className={`px-6 py-2.5 font-medium flex-1 rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white transition-colors whitespace-nowrap ${getTabButtonClass("coaches")}`}
          >
            Assign Mentor Coach
          </button>
          <button
            onClick={() => setActiveTab("add-user")}
            className={`px-6 py-2.5 font-medium flex-1 rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white transition-colors whitespace-nowrap ${getTabButtonClass("add-user")}`}
          >
            Add User
          </button>
          <button
            onClick={() => setActiveTab("manage-users")}
            className={`px-6 py-2.5 font-medium flex-1 rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white transition-colors whitespace-nowrap ${getTabButtonClass("manage-users")}`}
          >
            Manage Users
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {/* Pending Approvals Tab */}
        {activeTab === "pending" && (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="border-b border-gray-100 dark:border-white/[0.05] px-5 py-4">
              <h3 className="font-semibold text-gray-800 text-theme-base dark:text-white/90">
                Pending Approvals
              </h3>
            </div>
            <div className="max-w-full overflow-x-auto">
              {unapprovedUsers.length === 0 ? (
                <div className="px-5 py-8 text-center text-gray-500 text-theme-sm">
                  No pending approvals
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {unapprovedUsers.map((u) => (
                    <div
                      key={u.id}
                      className="px-5 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/[0.02]"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                          {u.first_name} {u.last_name}
                        </div>
                        <div className="text-gray-500 text-theme-xs dark:text-gray-400 mt-1">
                          {u.email}
                        </div>
                        <div className="text-gray-500 text-theme-xs dark:text-gray-400 mt-1">
                          Role: {u.role}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleApprove(u.id)}
                        className="ml-4"
                      >
                        Approve
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Assign Coach Tab */}
        {activeTab === "students" && <AssignCoachTab />}

        {/* Assign Mentor Coach Tab */}
        {activeTab === "coaches" && <AssignMentorTab />}

        {/* Add User Tab */}
        {activeTab === "add-user" && (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="border-b border-gray-100 dark:border-white/[0.05] px-5 py-4">
              <h3 className="font-semibold text-gray-800 text-theme-base dark:text-white/90">
                Create New User
              </h3>
            </div>
            <div className="p-6 max-w-2xl">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setCreatingUser(true);
                  try {
                    await createUserMutation.mutateAsync(newUserForm);
                  } catch (error) {
                    console.error("Error creating user:", error);
                    alert("Failed to create user");
                  } finally {
                    setCreatingUser(false);
                  }
                }}
              >
                <div className="space-y-8">

                  {/* ── Required Fields ── */}
                  <div className="space-y-6">
                    <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide dark:text-white/50">
                      Required Info
                    </h4>

                    <div>
                      <Label>Role <span className="text-error-500">*</span></Label>
                      <Select
                        options={[
                          { value: "student", label: "Student" },
                          { value: "coach", label: "Coach" },
                          { value: "mentor", label: "Mentor Coach" },
                        ]}
                        placeholder="Select Role"
                        onChange={(role) => setNewUserForm((prev) => ({ ...prev, role }))}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>First Name <span className="text-error-500">*</span></Label>
                        <Input
                          name="first_name"
                          value={newUserForm.first_name}
                          onChange={(e) => setNewUserForm((prev) => ({ ...prev, first_name: e.target.value }))}
                          placeholder="John"
                          required
                        />
                      </div>
                      <div>
                        <Label>Last Name <span className="text-error-500">*</span></Label>
                        <Input
                          name="last_name"
                          value={newUserForm.last_name}
                          onChange={(e) => setNewUserForm((prev) => ({ ...prev, last_name: e.target.value }))}
                          placeholder="Doe"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Email <span className="text-error-500">*</span></Label>
                      <Input
                        type="email"
                        name="email"
                        value={newUserForm.email}
                        onChange={(e) => setNewUserForm((prev) => ({ ...prev, email: e.target.value }))}
                        placeholder="example@gmail.com"
                        required
                      />
                    </div>

                    <div>
                      <Label>Password <span className="text-error-500">*</span></Label>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          value={newUserForm.password}
                          onChange={(e) => setNewUserForm((prev) => ({ ...prev, password: e.target.value }))}
                          placeholder="Enter password"
                          autoComplete="new-password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        >
                          {showPassword ? (
                            <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                          ) : (
                            <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ── Personal Details ── */}
                  <div className="space-y-6">
                    <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide dark:text-white/50">
                      Personal Details <span className="normal-case text-xs font-normal">(optional)</span>
                    </h4>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Phone</Label>
                        <Input
                          type="tel"
                          name="phone"
                          value={newUserForm.phone}
                          onChange={(e) => setNewUserForm((prev) => ({ ...prev, phone: e.target.value }))}
                          placeholder="+1 234 567 8900"
                        />
                      </div>
                      <div>
                        <Label>Date of Birth</Label>
                        <Input
                          type="date"
                          name="dob"
                          value={newUserForm.dob}
                          onChange={(e) => setNewUserForm((prev) => ({ ...prev, dob: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Bio</Label>
                      <textarea
                        name="bio"
                        value={newUserForm.bio}
                        onChange={(e) => setNewUserForm((prev) => ({ ...prev, bio: e.target.value }))}
                        placeholder="Tell us a bit about this user..."
                        rows={3}
                        className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-white/10 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* <div>
                        <Label>Profile Picture URL</Label>
                        <Input
                          type="url"
                          name="profile_picture_url"
                          value={newUserForm.profile_picture_url}
                          onChange={(e) => setNewUserForm((prev) => ({ ...prev, profile_picture_url: e.target.value }))}
                          placeholder="https://..."
                        />
                      </div> */}
                      <div>
                        <Label>Personal Meet Link</Label>
                        <Input
                          type="url"
                          name="personal_meet_link"
                          value={newUserForm.personal_meet_link}
                          onChange={(e) => setNewUserForm((prev) => ({ ...prev, personal_meet_link: e.target.value }))}
                          placeholder="https://meet.google.com/..."
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Syllabus URL</Label>
                      <Input
                        type="url"
                        name="syllabus_url"
                        value={newUserForm.syllabus_url}
                        onChange={(e) => setNewUserForm((prev) => ({ ...prev, syllabus_url: e.target.value }))}
                        placeholder="https://..."
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="added_in_whatsapp"
                        checked={newUserForm.added_in_whatsapp}
                        onChange={(e) => setNewUserForm((prev) => ({ ...prev, added_in_whatsapp: e.target.checked }))}
                        className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-white/10"
                      />
                      <label htmlFor="added_in_whatsapp" className="text-sm text-gray-700 dark:text-white/80">
                        Added in WhatsApp
                      </label>
                    </div>
                  </div>

                  {/* ── Location ── */}
                  <div className="space-y-6">
                    <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide dark:text-white/50">
                      Location <span className="normal-case text-xs font-normal">(optional)</span>
                    </h4>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>City</Label>
                        <Input
                          name="city"
                          value={newUserForm.city}
                          onChange={(e) => setNewUserForm((prev) => ({ ...prev, city: e.target.value }))}
                          placeholder="New York"
                        />
                      </div>
                      <div>
                        <Label>State</Label>
                        <Input
                          name="state"
                          value={newUserForm.state}
                          onChange={(e) => setNewUserForm((prev) => ({ ...prev, state: e.target.value }))}
                          placeholder="NY"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Country</Label>
                        <Input
                          name="country"
                          value={newUserForm.country}
                          onChange={(e) => setNewUserForm((prev) => ({ ...prev, country: e.target.value }))}
                          placeholder="United States"
                        />
                      </div>
                      <div>
                        <Label>Zipcode</Label>
                        <Input
                          name="zipcode"
                          value={newUserForm.zipcode}
                          onChange={(e) => setNewUserForm((prev) => ({ ...prev, zipcode: e.target.value }))}
                          placeholder="10001"
                        />
                      </div>
                    </div>
                  </div>

                  {/* ── Chess IDs ── */}
                  <div className="space-y-6">
                    <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide dark:text-white/50">
                      Chess Profiles <span className="normal-case text-xs font-normal">(optional)</span>
                    </h4>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Lichess Username</Label>
                        <Input
                          name="lichess_username"
                          value={newUserForm.lichess_username}
                          onChange={(e) => setNewUserForm((prev) => ({ ...prev, lichess_username: e.target.value }))}
                          placeholder="lichess_handle"
                        />
                      </div>
                      <div>
                        <Label>Chess.com Username</Label>
                        <Input
                          name="chesscom_username"
                          value={newUserForm.chesscom_username}
                          onChange={(e) => setNewUserForm((prev) => ({ ...prev, chesscom_username: e.target.value }))}
                          placeholder="chesscom_handle"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>USCF ID</Label>
                        <Input
                          name="uscf_id"
                          value={newUserForm.uscf_id}
                          onChange={(e) => setNewUserForm((prev) => ({ ...prev, uscf_id: e.target.value }))}
                          placeholder="12345678"
                        />
                      </div>
                      <div>
                        <Label>FIDE ID</Label>
                        <Input
                          name="fide_id"
                          value={newUserForm.fide_id}
                          onChange={(e) => setNewUserForm((prev) => ({ ...prev, fide_id: e.target.value }))}
                          placeholder="12345678"
                        />
                      </div>
                    </div>
                  </div>

                  {/* ── Actions ── */}
                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="outline"
                      onClick={() =>
                        setNewUserForm({
                          email: "",
                          password: "",
                          first_name: "",
                          last_name: "",
                          role: UserRole.STUDENT,
                          phone: "",
                          dob: "",
                          bio: "",
                          personal_meet_link: "",
                          syllabus_url: "",
                          added_in_whatsapp: false,
                          city: "",
                          state: "",
                          country: "",
                          zipcode: "",
                          lichess_username: "",
                          chesscom_username: "",
                          uscf_id: "",
                          fide_id: "",
                        })
                      }
                      type="button"
                    >
                      Clear
                    </Button>
                    <Button type="submit" disabled={creatingUser}>
                      {creatingUser ? "Creating User..." : "Create User"}
                    </Button>
                    
                  </div>

                </div>
              </form>
            </div>
            {/* <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]"> */}
              <div className="border-b border-gray-100 dark:border-white/[0.05] px-5 py-4">
                <h3 className="font-semibold text-gray-800 text-theme-base dark:text-white/90">
                  Done creating user? Add Referral Relationship...
                </h3>
              </div>
              <div className="p-6">
                <button
                  onClick={() => setShowAddRelationshipModal(true)}
                  className="px-6 py-3 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition font-medium"
                >
                  + Add New Referral
                </button>
                <p className="text-gray-600 dark:text-gray-400 text-theme-sm mt-4">
                  Create a new referral relationship between two users by specifying the referrer, referee, and relationship type.
                </p>
              </div>
            {/* </div> */}
          </div>
        )}

        {/* Manage Users Tab */}
        {activeTab === "manage-users" && (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="border-b border-gray-100 dark:border-white/[0.05] px-5 py-4 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800 text-theme-base dark:text-white/90">
                Manage Users
              </h3>
              <div className="w-48">
                <Select
                  options={[
                    { value: "all", label: "All Roles" },
                    { value: UserRole.STUDENT, label: "Students" },
                    { value: UserRole.COACH, label: "Coaches" },
                    { value: UserRole.MENTOR_COACH, label: "Mentors" },
                  ]}
                  placeholder="Filter by Role"
                  onChange={(val) => setManageRoleFilter(val)}
                  className="text-theme-xs"
                />
              </div>
            </div>
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Name</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Email</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">Role</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">Status</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">Action</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {(() => {
                    const filtered = allUsers
                      .filter((u) => u.approved)
                      .filter((u) => u.role?.toLowerCase() !== UserRole.ADMIN)
                      .filter((u) =>
                        manageRoleFilter === "all"
                          ? true
                          : u.role?.toLowerCase() === manageRoleFilter
                      );

                    if (filtered.length === 0) {
                      return (
                        <TableRow>
                          <TableCell colSpan={5} className="px-5 py-8 text-center text-gray-500 text-theme-sm">
                            No users found
                          </TableCell>
                        </TableRow>
                      );
                    }

                    return filtered.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="px-5 py-4 text-start">
                          <div className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                            {u.first_name} {u.last_name}
                          </div>
                          <div className="text-gray-500 text-theme-xs dark:text-gray-400 mt-0.5">
                            {u.id}
                          </div>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start">
                          <span className="text-gray-700 text-theme-sm dark:text-gray-300">{u.email}</span>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-center">
                          <Badge
                            size="sm"
                            color={
                              u.role?.toLowerCase() === UserRole.MENTOR_COACH
                                ? "primary"
                                : u.role?.toLowerCase() === UserRole.COACH
                                  ? "info"
                                  : "light"
                            }
                          >
                            {u.role?.toLowerCase() === UserRole.MENTOR_COACH
                              ? "Mentor"
                              : u.role?.charAt(0).toUpperCase() + u.role?.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-center">
                          <Badge size="sm" color={u.active ? "success" : "error"}>
                            {u.active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-center">
                          <Button
                            size="sm"
                            variant={u.active ? "outline" : "primary"}
                            onClick={() => {
                              const action = u.active ? "deactivate" : "activate";
                              if (confirm(`Are you sure you want to ${action} ${u.first_name} ${u.last_name}?`)) {
                                toggleActiveMutation.mutate({ userId: u.id, active: !u.active });
                              }
                            }}
                            disabled={toggleActiveMutation.isPending}
                          >
                            {u.active ? "Deactivate" : "Activate"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ));
                  })()}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>

      {/* Add Relationship Modal */}
      {showAddRelationshipModal && (
        <AddRelationshipModal
          onClose={() => setShowAddRelationshipModal(false)}
          onSuccess={() => setShowAddRelationshipModal(false)}
        />
      )}
    </div>
  );
}

