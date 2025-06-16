import React from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import {
  FileText,
  RefreshCw,
  Scissors,
  Merge,
  Shield,
  Archive,
  Edit,
  Eye,
  Lock,
  Unlock,
  Stamp,
  FileSignature,
  Settings,
  Scan,
  BookOpen,
  Crop,
  Search,
  Type,
  Image,
  Layers,
  Grid,
  RotateCw,
  Copy,
  Trash2,
  Download,
  Upload,
  Palette,
  Ruler,
  AlignLeft,
  Hash,
  Calendar,
  User,
  EyeOff,
  MapPin,
  Phone,
  Mail,
  Globe,
  Printer,
  Share2,
  Link2,
  Bookmark,
  Tag,
  Clock,
  Database,
  FileCheck,
  FileMinus,
  FilePlus,
  FileX,
  Maximize,
  Minimize,
  MessageSquare,
  Move,
  ZoomIn,
  ZoomOut,
  Quote,
  MousePointer,
  ChevronDown,
  Brain,
  PenTool,
  Highlighter,
  QrCode,
  Eraser,
  Square,
  Circle,
  Triangle,
  ArrowRight,
  Minus,
  Plus,
  X,
  Check,
  Info,
  AlertTriangle,
  Star,
  Heart,
  Flag,
  Target,
  Zap,
  Sparkles,
  Wand2,
  Filter,
  SortAsc,
  SortDesc,
  BarChart,
  PieChart,
  TrendingUp,
  Calculator,
  Binary,
  Code,
  FileCode,
  Braces,
  Terminal,
  Command,
  Cpu,
  HardDrive,
  Monitor,
  Smartphone,
  Tablet,
  Wifi,
  Bluetooth,
  Usb,
  Headphones,
  Camera,
  Video,
  Music,
  Volume2,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Repeat,
  Shuffle,
  Radio,
  Mic,
  MicOff,
  Speaker,
  Gamepad2,
  Joystick,
  Dices,
  Puzzle,
  Trophy,
  Award,
  Medal,
  Crown,
  Gem,
  Diamond,
  Coins,
  CreditCard,
  Banknote,
  Wallet,
  ShoppingCart,
  ShoppingBag,
  Store,
  Building,
  Home,
  Car,
  Plane,
  Train,
  Bus,
  Bike,
  Ship,
  Truck,
  Fuel,
  Navigation,
  Compass,
  Map,
  Route,
  Signpost,
  Mountain,
  Trees,
  Flower,
  Sun,
  Moon,
  Cloud,
  CloudRain,
  CloudSnow,
  Umbrella,
  Thermometer,
  Wind,
  Tornado,
  Waves,
  Droplets,
  Snowflake,
  Flame,
  Rainbow,
  Sunrise,
  Sunset,
} from "lucide-react";

