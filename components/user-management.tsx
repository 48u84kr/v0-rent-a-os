"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast"
import { ds, cn } from "@/lib/design-system"
import {
  Users,
  Shield,
  Briefcase,
  Search,
  Loader2,
  UserCog,
  Mail,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

interface Profile {
  id: string
  first_name: string | null
  last_name: string | null
  role: string
  avatar_url: string | null
  created_at: string
  updated_at: string
  email?: string
}

export function UserManagement() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [pendingRole, setPendingRole] = useState("")
  const [saving, setSaving] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const usersPerPage = 10
  const { toast } = useToast()

  const fetchProfiles = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()

      // Fetch profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError)
        toast({
          title: "Error",
          description: "Failed to load user profiles.",
          variant: "destructive",
        })
        return
      }

      // Fetch auth users to get emails (via admin API won't work on client, so we use a workaround)
      // We'll store email from the auth user metadata instead
      const { data: { user: currentUser } } = await supabase.auth.getUser()

      // Map profiles - email will come from auth metadata if available
      const mappedProfiles = (profilesData || []).map((p) => ({
        ...p,
        email: undefined as string | undefined,
      }))

      setProfiles(mappedProfiles)
    } catch (err) {
      console.error("Error:", err)
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchProfiles()
  }, [fetchProfiles])

  const handleRoleChange = async () => {
    if (!selectedUser || !pendingRole) return
    setSaving(true)

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("profiles")
        .update({ role: pendingRole, updated_at: new Date().toISOString() })
        .eq("id", selectedUser.id)

      if (error) {
        console.error("Error updating role:", error)
        toast({
          title: "Error",
          description: "Failed to update user role.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Role Updated",
          description: `User role has been changed to ${pendingRole}.`,
        })
        setProfiles((prev) =>
          prev.map((p) =>
            p.id === selectedUser.id ? { ...p, role: pendingRole } : p
          )
        )
        setIsEditOpen(false)
        setIsConfirmOpen(false)
        setSelectedUser(null)
      }
    } catch (err) {
      console.error("Error:", err)
    } finally {
      setSaving(false)
    }
  }

  const openEditDialog = (profile: Profile) => {
    setSelectedUser(profile)
    setPendingRole(profile.role)
    setIsEditOpen(true)
  }

  const confirmRoleChange = () => {
    if (pendingRole !== selectedUser?.role) {
      setIsConfirmOpen(true)
    } else {
      setIsEditOpen(false)
    }
  }

  // Filter and search
  const filteredProfiles = profiles.filter((p) => {
    const matchesSearch =
      searchQuery === "" ||
      (p.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (p.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesRole = roleFilter === "all" || p.role === roleFilter

    return matchesSearch && matchesRole
  })

  // Pagination
  const totalPages = Math.ceil(filteredProfiles.length / usersPerPage)
  const paginatedProfiles = filteredProfiles.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  )

  // Stats
  const totalUsers = profiles.length
  const adminCount = profiles.filter((p) => p.role === "admin").length
  const investorCount = profiles.filter((p) => p.role === "investor").length

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return (
          <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20">
            <Shield className="w-3 h-3 mr-1" />
            Admin
          </Badge>
        )
      case "investor":
        return (
          <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20">
            <Briefcase className="w-3 h-3 mr-1" />
            Investor
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary">
            {role}
          </Badge>
        )
    }
  }

  const getInitials = (profile: Profile) => {
    const first = profile.first_name?.[0]?.toUpperCase() || ""
    const last = profile.last_name?.[0]?.toUpperCase() || ""
    return first + last || "?"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">Manage user roles and access permissions</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className={cn(ds.iconContainer.withRotation("primary"), "w-12 h-12")}>
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{totalUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Admins</p>
                <p className="text-2xl font-bold">{adminCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Investors</p>
                <p className="text-2xl font-bold">{investorCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="rounded-2xl">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or ID..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="pl-10 rounded-xl"
              />
            </div>
            <Select
              value={roleFilter}
              onValueChange={(v) => {
                setRoleFilter(v)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-full sm:w-40 rounded-xl">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="investor">Investor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            Registered Users ({filteredProfiles.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : paginatedProfiles.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No users found</p>
              <p className="text-sm">Try adjusting your search or filter.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {paginatedProfiles.map((profile) => (
                <div
                  key={profile.id}
                  className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:bg-accent/50 transition-colors"
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-sm font-semibold text-primary">
                    {getInitials(profile)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {profile.first_name && profile.last_name
                        ? `${profile.first_name} ${profile.last_name}`
                        : "Unnamed User"}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>
                        Joined{" "}
                        {new Date(profile.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Role Badge */}
                  <div className="hidden sm:block">
                    {getRoleBadge(profile.role)}
                  </div>

                  {/* Edit Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl shrink-0"
                    onClick={() => openEditDialog(profile)}
                  >
                    <UserCog className="w-4 h-4 mr-1.5" />
                    Manage
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 mt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Role Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Manage User Role</DialogTitle>
            <DialogDescription>
              Change the role and access permissions for this user.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6 py-4">
              {/* User Info */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-base font-semibold text-primary">
                  {getInitials(selectedUser)}
                </div>
                <div>
                  <p className="font-medium">
                    {selectedUser.first_name && selectedUser.last_name
                      ? `${selectedUser.first_name} ${selectedUser.last_name}`
                      : "Unnamed User"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    ID: {selectedUser.id.slice(0, 8)}...
                  </p>
                </div>
              </div>

              {/* Current Role */}
              <div className="space-y-2">
                <Label>Current Role</Label>
                <div>{getRoleBadge(selectedUser.role)}</div>
              </div>

              {/* New Role */}
              <div className="space-y-2">
                <Label>Assign New Role</Label>
                <Select value={pendingRole} onValueChange={setPendingRole}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-blue-600" />
                        Admin - Full dashboard access
                      </div>
                    </SelectItem>
                    <SelectItem value="investor">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-amber-600" />
                        Investor - Investor portal only
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {pendingRole === "admin"
                    ? "Admins can access all dashboard tools, manage inventory, orders, customers, subscriptions, and user roles."
                    : "Investors can only view the Investor Portal with device investment details and returns."}
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => setIsEditOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="rounded-xl"
                  onClick={confirmRoleChange}
                  disabled={pendingRole === selectedUser.role}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Role Change */}
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Role Change</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to change{" "}
              <strong>
                {selectedUser?.first_name} {selectedUser?.last_name}
              </strong>
              {"'s"} role from{" "}
              <strong className="capitalize">{selectedUser?.role}</strong> to{" "}
              <strong className="capitalize">{pendingRole}</strong>. This will
              immediately change their access permissions.
              {pendingRole === "investor" && (
                <span className="block mt-2 text-amber-600">
                  Warning: This user will lose access to all admin tools and can
                  only view the Investor Portal.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl"
              onClick={handleRoleChange}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Confirm Change"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
