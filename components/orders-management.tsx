"use client"

import { useState, useEffect } from "react"
import {
  Search,
  SlidersHorizontal,
  Truck,
  ShoppingCart,
  Plus,
  Sparkles,
  Check,
  Package,
  CheckCircle,
  XCircle,
  PackageCheck,
  X,
  Trash2,
  Lock,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"

interface Device {
  id: number
  name: string
  serial_number: string
  brand: string
  storage: string
  status: string
  condition: string
  acquisition_cost_aed: number
}

interface Customer {
  id: number
  name: string
  email: string
  phone: string
}

interface Order {
  id: number
  order_number: string
  device_id: number
  customer_id: number
  device: Device
  customer: Customer
  status: string
  delivery_date: string | null
  carrier: string | null
  notes: string | null
  created_at: string
  subscription_months: number | null
}

export function OrdersManagement() {
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false)
  const [availableDevices, setAvailableDevices] = useState<Device[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("")
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("")
  const [orderNotes, setOrderNotes] = useState("")
  const [deliveryDate, setDeliveryDate] = useState("")
  const [carrier, setCarrier] = useState("")
  const [subscriptionLength, setSubscriptionLength] = useState<string>("12")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isButtonHovered, setIsButtonHovered] = useState(false)
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [allOrders, setAllOrders] = useState<Order[]>([])

  const [searchQuery, setSearchQuery] = useState("")
  const [showSearch, setShowSearch] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null)
  const [deletePin, setDeletePin] = useState("")
  const [pinError, setPinError] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const ADMIN_PIN = "12345"

  const supabase = createClient()

  const generateOrderNumber = async (): Promise<string> => {
    const { data: latestOrder } = await supabase
      .from("orders")
      .select("order_number")
      .like("order_number", "RT-%")
      .order("order_number", { ascending: false })
      .limit(1)
      .single()

    let nextNumber = 1

    if (latestOrder?.order_number) {
      const lastNumber = Number.parseInt(latestOrder.order_number.replace("RT-", ""), 10)
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1
      }
    }

    return `RT-${nextNumber.toString().padStart(4, "0")}`
  }

  const fetchFormData = async () => {
    const { data: devices } = await supabase.from("devices").select("*").eq("status", "available").order("name")

    if (devices) setAvailableDevices(devices)

    const { data: customerData } = await supabase.from("customers").select("id, name, email, phone").order("name")

    if (customerData) setCustomers(customerData)
  }

  const fetchPendingOrders = async () => {
    const { data: orders } = await supabase
      .from("orders")
      .select(`
        *,
        device:devices(*),
        customer:customers(*)
      `)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(10)

    if (orders) setRecentOrders(orders)
  }

  const fetchAllOrders = async () => {
    const { data: orders } = await supabase
      .from("orders")
      .select(`
        *,
        device:devices(*),
        customer:customers(*)
      `)
      .order("created_at", { ascending: false })

    if (orders) setAllOrders(orders)
  }

  useEffect(() => {
    fetchFormData()
    fetchPendingOrders()
    fetchAllOrders()
  }, [])

  const handleCreateOrder = async () => {
    if (!selectedDeviceId || !selectedCustomerId) return

    setIsSubmitting(true)

    try {
      const orderNumber = await generateOrderNumber()

      const { data: newOrder, error: orderError } = await supabase
        .from("orders")
        .insert({
          device_id: Number.parseInt(selectedDeviceId),
          customer_id: Number.parseInt(selectedCustomerId),
          order_number: orderNumber,
          status: "pending",
          delivery_date: deliveryDate || null,
          carrier: carrier || null,
          notes: orderNotes || null,
          subscription_months: Number.parseInt(subscriptionLength),
        })
        .select(`
          *,
          device:devices(*),
          customer:customers(*)
        `)
        .single()

      if (orderError) throw orderError

      const { error: deviceError } = await supabase
        .from("devices")
        .update({ status: "rented" })
        .eq("id", Number.parseInt(selectedDeviceId))

      if (deviceError) throw deviceError

      if (newOrder) {
        // Assuming you want to handle the new order here, you can add logic to update any other state or perform actions
      }

      setSelectedDeviceId("")
      setSelectedCustomerId("")
      setOrderNotes("")
      setDeliveryDate("")
      setCarrier("")
      setSubscriptionLength("12")
      setIsNewOrderOpen(false)

      fetchFormData()
      fetchPendingOrders()
      fetchAllOrders()
    } catch (error) {
      console.error("Error creating order:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateOrderStatus = async (orderId: number, newStatus: string, deviceId?: number) => {
    try {
      const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", orderId)

      if (error) throw error

      // If order is declined/cancelled, set device back to available
      if (newStatus === "cancelled" && deviceId) {
        await supabase.from("devices").update({ status: "available" }).eq("id", deviceId)
      }

      if (newStatus === "delivered") {
        // Get the order details to create subscription
        const { data: orderData } = await supabase.from("orders").select("*").eq("id", orderId).single()

        if (orderData) {
          const startDate = new Date()
          const subscriptionMonths = orderData.subscription_months || 12
          const endDate = new Date(startDate)
          endDate.setMonth(endDate.getMonth() + subscriptionMonths)

          // Create a new subscription with calculated end_date
          const { error: subError } = await supabase.from("subscriptions").insert({
            order_id: orderId,
            customer_id: orderData.customer_id,
            device_id: orderData.device_id,
            status: "active",
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            notes: orderData.notes || "",
          })

          if (subError) {
            console.error("Error creating subscription:", subError)
          }
        }
      }

      // Refresh orders
      fetchPendingOrders()
      fetchAllOrders()
    } catch (error) {
      console.error("Error updating order status:", error)
    }
  }

  const renderOrderActions = (order: Order) => {
    switch (order.status?.toLowerCase()) {
      case "pending":
        return (
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => updateOrderStatus(order.id, "processing")}
              className="h-7 px-2 text-xs rounded-lg bg-success-muted hover:bg-success/20 text-success"
            >
              <CheckCircle className="w-3 h-3 mr-1" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => updateOrderStatus(order.id, "cancelled", order.device_id)}
              className="h-7 px-2 text-xs rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive"
            >
              <XCircle className="w-3 h-3 mr-1" />
              Decline
            </Button>
          </div>
        )
      case "processing":
        return (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => updateOrderStatus(order.id, "out_for_delivery")}
            className="h-7 px-2 text-xs rounded-lg bg-info-muted hover:bg-info/20 text-info"
          >
            <Truck className="w-3 h-3 mr-1" />
            Out for Delivery
          </Button>
        )
      case "out_for_delivery":
        return (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => updateOrderStatus(order.id, "delivered")}
            className="h-7 px-2 text-xs rounded-lg bg-success-muted hover:bg-success/20 text-success"
          >
            <PackageCheck className="w-3 h-3 mr-1" />
            Delivered
          </Button>
        )
      case "delivered":
        return (
          <Badge className="bg-success-muted text-success border-0 text-xs">
            <Check className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        )
      case "cancelled":
        return (
          <Badge className="bg-destructive/10 text-destructive border-0 text-xs">
            <XCircle className="w-3 h-3 mr-1" />
            Cancelled
          </Badge>
        )
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Delivered":
        return <Badge className="bg-success-muted text-success hover:bg-success-muted border-0">Delivered</Badge>
      case "Delayed":
        return <Badge className="bg-warning-muted text-warning hover:bg-warning-muted border-0">Delayed</Badge>
      case "In Transit":
        return <Badge className="bg-warning-muted text-warning hover:bg-warning-muted border-0">In Transit</Badge>
      case "Processing":
        return <Badge className="bg-info-muted text-info hover:bg-info-muted border-0">Processing</Badge>
      case "Confirmed":
        return <Badge className="bg-info-muted text-info hover:bg-info-muted border-0">Confirmed</Badge>
      case "Cancelled":
        return <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/10 border-0">Cancelled</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const selectedDevice = availableDevices.find((d) => d.id === Number.parseInt(selectedDeviceId))
  const selectedCustomer = customers.find((c) => c.id === Number.parseInt(selectedCustomerId))

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const getOrderStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "delivered":
        return "bg-success-muted text-success"
      case "out_for_delivery":
        return "bg-info-muted text-info"
      case "in_transit":
        return "bg-info-muted text-info"
      case "processing":
        return "bg-primary/10 text-primary"
      case "confirmed":
        return "bg-info-muted text-info"
      case "cancelled":
        return "bg-destructive/10 text-destructive"
      case "pending":
      default:
        return "bg-warning-muted text-warning"
    }
  }

  const handleDeleteOrder = async () => {
    if (deletePin !== ADMIN_PIN) {
      setPinError(true)
      return
    }

    if (!orderToDelete) return

    setIsDeleting(true)
    try {
      // If order has a device, set it back to available
      if (orderToDelete.device_id) {
        await supabase.from("devices").update({ status: "available" }).eq("id", orderToDelete.device_id)
      }

      // Delete the order
      const { error } = await supabase.from("orders").delete().eq("id", orderToDelete.id)

      if (error) throw error

      // Refresh orders
      fetchPendingOrders()
      fetchAllOrders()
      fetchFormData()

      // Close dialog and reset state
      setIsDeleteDialogOpen(false)
      setOrderToDelete(null)
      setDeletePin("")
      setPinError(false)
    } catch (error) {
      console.error("Error deleting order:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  const filteredOrders = allOrders.filter((order) => {
    const matchesSearch =
      searchQuery === "" ||
      order.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.carrier?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || order.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const totalOrders = allOrders.length
  const outForDelivery = allOrders.filter((order) => order.status === "out_for_delivery").length
  const completedOrders = allOrders.filter((order) => order.status === "delivered").length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Metrics</h2>
        <div className="flex items-center gap-3">
          <Select defaultValue="this-week">
            <SelectTrigger className="w-32 rounded-xl border-border shadow-sm">
              <SelectValue placeholder="This Week" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="this-week">This Week</SelectItem>
              <SelectItem value="this-month">This Month</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={() => {
              fetchFormData()
              setIsNewOrderOpen(true)
            }}
            onMouseEnter={() => setIsButtonHovered(true)}
            onMouseLeave={() => setIsButtonHovered(false)}
            className="relative overflow-hidden bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-primary-foreground rounded-xl shadow-lg hover:shadow-xl hover:shadow-primary/25 transition-all duration-300 hover:scale-105 active:scale-95 group"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-foreground/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <Plus className={`w-4 h-4 mr-2 transition-transform duration-300 ${isButtonHovered ? "rotate-90" : ""}`} />
            New Order
            <Sparkles
              className={`w-3 h-3 ml-2 transition-all duration-300 ${isButtonHovered ? "opacity-100 scale-100" : "opacity-0 scale-0"}`}
            />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-2xl border border-border shadow-md hover:shadow-lg transition-shadow duration-300 bg-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-4">
              <div className="p-2 bg-info-muted rounded-xl">
                <ShoppingCart className="w-4 h-4 text-info" />
              </div>
              <span className="text-sm font-medium">Total Orders</span>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold tracking-tight">{totalOrders}</span>
                  <span className="text-muted-foreground text-sm">Orders</span>
                </div>
                <div className="flex items-center gap-1 mt-3 text-sm">
                  <span className="text-muted-foreground">All time orders</span>
                </div>
              </div>
              <div className="p-3 bg-info-muted rounded-xl">
                <Package className="w-6 h-6 text-info" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border shadow-md hover:shadow-lg transition-shadow duration-300 bg-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-4">
              <div className="p-2 bg-warning-muted rounded-xl">
                <Truck className="w-4 h-4 text-warning" />
              </div>
              <span className="text-sm font-medium">Out For Delivery</span>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold tracking-tight">{outForDelivery}</span>
                  <span className="text-muted-foreground text-sm">Orders</span>
                </div>
                <div className="flex items-center gap-1 mt-3 text-sm">
                  <span className="text-muted-foreground">Out For Delivery</span>
                </div>
              </div>
              <div className="p-3 bg-warning-muted rounded-xl">
                <Truck className="w-6 h-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border shadow-md hover:shadow-lg transition-shadow duration-300 bg-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-4">
              <div className="p-2 bg-success-muted rounded-xl">
                <CheckCircle className="w-4 h-4 text-success" />
              </div>
              <span className="text-sm font-medium">Completed Orders</span>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold tracking-tight">{completedOrders}</span>
                  <span className="text-muted-foreground text-sm">Orders</span>
                </div>
                <div className="flex items-center gap-1 mt-3 text-sm">
                  <span className="text-muted-foreground">Successfully delivered</span>
                </div>
              </div>
              <div className="p-3 bg-success-muted rounded-xl">
                <CheckCircle className="w-6 h-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={isNewOrderOpen}
        onOpenChange={(open) => {
          setIsNewOrderOpen(open)
          if (!open) {
            setSelectedDeviceId("")
            setSelectedCustomerId("")
            setOrderNotes("")
            setDeliveryDate("")
            setCarrier("")
            setSubscriptionLength("12")
          }
        }}
      >
        <DialogContent className="sm:max-w-lg rounded-2xl animate-in zoom-in-95 duration-200">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Plus className="w-5 h-5 text-primary" />
              </div>
              Create New Order
            </DialogTitle>
            <DialogDescription>
              Create a rental order by selecting an available device and assigning it to a customer.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="device">Select Device</Label>
              <Select value={selectedDeviceId} onValueChange={setSelectedDeviceId}>
                <SelectTrigger id="device" className="rounded-xl">
                  <SelectValue placeholder="Choose an available device" />
                </SelectTrigger>
                <SelectContent className="rounded-xl max-h-60">
                  {availableDevices.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">No available devices</div>
                  ) : (
                    availableDevices.map((device) => (
                      <SelectItem key={device.id} value={device.id.toString()}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{device.name}</span>
                          <span className="text-muted-foreground text-xs">({device.serial_number})</span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {selectedDevice && (
                <div className="p-3 bg-muted/50 rounded-xl text-sm space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Brand:</span>
                    <span className="font-medium">{selectedDevice.brand}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Storage:</span>
                    <span className="font-medium">{selectedDevice.storage}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Condition:</span>
                    <span className="font-medium">{selectedDevice.condition}</span>
                  </div>
                  <p>
                    <span className="text-muted-foreground">Value:</span> AED{" "}
                    {selectedDevice.acquisition_cost_aed?.toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer">Select Customer</Label>
              <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                <SelectTrigger id="customer" className="rounded-xl">
                  <SelectValue placeholder="Choose a customer" />
                </SelectTrigger>
                <SelectContent className="rounded-xl max-h-60">
                  {customers.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">No customers found</div>
                  ) : (
                    customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id.toString()}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{customer.name}</span>
                          <span className="text-muted-foreground text-xs">({customer.email})</span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {selectedCustomer && (
                <div className="p-3 bg-muted/50 rounded-xl text-sm space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-medium">{selectedCustomer.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="font-medium">{selectedCustomer.phone}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="subscriptionLength">Subscription Length</Label>
              <Select value={subscriptionLength} onValueChange={setSubscriptionLength}>
                <SelectTrigger id="subscriptionLength" className="rounded-xl">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="3">3 Months</SelectItem>
                  <SelectItem value="6">6 Months</SelectItem>
                  <SelectItem value="12">12 Months</SelectItem>
                  <SelectItem value="24">24 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deliveryDate">Delivery Date</Label>
                <Input
                  id="deliveryDate"
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="carrier">Carrier</Label>
                <Select value={carrier} onValueChange={setCarrier}>
                  <SelectTrigger id="carrier" className="rounded-xl">
                    <SelectValue placeholder="Select carrier" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="FedEx">FedEx</SelectItem>
                    <SelectItem value="DHL">DHL</SelectItem>
                    <SelectItem value="Aramex">Aramex</SelectItem>
                    <SelectItem value="LocalShip">LocalShip</SelectItem>
                    <SelectItem value="Self Pickup">Self Pickup</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Order Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this order..."
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                className="rounded-xl resize-none"
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedDeviceId("")
                setSelectedCustomerId("")
                setOrderNotes("")
                setDeliveryDate("")
                setCarrier("")
                setIsNewOrderOpen(false)
              }}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateOrder}
              disabled={!selectedDeviceId || !selectedCustomerId || isSubmitting}
              className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Create Order
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          setIsDeleteDialogOpen(open)
          if (!open) {
            setOrderToDelete(null)
            setDeletePin("")
            setPinError(false)
          }
        }}
      >
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                <Lock className="w-5 h-5 text-destructive" />
              </div>
              Delete Order
            </DialogTitle>
            <DialogDescription>
              Enter admin PIN to delete order <span className="font-semibold">{orderToDelete?.order_number}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="pin">Admin PIN</Label>
              <Input
                id="pin"
                type="password"
                placeholder="Enter PIN..."
                value={deletePin}
                onChange={(e) => {
                  setDeletePin(e.target.value)
                  setPinError(false)
                }}
                className={`rounded-xl ${pinError ? "border-destructive focus-visible:ring-destructive" : ""}`}
                maxLength={5}
              />
              {pinError && <p className="text-xs text-destructive">Incorrect PIN. Please try again.</p>}
            </div>

            <div className="p-3 rounded-xl bg-destructive/10 text-sm">
              <p className="text-destructive font-medium">Warning</p>
              <p className="text-muted-foreground text-xs mt-1">
                This action cannot be undone. The order will be permanently deleted and the device will be set back to
                available.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setOrderToDelete(null)
                setDeletePin("")
                setPinError(false)
              }}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteOrder}
              disabled={!deletePin || isDeleting}
              className="rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-destructive-foreground/30 border-t-destructive-foreground rounded-full animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Order
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col gap-6">
        {/* Pending Orders - Now on top */}
        <Card className="rounded-2xl border border-border shadow-md bg-card">
          <CardHeader className="pb-3 px-6 pt-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Pending Orders</CardTitle>
              <Badge variant="outline" className="rounded-full">
                {recentOrders.length} pending
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            {recentOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-success-muted flex items-center justify-center mb-3">
                  <Check className="w-6 h-6 text-success" />
                </div>
                <p className="text-muted-foreground text-sm">No pending orders</p>
                <p className="text-muted-foreground text-xs mt-1">All orders have been processed</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {recentOrders.map((order, index) => (
                  <div
                    key={order.id}
                    className="p-4 rounded-xl bg-accent/30 hover:bg-accent/50 transition-all duration-200 group border border-border/50"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                        <Package className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{order.order_number}</p>
                        <p className="text-xs text-muted-foreground">{order.customer?.name || "Unknown Customer"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-8 text-xs rounded-lg bg-success/10 text-success border-success/20 hover:bg-success/20"
                        onClick={() => updateOrderStatus(order.id, "processing")}
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-8 text-xs rounded-lg bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20"
                        onClick={() => updateOrderStatus(order.id, "cancelled", order.device_id)}
                      >
                        <X className="h-3 w-3 mr-1" />
                        Decline
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Orders Overview - Now below */}
        <Card className="rounded-2xl border border-border shadow-md bg-card">
          <CardHeader className="pb-3 px-6 pt-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Orders Overview</CardTitle>
              <div className="flex items-center gap-2">
                {showSearch ? (
                  <div className="flex items-center gap-2 animate-in slide-in-from-right-4 duration-200">
                    <Input
                      placeholder="Search orders..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-9 w-48 text-sm rounded-xl"
                      autoFocus
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-xl hover:bg-accent"
                      onClick={() => {
                        setShowSearch(false)
                        setSearchQuery("")
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-xl hover:bg-accent"
                    onClick={() => setShowSearch(true)}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                )}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-36 h-9 text-xs rounded-xl border-border">
                    <SlidersHorizontal className="h-3 w-3 mr-2" />
                    <SelectValue placeholder="Filter status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="space-y-1">
              <div className="grid grid-cols-12 gap-4 py-3 text-xs text-muted-foreground font-medium border-b border-border">
                <div className="col-span-1"></div>
                <div className="col-span-3">Order ID</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Delivery Date</div>
                <div className="col-span-1">Carrier</div>
                <div className="col-span-3">Actions</div>
              </div>

              {filteredOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                    <Package className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {searchQuery || statusFilter !== "all" ? "No orders match your filters" : "No orders yet"}
                  </p>
                  <p className="text-muted-foreground text-xs mt-1">
                    {searchQuery || statusFilter !== "all"
                      ? "Try adjusting your search or filter"
                      : "Create your first order to get started"}
                  </p>
                </div>
              ) : (
                filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="grid grid-cols-12 gap-4 py-3 items-center border-b border-border/50 hover:bg-accent/30 transition-colors duration-200 rounded-lg group"
                  >
                    <div className="col-span-1">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20"
                      />
                    </div>
                    <div className="col-span-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">#{order.order_number}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {order.customer?.name || "Unknown Customer"}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <Badge className={`${getOrderStatusColor(order.status)} border-0 text-xs capitalize`}>
                        {order.status?.replace(/_/g, " ") || "Pending"}
                      </Badge>
                    </div>
                    <div className="col-span-2 text-sm text-muted-foreground">
                      {order.delivery_date
                        ? new Date(order.delivery_date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "Not set"}
                    </div>
                    <div className="col-span-1 text-sm">{order.carrier || "—"}</div>
                    <div className="col-span-3 flex items-center gap-2">
                      {renderOrderActions(order)}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setOrderToDelete(order)
                          setIsDeleteDialogOpen(true)
                        }}
                        className="h-7 w-7 p-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
