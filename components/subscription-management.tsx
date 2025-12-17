"use client"

import { useState, useEffect } from "react"
import {
  CreditCard,
  Calendar,
  Search,
  Download,
  MoreVertical,
  Pencil,
  Trash2,
  Eye,
  Check,
  RefreshCw,
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Smartphone,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { ds, cn } from "@/lib/design-system"

interface Subscription {
  id: number
  order_id: number | null
  customer_id: number | null
  device_id: number | null
  status: string
  start_date: string
  end_date: string | null
  monthly_rate: number
  notes: string | null
  created_at: string
  updated_at: string
  customer_name?: string
  customer_email?: string
  customer_phone?: string
  device_name?: string
  device_serial?: string
  device_brand?: string
}

interface Customer {
  id: number
  name: string
  email: string
  phone: string
}

interface Device {
  id: number // Added id for device table
  serial_number: string
  name: string
  brand: string
  status: string // Added status to device table
}

export function SubscriptionManagement() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [stats, setStats] = useState({
    totalSubscriptions: 0,
    activeSubscriptions: 0,
    monthlyRevenue: 0,
    renewalsDue: 0,
  })

  // Dialog states
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    customer_id: "",
    device_id: "", // Changed from device_serial to device_id
    subscription_length_months: "12", // This will need to be mapped to start_date and end_date
    subscription_price: "", // This will need to be mapped to monthly_rate
    status: "active",
  })

  const supabase = createClient()

  useEffect(() => {
    fetchSubscriptions()
    fetchCustomers()
    fetchDevices()
    fetchStats()
  }, [])

  const fetchSubscriptions = async () => {
    setLoading(true)
    const { data, error } = await supabase.from("subscriptions").select("*").order("created_at", { ascending: false })

    if (!error && data) {
      const enrichedData = await Promise.all(
        data.map(async (sub) => {
          let customerData = { name: "Unknown", email: "", phone: "" }
          let deviceData = { name: "", brand: "", serial_number: "" }

          // Fetch customer if customer_id exists
          if (sub.customer_id) {
            const { data: customer } = await supabase
              .from("customers")
              .select("name, email, phone")
              .eq("id", sub.customer_id)
              .single()
            if (customer) {
              customerData = customer
            }
          }

          // Fetch device using device_id
          if (sub.device_id) {
            const { data: device } = await supabase
              .from("devices")
              .select("name, brand, serial_number")
              .eq("id", sub.device_id)
              .single()
            if (device) {
              deviceData = device
            }
          }

          return {
            ...sub,
            customer_name: customerData.name || "Unknown",
            customer_email: customerData.email || "",
            customer_phone: customerData.phone || "",
            device_name: deviceData.name || "",
            device_serial: deviceData.serial_number || "",
            device_brand: deviceData.brand || "",
          }
        }),
      )
      setSubscriptions(enrichedData)
    } else {
      setSubscriptions([])
    }
    setLoading(false)
  }

  const fetchCustomers = async () => {
    const { data } = await supabase.from("customers").select("id, name, email, phone")
    if (data) setCustomers(data)
  }

  const fetchDevices = async () => {
    // Fetch devices with status 'available'
    const { data } = await supabase.from("devices").select("id, serial_number, name, brand").eq("status", "available")
    if (data) setDevices(data)
  }

  const fetchStats = async () => {
    // Total subscriptions
    const { count: total } = await supabase.from("subscriptions").select("*", { count: "exact", head: true })

    // Active subscriptions
    const { count: active } = await supabase
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("status", "active")

    // Monthly revenue (sum of subscription_price for active)
    const { data: revenueData } = await supabase.from("subscriptions").select("monthly_rate").eq("status", "active")

    const monthlyRevenue = revenueData?.reduce((sum, sub) => sum + (sub.monthly_rate || 0), 0) || 0

    // Renewals due (subscriptions created more than subscription_length_months ago)
    const { data: renewalData } = await supabase.from("subscriptions").select("*").eq("status", "active")

    const now = new Date()
    const renewalsDue =
      renewalData?.filter((sub) => {
        const endDate = new Date(sub.end_date || sub.start_date) // Use end_date if available, else start_date
        const daysUntilRenewal = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        return daysUntilRenewal <= 30 && daysUntilRenewal > 0
      }).length || 0

    setStats({
      totalSubscriptions: total || 0,
      activeSubscriptions: active || 0,
      monthlyRevenue,
      renewalsDue,
    })
  }

  const handleEditSubscription = async () => {
    if (!selectedSubscription) return
    setIsSaving(true)

    // Recalculate end_date if duration changes
    let newEndDate = selectedSubscription.end_date
    if (Number.parseInt(formData.subscription_length_months) !== getSubscriptionDurationMonths(selectedSubscription)) {
      const startDate = new Date(selectedSubscription.start_date)
      const durationMonths = Number.parseInt(formData.subscription_length_months)
      const calculatedEndDate = new Date(startDate)
      calculatedEndDate.setMonth(calculatedEndDate.getMonth() + durationMonths)
      newEndDate = calculatedEndDate.toISOString()
    }

    const { error } = await supabase
      .from("subscriptions")
      .update({
        monthly_rate: Number.parseFloat(formData.subscription_price),
        status: formData.status,
        end_date: newEndDate,
      })
      .eq("id", selectedSubscription.id)

    if (!error) {
      setIsEditDialogOpen(false)
      fetchSubscriptions()
      fetchStats()
    }
    setIsSaving(false)
  }

  const handleDeleteSubscription = async () => {
    if (!selectedSubscription) return
    setIsSaving(true)

    // Set device back to available
    await supabase.from("devices").update({ status: "available" }).eq("id", selectedSubscription.device_id) // Changed from device_serial to device_id

    const { error } = await supabase.from("subscriptions").delete().eq("id", selectedSubscription.id)

    if (!error) {
      setIsDeleteDialogOpen(false)
      fetchSubscriptions()
      fetchStats()
      fetchDevices()
    }
    setIsSaving(false)
  }

  const resetForm = () => {
    setFormData({
      customer_id: "",
      device_id: "", // Changed from device_serial to device_id
      subscription_length_months: "12",
      subscription_price: "",
      status: "active",
    })
  }

  const openEditDialog = (subscription: Subscription) => {
    setSelectedSubscription(subscription)
    setFormData({
      customer_id: subscription.customer_id?.toString() || "",
      device_id: subscription.device_id?.toString() || "", // Changed from device_serial to device_id
      subscription_length_months: getSubscriptionDurationMonths(subscription).toString(),
      subscription_price: subscription.monthly_rate?.toString() || "",
      status: subscription.status || "active",
    })
    setIsEditDialogOpen(true)
  }

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return (
          <Badge className="bg-success-muted text-success dark:bg-success-muted dark:text-success rounded-lg">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Active
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-warning-muted text-warning dark:bg-warning-muted dark:text-warning rounded-lg">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      case "cancelled":
        return (
          <Badge className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive rounded-lg">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelled
          </Badge>
        )
      case "expired":
        return (
          <Badge className="bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground rounded-lg">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Expired
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="rounded-lg">
            {status}
          </Badge>
        )
    }
  }

  const getSubscriptionAge = (createdAt: string) => {
    const created = new Date(createdAt)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - created.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 30) return `${diffDays} days`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`
    return `${Math.floor(diffDays / 365)} years`
  }

  const getRenewalDate = (createdAt: string, months: number) => {
    const created = new Date(createdAt)
    created.setMonth(created.getMonth() + months)
    return created.toLocaleDateString()
  }

  // Helper to get subscription duration in months from start and end dates
  const getSubscriptionDurationMonths = (subscription: Subscription) => {
    if (!subscription.start_date || !subscription.end_date) return 0
    const start = new Date(subscription.start_date)
    const end = new Date(subscription.end_date)
    const diffYears = end.getFullYear() - start.getFullYear()
    const diffMonths = end.getMonth() - start.getMonth()
    return diffYears * 12 + diffMonths
  }

  const getDaysUntilRenewal = (createdAt: string, months: number) => {
    const created = new Date(createdAt)
    created.setMonth(created.getMonth() + months)
    const now = new Date()
    const diffTime = created.getTime() - now.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const filteredSubscriptions = subscriptions.filter((sub) => {
    const matchesSearch =
      (sub.customer_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sub.device_serial || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sub.device_name || "").toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || (sub.status || "").toLowerCase() === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className={cn("text-3xl font-bold tracking-tight", "flex items-center gap-3")}>
            <div className={ds.iconContainer.withRotation("chart-1")}>
              <CreditCard className="h-5 w-5 text-chart-1" />
            </div>
            Subscriptions
          </h1>
          <p className="text-muted-foreground">Track and manage all device rental subscriptions</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className={cn(ds.button.secondary, "relative overflow-hidden group")}>
            <div className={ds.overlay.secondaryGradientOverlay} />
            <Download className="w-4 h-4 mr-2 relative z-10" />
            <span className="relative z-10">Export</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Subscriptions */}
        <Card className={cn(ds.card.lift)} style={{ animationDelay: "0ms", animationFillMode: "both" }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Subscriptions</CardTitle>
            <div className={ds.iconContainer.withRotation("blue")}>
              <CreditCard className={cn("h-5 w-5", ds.iconColor.blue)} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalSubscriptions}</div>
            <p className="text-xs text-muted-foreground mt-1">All time subscriptions</p>
          </CardContent>
        </Card>

        {/* Active Subscriptions */}
        <Card className={cn(ds.card.lift)} style={{ animationDelay: "100ms", animationFillMode: "both" }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Subscriptions</CardTitle>
            <div className={ds.iconContainer.withRotation("green")}>
              <CheckCircle2 className={cn("h-5 w-5", ds.iconColor.green)} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently active</p>
          </CardContent>
        </Card>

        {/* Monthly Recurring Revenue */}
        <Card className={cn(ds.card.lift)} style={{ animationDelay: "200ms", animationFillMode: "both" }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Recurring Revenue</CardTitle>
            <div className={ds.iconContainer.withRotation("purple")}>
              <DollarSign className={cn("h-5 w-5", ds.iconColor.purple)} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">AED {stats.monthlyRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">From active subscriptions</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search subscriptions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn("pl-10", ds.input.search)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className={cn("w-[180px]", ds.input.select)}>
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Subscription Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredSubscriptions.length === 0 ? (
        <Card className={ds.card.base}>
          <CardContent className="p-6 text-center text-muted-foreground">
            <Smartphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No subscriptions found</p>
            <p className="text-sm mt-2">Subscriptions are automatically created when orders are marked as delivered</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubscriptions.map((subscription, index) => {
            const daysUntilRenewal = getDaysUntilRenewal(
              subscription.created_at,
              getSubscriptionDurationMonths(subscription) || 12,
            )
            const isRenewalSoon = daysUntilRenewal <= 30 && daysUntilRenewal > 0

            return (
              <Card
                key={subscription.id}
                className={cn(ds.card.liftStrong, "animate-in fade-in slide-in-from-bottom-4 duration-500")}
                style={{ animationDelay: `${index * 100}ms`, animationFillMode: "both" }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={ds.iconContainer.avatar}>{subscription.customer_name?.charAt(0) || "?"}</div>
                      <div>
                        <h3 className="font-semibold text-lg group-hover:text-blue-600 transition-colors duration-200">
                          {subscription.customer_name}
                        </h3>
                        <p className="text-sm text-muted-foreground">SUB-{subscription.id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={ds.button.iconBlue}
                        onClick={() => {
                          setSelectedSubscription(subscription)
                          setIsViewDialogOpen(true)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className={ds.button.icon}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className={ds.dropdown.content}>
                          <DropdownMenuItem
                            onClick={() => openEditDialog(subscription)}
                            className={ds.dropdown.itemBlue}
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedSubscription(subscription)
                              setIsDeleteDialogOpen(true)
                            }}
                            className={ds.dropdown.itemRed}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Device Info */}
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium truncate">
                      {subscription.device_brand} {subscription.device_name}
                    </span>
                  </div>

                  {/* Subscription Details */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Duration</p>
                      <p className="font-semibold">{getSubscriptionDurationMonths(subscription) || 12} months</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Monthly Price</p>
                      <p className="font-semibold text-green-600">
                        AED {subscription.monthly_rate?.toLocaleString() || 0}
                      </p>
                    </div>
                  </div>

                  {/* Renewal Info */}
                  {subscription.status === "active" && (
                    <div
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-lg",
                        isRenewalSoon ? "bg-orange-50 dark:bg-orange-950/30" : "bg-gray-50 dark:bg-gray-800/50",
                      )}
                    >
                      <Calendar
                        className={cn("h-4 w-4", isRenewalSoon ? "text-orange-600" : "text-muted-foreground")}
                      />
                      <span className={cn("text-sm", isRenewalSoon && "text-orange-600 font-medium")}>
                        Renews {subscription.end_date?.split("T")[0]}
                        {isRenewalSoon && ` (${daysUntilRenewal} days)`}
                      </span>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="pt-3 border-t flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>Active for {getSubscriptionAge(subscription.created_at)}</span>
                    </div>
                    {getStatusBadge(subscription.status)}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Edit Subscription Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className={ds.dialog.content}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Pencil className="h-5 w-5 text-white" />
              </div>
              Edit Subscription
            </DialogTitle>
            <DialogDescription>Update subscription details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Duration (months)</Label>
                <Select
                  value={formData.subscription_length_months}
                  onValueChange={(v) => setFormData({ ...formData, subscription_length_months: v })}
                >
                  <SelectTrigger className={ds.input.select}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="1">1 month</SelectItem>
                    <SelectItem value="3">3 months</SelectItem>
                    <SelectItem value="6">6 months</SelectItem>
                    <SelectItem value="12">12 months</SelectItem>
                    <SelectItem value="24">24 months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Monthly Price (AED)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={formData.subscription_price}
                  onChange={(e) => setFormData({ ...formData, subscription_price: e.target.value })}
                  className={ds.input.base}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger className={ds.input.select}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className={ds.button.cancel}>
              Cancel
            </Button>
            <Button
              onClick={handleEditSubscription}
              disabled={isSaving}
              className={cn(ds.button.primaryIndigo, "text-white")}
            >
              {isSaving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className={ds.dialog.content}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950 flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              Delete Subscription
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this subscription for{" "}
              <span className="font-semibold">{selectedSubscription?.customer_name}</span>? This action cannot be undone
              and will make the device available again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className={ds.button.cancel}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteSubscription}
              disabled={isSaving}
              className="rounded-xl hover:scale-105 active:scale-95 transition-transform duration-200"
            >
              {isSaving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Delete Subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
