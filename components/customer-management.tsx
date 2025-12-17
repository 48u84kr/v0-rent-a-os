"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import {
  Users,
  DollarSign,
  UserPlus,
  TrendingUp,
  Search,
  Plus,
  MoreVertical,
  Phone,
  Mail,
  MapPin,
  Edit,
  Trash2,
  Download,
  Calendar,
  FileText,
  Sparkles,
  Eye,
  Check,
  Copy,
  Upload,
  File,
  X,
  ImageIcon,
  FileSpreadsheet,
  FileArchive,
  ExternalLink,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { ds, cn } from "@/lib/design-system"

const UAEFlag = () => (
  <svg width="20" height="14" viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="rounded-sm">
    <rect width="20" height="4.67" fill="#00732F" />
    <rect y="4.67" width="20" height="4.67" fill="#FFFFFF" />
    <rect y="9.33" width="20" height="4.67" fill="#000000" />
    <rect width="5.5" height="14" fill="#FF0000" />
  </svg>
)

interface Customer {
  id: number
  name: string
  email: string
  phone: string
  address: string
  notes: string
  created_at: string
  emirates_id_url?: string | null
  financial_document_url?: string | null
}

interface CustomerDocument {
  id: number
  customer_id: number
  file_name: string
  file_type: string
  file_size: number
  file_url: string
  uploaded_at: string
}

interface CustomerStats {
  totalCustomers: number
  newThisMonth: number
  activeCustomers: number
  retentionRate: number
}

interface UploadedDocument {
  id: string
  file: File
  name: string
  type: string
  size: number
  preview?: string
}