const PDFTools: React.FC = () => {
  const tools = [
    // Conversion Tools (20 tools)
    {
      name: "Word to PDF",
      path: "/en-US/tool/word-to-pdf",
      icon: FileText,
      category: "conversion",
      description:
        "Convert Word documents to PDF with perfect formatting preservation",
      usage: "2.1M",
      isPopular: true,
    },
    {
      name: "PDF to Word",
      path: "/en-US/tool/pdf-to-word",
      icon: FileText,
      category: "conversion",
      description: "Convert PDF to editable Word documents with OCR technology",
      usage: "1.8M",
      isPopular: true,
    },
    {
      name: "PDF to PowerPoint",
      path: "/en-US/tool/pdf-to-ppt",
      icon: FileText,
      category: "conversion",
      description: "Convert PDF to PowerPoint presentations",
      usage: "890K",
    },
    {
      name: "PDF to Excel",
      path: "/en-US/tool/pdf-to-excel",
      icon: FileText,
      category: "conversion",
      description: "Convert PDF tables to Excel spreadsheets",
      usage: "750K",
    },
    {
      name: "PDF to JPG",
      path: "/en-US/tool/pdf-to-jpg",
      icon: Image,
      category: "conversion",
      description: "Convert PDF pages to high-quality JPG images",
      usage: "1.2M",
    },
    {
      name: "PDF to PNG",
      path: "/en-US/tool/pdf-to-png",
      icon: Image,
      category: "conversion",
      description: "Convert PDF pages to PNG with transparency",
      usage: "680K",
    },
    {
      name: "Images to PDF",
      path: "/en-US/tool/images-to-pdf",
      icon: Image,
      category: "conversion",
      description: "Combine multiple images into one PDF",
      usage: "920K",
    },
    {
      name: "HTML to PDF",
      path: "/en-US/tool/html-to-pdf",
      icon: Code,
      category: "conversion",
      description: "Convert web pages to PDF documents",
      usage: "540K",
    },
    {
      name: "Excel to PDF",
      path: "/en-US/tool/excel-to-pdf",
      icon: FileText,
      category: "conversion",
      description: "Convert Excel spreadsheets to PDF format",
      usage: "620K",
    },
    {
      name: "PowerPoint to PDF",
      path: "/en-US/tool/ppt-to-pdf",
      icon: FileText,
      category: "conversion",
      description: "Convert PowerPoint presentations to PDF",
      usage: "580K",
    },
    {
      name: "Text to PDF",
      path: "/en-US/tool/text-to-pdf",
      icon: Type,
      category: "conversion",
      description: "Convert plain text files to formatted PDF",
      usage: "340K",
    },
    {
      name: "CSV to PDF",
      path: "/en-US/tool/csv-to-pdf",
      icon: FileText,
      category: "conversion",
      description: "Convert CSV data to formatted PDF tables",
      usage: "280K",
    },
    {
      name: "PDF to TIFF",
      path: "/en-US/tool/pdf-to-tiff",
      icon: Image,
      category: "conversion",
      description: "Convert PDF pages to TIFF images",
      usage: "190K",
    },
    {
      name: "PDF to SVG",
      path: "/en-US/tool/pdf-to-svg",
      icon: Image,
      category: "conversion",
      description: "Convert PDF to scalable vector graphics",
      usage: "150K",
    },
    {
      name: "PDF to EPS",
      path: "/en-US/tool/pdf-to-eps",
      icon: Image,
      category: "conversion",
      description: "Convert PDF to Encapsulated PostScript",
      usage: "120K",
    },
    {
      name: "EPUB to PDF",
      path: "/en-US/tool/epub-to-pdf",
      icon: BookOpen,
      category: "conversion",
      description: "Convert EPUB ebooks to PDF format",
      usage: "210K",
    },
    {
      name: "RTF to PDF",
      path: "/en-US/tool/rtf-to-pdf",
      icon: FileText,
      category: "conversion",
      description: "Convert Rich Text Format to PDF",
      usage: "160K",
    },
    {
      name: "ODT to PDF",
      path: "/en-US/tool/odt-to-pdf",
      icon: FileText,
      category: "conversion",
      description: "Convert OpenDocument Text to PDF",
      usage: "140K",
    },
    {
      name: "LaTeX to PDF",
      path: "/en-US/tool/latex-to-pdf",
      icon: Code,
      category: "conversion",
      description: "Compile LaTeX documents to PDF",
      usage: "180K",
    },
    {
      name: "Markdown to PDF",
      path: "/en-US/tool/markdown-to-pdf",
      icon: FileText,
      category: "conversion",
      description: "Convert Markdown files to formatted PDF",
      usage: "220K",
    },

    // Editing Tools (20 tools)
    {
      name: "PDF Editor",
      path: "/en-US/tool/pdf-editor",
      icon: Edit,
      category: "editing",
      description: "Professional PDF editing with advanced tools",
      usage: "1.5M",
      isPopular: true,
    },
    {
      name: "Add Text",
      path: "/en-US/tool/pdf-add-text",
      icon: Type,
      category: "editing",
      description: "Add custom text with fonts and formatting",
      usage: "780K",
    },
    {
      name: "Add Images",
      path: "/en-US/tool/pdf-add-images",
      icon: Image,
      category: "editing",
      description: "Insert images and graphics into PDF",
      usage: "650K",
    },
    {
      name: "Highlight Text",
      path: "/en-US/tool/pdf-highlight",
      icon: Highlighter,
      category: "editing",
      description: "Highlight and markup text content",
      usage: "420K",
    },
    {
      name: "Add Comments",
      path: "/en-US/tool/pdf-comments",
      icon: MessageSquare,
      category: "editing",
      description: "Add sticky notes and comments",
      usage: "380K",
    },
    {
      name: "Rotate Pages",
      path: "/en-US/tool/pdf-rotate",
      icon: RotateCw,
      category: "editing",
      description: "Rotate individual or all pages",
      usage: "560K",
    },
    {
      name: "Crop Pages",
      path: "/en-US/tool/pdf-crop",
      icon: Crop,
      category: "editing",
      description: "Crop and resize PDF pages",
      usage: "340K",
    },
    {
      name: "Reorder Pages",
      path: "/en-US/tool/pdf-reorder",
      icon: Move,
      category: "editing",
      description: "Drag and drop to reorder pages",
      usage: "290K",
    },
    {
      name: "Delete Pages",
      path: "/en-US/tool/pdf-delete-pages",
      icon: Trash2,
      category: "editing",
      description: "Remove unwanted pages from PDF",
      usage: "450K",
    },
    {
      name: "Insert Pages",
      path: "/en-US/tool/pdf-insert-pages",
      icon: FilePlus,
      category: "editing",
      description: "Insert blank or existing pages",
      usage: "320K",
    },
    {
      name: "Add Shapes",
      path: "/en-US/tool/pdf-add-shapes",
      icon: Square,
      category: "editing",
      description: "Draw rectangles, circles, and lines",
      usage: "280K",
    },
    {
      name: "Add Arrows",
      path: "/en-US/tool/pdf-add-arrows",
      icon: ArrowRight,
      category: "editing",
      description: "Insert directional arrows and pointers",
      usage: "240K",
    },
    {
      name: "Underline Text",
      path: "/en-US/tool/pdf-underline",
      icon: Minus,
      category: "editing",
      description: "Underline important text sections",
      usage: "200K",
    },
    {
      name: "Strikethrough",
      path: "/en-US/tool/pdf-strikethrough",
      icon: X,
      category: "editing",
      description: "Cross out text with strikethrough",
      usage: "180K",
    },
    {
      name: "Add Checkmarks",
      path: "/en-US/tool/pdf-checkmarks",
      icon: Check,
      category: "editing",
      description: "Insert checkmarks and tick symbols",
      usage: "160K",
    },
    {
      name: "Add Stamps",
      path: "/en-US/tool/pdf-stamps",
      icon: Stamp,
      category: "editing",
      description: "Apply approval, draft, and custom stamps",
      usage: "350K",
    },
    {
      name: "Erase Content",
      path: "/en-US/tool/pdf-eraser",
      icon: Eraser,
      category: "editing",
      description: "Remove unwanted content from pages",
      usage: "270K",
    },
    {
      name: "Add Borders",
      path: "/en-US/tool/pdf-borders",
      icon: Square,
      category: "editing",
      description: "Add decorative borders to pages",
      usage: "190K",
    },
    {
      name: "Change Colors",
      path: "/en-US/tool/pdf-colors",
      icon: Palette,
      category: "editing",
      description: "Modify text and background colors",
      usage: "220K",
    },
    {
      name: "Resize Elements",
      path: "/en-US/tool/pdf-resize",
      icon: Maximize,
      category: "editing",
      description: "Resize text, images, and objects",
      usage: "250K",
    },

    // Organization Tools (20 tools)
    {
      name: "Merge PDFs",
      path: "/en-US/tool/pdf-merge",
      icon: Merge,
      category: "organization",
      description: "Combine multiple PDFs with custom ordering",
      usage: "1.3M",
      isPopular: true,
    },
    {
      name: "Split PDF",
      path: "/en-US/tool/pdf-split",
      icon: Scissors,
      category: "organization",
      description: "Split by pages, size, or bookmarks",
      usage: "980K",
    },
    {
      name: "Compress PDF",
      path: "/en-US/tool/pdf-compress",
      icon: Archive,
      category: "organization",
      description: "Reduce file size with quality options",
      usage: "1.1M",
      isPopular: true,
    },
    {
      name: "Extract Pages",
      path: "/en-US/tool/pdf-extract",
      icon: FileCheck,
      category: "organization",
      description: "Extract specific pages to new PDF",
      usage: "670K",
    },
    {
      name: "Compare PDFs",
      path: "/en-US/tool/pdf-compare",
      icon: Search,
      category: "organization",
      description: "Compare two documents for differences",
      usage: "450K",
    },
    {
      name: "Repair PDF",
      path: "/en-US/tool/pdf-repair",
      icon: Settings,
      category: "organization",
      description: "Fix corrupted or damaged PDF files",
      usage: "320K",
    },
    {
      name: "Sort Pages",
      path: "/en-US/tool/pdf-sort",
      icon: SortAsc,
      category: "organization",
      description: "Sort pages by various criteria",
      usage: "280K",
    },
    {
      name: "Duplicate Pages",
      path: "/en-US/tool/pdf-duplicate",
      icon: Copy,
      category: "organization",
      description: "Create copies of specific pages",
      usage: "240K",
    },
    {
      name: "Reverse Pages",
      path: "/en-US/tool/pdf-reverse",
      icon: RefreshCw,
      category: "organization",
      description: "Reverse the order of all pages",
      usage: "200K",
    },
    {
      name: "Optimize PDF",
      path: "/en-US/tool/pdf-optimize",
      icon: Zap,
      category: "organization",
      description: "Optimize for web, print, or mobile",
      usage: "380K",
    },
    {
      name: "Validate PDF",
      path: "/en-US/tool/pdf-validate",
      icon: Check,
      category: "organization",
      description: "Check PDF compliance and standards",
      usage: "160K",
    },
    {
      name: "Archive PDF",
      path: "/en-US/tool/pdf-archive",
      icon: Archive,
      category: "organization",
      description: "Convert to PDF/A for long-term storage",
      usage: "220K",
    },
    {
      name: "Backup PDF",
      path: "/en-US/tool/pdf-backup",
      icon: Database,
      category: "organization",
      description: "Create secure backups with versioning",
      usage: "180K",
    },
    {
      name: "Batch Process",
      path: "/en-US/tool/pdf-batch",
      icon: Layers,
      category: "organization",
      description: "Process multiple PDFs simultaneously",
      usage: "340K",
    },
    {
      name: "File Manager",
      path: "/en-US/tool/pdf-manager",
      icon: FileText,
      category: "organization",
      description: "Organize and manage PDF collections",
      usage: "260K",
    },
    {
      name: "Version Control",
      path: "/en-US/tool/pdf-versions",
      icon: Clock,
      category: "organization",
      description: "Track changes and manage versions",
      usage: "190K",
    },
    {
      name: "Sync PDFs",
      path: "/en-US/tool/pdf-sync",
      icon: RefreshCw,
      category: "organization",
      description: "Synchronize across devices and platforms",
      usage: "150K",
    },
    {
      name: "Tag Manager",
      path: "/en-US/tool/pdf-tags",
      icon: Tag,
      category: "organization",
      description: "Add and manage document tags",
      usage: "210K",
    },
    {
      name: "Folder Organizer",
      path: "/en-US/tool/pdf-folders",
      icon: FileText,
      category: "organization",
      description: "Organize PDFs into smart folders",
      usage: "170K",
    },
    {
      name: "Duplicate Finder",
      path: "/en-US/tool/pdf-duplicates",
      icon: Search,
      category: "organization",
      description: "Find and remove duplicate PDFs",
      usage: "140K",
    },

    // Security Tools (20 tools)
    {
      name: "Password Protect",
      path: "/en-US/tool/pdf-protect",
      icon: Lock,
      category: "security",
      description: "Add user and owner passwords",
      usage: "890K",
    },
    {
      name: "Remove Password",
      path: "/en-US/tool/pdf-unlock",
      icon: Unlock,
      category: "security",
      description: "Unlock password-protected PDFs",
      usage: "720K",
    },
    {
      name: "Digital Signature",
      path: "/en-US/tool/pdf-signature",
      icon: FileSignature,
      category: "security",
      description: "Add legally binding digital signatures",
      usage: "540K",
    },
    {
      name: "Add Watermark",
      path: "/en-US/tool/pdf-watermark",
      icon: Stamp,
      category: "security",
      description: "Add text or image watermarks",
      usage: "480K",
    },
    {
      name: "Redact Information",
      path: "/en-US/tool/pdf-redact",
      icon: EyeOff,
      category: "security",
      description: "Permanently remove sensitive content",
      usage: "380K",
    },
    {
      name: "Remove Metadata",
      path: "/en-US/tool/pdf-metadata",
      icon: Database,
      category: "security",
      description: "Remove document metadata and properties",
      usage: "290K",
    },
    {
      name: "Encrypt PDF",
      path: "/en-US/tool/pdf-encrypt",
      icon: Shield,
      category: "security",
      description: "Apply advanced encryption algorithms",
      usage: "350K",
    },
    {
      name: "Certificate Security",
      path: "/en-US/tool/pdf-certificate",
      icon: Award,
      category: "security",
      description: "Secure with digital certificates",
      usage: "240K",
    },
    {
      name: "Access Control",
      path: "/en-US/tool/pdf-access",
      icon: User,
      category: "security",
      description: "Set user permissions and restrictions",
      usage: "320K",
    },
    {
      name: "Audit Trail",
      path: "/en-US/tool/pdf-audit",
      icon: Eye,
      category: "security",
      description: "Track document access and changes",
      usage: "180K",
    },
    {
      name: "Secure Sharing",
      path: "/en-US/tool/pdf-secure-share",
      icon: Share2,
      category: "security",
      description: "Share with time-limited access",
      usage: "260K",
    },
    {
      name: "Rights Management",
      path: "/en-US/tool/pdf-rights",
      icon: Shield,
      category: "security",
      description: "Control printing, copying, editing rights",
      usage: "200K",
    },
    {
      name: "Secure Viewer",
      path: "/en-US/tool/pdf-secure-view",
      icon: Eye,
      category: "security",
      description: "View sensitive PDFs securely",
      usage: "220K",
    },
    {
      name: "Expiry Control",
      path: "/en-US/tool/pdf-expiry",
      icon: Clock,
      category: "security",
      description: "Set document expiration dates",
      usage: "160K",
    },
    {
      name: "Forensic Analysis",
      path: "/en-US/tool/pdf-forensics",
      icon: Search,
      category: "security",
      description: "Analyze document authenticity",
      usage: "140K",
    },
    {
      name: "Secure Print",
      path: "/en-US/tool/pdf-secure-print",
      icon: Printer,
      category: "security",
      description: "Control printing with watermarks",
      usage: "190K",
    },
    {
      name: "Anti-Copy",
      path: "/en-US/tool/pdf-anti-copy",
      icon: Shield,
      category: "security",
      description: "Prevent unauthorized copying",
      usage: "170K",
    },
    {
      name: "Secure Storage",
      path: "/en-US/tool/pdf-secure-storage",
      icon: Database,
      category: "security",
      description: "Encrypted cloud storage integration",
      usage: "150K",
    },
    {
      name: "Compliance Check",
      path: "/en-US/tool/pdf-compliance",
      icon: Check,
      category: "security",
      description: "Verify regulatory compliance",
      usage: "130K",
    },
    {
      name: "Secure Backup",
      path: "/en-US/tool/pdf-secure-backup",
      icon: Archive,
      category: "security",
      description: "Encrypted backup solutions",
      usage: "120K",
    },

    // OCR & Text Tools (20 tools)
    {
      name: "OCR Scanner",
      path: "/en-US/tool/pdf-ocr",
      icon: Scan,
      category: "ocr",
      description: "Convert scanned PDFs to searchable text",
      usage: "760K",
    },
    {
      name: "Text Extraction",
      path: "/en-US/tool/pdf-text-extract",
      icon: Type,
      category: "ocr",
      description: "Extract all text content from PDF",
      usage: "580K",
    },
    {
      name: "Translation",
      path: "/en-US/tool/pdf-translate",
      icon: Globe,
      category: "ocr",
      description: "Translate PDF content to other languages",
      usage: "420K",
    },
    {
      name: "Text Search",
      path: "/en-US/tool/pdf-search",
      icon: Search,
      category: "ocr",
      description: "Advanced text search and indexing",
      usage: "340K",
    },
    {
      name: "Font Recognition",
      path: "/en-US/tool/pdf-font-detect",
      icon: Type,
      category: "ocr",
      description: "Identify and extract font information",
      usage: "280K",
    },
    {
      name: "Language Detection",
      path: "/en-US/tool/pdf-language",
      icon: Globe,
      category: "ocr",
      description: "Automatically detect document language",
      usage: "240K",
    },
    {
      name: "Text Formatting",
      path: "/en-US/tool/pdf-text-format",
      icon: AlignLeft,
      category: "ocr",
      description: "Preserve original text formatting",
      usage: "320K",
    },
    {
      name: "Spell Check",
      path: "/en-US/tool/pdf-spell-check",
      icon: Check,
      category: "ocr",
      description: "Check and correct spelling errors",
      usage: "200K",
    },
    {
      name: "Grammar Check",
      path: "/en-US/tool/pdf-grammar",
      icon: Edit,
      category: "ocr",
      description: "Analyze and improve grammar",
      usage: "180K",
    },
    {
      name: "Text Statistics",
      path: "/en-US/tool/pdf-text-stats",
      icon: BarChart,
      category: "ocr",
      description: "Word count, reading time, complexity",
      usage: "160K",
    },
    {
      name: "Keyword Extraction",
      path: "/en-US/tool/pdf-keywords",
      icon: Tag,
      category: "ocr",
      description: "Extract important keywords and phrases",
      usage: "220K",
    },
    {
      name: "Text Summarization",
      path: "/en-US/tool/pdf-text-summary",
      icon: FileText,
      category: "ocr",
      description: "Generate automatic text summaries",
      usage: "190K",
    },
    {
      name: "Reading Level",
      path: "/en-US/tool/pdf-reading-level",
      icon: BookOpen,
      category: "ocr",
      description: "Analyze document reading difficulty",
      usage: "140K",
    },
    {
      name: "Text Replacement",
      path: "/en-US/tool/pdf-text-replace",
      icon: RefreshCw,
      category: "ocr",
      description: "Find and replace text across documents",
      usage: "250K",
    },
    {
      name: "Character Recognition",
      path: "/en-US/tool/pdf-char-recognition",
      icon: Eye,
      category: "ocr",
      description: "Advanced character and symbol recognition",
      usage: "170K",
    },
    {
      name: "Handwriting OCR",
      path: "/en-US/tool/pdf-handwriting",
      icon: PenTool,
      category: "ocr",
      description: "Convert handwritten text to digital",
      usage: "210K",
    },
    {
      name: "Table OCR",
      path: "/en-US/tool/pdf-table-ocr",
      icon: Grid,
      category: "ocr",
      description: "Extract and recognize table data",
      usage: "230K",
    },
    {
      name: "Multi-Language OCR",
      path: "/en-US/tool/pdf-multilang-ocr",
      icon: Globe,
      category: "ocr",
      description: "OCR for multiple languages simultaneously",
      usage: "150K",
    },
    {
      name: "OCR Quality Check",
      path: "/en-US/tool/pdf-ocr-quality",
      icon: Check,
      category: "ocr",
      description: "Verify and improve OCR accuracy",
      usage: "130K",
    },
    {
      name: "Text Indexing",
      path: "/en-US/tool/pdf-text-index",
      icon: Database,
      category: "ocr",
      description: "Create searchable text indexes",
      usage: "120K",
    },

    // Forms & Interactive (20 tools)
    {
      name: "Form Creator",
      path: "/en-US/tool/pdf-form-creator",
      icon: FileSignature,
      category: "forms",
      description: "Create interactive PDF forms from scratch",
      usage: "450K",
    },
    {
      name: "Form Filler",
      path: "/en-US/tool/pdf-form-filler",
      icon: Edit,
      category: "forms",
      description: "Fill out PDF forms electronically",
      usage: "680K",
    },
    {
      name: "Form Flattener",
      path: "/en-US/tool/pdf-flatten",
      icon: Layers,
      category: "forms",
      description: "Convert forms to non-editable format",
      usage: "320K",
    },
    {
      name: "Signature Pad",
      path: "/en-US/tool/pdf-signature-pad",
      icon: PenTool,
      category: "forms",
      description: "Add handwritten signatures to PDFs",
      usage: "590K",
    },
    {
      name: "Checkbox Creator",
      path: "/en-US/tool/pdf-checkbox",
      icon: Check,
      category: "forms",
      description: "Add interactive checkboxes",
      usage: "280K",
    },
    {
      name: "Radio Buttons",
      path: "/en-US/tool/pdf-radio",
      icon: Circle,
      category: "forms",
      description: "Create radio button groups",
      usage: "240K",
    },
    {
      name: "Dropdown Lists",
      path: "/en-US/tool/pdf-dropdown",
      icon: ChevronDown,
      category: "forms",
      description: "Add dropdown selection menus",
      usage: "200K",
    },
    {
      name: "Text Fields",
      path: "/en-US/tool/pdf-text-fields",
      icon: Type,
      category: "forms",
      description: "Create fillable text input fields",
      usage: "380K",
    },
    {
      name: "Date Picker",
      path: "/en-US/tool/pdf-date-picker",
      icon: Calendar,
      category: "forms",
      description: "Add interactive date selection",
      usage: "220K",
    },
    {
      name: "Form Validation",
      path: "/en-US/tool/pdf-form-validate",
      icon: Check,
      category: "forms",
      description: "Validate form data and inputs",
      usage: "180K",
    },
    {
      name: "Form Templates",
      path: "/en-US/tool/pdf-form-templates",
      icon: FileText,
      category: "forms",
      description: "Pre-built form templates library",
      usage: "340K",
    },
    {
      name: "Form Analytics",
      path: "/en-US/tool/pdf-form-analytics",
      icon: BarChart,
      category: "forms",
      description: "Analyze form completion rates",
      usage: "160K",
    },
    {
      name: "Auto-Fill",
      path: "/en-US/tool/pdf-auto-fill",
      icon: Zap,
      category: "forms",
      description: "Automatically populate form fields",
      usage: "290K",
    },
    {
      name: "Form Submission",
      path: "/en-US/tool/pdf-form-submit",
      icon: Upload,
      category: "forms",
      description: "Handle form submissions and data",
      usage: "250K",
    },
    {
      name: "Form Encryption",
      path: "/en-US/tool/pdf-form-encrypt",
      icon: Lock,
      category: "forms",
      description: "Secure form data with encryption",
      usage: "170K",
    },
    {
      name: "Form Workflow",
      path: "/en-US/tool/pdf-form-workflow",
      icon: ArrowRight,
      category: "forms",
      description: "Create multi-step form processes",
      usage: "140K",
    },
    {
      name: "Form Backup",
      path: "/en-US/tool/pdf-form-backup",
      icon: Archive,
      category: "forms",
      description: "Backup and restore form data",
      usage: "120K",
    },
    {
      name: "Form Sharing",
      path: "/en-US/tool/pdf-form-share",
      icon: Share2,
      category: "forms",
      description: "Share forms with controlled access",
      usage: "190K",
    },
    {
      name: "Form Versioning",
      path: "/en-US/tool/pdf-form-versions",
      icon: Clock,
      category: "forms",
      description: "Manage different form versions",
      usage: "110K",
    },
    {
      name: "Form Integration",
      path: "/en-US/tool/pdf-form-integration",
      icon: Link2,
      category: "forms",
      description: "Integrate with external systems",
      usage: "100K",
    },

    // AI Features (20 tools)
    {
      name: "AI Analysis",
      path: "/en-US/tool/pdf-ai-analysis",
      icon: Brain,
      category: "ai",
      description: "AI-powered document analysis and insights",
      usage: "280K",
      isNew: true,
    },
    {
      name: "Smart Summary",
      path: "/en-US/tool/pdf-summary",
      icon: FileText,
      category: "ai",
      description: "Generate intelligent document summaries",
      usage: "190K",
      isNew: true,
    },
    {
      name: "Table Extractor",
      path: "/en-US/tool/pdf-table-extract",
      icon: Grid,
      category: "ai",
      description: "Extract and convert tables to Excel",
      usage: "340K",
    },
    {
      name: "QR Code Generator",
      path: "/en-US/tool/pdf-qr-generator",
      icon: QrCode,
      category: "ai",
      description: "Add QR codes linking to PDF content",
      usage: "150K",
    },
    {
      name: "Content Classification",
      path: "/en-US/tool/pdf-classify",
      icon: Tag,
      category: "ai",
      description: "Automatically classify document content",
      usage: "220K",
      isNew: true,
    },
    {
      name: "Sentiment Analysis",
      path: "/en-US/tool/pdf-sentiment",
      icon: Heart,
      category: "ai",
      description: "Analyze emotional tone of content",
      usage: "160K",
      isNew: true,
    },
    {
      name: "Entity Recognition",
      path: "/en-US/tool/pdf-entities",
      icon: User,
      category: "ai",
      description: "Identify people, places, organizations",
      usage: "180K",
    },
    {
      name: "Topic Modeling",
      path: "/en-US/tool/pdf-topics",
      icon: Target,
      category: "ai",
      description: "Discover main topics in documents",
      usage: "140K",
    },
    {
      name: "Smart Redaction",
      path: "/en-US/tool/pdf-smart-redact",
      icon: EyeOff,
      category: "ai",
      description: "AI-powered sensitive content detection",
      usage: "200K",
      isNew: true,
    },
    {
      name: "Auto Tagging",
      path: "/en-US/tool/pdf-auto-tag",
      icon: Tag,
      category: "ai",
      description: "Automatically generate relevant tags",
      usage: "170K",
    },
    {
      name: "Content Similarity",
      path: "/en-US/tool/pdf-similarity",
      icon: Search,
      category: "ai",
      description: "Find similar documents and content",
      usage: "130K",
    },
    {
      name: "AI Translation",
      path: "/en-US/tool/pdf-ai-translate",
      icon: Globe,
      category: "ai",
      description: "Advanced neural machine translation",
      usage: "250K",
      isNew: true,
    },
    {
      name: "Document Clustering",
      path: "/en-US/tool/pdf-clustering",
      icon: Layers,
      category: "ai",
      description: "Group similar documents automatically",
      usage: "120K",
    },
    {
      name: "Anomaly Detection",
      path: "/en-US/tool/pdf-anomaly",
      icon: AlertTriangle,
      category: "ai",
      description: "Detect unusual patterns in documents",
      usage: "110K",
    },
    {
      name: "AI Proofreading",
      path: "/en-US/tool/pdf-ai-proofread",
      icon: Edit,
      category: "ai",
      description: "Advanced grammar and style checking",
      usage: "190K",
      isNew: true,
    },
    {
      name: "Smart Compression",
      path: "/en-US/tool/pdf-smart-compress",
      icon: Archive,
      category: "ai",
      description: "AI-optimized file size reduction",
      usage: "210K",
    },
    {
      name: "Content Generation",
      path: "/en-US/tool/pdf-ai-generate",
      icon: Wand2,
      category: "ai",
      description: "Generate content based on prompts",
      usage: "160K",
      isNew: true,
    },
    {
      name: "Document Insights",
      path: "/en-US/tool/pdf-insights",
      icon: TrendingUp,
      category: "ai",
      description: "Extract business insights from documents",
      usage: "140K",
    },
    {
      name: "AI Accessibility",
      path: "/en-US/tool/pdf-ai-accessibility",
      icon: Eye,
      category: "ai",
      description: "Improve document accessibility with AI",
      usage: "100K",
      isNew: true,
    },
    {
      name: "Predictive Analysis",
      path: "/en-US/tool/pdf-predictive",
      icon: TrendingUp,
      category: "ai",
      description: "Predict document trends and patterns",
      usage: "90K",
      isNew: true,
    },
  ];

  const categories = [
    { id: "all", name: "All Tools", icon: Grid },
    { id: "conversion", name: "Conversion", icon: RefreshCw },
    { id: "editing", name: "Editing", icon: Edit },
    { id: "organization", name: "Organization", icon: Merge },
    { id: "security", name: "Security", icon: Shield },
    { id: "ocr", name: "OCR & Text", icon: Scan },
    { id: "forms", name: "Forms", icon: FileSignature },
    { id: "ai", name: "AI Features", icon: Brain },
  ];

  const [selectedCategory, setSelectedCategory] = React.useState("all");
  const [searchTerm, setSearchTerm] = React.useState("");

  const filteredTools = tools.filter((tool) => {
    const matchesCategory =
      selectedCategory === "all" || tool.category === selectedCategory;
    const matchesSearch =
      tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const popularTools = tools.filter((tool) => tool.isPopular);
  const newTools = tools.filter((tool) => tool.isNew);

  return (
    <>
      <Helmet>
        <title>PDF Tools - Professional PDF Converter & Editor | Doclair</title>
        <meta
          name="description"
          content={`Complete PDF toolkit with ${tools.length}+ professional tools. Convert Word to PDF, PDF to Word, merge, split, compress, edit, and secure your PDF documents online for free.`}
        />
        <meta
          name="keywords"
          content="PDF tools, Word to PDF, PDF to Word, merge PDF, split PDF, compress PDF, PDF editor, PDF converter, password protect PDF, OCR, PDF forms, AI PDF tools"
        />
        <link rel="canonical" href="https://doclair.com/en-US/pdf-tools" />
        <meta
          property="og:title"
          content="Professional PDF Tools - Convert, Edit, Merge & More"
        />
        <meta
          property="og:description"
          content={`${tools.length}+ professional PDF tools including Word to PDF converter, PDF editor, merger, splitter, compressor and more. Free online PDF toolkit.`}
        />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 pt-16 pb-20">
          {/* Floating Elements */}
          <div className="absolute top-20 left-12 floating-element opacity-20">
            <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-orange-500 rounded-3xl shadow-lg"></div>
          </div>
          <div
            className="absolute top-32 right-16 floating-element opacity-20"
            style={{ animationDelay: "3s" }}
          >
            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl shadow-lg"></div>
          </div>
          <div
            className="absolute bottom-20 left-1/4 floating-element opacity-20"
            style={{ animationDelay: "6s" }}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl shadow-lg"></div>
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="flex justify-center mb-8">
                <div className="bg-gradient-to-br from-red-600 to-orange-600 p-4 rounded-3xl shadow-2xl floating-element">
                  <FileText className="h-12 w-12 text-white" />
                </div>
              </div>

              <h1 className="hero-title text-shadow-sm mb-6">
                <span className="cursive-text text-5xl md:text-7xl apple-gradient-text">
                  Professional
                </span>
                <br />
                <span className="block">PDF Toolkit</span>
              </h1>

              <p className="hero-subtitle mb-10">
                The{" "}
                <span className="cursive-text text-red-600 text-xl">
                  ultimate
                </span>{" "}
                collection of {tools.length}+ PDF tools for professionals.
                Convert, edit, merge, split, compress with{" "}
                <span className="cursive-text text-orange-600 text-xl">
                  enterprise-grade
                </span>{" "}
                precision.
              </p>

              <div className="flex flex-wrap justify-center gap-3 mb-8">
                <div className="bg-white/80 backdrop-blur-xl px-4 py-2 rounded-full border border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-red-600" />
                  <span className="compact-text font-semibold text-gray-800">
                    {tools.length}+ Tools
                  </span>
                </div>
                <div className="bg-white/80 backdrop-blur-xl px-4 py-2 rounded-full border border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-600" />
                  <span className="compact-text font-semibold text-gray-800">
                    Lightning Fast
                  </span>
                </div>
                <div className="bg-white/80 backdrop-blur-xl px-4 py-2 rounded-full border border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span className="compact-text font-semibold text-gray-800">
                    100% Secure
                  </span>
                </div>
                <div className="bg-white/80 backdrop-blur-xl px-4 py-2 rounded-full border border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-2">
                  <Brain className="h-4 w-4 text-purple-600" />
                  <span className="compact-text font-semibold text-gray-800">
                    AI-Powered
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Popular Tools Section */}
        {popularTools.length > 0 && (
          <section className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="section-title">
                  Most{" "}
                  <span className="cursive-text text-4xl text-red-600">
                    Popular
                  </span>{" "}
                  PDF Tools
                </h2>
                <p className="section-subtitle">
                  Start with our{" "}
                  <span className="cursive-text text-orange-600 text-xl">
                    most-used
                  </span>{" "}
                  tools, trusted by millions worldwide.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {popularTools.map((tool, index) => (
                  <Link
                    key={index}
                    to={tool.path}
                    className="tool-card group relative"
                  >
                    <div className="absolute -top-2 -right-2 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold z-10">
                      POPULAR
                    </div>
                    <div className="flex items-start justify-between mb-4">
                      <div className="inline-flex p-3 rounded-2xl bg-gradient-to-r from-red-500 to-orange-500 group-hover:scale-110 transition-transform duration-500 shadow-lg">
                        <tool.icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="text-right">
                        <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-red-600 group-hover:translate-x-2 transition-all duration-500 mb-1" />
                        <div className="text-xs font-bold px-2 py-1 rounded-full bg-red-100 text-red-600">
                          {tool.usage}
                        </div>
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-red-600 transition-colors duration-500">
                      {tool.name}
                    </h3>

                    <p className="text-gray-600 compact-text mb-4 leading-relaxed">
                      {tool.description}
                    </p>

                    <div className="category-pdf">PDF Tool</div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* New Tools Section */}
        {newTools.length > 0 && (
          <section className="py-16 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="section-title">
                  <span className="cursive-text text-4xl text-purple-600">
                    Latest
                  </span>{" "}
                  AI-Powered Tools
                </h2>
                <p className="section-subtitle">
                  Discover our{" "}
                  <span className="cursive-text text-blue-600 text-xl">
                    newest
                  </span>{" "}
                  AI-enhanced PDF processing capabilities.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {newTools.map((tool, index) => (
                  <Link
                    key={index}
                    to={tool.path}
                    className="tool-card group relative"
                  >
                    <div className="absolute -top-2 -right-2 bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-bold z-10">
                      NEW
                    </div>
                    <div className="flex items-start justify-between mb-4">
                      <div className="inline-flex p-3 rounded-2xl bg-gradient-to-r from-purple-500 to-blue-500 group-hover:scale-110 transition-transform duration-500 shadow-lg">
                        <tool.icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="text-right">
                        <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-2 transition-all duration-500 mb-1" />
                        <div className="text-xs font-bold px-2 py-1 rounded-full bg-purple-100 text-purple-600">
                          {tool.usage}
                        </div>
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-purple-600 transition-colors duration-500">
                      {tool.name}
                    </h3>

                    <p className="text-gray-600 compact-text mb-4 leading-relaxed">
                      {tool.description}
                    </p>

                    <div className="bg-purple-50/80 text-purple-700 border border-purple-200/50 category-badge">
                      AI-Powered
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* All Tools Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="section-title">
                Complete{" "}
                <span className="cursive-text text-4xl text-blue-600">PDF</span>{" "}
                Toolkit
              </h2>
              <p className="section-subtitle">
                Browse our{" "}
                <span className="cursive-text text-green-600 text-xl">
                  comprehensive
                </span>{" "}
                collection of {tools.length} professional PDF tools.
              </p>
            </div>

            {/* Search and Filter */}
            <div className="mb-12">
              <div className="max-w-2xl mx-auto mb-8">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search PDF tools..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white shadow-sm"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div className="flex flex-wrap justify-center gap-3">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                      selectedCategory === category.id
                        ? "bg-red-600 text-white shadow-lg"
                        : "bg-white text-gray-700 border border-gray-200 hover:border-red-300 hover:text-red-600 shadow-sm hover:shadow-md"
                    }`}
                  >
                    <category.icon className="h-4 w-4" />
                    {category.name}
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        selectedCategory === category.id
                          ? "bg-white/20 text-white"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {category.id === "all"
                        ? tools.length
                        : tools.filter((t) => t.category === category.id)
                            .length}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tools Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredTools.map((tool, index) => (
                <Link key={index} to={tool.path} className="tool-card group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="inline-flex p-3 rounded-2xl bg-gradient-to-r from-red-500 to-orange-500 group-hover:scale-110 transition-transform duration-500 shadow-lg">
                      <tool.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-right">
                      <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-red-600 group-hover:translate-x-2 transition-all duration-500 mb-1" />
                      <div className="text-xs font-bold px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                        {tool.usage}
                      </div>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-red-600 transition-colors duration-500">
                    {tool.name}
                  </h3>

                  <p className="text-gray-600 compact-text mb-4 leading-relaxed">
                    {tool.description}
                  </p>

                  <div className="category-pdf">PDF Tool</div>
                </Link>
              ))}
            </div>

            {filteredTools.length === 0 && (
              <div className="text-center py-12">
                <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No tools found
                </h3>
                <p className="text-gray-600">
                  Try adjusting your search or filter criteria.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-gradient-to-r from-red-600 via-orange-600 to-red-700 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Why Choose Our{" "}
                <span className="cursive-text text-5xl">PDF</span> Tools?
              </h2>
              <p className="text-xl text-red-100 max-w-3xl mx-auto">
                Professional-grade PDF processing with{" "}
                <span className="cursive-text text-2xl text-white">
                  enterprise-level
                </span>{" "}
                security and performance.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center bg-white/10 backdrop-blur-xl rounded-2xl p-6">
                <Shield className="h-12 w-12 mx-auto mb-4 text-red-200" />
                <h3 className="text-xl font-bold mb-2">100% Secure</h3>
                <p className="text-red-100">
                  All processing happens in your browser. Files never leave your
                  device.
                </p>
              </div>
              <div className="text-center bg-white/10 backdrop-blur-xl rounded-2xl p-6">
                <Sparkles className="h-12 w-12 mx-auto mb-4 text-red-200" />
                <h3 className="text-xl font-bold mb-2">AI-Enhanced</h3>
                <p className="text-red-100">
                  Advanced AI algorithms for intelligent document processing and
                  analysis.
                </p>
              </div>
              <div className="text-center bg-white/10 backdrop-blur-xl rounded-2xl p-6">
                <Layers className="h-12 w-12 mx-auto mb-4 text-red-200" />
                <h3 className="text-xl font-bold mb-2">Batch Processing</h3>
                <p className="text-red-100">
                  Process multiple files simultaneously to save time and effort.
                </p>
              </div>
              <div className="text-center bg-white/10 backdrop-blur-xl rounded-2xl p-6">
                <Zap className="h-12 w-12 mx-auto mb-4 text-red-200" />
                <h3 className="text-xl font-bold mb-2">Lightning Fast</h3>
                <p className="text-red-100">
                  WebAssembly-powered processing delivers results in seconds.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Statistics Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Trusted by{" "}
                <span className="cursive-text text-3xl text-red-600">
                  millions
                </span>{" "}
                of professionals
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center group">
                <div className="inline-flex p-3 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl mb-3 group-hover:scale-110 transition-transform duration-500 shadow-lg">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div className="stats-number text-4xl">{tools.length}+</div>
                <div className="text-gray-600 font-medium compact-text">
                  PDF Tools
                </div>
              </div>
              <div className="text-center group">
                <div className="inline-flex p-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl mb-3 group-hover:scale-110 transition-transform duration-500 shadow-lg">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div className="stats-number text-4xl">5M+</div>
                <div className="text-gray-600 font-medium compact-text">
                  Files Processed
                </div>
              </div>
              <div className="text-center group">
                <div className="inline-flex p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl mb-3 group-hover:scale-110 transition-transform duration-500 shadow-lg">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div className="stats-number text-4xl">200K+</div>
                <div className="text-gray-600 font-medium compact-text">
                  Active Users
                </div>
              </div>
              <div className="text-center group">
                <div className="inline-flex p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mb-3 group-hover:scale-110 transition-transform duration-500 shadow-lg">
                  <Award className="h-6 w-6 text-white" />
                </div>
                <div className="stats-number text-4xl">99.9%</div>
                <div className="text-gray-600 font-medium compact-text">
                  Uptime
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default PDFTools;
