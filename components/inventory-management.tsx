"use client"

import type React from "react"

import { useEffect, useState } from "react"
import {
  Search,
  Plus,
  Package,
  TrendingUp,
  Activity,
  Box,
  Loader2,
  Smartphone,
  Pencil,
  Trash2,
  Eye,
  FileText,
  ExternalLink,
  X,
  LayoutGrid,
  List,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Layers,
  ChevronDown,
  ChevronRight,
  Settings,
  Calculator,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { createClient } from "@/lib/supabase/client"
import { ds, cn } from "@/lib/design-system"
import { useToast } from "@/components/ui/use-toast"
import { PricingCalculator } from "@/components/pricing-calculator"

interface DeviceModel {
  id: string
  name: string
  brand: string | null
  category: string | null
  storage_options: string[]
  color_options: string[]
  created_at: string
}

interface BusinessSetting {
  id: string
  setting_key: string
  setting_name: string
  value_percent: number | null
  value_aed: number | null
  description: string | null
}

interface Device {
  id: string
  name: string | null
  sku: string | null
  serial_number: string | null
  brand: string | null
  category: string | null
  condition: string | null
  status: string | null
  storage: string | null
  model_id: string | null
  color: string | null
  acquisition_cost_aed: number | null
  depreciation_rate_percent: number | null
  refurb_estimate_aed: number | null
  notes: string | null
  invoice_url: string | null
  accessories: { name: string; cost: number }[] | null
  created_at: string
}

export function InventoryManagement() {
  const { toast } = useToast()
  const [totalDevices, setTotalDevices] = useState<number | null>(null)
  const [totalValue, setTotalValue] = useState<number | null>(null)
  const [utilizationRate, setUtilizationRate] = useState<number | null>(null)
  const [availableInventory, setAvailableInventory] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [devices, setDevices] = useState<Device[]>([])
  const [isLoadingDevices, setIsLoadingDevices] = useState(true)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deviceModels, setDeviceModels] = useState<DeviceModel[]>([])
  const [isModelDialogOpen, setIsModelDialogOpen] = useState(false)
  const [isSubmittingModel, setIsSubmittingModel] = useState(false)
  const [selectedModelId, setSelectedModelId] = useState<string>("")
  const [modelFormData, setModelFormData] = useState({
    name: "",
    brand: "",
    category: "",
    storageOptions: [] as string[],
    colorOptions: [] as string[],
  })
  const [newStorage, setNewStorage] = useState("")
  const [newColor, setNewColor] = useState("")
  const [expandedSections, setExpandedSections] = useState({
    storage: true,
    colors: true,
  })

  const [customCategory, setCustomCategory] = useState("")
  const [showCustomCategory, setShowCustomCategory] = useState(false)
  const [customCategoryEdit, setCustomCategoryEdit] = useState("")
  const [showCustomCategoryEdit, setShowCustomCategoryEdit] = useState(false)
  const [customCategoryAddDevice, setCustomCategoryAddDevice] = useState("")
  const [showCustomCategoryAddDevice, setShowCustomCategoryAddDevice] = useState(false)
  const [customCategoryEditModel, setCustomCategoryEditModel] = useState("")
  const [showCustomCategoryEditModel, setShowCustomCategoryEditModel] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    serial_number: "",
    model_id: "",
    storage: "",
    color: "",
    brand: "",
    category: "",
    condition: "",
    status: "",
    acquisition_cost_aed: "",
    depreciation_rate_percent: "",
    refurb_estimate_aed: "",
    notes: "",
    accessories: [] as { name: string; cost: number }[],
  })
  const [newAccessory, setNewAccessory] = useState({
    name: "",
    cost: "",
  })

  const [editFormData, setEditFormData] = useState({
    name: "",
    sku: "",
    serial_number: "",
    brand: "",
    category: "",
    condition: "",
    status: "",
    storage: "",
    color: "",
    acquisition_cost_aed: "",
    depreciation_rate_percent: "",
    refurb_estimate_aed: "",
    notes: "",
  })

  const [editDeviceModel, setEditDeviceModel] = useState<DeviceModel | null>(null)

  // Add state for view dialog and copied field
  const [viewDevice, setViewDevice] = useState<Device | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [businessSettings, setBusinessSettings] = useState<BusinessSetting[]>([])
  const [isLoadingSettings, setIsLoadingSettings] = useState(false)
  const [isSavingSettings, setIsSavingSettings] = useState(false)

  const [isPricingCalculatorOpen, setIsPricingCalculatorOpen] = useState(false)

  const supabase = createClient()

  const [invoiceFile, setInvoiceFile] = useState<File | null>(null)
  const [invoicePreview, setInvoicePreview] = useState<string | null>(null)
  const [isDraggingInvoice, setIsDraggingInvoice] = useState(false)

  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [valueSortDirection, setValueSortDirection] = useState<"none" | "asc" | "desc">("none")

  const [selectedModelForAdd, setSelectedModelForAdd] = useState<string>("")

  const [isEditModelDialogOpen, setIsEditModelDialogOpen] = useState(false)
  const [selectedModelForEdit, setSelectedModelForEdit] = useState<DeviceModel | null>(null)
  const [editModelFormData, setEditModelFormData] = useState({
    name: "",
    brand: "",
    category: "",
    storageOptions: [] as string[],
    colorOptions: [] as string[],
  })
  const [editModelNewStorage, setEditModelNewStorage] = useState("")
  const [editModelNewColor, setEditModelNewColor] = useState("")

  const filteredDevices = devices
    .filter((device) => {
      const matchesSearch =
        searchQuery === "" ||
        device.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.serial_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.brand?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCategory =
        categoryFilter === "all" || device.category?.toLowerCase() === categoryFilter.toLowerCase()

      const matchesStatus = statusFilter === "all" || device.status?.toLowerCase() === statusFilter.toLowerCase()

      return matchesSearch && matchesCategory && matchesStatus
    })
    .sort((a, b) => {
      if (valueSortDirection === "none") return 0
      const aValue = a.acquisition_cost_aed ?? 0
      const bValue = b.acquisition_cost_aed ?? 0
      return valueSortDirection === "asc" ? aValue - bValue : bValue - aValue
    })

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const fetchDeviceStats = async () => {
    const supabase = createClient()

    try {
      const { count, error: countError } = await supabase.from("devices").select("*", { count: "exact", head: true })

      if (countError) {
        console.error("Error fetching device count:", countError)
      } else {
        setTotalDevices(count ?? 0)
      }

      const { data: costData, error: costError } = await supabase.from("devices").select("acquisition_cost_aed")

      if (costError) {
        console.error("Error fetching costs:", costError)
      } else if (costData) {
        const total = costData.reduce((sum, device) => sum + (Number(device.acquisition_cost_aed) || 0), 0)
        setTotalValue(total)
      }

      // Set default values for utilization rate and available inventory
      setUtilizationRate(0)
      setAvailableInventory(count ?? 0) // All devices are considered available
    } catch (error) {
      console.error("Error in fetchDeviceStats:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchDevices = async () => {
    const supabase = createClient()
    setIsLoadingDevices(true)

    try {
      const { data, error } = await supabase.from("devices").select("*").order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching devices:", error)
      } else {
        setDevices(data || [])
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setIsLoadingDevices(false)
    }
  }

  const fetchDeviceModels = async () => {
    const supabase = createClient()
    const { data, error } = await supabase.from("device_models").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching device models:", error)
      return
    }

    setDeviceModels(data || [])
  }

  // Fetch BusinessSettings
  const fetchBusinessSettings = async () => {
    setIsLoadingSettings(true)
    const supabase = createClient()
    const { data, error } = await supabase.from("business_settings").select("*").order("id")

    if (error) {
      console.error("Error fetching business settings:", error)
      toast({
        title: "Error",
        description: "Failed to load business settings.",
        variant: "destructive",
      })
    } else {
      setBusinessSettings(data || [])
    }
    setIsLoadingSettings(false)
  }

  useEffect(() => {
    fetchDeviceStats()
    fetchDevices()
    fetchDeviceModels()
    fetchBusinessSettings() // Call fetchBusinessSettings
  }, [])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleEditInputChange = (field: string, value: string) => {
    setEditFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleInvoiceDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingInvoice(false)
    const file = e.dataTransfer.files[0]
    if (file && (file.type.startsWith("image/") || file.type === "application/pdf")) {
      setInvoiceFile(file)
      if (file.type.startsWith("image/")) {
        setInvoicePreview(URL.createObjectURL(file))
      } else {
        setInvoicePreview(null)
      }
    }
  }

  const handleInvoiceSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && (file.type.startsWith("image/") || file.type === "application/pdf")) {
      setInvoiceFile(file)
      if (file.type.startsWith("image/")) {
        setInvoicePreview(URL.createObjectURL(file))
      } else {
        setInvoicePreview(null)
      }
    }
  }

  const removeInvoice = () => {
    setInvoiceFile(null)
    setInvoicePreview(null)
  }

  const handleSubmit = async () => {
    if (!invoiceFile) {
      toast({
        title: "Invoice Required",
        description: "Please upload an invoice for this device before saving.",
        variant: "destructive",
      })
      return
    }

    if (!formData.model_id) {
      toast({
        title: "Model Required",
        description: "Please select a device model before adding a device.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    const supabase = createClient()

    try {
      const fileExt = invoiceFile.name.split(".").pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `invoices/${fileName}`

      const { error: uploadError } = await supabase.storage.from("device-invoices").upload(filePath, invoiceFile)

      if (uploadError) {
        console.error("Error uploading invoice:", uploadError)
        toast({
          title: "Upload Failed",
          description: "Failed to upload invoice. Please check your file and try again.",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      // Get public URL
      const { data: urlData } = supabase.storage.from("device-invoices").getPublicUrl(filePath)

      const invoiceUrl = urlData.publicUrl

      // Insert device with invoice URL
      const { error } = await supabase.from("devices").insert({
        name: formData.name || null,
        sku: formData.sku || null,
        serial_number: formData.serial_number || null,
        // Use model_id, color, and selected brand/category
        model_id: formData.model_id || null,
        color: formData.color || null,
        brand: formData.brand || null,
        category: formData.category || null,
        condition: formData.condition || null,
        storage: formData.storage || null,
        acquisition_cost_aed: formData.acquisition_cost_aed ? Number.parseFloat(formData.acquisition_cost_aed) : null,
        // Added depreciation_rate_percent and refurb_estimate_aed to insert
        depreciation_rate_percent: formData.depreciation_rate_percent
          ? Number.parseFloat(formData.depreciation_rate_percent)
          : null,
        refurb_estimate_aed: formData.refurb_estimate_aed ? Number.parseFloat(formData.refurb_estimate_aed) : null,
        notes: formData.notes || null,
        invoice_url: invoiceUrl,
        accessories: formData.accessories.length > 0 ? formData.accessories : null,
      })

      if (error) {
        console.error("Error inserting device:", error)
        let errorMessage = "Failed to add device. Please try again."

        if (error.message.includes("column")) {
          errorMessage = `Database error: ${error.message}. Please contact support.`
        } else if (error.message.includes("duplicate")) {
          errorMessage = "A device with this serial number or SKU already exists."
        } else if (error.message.includes("violates")) {
          errorMessage = "Invalid data provided. Please check all required fields."
        }

        toast({
          title: "Failed to Add Device",
          description: errorMessage,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Device Added",
          description: "The device has been successfully added to inventory.",
        })

        setFormData({
          name: "",
          sku: "",
          serial_number: "",
          model_id: "",
          storage: "",
          color: "",
          brand: "",
          category: "",
          condition: "",
          status: "",
          acquisition_cost_aed: "",
          // Reset depreciation and refurb fields
          depreciation_rate_percent: "",
          refurb_estimate_aed: "",
          notes: "",
          accessories: [],
        })
        setInvoiceFile(null)
        setInvoicePreview(null)
        setIsDialogOpen(false)
        setSelectedModelId("") // Reset selected model
        fetchDevices()
        fetchDeviceStats()
      }
    } catch (err) {
      console.error("Error:", err)
      toast({
        title: "Unexpected Error",
        description: err instanceof Error ? err.message : "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditClick = async (device: Device) => {
    setSelectedDevice(device)

    if (device.model_id) {
      const model = deviceModels.find((m) => m.id === device.model_id)
      setEditDeviceModel(model || null)
    } else {
      setEditDeviceModel(null)
    }

    setEditFormData({
      name: device.name || "",
      sku: device.sku || "",
      serial_number: device.serial_number || "",
      brand: device.brand || "",
      category: device.category || "",
      condition: device.condition || "",
      status: device.status || "",
      storage: device.storage || "",
      color: device.color || "",
      acquisition_cost_aed: device.acquisition_cost_aed?.toString() || "",
      depreciation_rate_percent: device.depreciation_rate_percent?.toString() || "",
      refurb_estimate_aed: device.refurb_estimate_aed?.toString() || "",
      notes: device.notes || "",
    })
    setIsEditDialogOpen(true)
  }

  const handleEditSubmit = async () => {
    if (!selectedDevice) return
    setIsSubmitting(true)
    const supabase = createClient()

    try {
      const { error } = await supabase
        .from("devices")
        .update({
          name: editFormData.name || null,
          sku: editFormData.sku || null,
          serial_number: editFormData.serial_number || null,
          brand: editFormData.brand || null,
          category: editFormData.category || null,
          condition: editFormData.condition || null,
          status: editFormData.status || null,
          storage: editFormData.storage || null,
          acquisition_cost_aed: editFormData.acquisition_cost_aed
            ? Number.parseFloat(editFormData.acquisition_cost_aed)
            : null,
          // Added depreciation_rate_percent and refurb_estimate_aed to update
          depreciation_rate_percent: editFormData.depreciation_rate_percent
            ? Number.parseFloat(editFormData.depreciation_rate_percent)
            : null,
          refurb_estimate_aed: editFormData.refurb_estimate_aed
            ? Number.parseFloat(editFormData.refurb_estimate_aed)
            : null,
          notes: editFormData.notes || null,
        })
        .eq("id", selectedDevice.id)

      if (error) {
        console.error("Error updating device:", error)
        toast({
          title: "Update Failed",
          description: "Failed to update device. Please try again.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Device Updated",
          description: "Device details have been successfully updated.",
        })
        setIsEditDialogOpen(false)
        setSelectedDevice(null)
        fetchDeviceStats()
        fetchDevices()
      }
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Unexpected Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteClick = (device: Device) => {
    setSelectedDevice(device)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedDevice) return
    setIsDeleting(true)
    const supabase = createClient()

    try {
      const { error } = await supabase.from("devices").delete().eq("id", selectedDevice.id)

      if (error) {
        console.error("Error deleting device:", error)
        toast({
          title: "Deletion Failed",
          description: "Failed to delete device. Please try again.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Device Deleted",
          description: "The device has been successfully removed from inventory.",
        })
        setIsDeleteDialogOpen(false)
        setSelectedDevice(null)
        fetchDeviceStats()
        fetchDevices()
      }
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Unexpected Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleViewDevice = (device: Device) => {
    setViewDevice(device)
    setIsViewDialogOpen(true)
  }

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `AED ${(value / 1000000).toFixed(1)}M`
    } else if (value >= 1000) {
      return `AED ${(value / 1000).toFixed(1)}K`
    }
    return `AED ${value.toFixed(0)}`
  }

  const getStatusBadgeStyle = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case "available":
        return "bg-success-muted text-success dark:bg-success-muted dark:text-success"
      case "rented":
        return "bg-info-muted text-info dark:bg-info-muted dark:text-info"
      case "maintenance":
        return "bg-warning-muted text-warning dark:bg-warning-muted dark:text-warning"
      case "reserved":
        return "bg-accent text-purple-800 dark:bg-accent dark:text-purple-400"
      case "retired":
        return "bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground"
      default:
        return "bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground"
    }
  }

  const getConditionBadgeStyle = (condition: string | null) => {
    switch (condition?.toLowerCase()) {
      case "new":
        return "bg-success-muted text-success dark:bg-success-muted dark:text-success"
      case "like_new":
        return "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-400"
      case "good":
        return "bg-info-muted text-info dark:bg-info-muted dark:text-info"
      case "fair":
        return "bg-warning-muted text-warning dark:bg-warning-muted dark:text-warning"
      case "poor":
        return "bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive"
      default:
        return "bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground"
    }
  }

  const formatCondition = (condition: string | null) => {
    if (!condition) return "N/A"
    return condition.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())
  }

  const getDeviceAge = (createdAt: string) => {
    const created = new Date(createdAt)
    const now = new Date()
    const diffMs = now.getTime() - created.getTime()

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const months = Math.floor(days / 30)
    const years = Math.floor(days / 365)

    if (years >= 1) {
      return `${years} ${years === 1 ? "year" : "years"} old`
    } else if (months >= 1) {
      return `${months} ${months === 1 ? "month" : "months"} old`
    } else {
      return `${days} ${days === 1 ? "day" : "days"} old`
    }
  }

  const toggleValueSort = () => {
    setValueSortDirection((prev) => {
      if (prev === "none") return "asc"
      if (prev === "asc") return "desc"
      return "none"
    })
  }

  const handleModelSelect = (modelId: string) => {
    setSelectedModelId(modelId)
    const model = deviceModels.find((m) => m.id === modelId)
    if (model) {
      setFormData({
        ...formData,
        model_id: modelId,
        name: model.name,
        brand: model.brand || "",
        category: model.category || "",
        storage: "",
        color: "",
      })
    }
  }

  const handleAddStorage = () => {
    if (newStorage && !modelFormData.storageOptions.includes(newStorage)) {
      setModelFormData({
        ...modelFormData,
        storageOptions: [...modelFormData.storageOptions, newStorage],
      })
      setNewStorage("")
    }
  }

  const handleRemoveStorage = (storage: string) => {
    setModelFormData({
      ...modelFormData,
      storageOptions: modelFormData.storageOptions.filter((s) => s !== storage),
    })
  }

  const handleAddColor = () => {
    if (newColor && !modelFormData.colorOptions.includes(newColor)) {
      setModelFormData({
        ...modelFormData,
        colorOptions: [...modelFormData.colorOptions, newColor],
      })
      setNewColor("")
    }
  }

  const handleRemoveColor = (color: string) => {
    setModelFormData({
      ...modelFormData,
      colorOptions: modelFormData.colorOptions.filter((c) => c !== color),
    })
  }

  const handleAddModel = async () => {
    if (!modelFormData.name || !modelFormData.brand || !modelFormData.category) {
      return
    }

    setIsSubmittingModel(true)
    const supabase = createClient()

    const { error } = await supabase.from("device_models").insert({
      name: modelFormData.name,
      brand: modelFormData.brand,
      category: modelFormData.category,
      storage_options: modelFormData.storageOptions,
      color_options: modelFormData.colorOptions,
    })

    if (error) {
      console.error("Error adding model:", error)
      toast({
        title: "Error Adding Model",
        description: "Failed to add the device model. Please try again.",
        variant: "destructive",
      })
      setIsSubmittingModel(false)
      return
    }

    toast({
      title: "Model Added",
      description: "The new device model has been successfully added.",
    })

    await fetchDeviceModels()
    setIsModelDialogOpen(false)
    setModelFormData({
      name: "",
      brand: "",
      category: "",
      storageOptions: [],
      colorOptions: [],
    })
    setIsSubmittingModel(false)
  }

  const handleAddDeviceToModel = (modelId: string) => {
    const model = deviceModels.find((m) => m.id === modelId)
    if (model) {
      setFormData({
        name: model.name,
        sku: "",
        serial_number: "",
        model_id: modelId,
        storage: "",
        color: "",
        brand: model.brand || "",
        category: model.category || "",
        condition: "",
        status: "",
        acquisition_cost_aed: "",
        depreciation_rate_percent: "",
        refurb_estimate_aed: "",
        notes: "",
        accessories: [],
      })
      setSelectedModelForAdd(modelId)
      setInvoiceFile(null)
      setInvoicePreview(null)
    }
    setIsDialogOpen(true)
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    setSelectedModelForAdd("")
    setSelectedModelId("")
    // Reset form data as well to avoid carry-over from previous additions
    setFormData({
      name: "",
      sku: "",
      serial_number: "",
      model_id: "",
      storage: "",
      color: "",
      brand: "",
      category: "",
      condition: "",
      status: "",
      acquisition_cost_aed: "",
      // Reset depreciation and refurb fields
      depreciation_rate_percent: "",
      refurb_estimate_aed: "",
      notes: "",
      accessories: [],
    })
    setNewAccessory({ name: "", cost: "" })
    setInvoiceFile(null)
    setInvoicePreview(null)
  }

  // Updated function for handling settings open and fetch
  const handleSettingsOpen = () => {
    setIsSettingsOpen(true)
    fetchBusinessSettings()
  }

  // Updated function for handling setting changes
  const handleSettingChange = (settingKey: string, field: "value_percent" | "value_aed", value: string) => {
    setBusinessSettings((prev) =>
      prev.map((s) =>
        s.setting_key === settingKey ? { ...s, [field]: value === "" ? null : Number.parseFloat(value) } : s,
      ),
    )
  }

  // Updated function for saving settings
  const handleSaveSettings = async () => {
    setIsSavingSettings(true)
    const supabase = createClient()

    try {
      for (const setting of businessSettings) {
        const { error } = await supabase
          .from("business_settings")
          .update({
            value_percent: setting.value_percent,
            value_aed: setting.value_aed,
            updated_at: new Date().toISOString(),
          })
          .eq("setting_key", setting.setting_key)

        if (error) {
          throw error
        }
      }

      toast({
        title: "Settings Saved",
        description: "Business settings have been updated successfully.",
      })
      setIsSettingsOpen(false)
    } catch (error) {
      console.error("Error saving settings:", error)
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSavingSettings(false)
    }
  }

  const handleEditModelClick = (model: DeviceModel) => {
    setSelectedModelForEdit(model)
    setEditModelFormData({
      name: model.name,
      brand: model.brand || "",
      category: model.category || "",
      storageOptions: model.storage_options || [],
      colorOptions: model.color_options || [],
    })
    setIsEditModelDialogOpen(true)
  }

  const handleEditModelSubmit = async () => {
    if (!selectedModelForEdit) return

    if (!editModelFormData.name.trim()) {
      toast({
        title: "Model Name Required",
        description: "Please enter a model name.",
        variant: "destructive",
      })
      return
    }

    setIsSubmittingModel(true)
    const supabase = createClient()

    try {
      const { error } = await supabase
        .from("device_models")
        .update({
          name: editModelFormData.name,
          brand: editModelFormData.brand || null,
          category: editModelFormData.category || null,
          storage_options: editModelFormData.storageOptions,
          color_options: editModelFormData.colorOptions,
        })
        .eq("id", selectedModelForEdit.id)

      if (error) {
        console.error("Error updating device model:", error)
        toast({
          title: "Update Failed",
          description: "Failed to update device model. Please try again.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Model Updated",
          description: `${editModelFormData.name} has been successfully updated.`,
        })
        setIsEditModelDialogOpen(false)
        setSelectedModelForEdit(null)
        setEditModelFormData({
          name: "",
          brand: "",
          category: "",
          storageOptions: [],
          colorOptions: [],
        })
        fetchDeviceModels()
      }
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Unexpected Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsSubmittingModel(false)
    }
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      {/* Updated header layout and replaced Export Report with Add New Model */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Inventory Management</h2>
          <p className="text-muted-foreground">Track stock levels and warehouse operations</p>
        </div>
        <div className="flex gap-3">
          {/* Pricing Calculator Dialog */}
          <Dialog
            open={isPricingCalculatorOpen}
            onOpenChange={(open) => {
              setIsPricingCalculatorOpen(open)
            }}
          >
            <DialogTrigger asChild>
              <Button variant="outline" className={cn(ds.button.secondary, "relative overflow-hidden group")}>
                <Calculator className="w-4 h-4 mr-2" />
                Pricing Calculator
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold">Pricing Calculator</DialogTitle>
                <DialogDescription>
                  Calculate rental pricing based on device cost and business settings.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <PricingCalculator />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsPricingCalculatorOpen(false)} className="rounded-xl">
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Settings Dialog */}
          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className={cn(ds.button.secondary, "relative overflow-hidden group")}
                onClick={handleSettingsOpen}
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold">Business Settings</DialogTitle>
                <DialogDescription>
                  Configure your business-specific settings for inventory calculations.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                {isLoadingSettings ? (
                  <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : businessSettings.length === 0 ? (
                  <div className="text-center text-muted-foreground py-10">
                    No settings found. Please check your database configuration.
                  </div>
                ) : (
                  businessSettings.map((setting) => (
                    <div key={setting.id} className="space-y-2">
                      <Label htmlFor={`setting-${setting.id}`} className="text-sm font-medium">
                        {setting.setting_name}
                      </Label>
                      {setting.description && <p className="text-xs text-muted-foreground">{setting.description}</p>}
                      <div className="flex items-center gap-2">
                        {/* Investor Profit Rate, Payment Gateway Fee, Risk Provision, Target Margin - show % input */}
                        {(setting.setting_key === "investor_profit_rate" ||
                          setting.setting_key === "payment_gateway_fee" ||
                          setting.setting_key === "risk_provision" ||
                          setting.setting_key === "target_margin") && (
                          <>
                            <Input
                              id={`setting-${setting.id}`}
                              type="number"
                              placeholder="e.g., 15.00"
                              className="rounded-xl flex-1"
                              value={setting.value_percent ?? ""}
                              onChange={(e) =>
                                handleSettingChange(setting.setting_key, "value_percent", e.target.value)
                              }
                              min="0"
                              max="100"
                              step="0.01"
                            />
                            <div className="flex items-center justify-center px-3 bg-muted border border-l-0 border-input rounded-r-xl text-sm text-muted-foreground h-9">
                              %
                            </div>
                          </>
                        )}
                        {/* Logistics Buffer - show AED input */}
                        {setting.setting_key === "logistics_buffer" && (
                          <>
                            <div className="flex items-center justify-center px-3 bg-muted border border-r-0 border-input rounded-l-xl text-sm text-muted-foreground h-9">
                              AED
                            </div>
                            <Input
                              id={`setting-${setting.id}`}
                              type="number"
                              placeholder="e.g., 500.00"
                              className="rounded-l-none rounded-r-xl flex-1"
                              value={setting.value_aed ?? ""}
                              onChange={(e) => handleSettingChange(setting.setting_key, "value_aed", e.target.value)}
                              min="0"
                              step="0.01"
                            />
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsSettingsOpen(false)} className="rounded-xl">
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveSettings}
                  disabled={isSavingSettings || businessSettings.length === 0}
                  className="rounded-xl"
                >
                  {isSavingSettings ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Settings"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isModelDialogOpen} onOpenChange={setIsModelDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className={cn(ds.button.secondary, "relative overflow-hidden group bg-transparent")}
              >
                <Layers className="w-4 h-4 mr-2 transition-transform duration-300 group-hover:scale-110" />
                Add New Model
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold">Add Device Model</DialogTitle>
                <DialogDescription>
                  Define a new device model with storage and color variants. These will be available when adding
                  devices.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Model Name */}
                <div className="space-y-2">
                  <Label htmlFor="model-name">Model Name *</Label>
                  <Input
                    id="model-name"
                    placeholder="e.g., iPhone 17 Pro Max"
                    className="rounded-xl"
                    value={modelFormData.name}
                    onChange={(e) => setModelFormData({ ...modelFormData, name: e.target.value })}
                  />
                </div>

                {/* Brand and Category */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="model-brand">Brand *</Label>
                    <Input
                      id="model-brand"
                      placeholder="e.g., Apple"
                      className="rounded-xl"
                      value={modelFormData.brand}
                      onChange={(e) => setModelFormData({ ...modelFormData, brand: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model-category">Category *</Label>
                    <Select
                      value={showCustomCategory ? "custom" : modelFormData.category}
                      onValueChange={(value) => {
                        if (value === "custom") {
                          setShowCustomCategory(true)
                          setModelFormData({ ...modelFormData, category: "" })
                        } else {
                          setShowCustomCategory(false)
                          setCustomCategory("")
                          setModelFormData({ ...modelFormData, category: value })
                        }
                      }}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="smartphone">Smartphone</SelectItem>
                        <SelectItem value="tablet">Tablet</SelectItem>
                        <SelectItem value="laptop">Laptop</SelectItem>
                        <SelectItem value="gaming-console">Gaming Console</SelectItem>
                        <SelectItem value="smartwatch">Smartwatch</SelectItem>
                        <SelectItem value="accessory">Accessory</SelectItem>
                        <SelectItem value="custom">Custom Category...</SelectItem>
                      </SelectContent>
                    </Select>
                    {showCustomCategory && (
                      <Input
                        placeholder="Enter custom category"
                        className="rounded-xl mt-2"
                        value={customCategory}
                        onChange={(e) => {
                          setCustomCategory(e.target.value)
                          setModelFormData({ ...modelFormData, category: e.target.value })
                        }}
                      />
                    )}
                  </div>
                </div>

                {/* Storage Options */}
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setExpandedSections({ ...expandedSections, storage: !expandedSections.storage })}
                    className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
                  >
                    {expandedSections.storage ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    Storage Options
                  </button>

                  {expandedSections.storage && (
                    <div className="space-y-2 pl-6">
                      <div className="flex gap-2">
                        <Select value={newStorage} onValueChange={setNewStorage}>
                          <SelectTrigger className="rounded-xl flex-1">
                            <SelectValue placeholder="Select storage" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="128GB">128GB</SelectItem>
                            <SelectItem value="256GB">256GB</SelectItem>
                            <SelectItem value="512GB">512GB</SelectItem>
                            <SelectItem value="1TB">1TB</SelectItem>
                            <SelectItem value="2TB">2TB</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="rounded-xl shrink-0 bg-transparent"
                          onClick={handleAddStorage}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {modelFormData.storageOptions.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {modelFormData.storageOptions.map((storage) => (
                            <Badge key={storage} variant="secondary" className="gap-1">
                              {storage}
                              <button
                                type="button"
                                onClick={() => handleRemoveStorage(storage)}
                                className="ml-1 hover:text-destructive"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Color Options */}
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setExpandedSections({ ...expandedSections, colors: !expandedSections.colors })}
                    className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
                  >
                    {expandedSections.colors ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    Color Options
                  </button>

                  {expandedSections.colors && (
                    <div className="space-y-2 pl-6">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter color name"
                          className="rounded-xl flex-1"
                          value={newColor}
                          onChange={(e) => setNewColor(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              handleAddColor()
                            }
                          }}
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="rounded-xl shrink-0 bg-transparent"
                          onClick={handleAddColor}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {modelFormData.colorOptions.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {modelFormData.colorOptions.map((color) => (
                            <Badge key={color} variant="secondary" className="gap-1">
                              {color}
                              <button
                                type="button"
                                onClick={() => handleRemoveColor(color)}
                                className="ml-1 hover:text-destructive"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsModelDialogOpen(false)} className="rounded-xl">
                  Cancel
                </Button>
                <Button
                  onClick={handleAddModel}
                  disabled={isSubmittingModel || !modelFormData.name || !modelFormData.brand || !modelFormData.category}
                  className="rounded-xl"
                >
                  {isSubmittingModel ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Model"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className={ds.card.lift}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Devices</CardTitle>
            <div className={ds.iconContainer.withRotation("blue")}>
              <Package className={cn("h-5 w-5", ds.iconColor.info)} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : (totalDevices?.toLocaleString() ?? "0")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Across all categories</p>
          </CardContent>
        </Card>

        <Card className={ds.card.lift}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Value</CardTitle>
            <div className={ds.iconContainer.withRotation("green")}>
              <TrendingUp className={cn("h-5 w-5", ds.iconColor.success)} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : formatCurrency(totalValue ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-success">+8.2%</span> from last month
            </p>
          </CardContent>
        </Card>

        {/* Utilization Rate Card */}
        <Card className={ds.card.lift}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Utilization Rate</CardTitle>
            <div className={ds.iconContainer.withRotation("warning")}>
              <Activity className="h-5 w-5 text-warning" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : `${utilizationRate ?? 0}%`}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isLoading
                ? "Loading..."
                : `${totalDevices ? Math.round(((utilizationRate ?? 0) * totalDevices) / 100) : 0} of ${totalDevices ?? 0} devices rented`}
            </p>
          </CardContent>
        </Card>

        {/* Available Inventory Card */}
        <Card className={ds.card.lift}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Available Inventory</CardTitle>
            <div className={ds.iconContainer.withRotation("info")}>
              <Box className="h-5 w-5 text-info" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : (availableInventory?.toLocaleString() ?? "0")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isLoading
                ? "Loading..."
                : `${totalDevices ? Math.round(((availableInventory ?? 0) / totalDevices) * 100) : 0}% of total inventory`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 transition-colors duration-300 group-focus-within:text-primary" />
          <Input
            placeholder="Search by name, SKU, serial, or brand..."
            className="pl-11 pr-10 h-11 rounded-xl border-border transition-all duration-300 focus:ring-2 focus:ring-ring/20 focus:border-ring focus:shadow-lg focus:shadow-ring/10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200 p-1 rounded-md hover:bg-muted"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className={cn("w-[180px]", ds.input.select)}>
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="smartphone">Smartphone</SelectItem>
            <SelectItem value="tablet">Tablet</SelectItem>
            <SelectItem value="laptop">Laptop</SelectItem>
            <SelectItem value="wearable">Wearable</SelectItem>
            <SelectItem value="accessory">Accessory</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className={cn("w-[150px]", ds.input.select)}>
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="rented">Rented</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
            <SelectItem value="reserved">Reserved</SelectItem>
            <SelectItem value="retired">Retired</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1 bg-muted rounded-xl p-1 relative">
          {/* Animated sliding background */}
          <div
            className={cn(
              "absolute top-1 bottom-1 w-[calc(50%-2px)] bg-background rounded-lg shadow-sm transition-all duration-300 ease-out",
              viewMode === "grid" ? "left-1" : "left-[calc(50%+1px)]",
            )}
          />
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 rounded-lg relative z-10 transition-colors duration-300",
              viewMode === "grid" ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 rounded-lg relative z-10 transition-colors duration-300",
              viewMode === "list" ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Inventory Grid/List */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoadingDevices ? (
            <div className="col-span-full flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : deviceModels.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Layers className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">No device models found</p>
              <p className="text-sm">Add your first device model to get started</p>
              <Button onClick={() => setIsModelDialogOpen(true)} className="mt-4 rounded-xl" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add New Model
              </Button>
            </div>
          ) : (
            deviceModels.map((model, index) => {
              const modelDevices = devices.filter((d) => d.model_id === model.id)
              const filteredModelDevices = filteredDevices.filter((d) => d.model_id === model.id)

              return (
                <Card
                  key={model.id}
                  className={cn(ds.card.liftStrong, "animate-in fade-in slide-in-from-bottom-4 duration-500")}
                  style={{ animationDelay: `${index * 100}ms`, animationFillMode: "both" }}
                >
                  <CardHeader className="pb-3 border-b">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={ds.iconContainer.withRotation("primary")}>
                          <Layers className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{model.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {model.brand} • {model.category}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg"
                          onClick={() => handleEditModelClick(model)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Badge variant="outline" className="rounded-lg">
                          {modelDevices.length} {modelDevices.length === 1 ? "device" : "devices"}
                        </Badge>
                      </div>
                    </div>

                    {/* Model Variants Info */}
                    <div className="mt-3 space-y-2">
                      {model.storage_options && model.storage_options.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          <span className="text-xs text-muted-foreground mr-1">Storage:</span>
                          {model.storage_options.map((storage) => (
                            <Badge key={storage} variant="secondary" className="text-xs rounded-md">
                              {storage}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {model.color_options && model.color_options.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          <span className="text-xs text-muted-foreground mr-1">Colors:</span>
                          {model.color_options.map((color) => (
                            <Badge key={color} variant="secondary" className="text-xs rounded-md">
                              {color}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="pt-4 space-y-3">
                    {/* Devices in this model */}
                    {filteredModelDevices.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        <Package className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No devices added yet</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {filteredModelDevices.map((device) => (
                          <div
                            key={device.id}
                            className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors group"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium text-sm truncate">{device.serial_number || "No S/N"}</p>
                                <Badge className={cn("text-xs rounded-md", getStatusBadgeStyle(device.status))}>
                                  {device.status}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                {device.storage && <span>{device.storage}</span>}
                                {device.color && (
                                  <>
                                    <span>•</span>
                                    <span>{device.color}</span>
                                  </>
                                )}
                                {device.acquisition_cost_aed && (
                                  <>
                                    <span>•</span>
                                    <span className="font-medium">
                                      AED {device.acquisition_cost_aed.toLocaleString()}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-lg"
                                onClick={() => handleViewDevice(device)}
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-lg"
                                onClick={() => handleEditClick(device)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-lg text-destructive hover:text-destructive"
                                onClick={() => handleDeleteClick(device)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add Device Button */}
                    <Button
                      onClick={() => handleAddDeviceToModel(model.id)}
                      className="w-full rounded-xl mt-3"
                      variant="outline"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Device to {model.name}
                    </Button>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      ) : (
        <Card className="rounded-2xl border border-border shadow-md bg-card">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Device</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Serial Number</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Category</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Condition</th>
                    <th
                      className="text-left p-4 text-sm font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors group"
                      onClick={toggleValueSort}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Value</span>
                        <span className="text-muted-foreground/50 group-hover:text-muted-foreground transition-colors">
                          {valueSortDirection === "none" && <ArrowUpDown className="h-4 w-4" />}
                          {valueSortDirection === "asc" && <ArrowUp className="h-4 w-4 text-primary" />}
                          {valueSortDirection === "desc" && <ArrowDown className="h-4 w-4 text-primary" />}
                        </span>
                      </div>
                    </th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingDevices ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                      </td>
                    </tr>
                  ) : filteredDevices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <Package className="h-12 w-12 mb-4 opacity-50" />
                          <p className="text-lg font-medium">No devices found</p>
                          <p className="text-sm">
                            {searchQuery || categoryFilter !== "all" || statusFilter !== "all"
                              ? "Try adjusting your search or filters"
                              : "Add your first device to get started"}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredDevices.map((device) => (
                      <tr key={device.id} className="border-b hover:bg-muted/30 transition-colors group">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={ds.iconContainer.withRotation("blue")}>
                              <Smartphone className={cn("h-4 w-4", ds.iconColor.info)} />
                            </div>
                            <div>
                              <p className="font-medium group-hover:text-primary transition-colors">{device.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {device.brand || "Unknown"} {device.storage && `• ${device.storage}`}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-sm font-mono">{device.serial_number || "N/A"}</span>
                        </td>
                        <td className="p-4">
                          <Badge variant="outline" className="rounded-lg">
                            {device.category || "Uncategorized"}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Badge className={cn("rounded-lg", getStatusBadgeStyle(device.status))}>
                            {device.status || "Unknown"}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Badge className={cn("rounded-lg", getConditionBadgeStyle(device.condition))}>
                            {formatCondition(device.condition)}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <span className="text-sm font-medium">
                            {device.acquisition_cost_aed
                              ? `AED ${device.acquisition_cost_aed.toLocaleString()}`
                              : "N/A"}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className={cn(ds.button.iconBlue, "h-8 w-8")}
                              onClick={() => handleViewDevice(device)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className={cn(ds.button.icon, "h-8 w-8")}
                              onClick={() => handleEditClick(device)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg text-destructive hover:text-destructive"
                              onClick={() => handleDeleteClick(device)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* View Device Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className={cn(ds.iconContainer.withRotation("primary"), "w-12 h-12")}>
                <Smartphone className="w-6 h-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl">{viewDevice?.name}</DialogTitle>
                <DialogDescription>Device Details</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          {viewDevice && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Serial Number */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Serial Number</Label>
                  <p className="font-medium font-mono text-sm">{viewDevice.serial_number || "N/A"}</p>
                </div>
                {/* SKU */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">SKU</Label>
                  <p className="font-medium text-sm">{viewDevice.sku || "N/A"}</p>
                </div>
                {/* Brand */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Brand</Label>
                  <p className="font-medium text-sm">{viewDevice.brand || "N/A"}</p>
                </div>
                {/* Category */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Category</Label>
                  <p className="font-medium text-sm capitalize">{viewDevice.category || "N/A"}</p>
                </div>
                {/* Storage */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Storage</Label>
                  <p className="font-medium text-sm">{viewDevice.storage || "N/A"}</p>
                </div>
                {/* Condition */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Condition</Label>
                  <Badge className={`text-xs rounded-lg ${getConditionBadgeStyle(viewDevice.condition || null)}`}>
                    {formatCondition(viewDevice.condition || null)}
                  </Badge>
                </div>
                {/* Status */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Badge className={`text-xs rounded-lg ${getStatusBadgeStyle(viewDevice.status || null)}`}>
                    {viewDevice.status || "Unknown"}
                  </Badge>
                </div>
                {/* Acquisition Cost */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Acquisition Cost</Label>
                  <p className="font-medium text-sm">
                    {viewDevice.acquisition_cost_aed
                      ? `AED ${viewDevice.acquisition_cost_aed.toLocaleString()}`
                      : "N/A"}
                  </p>
                </div>
                {/* Added Depreciation Rate field in View Dialog */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Depreciation Rate</Label>
                  <p className="font-medium text-sm">
                    {viewDevice.depreciation_rate_percent !== null && viewDevice.depreciation_rate_percent !== undefined
                      ? `${viewDevice.depreciation_rate_percent.toFixed(2)}%`
                      : "N/A"}
                  </p>
                </div>
                {/* Added Refurb Estimate field in View Dialog */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Refurb Estimate</Label>
                  <p className="font-medium text-sm">
                    {viewDevice.refurb_estimate_aed !== null && viewDevice.refurb_estimate_aed !== undefined
                      ? `AED ${viewDevice.refurb_estimate_aed.toLocaleString()}`
                      : "N/A"}
                  </p>
                </div>
              </div>

              {/* Accessories */}
              {viewDevice.accessories && viewDevice.accessories.length > 0 && (
                <div className="space-y-2 pt-4 border-t">
                  <Label className="text-sm font-medium block">Accessories</Label>
                  <div className="space-y-2">
                    {viewDevice.accessories.map((accessory, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-primary" />
                          <span className="text-sm font-medium">{accessory.name}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">AED {accessory.cost}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between p-3 rounded-lg border border-primary/20 bg-primary/5">
                      <span className="text-sm font-semibold">Total Accessories Cost</span>
                      <span className="text-sm font-bold text-primary">
                        AED {viewDevice.accessories.reduce((sum, acc) => sum + acc.cost, 0)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              {viewDevice.notes && (
                <div className="space-y-2 pt-4 border-t">
                  <Label className="text-sm font-medium block">Notes</Label>
                  <p className="text-sm text-muted-foreground">{viewDevice.notes}</p>
                </div>
              )}

              {/* Invoice */}
              {viewDevice.invoice_url && (
                <div className="pt-4 border-t">
                  <Label className="text-sm font-medium mb-2 block">Invoice</Label>
                  <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                    {viewDevice.invoice_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                      <img
                        src={viewDevice.invoice_url || "/placeholder.svg"}
                        alt="Invoice"
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
                        <FileText className="w-8 h-8 text-primary" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium">Device Invoice</p>
                      <p className="text-xs text-muted-foreground">Click to view or download</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl bg-transparent"
                      onClick={() => window.open(viewDevice.invoice_url!, "_blank")}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog - Add animations */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className={cn(ds.dialog.content, "animate-in zoom-in-95 duration-300")}>
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Edit Device</DialogTitle>
            <DialogDescription>Update the device details below. Click save when you're done.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Basic Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Device Name *</Label>
                  <Input
                    id="edit-name"
                    placeholder="e.g., iPhone 15 Pro"
                    className="rounded-xl transition-all duration-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    value={editFormData.name}
                    onChange={(e) => handleEditInputChange("name", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-sku">SKU</Label>
                  <Input
                    id="edit-sku"
                    placeholder="e.g., IPH-15P-256"
                    className="rounded-xl transition-all duration-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    value={editFormData.sku}
                    onChange={(e) => handleEditInputChange("sku", e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-serial_number">Serial Number</Label>
                  <Input
                    id="edit-serial_number"
                    placeholder="e.g., SN123456789"
                    className="rounded-xl transition-all duration-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    value={editFormData.serial_number}
                    onChange={(e) => handleEditInputChange("serial_number", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-brand">Brand</Label>
                  <Input
                    id="edit-brand"
                    placeholder="e.g., Apple"
                    className="rounded-xl transition-all duration-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    value={editFormData.brand}
                    onChange={(e) => handleEditInputChange("brand", e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-storage">Storage</Label>
                  <Select
                    value={editFormData.storage}
                    onValueChange={(value) => handleEditInputChange("storage", value)}
                  >
                    <SelectTrigger className="rounded-xl transition-all duration-300 focus:ring-2 focus:ring-blue-500/20">
                      <SelectValue placeholder="Select storage" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {editDeviceModel &&
                      editDeviceModel.storage_options &&
                      editDeviceModel.storage_options.length > 0 ? (
                        editDeviceModel.storage_options.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))
                      ) : (
                        <>
                          <SelectItem value="128GB">128GB</SelectItem>
                          <SelectItem value="256GB">256GB</SelectItem>
                          <SelectItem value="512GB">512GB</SelectItem>
                          <SelectItem value="1TB">1TB</SelectItem>
                          <SelectItem value="2TB">2TB</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-color">Color</Label>
                  <Select value={editFormData.color} onValueChange={(value) => handleEditInputChange("color", value)}>
                    <SelectTrigger className="rounded-xl transition-all duration-300 focus:ring-2 focus:ring-blue-500/20">
                      <SelectValue placeholder="Select color" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {editDeviceModel && editDeviceModel.color_options && editDeviceModel.color_options.length > 0 ? (
                        editDeviceModel.color_options.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))
                      ) : (
                        <>
                          <SelectItem value="Black">Black</SelectItem>
                          <SelectItem value="White">White</SelectItem>
                          <SelectItem value="Blue">Blue</SelectItem>
                          <SelectItem value="Gold">Gold</SelectItem>
                          <SelectItem value="Silver">Silver</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Status & Condition */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Category & Condition</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-category">Category</Label>
                  <Select
                    value={showCustomCategoryEdit ? "custom" : editFormData.category}
                    onValueChange={(value) => {
                      if (value === "custom") {
                        setShowCustomCategoryEdit(true)
                        setEditModelFormData((prev) => ({ ...prev, category: "" }))
                      } else {
                        setShowCustomCategoryEdit(false)
                        setCustomCategoryEdit("")
                        setEditModelFormData((prev) => ({ ...prev, category: value }))
                      }
                    }}
                  >
                    <SelectTrigger className="rounded-xl transition-all duration-300 focus:ring-2 focus:ring-blue-500/20">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="smartphone">Smartphone</SelectItem>
                      <SelectItem value="tablet">Tablet</SelectItem>
                      <SelectItem value="laptop">Laptop</SelectItem>
                      <SelectItem value="wearable">Wearable</SelectItem>
                      <SelectItem value="accessory">Accessory</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="custom">Custom Category...</SelectItem>
                    </SelectContent>
                  </Select>
                  {showCustomCategoryEdit && (
                    <Input
                      placeholder="Enter custom category"
                      className="rounded-xl mt-2"
                      value={customCategoryEdit}
                      onChange={(e) => {
                        setCustomCategoryEdit(e.target.value)
                        setEditModelFormData((prev) => ({ ...prev, category: e.target.value }))
                      }}
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-condition">Condition</Label>
                  <Select
                    value={editFormData.condition}
                    onValueChange={(value) => handleEditInputChange("condition", value)}
                  >
                    <SelectTrigger className="rounded-xl transition-all duration-300 focus:ring-2 focus:ring-blue-500/20">
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="like_new">Like New</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select value={editFormData.status} onValueChange={(value) => handleEditInputChange("status", value)}>
                  <SelectTrigger className="rounded-xl transition-all duration-300 focus:ring-2 focus:ring-blue-500/20">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="rented">Rented</SelectItem>
                    <SelectItem value="maintenance">Under Maintenance</SelectItem>
                    <SelectItem value="reserved">Reserved</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Pricing</h4>
              <div className="space-y-2">
                <Label htmlFor="edit-acquisition_cost_aed">Acquisition Cost (AED)</Label>
                <Input
                  id="edit-acquisition_cost_aed"
                  type="number"
                  placeholder="e.g., 4000"
                  className="rounded-xl transition-all duration-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  value={editFormData.acquisition_cost_aed}
                  onChange={(e) => handleEditInputChange("acquisition_cost_aed", e.target.value)}
                />
              </div>
              {/* Added Depreciation Rate field in Edit Dialog */}
              <div className="space-y-2">
                <Label htmlFor="edit-depreciation_rate_percent">Depreciation Rate</Label>
                <div className="flex">
                  <Input
                    id="edit-depreciation_rate_percent"
                    type="number"
                    placeholder="e.g., 15.5"
                    className="rounded-l-xl rounded-r-none"
                    value={editFormData.depreciation_rate_percent}
                    onChange={(e) => handleEditInputChange("depreciation_rate_percent", e.target.value)}
                    step="0.01"
                    min="0"
                    max="100"
                  />
                  <div className="flex items-center justify-center px-3 bg-muted border border-l-0 border-input rounded-r-xl text-sm text-muted-foreground">
                    %
                  </div>
                </div>
              </div>
              {/* Added Refurb Estimate field in Edit Dialog */}
              <div className="space-y-2">
                <Label htmlFor="edit-refurb_estimate_aed">Refurb Estimate</Label>
                <div className="flex">
                  <div className="flex items-center justify-center px-3 bg-muted border border-r-0 border-input rounded-l-xl text-sm text-muted-foreground">
                    AED
                  </div>
                  <Input
                    id="edit-refurb_estimate_aed"
                    type="number"
                    placeholder="e.g., 500"
                    className="rounded-l-none rounded-r-xl"
                    value={editFormData.refurb_estimate_aed}
                    onChange={(e) => handleEditInputChange("refurb_estimate_aed", e.target.value)}
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                placeholder="Additional notes about the device..."
                className="rounded-xl min-h-[80px] transition-all duration-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                value={editFormData.notes}
                onChange={(e) => handleEditInputChange("notes", e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="rounded-xl transition-all duration-300 hover:scale-105 active:scale-95"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditSubmit}
              disabled={isSubmitting || !editFormData.name}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25 active:scale-95 disabled:hover:scale-100"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog - Add animations */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className={cn(ds.dialog.content, "animate-in zoom-in-95 duration-300")}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Device</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedDevice?.name}"? This action cannot be undone and will
              permanently remove the device from your inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl transition-all duration-300 hover:scale-105 active:scale-95">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-red-500/25 active:scale-95"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isEditModelDialogOpen} onOpenChange={setIsEditModelDialogOpen}>
        <DialogContent className={cn(ds.dialog.content, "sm:max-w-[700px] max-h-[90vh] overflow-y-auto")}>
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Edit Device Model</DialogTitle>
            <DialogDescription>
              Update the model configuration. Changes will be reflected in the device list.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Model Name */}
            <div className="space-y-2">
              <Label htmlFor="edit-model-name">Model Name *</Label>
              <Input
                id="edit-model-name"
                placeholder="e.g., iPhone 17 Pro Max"
                value={editModelFormData.name}
                onChange={(e) => setEditModelFormData((prev) => ({ ...prev, name: e.target.value }))}
                className="rounded-xl"
              />
            </div>

            {/* Brand and Category */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-model-brand">Brand</Label>
                <Input
                  id="edit-model-brand"
                  placeholder="e.g., Apple"
                  value={editModelFormData.brand}
                  onChange={(e) => setEditModelFormData((prev) => ({ ...prev, brand: e.target.value }))}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-model-category">Category</Label>
                <Select
                  value={showCustomCategoryEditModel ? "custom" : editModelFormData.category}
                  onValueChange={(value) => {
                    if (value === "custom") {
                      setShowCustomCategoryEditModel(true)
                      setEditModelFormData((prev) => ({ ...prev, category: "" }))
                    } else {
                      setShowCustomCategoryEditModel(false)
                      setCustomCategoryEditModel("")
                      setEditModelFormData((prev) => ({ ...prev, category: value }))
                    }
                  }}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Smartphone">Smartphone</SelectItem>
                    <SelectItem value="Tablet">Tablet</SelectItem>
                    <SelectItem value="Laptop">Laptop</SelectItem>
                    <SelectItem value="Gaming Console">Gaming Console</SelectItem>
                    <SelectItem value="Smartwatch">Smartwatch</SelectItem>
                    <SelectItem value="custom">Custom Category...</SelectItem>
                  </SelectContent>
                </Select>
                {showCustomCategoryEditModel && (
                  <Input
                    placeholder="Enter custom category"
                    className="rounded-xl mt-2"
                    value={customCategoryEditModel}
                    onChange={(e) => {
                      setCustomCategoryEditModel(e.target.value)
                      setEditModelFormData((prev) => ({ ...prev, category: e.target.value }))
                    }}
                  />
                )}
              </div>
            </div>

            {/* Storage Options */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Storage Options</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedSections((prev) => ({ ...prev, storage: !prev.storage }))}
                  className="h-8 text-sm"
                >
                  {expandedSections.storage ? (
                    <>
                      <ChevronDown className="h-4 w-4 mr-1" />
                      Hide
                    </>
                  ) : (
                    <>
                      <ChevronRight className="h-4 w-4 mr-1" />
                      Show
                    </>
                  )}
                </Button>
              </div>

              {expandedSections.storage && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g., 128GB, 256GB"
                      value={editModelNewStorage}
                      onChange={(e) => setEditModelNewStorage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && editModelNewStorage.trim()) {
                          e.preventDefault()
                          if (!editModelFormData.storageOptions.includes(editModelNewStorage.trim())) {
                            setEditModelFormData((prev) => ({
                              ...prev,
                              storageOptions: [...prev.storageOptions, editModelNewStorage.trim()],
                            }))
                            setEditModelNewStorage("")
                          }
                        }
                      }}
                      className="rounded-xl"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (
                          editModelNewStorage.trim() &&
                          !editModelFormData.storageOptions.includes(editModelNewStorage.trim())
                        ) {
                          setEditModelFormData((prev) => ({
                            ...prev,
                            storageOptions: [...prev.storageOptions, editModelNewStorage.trim()],
                          }))
                          setEditModelNewStorage("")
                        }
                      }}
                      className="rounded-xl"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {editModelFormData.storageOptions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {editModelFormData.storageOptions.map((storage, idx) => (
                        <Badge key={idx} variant="secondary" className="rounded-lg pr-1">
                          {storage}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 ml-1 hover:bg-transparent"
                            onClick={() => {
                              setEditModelFormData((prev) => ({
                                ...prev,
                                storageOptions: prev.storageOptions.filter((_, i) => i !== idx),
                              }))
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Color Options */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Color Options</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedSections((prev) => ({ ...prev, colors: !prev.colors }))}
                  className="h-8 text-sm"
                >
                  {expandedSections.colors ? (
                    <>
                      <ChevronDown className="h-4 w-4 mr-1" />
                      Hide
                    </>
                  ) : (
                    <>
                      <ChevronRight className="h-4 w-4 mr-1" />
                      Show
                    </>
                  )}
                </Button>
              </div>

              {expandedSections.colors && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g., Black, White, Blue"
                      value={editModelNewColor}
                      onChange={(e) => setEditModelNewColor(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && editModelNewColor.trim()) {
                          e.preventDefault()
                          if (!editModelFormData.colorOptions.includes(editModelNewColor.trim())) {
                            setEditModelFormData((prev) => ({
                              ...prev,
                              colorOptions: [...prev.colorOptions, editModelNewColor.trim()],
                            }))
                            setEditModelNewColor("")
                          }
                        }
                      }}
                      className="rounded-xl"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (
                          editModelNewColor.trim() &&
                          !editModelFormData.colorOptions.includes(editModelNewColor.trim())
                        ) {
                          setEditModelFormData((prev) => ({
                            ...prev,
                            colorOptions: [...prev.colorOptions, editModelNewColor.trim()],
                          }))
                          setEditModelNewColor("")
                        }
                      }}
                      className="rounded-xl"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {editModelFormData.colorOptions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {editModelFormData.colorOptions.map((color, idx) => (
                        <Badge key={idx} variant="secondary" className="rounded-lg pr-1">
                          {color}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 ml-1 hover:bg-transparent"
                            onClick={() => {
                              setEditModelFormData((prev) => ({
                                ...prev,
                                colorOptions: prev.colorOptions.filter((_, i) => i !== idx),
                              }))
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModelDialogOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleEditModelSubmit} disabled={isSubmittingModel} className={cn(ds.button.primary)}>
              {isSubmittingModel ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Model"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Device Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Add Device</DialogTitle>
            <DialogDescription>
              {selectedModelForAdd && deviceModels.find((m) => m.id === selectedModelForAdd)
                ? `Adding a new device to model: ${deviceModels.find((m) => m.id === selectedModelForAdd)?.name}`
                : "Add a new device to your inventory"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Model Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Device Model</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Model *</Label>
                  <Select
                    value={formData.model_id}
                    onValueChange={(value) => {
                      const model = deviceModels.find((m) => m.id === value)
                      if (model) {
                        setFormData({
                          ...formData,
                          model_id: value,
                          name: model.name,
                          brand: model.brand || "",
                          category: model.category || "",
                          storage: "",
                          color: "",
                        })
                        setSelectedModelForAdd(value)
                      }
                    }}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {deviceModels.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.name} ({model.brand})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Device Name</Label>
                  <Input
                    placeholder="e.g., iPhone 15 Pro Max"
                    className="rounded-xl"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Variant Selection */}
            {formData.model_id &&
              (() => {
                const selectedModel = deviceModels.find((m) => m.id === formData.model_id)
                return selectedModel ? (
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-muted-foreground">Device Variants</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedModel.storage_options && selectedModel.storage_options.length > 0 && (
                        <div className="space-y-2">
                          <Label>Storage</Label>
                          <Select
                            value={formData.storage}
                            onValueChange={(value) => handleInputChange("storage", value)}
                          >
                            <SelectTrigger className="rounded-xl">
                              <SelectValue placeholder="Select storage" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              {selectedModel.storage_options.map((storage) => (
                                <SelectItem key={storage} value={storage}>
                                  {storage}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      {selectedModel.color_options && selectedModel.color_options.length > 0 && (
                        <div className="space-y-2">
                          <Label>Color</Label>
                          <Select value={formData.color} onValueChange={(value) => handleInputChange("color", value)}>
                            <SelectTrigger className="rounded-xl">
                              <SelectValue placeholder="Select color" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              {selectedModel.color_options.map((color) => (
                                <SelectItem key={color} value={color}>
                                  {color}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null
              })()}

            {/* Device Details */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Device Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>SKU</Label>
                  <Input
                    placeholder="e.g., IPH-15PM-001"
                    className="rounded-xl"
                    value={formData.sku}
                    onChange={(e) => handleInputChange("sku", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Serial Number</Label>
                  <Input
                    placeholder="e.g., ABC123XYZ456"
                    className="rounded-xl"
                    value={formData.serial_number}
                    onChange={(e) => handleInputChange("serial_number", e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Condition *</Label>
                  <Select value={formData.condition} onValueChange={(value) => handleInputChange("condition", value)}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="like_new">Like New</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Pricing</h4>
              <div className="space-y-2">
                <Label htmlFor="acquisition_cost_aed">Device Cost</Label>
                <div className="flex">
                  <div className="flex items-center justify-center px-3 bg-muted border border-r-0 border-input rounded-l-xl text-sm text-muted-foreground">
                    AED
                  </div>
                  <Input
                    id="acquisition_cost_aed"
                    type="number"
                    placeholder="e.g., 4000"
                    className="rounded-l-none rounded-r-xl border-l-0"
                    value={formData.acquisition_cost_aed}
                    onChange={(e) => handleInputChange("acquisition_cost_aed", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="depreciation_rate_percent">Depreciation Rate</Label>
                <div className="flex">
                  <Input
                    id="depreciation_rate_percent"
                    type="number"
                    placeholder="e.g., 15.5"
                    className="rounded-l-xl rounded-r-none"
                    value={formData.depreciation_rate_percent}
                    onChange={(e) => handleInputChange("depreciation_rate_percent", e.target.value)}
                    step="0.01"
                    min="0"
                    max="100"
                  />
                  <div className="flex items-center justify-center px-3 bg-muted border border-l-0 border-input rounded-r-xl text-sm text-muted-foreground">
                    %
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="refurb_estimate_aed">Refurb Estimate</Label>
                <div className="flex">
                  <div className="flex items-center justify-center px-3 bg-muted border border-r-0 border-input rounded-l-xl text-sm text-muted-foreground">
                    AED
                  </div>
                  <Input
                    id="refurb_estimate_aed"
                    type="number"
                    placeholder="e.g., 500"
                    className="rounded-l-none rounded-r-xl border-l-0"
                    value={formData.refurb_estimate_aed}
                    onChange={(e) => handleInputChange("refurb_estimate_aed", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Accessories */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Accessories (Optional)</h4>
              <div className="flex gap-2">
                <Select
                  value={newAccessory.name}
                  onValueChange={(value) => setNewAccessory({ ...newAccessory, name: value })}
                >
                  <SelectTrigger className="rounded-xl flex-1">
                    <SelectValue placeholder="Select accessory type" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="Charger">Charger</SelectItem>
                    <SelectItem value="Cable">Cable</SelectItem>
                    <SelectItem value="Case">Case</SelectItem>
                    <SelectItem value="Earphones">Earphones</SelectItem>
                    <SelectItem value="Screen Protector">Screen Protector</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-0 flex-1">
                  <div className="flex items-center justify-center px-3 bg-muted border border-r-0 border-input rounded-l-xl text-sm text-muted-foreground h-10">
                    AED
                  </div>
                  <Input
                    type="number"
                    placeholder="Cost"
                    className="rounded-l-none rounded-r-none border-l-0 border-r-0 h-10"
                    value={newAccessory.cost}
                    onChange={(e) => setNewAccessory({ ...newAccessory, cost: e.target.value })}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl bg-transparent"
                  onClick={() => {
                    if (newAccessory.name && newAccessory.cost) {
                      setFormData({
                        ...formData,
                        accessories: [
                          ...formData.accessories,
                          { name: newAccessory.name, cost: Number.parseFloat(newAccessory.cost) },
                        ],
                      })
                      setNewAccessory({ name: "", cost: "" })
                    }
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.accessories.length > 0 && (
                <div className="space-y-2">
                  {formData.accessories.map((acc, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                      <span className="text-sm">
                        {acc.name}: AED {acc.cost}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            accessories: formData.accessories.filter((_, i) => i !== idx),
                          })
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Invoice Upload */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Invoice *</h4>
              <div
                className={cn(
                  "border-2 border-dashed rounded-xl p-6 transition-colors duration-200",
                  isDraggingInvoice ? "border-primary bg-primary/5" : "border-border",
                )}
                onDragOver={(e) => {
                  e.preventDefault()
                  setIsDraggingInvoice(true)
                }}
                onDragLeave={() => setIsDraggingInvoice(false)}
                onDrop={handleInvoiceDrop}
              >
                {invoiceFile ? (
                  <div className="space-y-3">
                    {invoicePreview && (
                      <div className="relative w-full h-48 rounded-lg overflow-hidden bg-muted">
                        <img
                          src={invoicePreview || "/placeholder.svg"}
                          alt="Invoice preview"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        <span className="text-sm font-medium">{invoiceFile.name}</span>
                      </div>
                      <Button variant="ghost" size="icon" onClick={removeInvoice} className="h-8 w-8">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <label className="cursor-pointer block">
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleInvoiceSelect}
                      className="hidden"
                    />
                    <div className="text-center">
                      <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                      <p className="text-sm font-medium">Drop invoice here or click to upload</p>
                      <p className="text-xs text-muted-foreground mt-1">Supports images and PDF files</p>
                    </div>
                  </label>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Additional Notes</h4>
              <Textarea
                placeholder="Any additional information about this device..."
                className="rounded-xl min-h-[100px]"
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false)
                setFormData({
                  name: "",
                  sku: "",
                  serial_number: "",
                  model_id: "",
                  storage: "",
                  color: "",
                  brand: "",
                  category: "",
                  condition: "",
                  status: "",
                  acquisition_cost_aed: "",
                  depreciation_rate_percent: "",
                  refurb_estimate_aed: "",
                  notes: "",
                  accessories: [],
                })
                setInvoiceFile(null)
                setInvoicePreview(null)
                setSelectedModelForAdd("")
              }}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.model_id || !formData.condition || !invoiceFile}
              className="rounded-xl"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Save Device"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