export function CustomerManagement() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<CustomerStats>({
    totalCustomers: 0,
    newThisMonth: 0,
    activeCustomers: 0,
    retentionRate: 0,
  })

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
  })

  const [copiedItem, setCopiedItem] = useState<string | null>(null)

  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([])
  const [isDragging, setIsDragging] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [emiratesIdFile, setEmiratesIdFile] = useState<File | null>(null)
  const [emiratesIdPreview, setEmiratesIdPreview] = useState<string | null>(null)
  const [financialDocFile, setFinancialDocFile] = useState<File | null>(null)
  const [financialDocPreview, setFinancialDocPreview] = useState<string | null>(null)
  const [isDraggingEmiratesId, setIsDraggingEmiratesId] = useState(false)
  const [isDraggingFinancialDoc, setIsDraggingFinancialDoc] = useState(false)
  const emiratesIdInputRef = useRef<HTMLInputElement>(null)
  const financialDocInputRef = useRef<HTMLInputElement>(null)

  const [customerDocuments, setCustomerDocuments] = useState<CustomerDocument[]>([])
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [previewImageName, setPreviewImageName] = useState<string>("")

  const supabase = createClient()

  const fetchCustomers = async () => {
    setIsLoading(true)
    const { data, error } = await supabase.from("customers").select("*").order("created_at", { ascending: false })

    if (!error && data) {
      setCustomers(data)
    }
    setIsLoading(false)
  }

  const fetchStats = async () => {
    // Total customers
    const { count: totalCount } = await supabase.from("customers").select("*", { count: "exact", head: true })

    // New this month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count: newCount } = await supabase
      .from("customers")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startOfMonth.toISOString())

    setStats({
      totalCustomers: totalCount || 0,
      newThisMonth: newCount || 0,
      activeCustomers: Math.floor((totalCount || 0) * 0.85), // Placeholder: 85% active
      retentionRate: 92.5, // Placeholder value
    })
  }

  const fetchCustomerDocuments = async (customerId: number) => {
    setIsLoadingDocuments(true)
    const { data, error } = await supabase
      .from("customer_documents")
      .select("*")
      .eq("customer_id", customerId)
      .order("uploaded_at", { ascending: false })

    if (!error && data) {
      setCustomerDocuments(data)
    } else {
      setCustomerDocuments([])
    }
    setIsLoadingDocuments(false)
  }

  useEffect(() => {
    fetchCustomers()
    fetchStats()
  }, [])

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      address: "",
      notes: "",
    })
    setUploadedDocuments([])
    setEmiratesIdFile(null)
    setEmiratesIdPreview(null)
    setFinancialDocFile(null)
    setFinancialDocPreview(null)
  }

  const handleDragOver = (e: React.DragEvent, boxId: string) => {
    e.preventDefault()
    setIsDragging(boxId)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(null)
  }

  const handleDrop = (e: React.DragEvent, boxId: string) => {
    e.preventDefault()
    setIsDragging(null)
    const files = Array.from(e.dataTransfer.files)
    handleFiles(files)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      handleFiles(files)
    }
  }

  const handleFiles = (files: File[]) => {
    const newDocs: UploadedDocument[] = files.map((file) => ({
      id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      name: file.name,
      type: file.type,
      size: file.size,
      preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
    }))
    setUploadedDocuments((prev) => [...prev, ...newDocs])
  }

  const removeDocument = (docId: string) => {
    setUploadedDocuments((prev) => {
      const doc = prev.find((d) => d.id === docId)
      if (doc?.preview) {
        URL.revokeObjectURL(doc.preview)
      }
      return prev.filter((d) => d.id !== docId)
    })
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return ImageIcon
    if (type.includes("pdf")) return FileText
    if (type.includes("spreadsheet") || type.includes("excel") || type.includes("csv")) return FileSpreadsheet
    if (type.includes("zip") || type.includes("rar") || type.includes("archive")) return FileArchive
    return File
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const handleEmiratesIdFile = (file: File) => {
    setEmiratesIdFile(file)
    if (file.type.startsWith("image/")) {
      setEmiratesIdPreview(URL.createObjectURL(file))
    } else {
      setEmiratesIdPreview(null)
    }
  }

  const handleFinancialDocFile = (file: File) => {
    setFinancialDocFile(file)
    if (file.type.startsWith("image/")) {
      setFinancialDocPreview(URL.createObjectURL(file))
    } else {
      setFinancialDocPreview(null)
    }
  }

  const handleAddCustomer = async () => {
    if (!formData.name || !formData.email || !emiratesIdFile || !financialDocFile) return

    setIsSubmitting(true)
    const phoneWithCode = formData.phone ? `+971${formData.phone.replace(/^\+971/, "")}` : null

    let emiratesIdUrl = null
    const emiratesIdExt = emiratesIdFile.name.split(".").pop()
    const emiratesIdFileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${emiratesIdExt}`

    const { error: emiratesIdError } = await supabase.storage
      .from("customer-emirates-id")
      .upload(emiratesIdFileName, emiratesIdFile)

    if (!emiratesIdError) {
      const { data: emiratesIdUrlData } = supabase.storage.from("customer-emirates-id").getPublicUrl(emiratesIdFileName)
      emiratesIdUrl = emiratesIdUrlData.publicUrl
    }

    let financialDocUrl = null
    const financialDocExt = financialDocFile.name.split(".").pop()
    const financialDocFileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${financialDocExt}`

    const { error: financialDocError } = await supabase.storage
      .from("customer-financial-docs")
      .upload(financialDocFileName, financialDocFile)

    if (!financialDocError) {
      const { data: financialDocUrlData } = supabase.storage
        .from("customer-financial-docs")
        .getPublicUrl(financialDocFileName)
      financialDocUrl = financialDocUrlData.publicUrl
    }

    const { data: customerData, error: customerError } = await supabase
      .from("customers")
      .insert({
        name: formData.name,
        email: formData.email,
        phone: phoneWithCode,
        address: formData.address || null,
        notes: formData.notes || null,
        emirates_id_url: emiratesIdUrl,
        financial_document_url: financialDocUrl,
      })
      .select()
      .single()

    if (customerError || !customerData) {
      console.error("Error adding customer:", customerError)
      setIsSubmitting(false)
      return
    }

    if (uploadedDocuments.length > 0) {
      for (const doc of uploadedDocuments) {
        // Create unique file path with customer ID
        const fileExt = doc.name.split(".").pop()
        const fileName = `${customerData.id}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`

        // Upload to storage bucket
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("customer-documents")
          .upload(fileName, doc.file)

        if (uploadError) {
          console.error("Error uploading document:", uploadError)
          continue
        }

        // Get public URL of the uploaded file
        const { data: urlData } = supabase.storage.from("customer-documents").getPublicUrl(fileName)

        // Save document reference to customer_documents table
        await supabase.from("customer_documents").insert({
          customer_id: customerData.id,
          file_name: doc.name,
          file_type: doc.type,
          file_size: doc.size,
          file_url: urlData.publicUrl,
        })
      }
    }

    setIsSubmitting(false)
    setIsAddDialogOpen(false)
    resetForm()
    fetchCustomers()
    fetchStats()
  }

  const handleEditCustomer = async () => {
    if (!selectedCustomer || !formData.name || !formData.email) return

    setIsSubmitting(true)
    const phoneWithCode = formData.phone ? `+971${formData.phone.replace(/^\+971/, "")}` : null

    const { error } = await supabase
      .from("customers")
      .update({
        name: formData.name,
        email: formData.email,
        phone: phoneWithCode,
        address: formData.address || null,
        notes: formData.notes || null,
      })
      .eq("id", selectedCustomer.id)

    if (!error) {
      resetForm()
      setIsEditDialogOpen(false)
      setSelectedCustomer(null)
      fetchCustomers()
    }
    setIsSubmitting(false)
  }

  const handleDeleteCustomer = async () => {
    if (!selectedCustomer) return

    setIsSubmitting(true)
    const { error } = await supabase.from("customers").delete().eq("id", selectedCustomer.id)

    if (!error) {
      setIsDeleteDialogOpen(false)
      setSelectedCustomer(null)
      fetchCustomers()
      fetchStats()
    }
    setIsSubmitting(false)
  }

  const openEditDialog = (customer: Customer) => {
    setSelectedCustomer(customer)
    const phoneValue = customer.phone ? String(customer.phone) : ""
    const phoneWithoutCode = phoneValue.replace(/^\+971/, "")
    setFormData({
      name: customer.name || "",
      email: customer.email || "",
      phone: phoneWithoutCode,
      address: customer.address || "",
      notes: customer.notes || "",
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (customer: Customer) => {
    setSelectedCustomer(customer)
    setIsDeleteDialogOpen(true)
  }

  const openViewDialog = (customer: Customer) => {
    setSelectedCustomer(customer)
    setIsViewDialogOpen(true)
    fetchCustomerDocuments(customer.id)
  }

  const copyToClipboard = async (text: string, itemId: string) => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopiedItem(itemId)
      setTimeout(() => setCopiedItem(null), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const handleViewDocument = (doc: CustomerDocument) => {
    if (doc.file_type.startsWith("image/")) {
      // Open image in lightbox
      setPreviewImage(doc.file_url)
      setPreviewImageName(doc.file_name)
    } else {
      // Open other files in new tab
      window.open(doc.file_url, "_blank")
    }
  }

  const getCustomerAge = (createdAt: string) => {
    const created = new Date(createdAt)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - created.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 30) {
      return `${diffDays} day${diffDays !== 1 ? "s" : ""}`
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30)
      return `${months} month${months !== 1 ? "s" : ""}`
    } else {
      const years = Math.floor(diffDays / 365)
      return `${years} year${years !== 1 ? "s" : ""}`
    }
  }

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone?.includes(searchQuery),
  )

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Customer Management</h2>
          <p className="text-muted-foreground">Manage your customer database and relationships</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className={cn(ds.button.secondary, "relative overflow-hidden group")}>
            <span className={ds.overlay.secondaryGradientOverlay} />
            <Download className="w-4 h-4 mr-2 relative z-10 group-hover:animate-bounce" />
            <span className="relative z-10">Export</span>
          </Button>
          <Dialog
            open={isAddDialogOpen}
            onOpenChange={(open) => {
              if (!open) resetForm()
              setIsAddDialogOpen(open)
            }}
          >
            <DialogTrigger asChild>
              <Button className={cn(ds.button.primary, "text-primary-foreground")}>
                <span className={ds.overlay.primaryGradientOverlay} />
                <span className={ds.overlay.primaryGlow} />
                <Plus className="w-4 h-4 mr-2 relative z-10 group-hover:rotate-90 transition-transform duration-300" />
                <span className="relative z-10">Add Customer</span>
                <Sparkles className="w-3 h-3 ml-2 relative z-10 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:animate-pulse" />
              </Button>
            </DialogTrigger>
            <DialogContent className={cn(ds.dialog.content, "sm:max-w-2xl")}>
              <DialogHeader>
                <DialogTitle>Add New Customer</DialogTitle>
                <DialogDescription>Enter customer details to add them to your database.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      className={ds.input.base}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      className={ds.input.base}
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="flex">
                    <div className="flex items-center gap-2 px-3 border border-r-0 rounded-l-xl bg-muted border-input">
                      <UAEFlag />
                      <span className="text-sm font-medium text-muted-foreground">+971</span>
                    </div>
                    <Input
                      id="phone"
                      placeholder="50 123 4567"
                      className="rounded-l-none rounded-r-xl transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    placeholder="123 Main Street, Dubai, UAE"
                    className={ds.input.base}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Documents</Label>
                  <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileSelect} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Emirates ID Upload */}
                    <div
                      className={cn(
                        "relative border-2 border-dashed rounded-xl p-4 transition-all duration-300 cursor-pointer",
                        isDraggingEmiratesId
                          ? "border-primary bg-primary/5 scale-[1.02]"
                          : emiratesIdFile
                            ? "border-success bg-success/5"
                            : "border-border hover:border-primary/50 hover:bg-accent/50",
                      )}
                      onDragOver={(e) => {
                        e.preventDefault()
                        setIsDraggingEmiratesId(true)
                      }}
                      onDragLeave={() => setIsDraggingEmiratesId(false)}
                      onDrop={(e) => {
                        e.preventDefault()
                        setIsDraggingEmiratesId(false)
                        const files = Array.from(e.dataTransfer.files)
                        if (files.length > 0) handleEmiratesIdFile(files[0])
                      }}
                      onClick={() => emiratesIdInputRef.current?.click()}
                    >
                      <input
                        type="file"
                        ref={emiratesIdInputRef}
                        className="hidden"
                        accept="image/*,application/pdf"
                        onChange={(e) => {
                          if (e.target.files?.[0]) handleEmiratesIdFile(e.target.files[0])
                        }}
                      />
                      <div className="flex flex-col items-center justify-center gap-2 min-h-[120px]">
                        {emiratesIdFile ? (
                          <>
                            {emiratesIdPreview ? (
                              <div className="relative w-full h-20 rounded-lg overflow-hidden">
                                <img
                                  src={emiratesIdPreview || "/placeholder.svg"}
                                  alt="Emirates ID Preview"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <FileText className="h-10 w-10 text-success" />
                            )}
                            <p className="text-xs font-medium text-foreground truncate max-w-full">
                              {emiratesIdFile.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground">{formatFileSize(emiratesIdFile.size)}</p>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute top-2 right-2 h-6 w-6 p-0 rounded-full bg-destructive/10 hover:bg-destructive/20"
                              onClick={(e) => {
                                e.stopPropagation()
                                setEmiratesIdFile(null)
                                setEmiratesIdPreview(null)
                              }}
                            >
                              <X className="h-3 w-3 text-destructive" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                              <Upload className="h-6 w-6 text-primary" />
                            </div>
                            <div className="text-center">
                              <p className="text-sm font-medium text-foreground">Emirates ID</p>
                              <p className="text-xs text-destructive">* Required</p>
                            </div>
                            <p className="text-[10px] text-muted-foreground">Drop file or click to upload</p>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Financial Document Upload */}
                    <div
                      className={cn(
                        "relative border-2 border-dashed rounded-xl p-4 transition-all duration-300 cursor-pointer",
                        isDraggingFinancialDoc
                          ? "border-primary bg-primary/5 scale-[1.02]"
                          : financialDocFile
                            ? "border-success bg-success/5"
                            : "border-border hover:border-primary/50 hover:bg-accent/50",
                      )}
                      onDragOver={(e) => {
                        e.preventDefault()
                        setIsDraggingFinancialDoc(true)
                      }}
                      onDragLeave={() => setIsDraggingFinancialDoc(false)}
                      onDrop={(e) => {
                        e.preventDefault()
                        setIsDraggingFinancialDoc(false)
                        const files = Array.from(e.dataTransfer.files)
                        if (files.length > 0) handleFinancialDocFile(files[0])
                      }}
                      onClick={() => financialDocInputRef.current?.click()}
                    >
                      <input
                        type="file"
                        ref={financialDocInputRef}
                        className="hidden"
                        accept="image/*,application/pdf"
                        onChange={(e) => {
                          if (e.target.files?.[0]) handleFinancialDocFile(e.target.files[0])
                        }}
                      />
                      <div className="flex flex-col items-center justify-center gap-2 min-h-[120px]">
                        {financialDocFile ? (
                          <>
                            {financialDocPreview ? (
                              <div className="relative w-full h-20 rounded-lg overflow-hidden">
                                <img
                                  src={financialDocPreview || "/placeholder.svg"}
                                  alt="Financial Document Preview"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <FileText className="h-10 w-10 text-success" />
                            )}
                            <p className="text-xs font-medium text-foreground truncate max-w-full">
                              {financialDocFile.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground">{formatFileSize(financialDocFile.size)}</p>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute top-2 right-2 h-6 w-6 p-0 rounded-full bg-destructive/10 hover:bg-destructive/20"
                              onClick={(e) => {
                                e.stopPropagation()
                                setFinancialDocFile(null)
                                setFinancialDocPreview(null)
                              }}
                            >
                              <X className="h-3 w-3 text-destructive" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                              <Upload className="h-6 w-6 text-primary" />
                            </div>
                            <div className="text-center">
                              <p className="text-sm font-medium text-foreground">Financial Document</p>
                              <p className="text-xs text-destructive">* Required</p>
                            </div>
                            <p className="text-[10px] text-muted-foreground">Salary slip, bank statement, etc.</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Both documents are required. Supported formats: Images, PDF.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    resetForm()
                    setIsAddDialogOpen(false)
                  }}
                  className={ds.button.secondary}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddCustomer}
                  disabled={isSubmitting || !formData.name || !formData.email || !emiratesIdFile || !financialDocFile}
                  className={cn(
                    ds.button.primary,
                    "text-primary-foreground disabled:opacity-50 disabled:hover:scale-100",
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin mr-2">⟳</span>
                      {uploadedDocuments.length > 0 ? "Uploading..." : "Adding..."}
                    </>
                  ) : (
                    "Add Customer"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPI Cards - Use design system card styles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className={ds.card.lift}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Customers</CardTitle>
            <div className={ds.iconContainer.withRotation("blue")}>
              <Users className={cn("h-5 w-5", ds.iconColor.info)} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalCustomers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-success">+{stats.newThisMonth}</span> this month
            </p>
          </CardContent>
        </Card>

        <Card className={ds.card.lift}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">New This Month</CardTitle>
            <div className={ds.iconContainer.withRotation("green")}>
              <UserPlus className={cn("h-5 w-5", ds.iconColor.success)} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.newThisMonth}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-success">+12%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card className={ds.card.lift}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Customers</CardTitle>
            <div className={ds.iconContainer.withRotation("purple")}>
              <TrendingUp className={cn("h-5 w-5", ds.iconColor.purple)} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.activeCustomers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Placeholder value</p>
          </CardContent>
        </Card>

        <Card className={ds.card.lift}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Retention Rate</CardTitle>
            <div className={ds.iconContainer.withRotation("orange")}>
              <DollarSign className={cn("h-5 w-5", ds.iconColor.warning)} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.retentionRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">Placeholder value</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md group">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 transition-colors duration-300 group-focus-within:text-primary" />
          <Input
            placeholder="Search customers by name, email, or phone..."
            className={ds.input.search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Customer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Users className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">No customers found</p>
            <p className="text-sm">Add your first customer to get started</p>
          </div>
        ) : (
          filteredCustomers.map((customer, index) => (
            <Card
              key={customer.id}
              className={cn(ds.card.liftStrong, "animate-in fade-in slide-in-from-bottom-4 duration-500 group")}
              style={{ animationDelay: `${index * 100}ms`, animationFillMode: "both" }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={ds.iconContainer.avatar}>{customer.name?.charAt(0).toUpperCase() || "?"}</div>
                    <div>
                      <h3 className="font-semibold text-lg group-hover:text-primary transition-colors duration-200">
                        {customer.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">ID: {customer.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={ds.button.iconBlue}
                      onClick={() => openViewDialog(customer)}
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
                        <DropdownMenuItem onClick={() => openEditDialog(customer)} className={ds.dropdown.itemBlue}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => openDeleteDialog(customer)} className={ds.dropdown.itemRed}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div
                    className="flex items-center gap-2 text-sm group/item cursor-pointer rounded-lg px-2 py-1.5 -mx-2 transition-all duration-200 hover:bg-info-muted"
                    onClick={() => copyToClipboard(customer.email, `email-${customer.id}`)}
                  >
                    <Mail className="h-4 w-4 text-muted-foreground group-hover/item:text-info transition-colors duration-200" />
                    <span className="text-muted-foreground group-hover/item:text-info truncate transition-colors duration-200 flex-1">
                      {customer.email}
                    </span>
                    {copiedItem === `email-${customer.id}` ? (
                      <Check className="h-4 w-4 text-success" />
                    ) : (
                      <Copy className="h-4 w-4 opacity-0 group-hover/item:opacity-100 transition-opacity duration-200 text-info" />
                    )}
                  </div>
                  {customer.phone && (
                    <div
                      className="flex items-center gap-2 text-sm group/item cursor-pointer rounded-lg px-2 py-1.5 -mx-2 transition-all duration-200 hover:bg-success-muted"
                      onClick={() => copyToClipboard(customer.phone, `phone-${customer.id}`)}
                    >
                      <Phone className="h-4 w-4 text-muted-foreground group-hover/item:text-success transition-colors duration-200" />
                      <span className="text-muted-foreground group-hover/item:text-success truncate transition-colors duration-200 flex-1">
                        {customer.phone}
                      </span>
                      {copiedItem === `phone-${customer.id}` ? (
                        <Check className="h-4 w-4 text-success" />
                      ) : (
                        <Copy className="h-4 w-4 opacity-0 group-hover/item:opacity-100 transition-opacity duration-200 text-success" />
                      )}
                    </div>
                  )}
                  {customer.address && (
                    <div
                      className="flex items-center gap-2 text-sm group/item cursor-pointer rounded-lg px-2 py-1.5 -mx-2 transition-all duration-200 hover:bg-accent"
                      onClick={() => copyToClipboard(customer.address, `address-${customer.id}`)}
                    >
                      <MapPin className="h-4 w-4 text-muted-foreground group-hover/item:text-purple-600 dark:group-hover/item:text-purple-400 transition-colors duration-200" />
                      <span className="text-muted-foreground group-hover/item:text-purple-600 dark:group-hover/item:text-purple-400 truncate transition-colors duration-200 flex-1">
                        {customer.address}
                      </span>
                      {copiedItem === `address-${customer.id}` ? (
                        <Check className="h-4 w-4 text-success" />
                      ) : (
                        <Copy className="h-4 w-4 opacity-0 group-hover/item:opacity-100 transition-opacity duration-200 text-purple-600 dark:text-purple-400" />
                      )}
                    </div>
                  )}
                </div>
                {customer.notes && (
                  <div className="pt-2 border-t">
                    <div className="flex items-start gap-2 text-sm">
                      <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span className="text-muted-foreground line-clamp-2">{customer.notes}</span>
                    </div>
                  </div>
                )}
                <div className="pt-2 border-t flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>Customer for {getCustomerAge(customer.created_at)}</span>
                  </div>
                  <Badge
                    variant="outline"
                    className="rounded-full bg-success-muted text-success border-success/20 animate-pulse"
                  >
                    Active
                  </Badge>
                  {customer.address?.includes("UAE") && <UAEFlag />}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className={ds.dialog.content}>
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>Update customer information.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Full Name *</Label>
                <Input
                  id="edit-name"
                  placeholder="John Doe"
                  className={ds.input.base}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  placeholder="john@example.com"
                  className={ds.input.base}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone Number</Label>
              <div className="flex">
                <div className="flex items-center gap-2 px-3 border border-r-0 rounded-l-xl bg-muted border-input">
                  <UAEFlag />
                  <span className="text-sm font-medium text-muted-foreground">+971</span>
                </div>
                <Input
                  id="edit-phone"
                  placeholder="50 123 4567"
                  className="rounded-l-none rounded-r-xl transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address">Address</Label>
              <Input
                id="edit-address"
                placeholder="123 Main Street, Dubai, UAE"
                className={ds.input.base}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                placeholder="Additional notes about this customer..."
                className="rounded-xl min-h-[80px] transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                resetForm()
                setIsEditDialogOpen(false)
                setSelectedCustomer(null)
              }}
              className={ds.button.secondary}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditCustomer}
              disabled={isSubmitting || !formData.name || !formData.email}
              className={cn(ds.button.primary, "text-primary-foreground disabled:opacity-50 disabled:hover:scale-100")}
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin mr-2">⟳</span>
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className={ds.dialog.content}>
          <DialogHeader>
            <DialogTitle>Delete Customer</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedCustomer?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className={ds.button.secondary}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteCustomer}
              disabled={isSubmitting}
              className="rounded-xl transition-all duration-300 hover:scale-105 active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin mr-2">⟳</span>
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Customer Dialog */}
      <Dialog
        open={isViewDialogOpen}
        onOpenChange={(open) => {
          setIsViewDialogOpen(open)
          if (!open) {
            setCustomerDocuments([])
          }
        }}
      >
        <DialogContent className="sm:max-w-[550px] rounded-2xl animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-4">
              <div className={cn(ds.iconContainer.avatar, "w-16 h-16 text-xl")}>
                {selectedCustomer?.name?.charAt(0).toUpperCase() || "?"}
              </div>
              <div>
                <DialogTitle className="text-xl">{selectedCustomer?.name}</DialogTitle>
                <DialogDescription>Customer ID: {selectedCustomer?.id}</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-4">
              {/* Email */}
              <div
                className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 transition-all duration-300 hover:bg-info-muted group cursor-pointer"
                onClick={() => selectedCustomer?.email && copyToClipboard(selectedCustomer.email, "view-email")}
              >
                <div className="w-10 h-10 rounded-xl bg-info-muted flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Mail className="h-5 w-5 text-info" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedCustomer?.email}</p>
                </div>
                {copiedItem === "view-email" ? (
                  <Check className="h-4 w-4 text-success" />
                ) : (
                  <Copy className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-info" />
                )}
              </div>
              {/* Phone */}
              {selectedCustomer?.phone && (
                <div
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 transition-all duration-300 hover:bg-success-muted group cursor-pointer"
                  onClick={() => copyToClipboard(selectedCustomer.phone, "view-phone")}
                >
                  <div className="w-10 h-10 rounded-xl bg-success-muted flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Phone className="h-5 w-5 text-success" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="font-medium">{selectedCustomer.phone}</p>
                  </div>
                  {copiedItem === "view-phone" ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : (
                    <Copy className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-success" />
                  )}
                </div>
              )}
              {/* Address */}
              {selectedCustomer?.address && (
                <div
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 transition-all duration-300 hover:bg-accent group cursor-pointer"
                  onClick={() => copyToClipboard(selectedCustomer.address, "view-address")}
                >
                  <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <MapPin className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Address</p>
                    <p className="font-medium">{selectedCustomer.address}</p>
                  </div>
                  {copiedItem === "view-address" ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : (
                    <Copy className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-purple-600 dark:text-purple-400" />
                  )}
                </div>
              )}
              {/* Notes */}
              {selectedCustomer?.notes && (
                <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50 transition-all duration-300 hover:bg-muted group">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Notes</p>
                    <p className="font-medium">{selectedCustomer.notes}</p>
                  </div>
                </div>
              )}
              {/* Date Added */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 transition-all duration-300 hover:bg-muted group">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Customer Since</p>
                  <p className="font-medium">
                    {selectedCustomer?.created_at
                      ? new Date(selectedCustomer.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "N/A"}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t">
                <div className="flex items-center gap-2 mb-3">
                  <Upload className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Documents</p>
                </div>
                {isLoadingDocuments ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : customerDocuments.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    No documents uploaded for this customer
                  </div>
                ) : (
                  <div className="space-y-2">
                    {customerDocuments.map((doc, index) => {
                      const FileIcon = getFileIcon(doc.file_type)
                      const isImage = doc.file_type.startsWith("image/")
                      return (
                        <div
                          key={doc.id}
                          className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 transition-all duration-300 hover:bg-primary/5 group animate-in fade-in slide-in-from-left-2"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          {/* Document thumbnail or icon */}
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden">
                            {isImage ? (
                              <img
                                src={doc.file_url || "/placeholder.svg"}
                                alt={doc.file_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <FileIcon className="h-5 w-5 text-primary" />
                            )}
                          </div>
                          {/* Document info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{doc.file_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(doc.file_size)} • {new Date(doc.uploaded_at).toLocaleDateString()}
                            </p>
                          </div>
                          {/* View button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-primary/10 hover:text-primary"
                            onClick={() => handleViewDocument(doc)}
                          >
                            {isImage ? <Eye className="h-4 w-4" /> : <ExternalLink className="h-4 w-4" />}
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)} className={ds.button.secondary}>
              Close
            </Button>
            <Button
              onClick={() => {
                setIsViewDialogOpen(false)
                if (selectedCustomer) openEditDialog(selectedCustomer)
              }}
              className={cn(ds.button.primary, "text-primary-foreground")}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!previewImage}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewImage(null)
            setPreviewImageName("")
          }
        }}
      >
        <DialogContent className="sm:max-w-[90vw] md:max-w-[80vw] lg:max-w-[70vw] p-0 rounded-2xl overflow-hidden bg-black/95">
          <div className="relative">
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white"
              onClick={() => {
                setPreviewImage(null)
                setPreviewImageName("")
              }}
            >
              <X className="h-5 w-5" />
            </Button>
            {/* Image */}
            <div className="flex items-center justify-center min-h-[50vh] max-h-[85vh] p-4">
              {previewImage && (
                <img
                  src={previewImage || "/placeholder.svg"}
                  alt={previewImageName}
                  className="max-w-full max-h-[80vh] object-contain rounded-lg animate-in zoom-in-95 duration-300"
                />
              )}
            </div>
            {/* File name */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
              <p className="text-white text-sm font-medium text-center">{previewImageName}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
