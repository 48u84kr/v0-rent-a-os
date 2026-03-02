"use client"

import { useState, useEffect, useCallback } from "react"
import {
  TrendingUp,
  DollarSign,
  Package,
  Calendar,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronUp,
  Wallet,
  PiggyBank,
  Calculator,
  CheckCircle2,
  Circle,
  CreditCard,
  UserPlus,
  X,
  Check,
  AlertTriangle,
  SlidersHorizontal,
} from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

interface Device {
  id: number
  name: string | null
  brand: string | null
  category: string | null
  serial_number: string | null
  storage: string | null
  color: string | null
  condition: string | null
  acquisition_cost_aed: number | null
  investor_id: string | null
  investor_paid_status: string | null
  investor_assigned_at: string | null
  created_at: string
}

interface DeviceWithInvestorData extends Device {
  investorReturn: number
  monthlyPayment: number
  totalProfit: number
}

interface DeviceWithSubscription extends Device {
  monthly_rate: number
  subscription_status: string
}

interface InvestorUser {
  id: string
  first_name: string | null
  last_name: string | null
  role: string
}

const INVESTOR_PROFIT_RATE = 0.15
const PAYMENT_MONTHS = 24

interface InvestorPortalProps {
  userRole?: string
}

export function InvestorPortal({ userRole = "investor" }: InvestorPortalProps) {
  const [devices, setDevices] = useState<DeviceWithInvestorData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState<string>("created_at")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const { toast } = useToast()

  // Admin: Set Paid Devices dialog
  const [isPaidDialogOpen, setIsPaidDialogOpen] = useState(false)
  const [selectedPaidDeviceIds, setSelectedPaidDeviceIds] = useState<Set<number>>(new Set())
  const [isUpdatingPaid, setIsUpdatingPaid] = useState(false)
  const [paidDialogSearch, setPaidDialogSearch] = useState("")

  // Admin: Assign Devices to Investor dialog
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [investors, setInvestors] = useState<InvestorUser[]>([])
  const [selectedInvestorId, setSelectedInvestorId] = useState<string>("")
  const [availableSubDevices, setAvailableSubDevices] = useState<DeviceWithSubscription[]>([])
  const [sliderValue, setSliderValue] = useState(0)
  const [selectedAssignDeviceIds, setSelectedAssignDeviceIds] = useState<Set<number>>(new Set())
  const [isAssigning, setIsAssigning] = useState(false)
  const [isLoadingAvailable, setIsLoadingAvailable] = useState(false)

  // Summary stats
  const [totalInvested, setTotalInvested] = useState(0)
  const [totalReturn, setTotalReturn] = useState(0)
  const [totalProfit, setTotalProfit] = useState(0)
  const [deviceCount, setDeviceCount] = useState(0)

  const isAdmin = userRole === "admin"

  const fetchDevices = useCallback(async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()

      let query = supabase
        .from("devices")
        .select("id, name, brand, category, serial_number, storage, color, condition, acquisition_cost_aed, investor_id, investor_paid_status, investor_assigned_at, created_at")
        .not("acquisition_cost_aed", "is", null)

      // Investors only see devices assigned to them
      if (!isAdmin) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          query = query.eq("investor_id", user.id)
        }
      } else {
        // Admins see devices assigned to any investor
        query = query.not("investor_id", "is", null)
      }

      const { data, error } = await query.order(sortField, { ascending: sortDirection === "asc" })

      if (error) {
        console.error("Error fetching devices:", error)
        return
      }

      const devicesWithInvestorData: DeviceWithInvestorData[] = (data || []).map((device) => {
        const cost = device.acquisition_cost_aed || 0
        const investorReturn = cost * (1 + INVESTOR_PROFIT_RATE)
        const monthlyPayment = investorReturn / PAYMENT_MONTHS
        const profit = cost * INVESTOR_PROFIT_RATE
        return { ...device, investorReturn, monthlyPayment, totalProfit: profit }
      })

      setDevices(devicesWithInvestorData)

      const totals = devicesWithInvestorData.reduce(
        (acc, device) => {
          acc.invested += device.acquisition_cost_aed || 0
          acc.return += device.investorReturn
          acc.profit += device.totalProfit
          return acc
        },
        { invested: 0, return: 0, profit: 0 }
      )

      setTotalInvested(totals.invested)
      setTotalReturn(totals.return)
      setTotalProfit(totals.profit)
      setDeviceCount(devicesWithInvestorData.length)
    } catch (err) {
      console.error("Error:", err)
    } finally {
      setIsLoading(false)
    }
  }, [sortField, sortDirection, isAdmin])

  useEffect(() => {
    fetchDevices()
  }, [fetchDevices])

  // Admin: fetch investors for assign dialog
  const fetchInvestors = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, role")
      .eq("role", "investor")

    if (!error && data) {
      setInvestors(data)
    }
  }

  // Admin: fetch unassigned devices that have active subscriptions
  const fetchAvailableDevices = async () => {
    setIsLoadingAvailable(true)
    try {
      const supabase = createClient()

      // First get all active subscriptions with device_id and monthly_rate
      const { data: subs, error: subError } = await supabase
        .from("subscriptions")
        .select("device_id, monthly_rate, status")
        .eq("status", "active")
        .not("device_id", "is", null)
        .not("monthly_rate", "is", null)

      if (subError || !subs || subs.length === 0) {
        setAvailableSubDevices([])
        return
      }

      // Get the device IDs that have active subscriptions
      const activeDeviceIds = subs.map((s) => s.device_id).filter(Boolean) as number[]

      // Fetch those devices that are NOT yet assigned to an investor
      const { data: deviceData, error: devError } = await supabase
        .from("devices")
        .select("id, name, brand, category, serial_number, storage, color, condition, acquisition_cost_aed, investor_id, investor_paid_status, investor_assigned_at, created_at")
        .in("id", activeDeviceIds)
        .is("investor_id", null)

      if (devError || !deviceData) {
        setAvailableSubDevices([])
        return
      }

      // Build a map of device_id -> subscription info
      const subMap = new Map<number, { monthly_rate: number; status: string }>()
      for (const s of subs) {
        if (s.device_id && s.monthly_rate) {
          subMap.set(s.device_id, { monthly_rate: s.monthly_rate, status: s.status })
        }
      }

      // Merge and sort by monthly rate ascending (cheapest first)
      const merged: DeviceWithSubscription[] = deviceData
        .filter((d) => subMap.has(d.id))
        .map((d) => ({
          ...d,
          monthly_rate: subMap.get(d.id)!.monthly_rate,
          subscription_status: subMap.get(d.id)!.status,
        }))
        .sort((a, b) => a.monthly_rate - b.monthly_rate)

      setAvailableSubDevices(merged)
    } catch (err) {
      console.error("Error fetching available devices:", err)
      setAvailableSubDevices([])
    } finally {
      setIsLoadingAvailable(false)
    }
  }

  // Open Set Paid dialog
  const openPaidDialog = () => {
    // Pre-select devices that are already marked as paid
    const paidIds = new Set(
      devices.filter((d) => d.investor_paid_status === "paid").map((d) => d.id)
    )
    setSelectedPaidDeviceIds(paidIds)
    setPaidDialogSearch("")
    setIsPaidDialogOpen(true)
  }

  // Toggle paid selection for a device
  const togglePaidDevice = (deviceId: number) => {
    setSelectedPaidDeviceIds((prev) => {
      const next = new Set(prev)
      if (next.has(deviceId)) {
        next.delete(deviceId)
      } else {
        next.add(deviceId)
      }
      return next
    })
  }

  // Confirm paid status changes
  const handleConfirmPaid = async () => {
    setIsUpdatingPaid(true)
    try {
      const supabase = createClient()

      // Update all investor-assigned devices: set paid or unpaid
      const updates = devices.map((device) => {
        const shouldBePaid = selectedPaidDeviceIds.has(device.id)
        return supabase
          .from("devices")
          .update({ investor_paid_status: shouldBePaid ? "paid" : "unpaid" })
          .eq("id", device.id)
      })

      await Promise.all(updates)

      toast({
        title: "Payment Status Updated",
        description: `${selectedPaidDeviceIds.size} device(s) marked as paid.`,
      })

      setIsPaidDialogOpen(false)
      fetchDevices()
    } catch (err) {
      console.error("Error updating paid status:", err)
      toast({
        title: "Error",
        description: "Failed to update payment status. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingPaid(false)
    }
  }

  // Open assign dialog
  const openAssignDialog = async () => {
    setSelectedInvestorId("")
    setSelectedAssignDeviceIds(new Set())
    setSliderValue(0)
    setIsAssignDialogOpen(true)
    await Promise.all([fetchInvestors(), fetchAvailableDevices()])
  }

  // Compute slider min/max from available devices
  const sliderMin = availableSubDevices.length > 0
    ? availableSubDevices[0].monthly_rate
    : 0
  const sliderMax = availableSubDevices.reduce((sum, d) => sum + d.monthly_rate, 0)

  // When slider value changes, auto-select devices sorted by cheapest first
  const handleSliderChange = (value: number[]) => {
    const targetAmount = value[0]
    setSliderValue(targetAmount)

    let runningTotal = 0
    const selected = new Set<number>()

    for (const device of availableSubDevices) {
      if (runningTotal + device.monthly_rate <= targetAmount) {
        runningTotal += device.monthly_rate
        selected.add(device.id)
      } else {
        break
      }
    }

    setSelectedAssignDeviceIds(selected)
  }

  // Calculate actual selected monthly total
  const selectedMonthlyTotal = availableSubDevices
    .filter((d) => selectedAssignDeviceIds.has(d.id))
    .reduce((sum, d) => sum + d.monthly_rate, 0)

  // Confirm assign devices to investor
  const handleConfirmAssign = async () => {
    if (!selectedInvestorId || selectedAssignDeviceIds.size === 0) return
    setIsAssigning(true)
    try {
      const supabase = createClient()
      const deviceIds = Array.from(selectedAssignDeviceIds)

      const { error } = await supabase
        .from("devices")
        .update({
          investor_id: selectedInvestorId,
          investor_paid_status: "unpaid",
          investor_assigned_at: new Date().toISOString(),
        })
        .in("id", deviceIds)

      if (error) throw error

      toast({
        title: "Devices Assigned",
        description: `${deviceIds.length} device(s) assigned to investor.`,
      })

      setIsAssignDialogOpen(false)
      fetchDevices()
    } catch (err) {
      console.error("Error assigning devices:", err)
      toast({
        title: "Error",
        description: "Failed to assign devices. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsAssigning(false)
    }
  }

  // Filter devices
  const filteredDevices = devices.filter((device) => {
    const matchesSearch =
      searchTerm === "" ||
      device.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.serial_number?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = categoryFilter === "all" || device.category === categoryFilter
    const matchesStatus = statusFilter === "all" || device.investor_paid_status === statusFilter

    return matchesSearch && matchesCategory && matchesStatus
  })

  const categories = [...new Set(devices.map((d) => d.category).filter(Boolean))]

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return null
    return sortDirection === "asc" ? (
      <ChevronUp className="h-4 w-4 inline ml-1" />
    ) : (
      <ChevronDown className="h-4 w-4 inline ml-1" />
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const getPaidBadge = (status: string | null) => {
    switch (status) {
      case "paid":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Paid
          </Badge>
        )
      case "in_progress":
        return (
          <Badge className="bg-amber-100 text-amber-700 border-amber-200 gap-1">
            <Circle className="h-3 w-3" />
            In Progress
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="gap-1 text-muted-foreground">
            <Circle className="h-3 w-3" />
            Unpaid
          </Badge>
        )
    }
  }

  // Filtered devices for the paid dialog
  const filteredPaidDialogDevices = devices.filter(
    (d) =>
      paidDialogSearch === "" ||
      d.name?.toLowerCase().includes(paidDialogSearch.toLowerCase()) ||
      d.brand?.toLowerCase().includes(paidDialogSearch.toLowerCase()) ||
      d.serial_number?.toLowerCase().includes(paidDialogSearch.toLowerCase())
  )

  // Compute selected device cost total for assign
  const selectedDeviceCostTotal = availableSubDevices
    .filter((d) => selectedAssignDeviceIds.has(d.id))
    .reduce((sum, d) => sum + (d.acquisition_cost_aed || 0), 0)

  const paidCount = devices.filter((d) => d.investor_paid_status === "paid").length
  const unpaidCount = devices.filter((d) => d.investor_paid_status !== "paid").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Investor Portal</h2>
          <p className="text-muted-foreground">
            {isAdmin
              ? "Manage investor device assignments and payment statuses"
              : "View your investment portfolio and expected returns"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <>
              <Button onClick={openAssignDialog} className="gap-2">
                <UserPlus className="h-4 w-4" />
                Assign Devices
              </Button>
              <Button
                onClick={openPaidDialog}
                variant="outline"
                className="gap-2 bg-transparent"
                disabled={devices.length === 0}
              >
                <CreditCard className="h-4 w-4" />
                Set Paid Devices
              </Button>
            </>
          )}
          <Button onClick={fetchDevices} variant="outline" className="gap-2 bg-transparent">
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(totalInvested)}</div>
                <p className="text-xs text-muted-foreground">
                  Across {deviceCount} devices
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Return</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(totalReturn)}
                </div>
                <p className="text-xs text-muted-foreground">Expected total payout</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(totalProfit)}
                </div>
                <p className="text-xs text-muted-foreground">15% return on investment</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payment Status</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {paidCount}/{deviceCount}
                </div>
                <p className="text-xs text-muted-foreground">
                  {paidCount} paid, {unpaidCount} remaining
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Table */}
      <Card>
        <CardHeader>
          <CardTitle>Investment Portfolio</CardTitle>
          <CardDescription>
            Detailed breakdown of each device investment with expected returns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, brand, or serial number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category || ""}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("name")}
                  >
                    Device <SortIcon field="name" />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("brand")}
                  >
                    Brand <SortIcon field="brand" />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("category")}
                  >
                    Category <SortIcon field="category" />
                  </TableHead>
                  <TableHead>Storage</TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50 text-right"
                    onClick={() => handleSort("acquisition_cost_aed")}
                  >
                    Device Cost <SortIcon field="acquisition_cost_aed" />
                  </TableHead>
                  <TableHead className="text-right">Total Return</TableHead>
                  <TableHead className="text-right">Monthly (24mo)</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={`skeleton-${i}`}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <TableCell key={`skeleton-${i}-${j}`}>
                          <Skeleton className="h-4 w-20" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filteredDevices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      {devices.length === 0
                        ? isAdmin
                          ? "No devices assigned to investors yet. Use 'Assign Devices' to get started."
                          : "No devices have been assigned to your portfolio yet."
                        : "No devices found matching your criteria."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDevices.map((device) => (
                    <TableRow key={device.id}>
                      <TableCell className="font-medium">
                        <div>
                          {device.name || "Unnamed Device"}
                          {device.serial_number && (
                            <div className="text-xs text-muted-foreground">
                              SN: {device.serial_number}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{device.brand || "-"}</TableCell>
                      <TableCell>
                        {device.category ? (
                          <Badge variant="outline">{device.category}</Badge>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>{device.storage || "-"}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(device.acquisition_cost_aed || 0)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-emerald-600">
                        {formatCurrency(device.investorReturn)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-medium">
                          {formatCurrency(device.monthlyPayment)}
                        </div>
                        <div className="text-xs text-muted-foreground">per month</div>
                      </TableCell>
                      <TableCell className="text-center">
                        {getPaidBadge(device.investor_paid_status)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Summary Footer */}
          {!isLoading && filteredDevices.length > 0 && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Showing:</span>{" "}
                  <span className="font-medium">{filteredDevices.length} devices</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Cost:</span>{" "}
                  <span className="font-medium">
                    {formatCurrency(
                      filteredDevices.reduce((sum, d) => sum + (d.acquisition_cost_aed || 0), 0)
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Return:</span>{" "}
                  <span className="font-medium text-emerald-600">
                    {formatCurrency(
                      filteredDevices.reduce((sum, d) => sum + d.investorReturn, 0)
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Monthly Total:</span>{" "}
                  <span className="font-medium">
                    {formatCurrency(
                      filteredDevices.reduce((sum, d) => sum + d.monthlyPayment, 0)
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ===== Set Paid Devices Dialog (Admin only) ===== */}
      <Dialog open={isPaidDialogOpen} onOpenChange={setIsPaidDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Set Paid Devices
            </DialogTitle>
            <DialogDescription>
              Select the devices that have been paid off to the investor.
              {selectedPaidDeviceIds.size > 0 && (
                <span className="ml-1 font-medium text-foreground">
                  {selectedPaidDeviceIds.size} selected
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search devices..."
                value={paidDialogSearch}
                onChange={(e) => setPaidDialogSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Quick actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="bg-transparent"
                onClick={() =>
                  setSelectedPaidDeviceIds(new Set(filteredPaidDialogDevices.map((d) => d.id)))
                }
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="bg-transparent"
                onClick={() => setSelectedPaidDeviceIds(new Set())}
              >
                Deselect All
              </Button>
            </div>

            {/* Device list */}
            <div className="flex-1 overflow-y-auto border rounded-lg divide-y min-h-0">
              {filteredPaidDialogDevices.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No devices found
                </div>
              ) : (
                filteredPaidDialogDevices.map((device) => {
                  const isSelected = selectedPaidDeviceIds.has(device.id)
                  return (
                    <button
                      type="button"
                      key={device.id}
                      className={cn(
                        "w-full flex items-center gap-4 p-4 text-left transition-colors hover:bg-muted/50",
                        isSelected && "bg-emerald-50 dark:bg-emerald-950/20"
                      )}
                      onClick={() => togglePaidDevice(device.id)}
                    >
                      <div
                        className={cn(
                          "w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors",
                          isSelected
                            ? "bg-emerald-600 border-emerald-600"
                            : "border-muted-foreground/30"
                        )}
                      >
                        {isSelected && <Check className="h-4 w-4 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {device.name || "Unnamed Device"}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          {device.brand && <span>{device.brand}</span>}
                          {device.serial_number && <span>SN: {device.serial_number}</span>}
                          {device.storage && <span>{device.storage}</span>}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-medium text-sm">
                          {formatCurrency(device.acquisition_cost_aed || 0)}
                        </div>
                        <div className="text-xs text-emerald-600">
                          Return: {formatCurrency(device.investorReturn)}
                        </div>
                      </div>
                      <div className="shrink-0">
                        {device.investor_paid_status === "paid" && !isSelected ? (
                          <Badge variant="outline" className="text-xs">Was Paid</Badge>
                        ) : isSelected ? (
                          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
                            Paid
                          </Badge>
                        ) : null}
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 pt-4 border-t">
            <div className="flex-1 text-sm text-muted-foreground">
              {selectedPaidDeviceIds.size} of {devices.length} devices will be marked as paid
            </div>
            <Button
              variant="outline"
              onClick={() => setIsPaidDialogOpen(false)}
              className="bg-transparent"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmPaid}
              disabled={isUpdatingPaid}
              className="gap-2"
            >
              {isUpdatingPaid ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Confirm Payment Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Assign Devices to Investor Dialog (Admin only) ===== */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5" />
              Assign Devices to Investor
            </DialogTitle>
            <DialogDescription>
              Select an investor, then use the slider to set the monthly payment budget. Devices are automatically assigned starting from the lowest monthly rate.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 flex-1 overflow-hidden flex flex-col">
            {/* Investor Selection */}
            <div className="space-y-2">
              <Label>Select Investor</Label>
              <Select value={selectedInvestorId} onValueChange={setSelectedInvestorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an investor..." />
                </SelectTrigger>
                <SelectContent>
                  {investors.length === 0 ? (
                    <SelectItem value="_none" disabled>
                      No investors found
                    </SelectItem>
                  ) : (
                    investors.map((inv) => (
                      <SelectItem key={inv.id} value={inv.id}>
                        {inv.first_name && inv.last_name
                          ? `${inv.first_name} ${inv.last_name}`
                          : `Investor (${inv.id.slice(0, 8)}...)`}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {investors.length === 0 && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  No users with the investor role found. Assign the investor role first in User Management.
                </p>
              )}
            </div>

            {isLoadingAvailable ? (
              <div className="flex-1 flex items-center justify-center">
                <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : availableSubDevices.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-2 py-8">
                <Package className="h-8 w-8 opacity-50" />
                <p className="text-sm">No unassigned devices with active subscriptions available.</p>
              </div>
            ) : (
              <>
                {/* Slider Section */}
                <div className="space-y-4 p-4 border rounded-xl bg-muted/30">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Monthly Payment Budget</Label>
                    <div className="text-right">
                      <span className="text-2xl font-bold tabular-nums">{formatCurrency(sliderValue)}</span>
                      <span className="text-xs text-muted-foreground block">per month</span>
                    </div>
                  </div>

                  <Slider
                    value={[sliderValue]}
                    onValueChange={handleSliderChange}
                    min={0}
                    max={sliderMax}
                    step={1}
                    className="w-full"
                  />

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatCurrency(0)}</span>
                    {sliderMin > 0 && sliderMin !== sliderMax && (
                      <span>Min device: {formatCurrency(sliderMin)}</span>
                    )}
                    <span>{formatCurrency(sliderMax)}</span>
                  </div>

                  {/* Summary stats */}
                  <div className="grid grid-cols-3 gap-3 pt-2 border-t">
                    <div className="text-center">
                      <div className="text-lg font-bold tabular-nums">{selectedAssignDeviceIds.size}</div>
                      <div className="text-xs text-muted-foreground">Devices Selected</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold tabular-nums text-emerald-600">{formatCurrency(selectedMonthlyTotal)}</div>
                      <div className="text-xs text-muted-foreground">Actual Monthly</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold tabular-nums">{formatCurrency(selectedDeviceCostTotal)}</div>
                      <div className="text-xs text-muted-foreground">Device Cost</div>
                    </div>
                  </div>
                </div>

                {/* Device list showing auto-selected devices */}
                <div className="flex-1 overflow-y-auto border rounded-lg divide-y min-h-0">
                  {availableSubDevices.map((device) => {
                    const isSelected = selectedAssignDeviceIds.has(device.id)
                    return (
                      <div
                        key={device.id}
                        className={cn(
                          "flex items-center gap-4 p-3 transition-colors",
                          isSelected
                            ? "bg-blue-50 dark:bg-blue-950/20"
                            : "opacity-50"
                        )}
                      >
                        <div
                          className={cn(
                            "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors",
                            isSelected
                              ? "bg-blue-600 border-blue-600"
                              : "border-muted-foreground/30"
                          )}
                        >
                          {isSelected && <Check className="h-3 w-3 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {device.name || "Unnamed Device"}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                            {device.brand && <span>{device.brand}</span>}
                            {device.storage && <span>{device.storage}</span>}
                            {device.serial_number && <span className="hidden sm:inline">SN: {device.serial_number}</span>}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-semibold text-sm tabular-nums">
                            {formatCurrency(device.monthly_rate)}
                          </div>
                          <div className="text-xs text-muted-foreground">/month</div>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            "shrink-0 text-xs",
                            isSelected && "bg-blue-100 text-blue-700 border-blue-200"
                          )}
                        >
                          {isSelected ? "Included" : "Not included"}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 pt-4 border-t">
            <div className="flex-1 text-sm text-muted-foreground">
              {selectedAssignDeviceIds.size} device(s) at {formatCurrency(selectedMonthlyTotal)}/mo will be assigned
            </div>
            <Button
              variant="outline"
              onClick={() => setIsAssignDialogOpen(false)}
              className="bg-transparent"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmAssign}
              disabled={
                isAssigning ||
                !selectedInvestorId ||
                selectedAssignDeviceIds.size === 0
              }
              className="gap-2"
            >
              {isAssigning ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              Assign to Investor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
