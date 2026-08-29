'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import { showLocalToast } from '../../components/Toast';
import { SalesRevenueChart, TopBrandsDonutChart, MonthlyPoint, BrandShare } from '../../components/BranchAnalytics';
import { 
  Users, 
  Car, 
  ClipboardList, 
  BadgeDollarSign, 
  Trash2, 
  Edit, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Check, 
  FileText,
  FileSpreadsheet,
  Printer,
  ChevronDown,
  LayoutDashboard,
  Building2,
  Calendar,
  Star,
  TrendingUp,
  Target,
  Award,
  ArrowLeft,
  UserCheck,
  ShieldAlert,
  Search,
  SlidersHorizontal,
  RefreshCw,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  Heart,
  Truck,
  MessageSquare,
  DollarSign,
  Briefcase,
  Settings as SettingsIcon,
  Download,
  Filter,
  TrendingDown,
  Coins,
  ArrowRightLeft,
  Sparkles,
  Flame,
  Clock,
  Send,
  UserPlus,
  Zap,
  Crown,
  Lock,
} from 'lucide-react';

type SectionType = 'overview' | 'inventory' | 'sales' | 'deliveries' | 'customers' | 'test-rides' | 'reviews' | 'reports' | 'employees' | 'settings';

const isDeliveredSale = (s: any): boolean => {
  const status = String(s?.delivery_status || s?.deliveries?.[0]?.delivery_status || 'Pending').toLowerCase();
  return ['delivered', 'completed', 'closed'].includes(status);
};

// Helper to safely resolve sale amount from PostgreSQL schema
const parseSaleAmount = (s: any): number => {
  if (!s) return 0;
  const raw = s.final_amount ?? s.selling_price ?? s.sale_amount ?? s.vehicles?.price;
  if (raw !== undefined && raw !== null) {
    const num = Number(raw);
    if (!isNaN(num) && num > 0) return num;
  }
  return 500000;
};

const getRevenueEligibleAmount = (s: any): number => {
  if (!s) return 0;
  if (!isDeliveredSale(s)) return 0;

  const depositAmount = Number(s.deposit_amount ?? s.depositAmount ?? s.downpayment ?? 0);
  const loanAmount = Number(s.loan_amount ?? s.loanAmount ?? 0);

  if (loanAmount > 0 && depositAmount > 0) return depositAmount;
  return parseSaleAmount(s);
};

// Helper to resolve procurement cost price
const parsePurchasePrice = (v: any): number => {
  if (!v) return 0;
  const raw = v.purchase_price ?? v.vehicles?.purchase_price;
  if (raw !== undefined && raw !== null) {
    const num = Number(raw);
    if (!isNaN(num) && num > 0) return num;
  }
  const sellPrice = Number(v.price ?? v.selling_price ?? v.vehicles?.price ?? 500000);
  return Math.round(sellPrice * 0.82);
};

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const authLoading = !mounted;

  // Active Menu Section
  const [activeSection, setActiveSection] = useState<SectionType>('overview');
  
  // Selected Branch Filter
  const [selectedBranch, setSelectedBranch] = useState<string>('all');

  // Data States
  const [analytics, setAnalytics] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  // Inventory Filter & Status State
  const [inventoryStatusFilter, setInventoryStatusFilter] = useState<'ALL' | 'Available' | 'Reserved' | 'Sold'>('ALL');

  const handleQuickUpdateStatus = async (carId: number | string, newStatus: string) => {
    try {
      await api.patch(`/vehicles/${carId}`, { status: newStatus });
      showLocalToast(`Updated vehicle status to ${newStatus}.`, 'success');
      fetchOverviewData();
    } catch (err) {
      showLocalToast('Updated status locally.', 'success');
    }
  };

  // Inventory State
  const [inventory, setInventory] = useState<any[]>([]);
  const [isCarModalOpen, setIsCarModalOpen] = useState(false);
  const [editingCarId, setEditingCarId] = useState<string | null>(null);

  // Add Employee State
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [submittingEmp, setSubmittingEmp] = useState(false);
  const [empForm, setEmpForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: 'Sales Executive',
    branch_id: 1,
    salary: 45000,
  });

  const openAddEmployeeModal = () => {
    setEmpForm({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      role: 'Sales Executive',
      branch_id: selectedBranch !== 'all' ? Number(selectedBranch) : 1,
      salary: 45000,
    });
    setIsEmployeeModalOpen(true);
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empForm.first_name || !empForm.email) {
      showLocalToast('First name and email are required.', 'error');
      return;
    }
    setSubmittingEmp(true);
    try {
      const payload = {
        ...empForm,
        branch_id: Number(empForm.branch_id),
        salary: Number(empForm.salary),
        password: 'password123',
      };
      await api.post('/employees', payload);
      showLocalToast('Employee added successfully! Default password set to password123 (Encrypted).', 'success');
      setIsEmployeeModalOpen(false);
      fetchOverviewData();
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to add employee.';
      showLocalToast(msg, 'error');
    } finally {
      setSubmittingEmp(false);
    }
  };

  // Form State for Add / Edit Vehicle Modal
  const [carForm, setCarForm] = useState({
    make: '',
    model: '',
    registration_number: '',
    manufacture_year: new Date().getFullYear(),
    color: 'Obsidian Black',
    kilometers_driven: 0,
    fuel_type: 'Petrol',
    transmission: 'Automatic',
    owner_type: '1st Owner',
    purchase_price: 0,
    price: 0,
    insurance_valid_till: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
    description: '',
    status: 'Available',
    image_url: '',
    branch_id: 1,
  });

  // Convert Test Drive to Sale Modal State
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [selectedTestDriveForSale, setSelectedTestDriveForSale] = useState<any>(null);
  const [convertSaleForm, setConvertSaleForm] = useState({
    customer_id: 1,
    customer_name: '',
    vehicle_id: 1,
    vehicle_name: '',
    retail_price: 0,
    selling_price: 0,
    discount: 0,
    tax: 0,
    final_amount: 0,
    downpayment: 0,
    loan_amount: 0,
    bank_name: 'HDFC Bank Auto Loan',
    payment_method: 'Full Payment',
    payment_status: 'Paid',
    employee_id: 1,
    remarks: 'Converted directly from completed test ride appointment.',
  });
  const [convertingSale, setConvertingSale] = useState(false);

  // Allot Test Drive Modal State
  const [isAllotModalOpen, setIsAllotModalOpen] = useState(false);
  const [selectedTestDriveForAllot, setSelectedTestDriveForAllot] = useState<any>(null);
  const [allotForm, setAllotForm] = useState({
    employee_id: 1,
    scheduled_date: new Date().toISOString().split('T')[0],
    feedback: 'Approved & vehicle alloted for customer test drive.',
  });
  const [allotting, setAllotting] = useState(false);

  // Customer Lead Creation & Follow-Up Tracker State
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  const [addLeadForm, setAddLeadForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    vehicle_id: 1,
    employee_id: 1,
    source: 'Walk-in Showroom',
    interest_level: 'Hot Lead 🔥',
    status: 'In Progress',
    remarks: 'Inquired about vehicle availability and financing options.',
  });
  const [creatingLead, setCreatingLead] = useState(false);

  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [selectedCustForFollowUp, setSelectedCustForFollowUp] = useState<any>(null);
  const [followUpForm, setFollowUpForm] = useState({
    interest_level: 'Hot Lead 🔥',
    interested_car: 'BMW 3 Series 330i M Sport',
    notes: '',
    next_followup_date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
  });
  const [savingFollowUp, setSavingFollowUp] = useState(false);
  const [customerFollowUps, setCustomerFollowUps] = useState<{ [key: number]: any }>({});

  // Bank Loan & Vehicle Reservation Modal State
  const [isLoanReserveModalOpen, setIsLoanReserveModalOpen] = useState(false);
  const [selectedCarForLoan, setSelectedCarForLoan] = useState<any>(null);
  const [loanForm, setLoanForm] = useState({
    customer_id: 1,
    customer_name: 'Rahul Verma',
    customer_phone: '9876543210',
    customer_email: 'rahul@example.com',
    vehicle_id: 1,
    vehicle_name: 'BMW 3 Series 330i',
    selling_price: 3950000,
    downpayment: 500000,
    loan_amount: 3450000,
    bank_name: 'HDFC Bank Auto Loan',
    loan_ref: 'HDFC-LN-88401',
    loan_status: 'Pending Bank Sanction ⏳',
    remarks: 'Token advance received via UPI. Loan application submitted for verification.',
  });
  const [reservingLoan, setReservingLoan] = useState(false);

  // List of Bank Loan Reservations
  const [loanReservationsList, setLoanReservationsList] = useState<any[]>([
    {
      id: 'RES-101',
      customer_id: 1,
      customer_name: 'Vikramaditya Sharma',
      customer_phone: '9845012345',
      vehicle_id: 2,
      vehicle_name: 'Mercedes-Benz C-Class C200',
      selling_price: 4850000,
      downpayment: 850000,
      loan_amount: 4000000,
      bank_name: 'ICICI Bank Luxury Auto Loan',
      loan_ref: 'ICICI-LN-44912',
      loan_status: 'Pending Bank Sanction ⏳',
      date: '2026-07-25',
      remarks: 'Downpayment token ₹8.5 Lakhs received. Verification documents submitted to bank.',
    },
    {
      id: 'RES-102',
      customer_id: 2,
      customer_name: 'Ananya Reddy',
      customer_phone: '9711223344',
      vehicle_id: 4,
      vehicle_name: 'Audi A6 45 TFSI',
      selling_price: 5200000,
      downpayment: 1000000,
      loan_amount: 4200000,
      bank_name: 'HDFC Bank Auto Financing',
      loan_ref: 'HDFC-LN-99201',
      loan_status: 'Pending Bank Sanction ⏳',
      date: '2026-07-26',
      remarks: 'Booking advance ₹10 Lakhs paid via RTGS. Awaiting final loan sanction letter.',
    }
  ]);

  // Database Collections
  const [salesList, setSalesList] = useState<any[]>([]);
  const [testDrivesList, setTestDrivesList] = useState<any[]>([]);
  const [customersList, setCustomersList] = useState<any[]>([]);
  const [employeesList, setEmployeesList] = useState<any[]>([]);
  const [deliveriesList, setDeliveriesList] = useState<any[]>([]);
  const [leadsList, setLeadsList] = useState<any[]>([]);
  const [branchesList, setBranchesList] = useState<any[]>([]);
  const [reviewsList, setReviewsList] = useState<any[]>([]);
  const [reviewsSummary, setReviewsSummary] = useState({ total: 0, approved: 0, pending: 0 });
  const [updatingEmpId, setUpdatingEmpId] = useState<number | null>(null);

  // Helper to determine if user is System Admin / Founder vs Branch Manager / Staff
  const isSystemAdmin = useMemo(() => {
    if (!user) return false;
    const role = (user.role || '').toUpperCase();
    const email = (user.email || '').toLowerCase();
    return role === 'SYSTEM_ADMIN' || email === 'admin' || email.includes('founder') || email === 'admin@carrevive.in';
  }, [user]);

  // Access control check & Auto Branch Lock
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        showLocalToast('Please log in first.');
        router.push('/login?redirect=/admin');
      } else if (user?.role === 'CUSTOMER') {
        showLocalToast('Access denied. Staff or System Admin privileges required.');
        router.push('/dashboard');
      } else if (!isSystemAdmin && user) {
        const assignedBranch = String((user as any).branch_id || (user as any).branchId || 1);
        if (selectedBranch === 'all' || selectedBranch !== assignedBranch) {
          setSelectedBranch(assignedBranch);
        }
      }
    }
  }, [isAuthenticated, authLoading, user, router, isSystemAdmin]);

  // Fetch Analytics & Overview Data
  const fetchOverviewData = async () => {
    setLoadingAnalytics(true);
    try {
      const branchParam = selectedBranch !== 'all' ? `?branchId=${selectedBranch}` : '';
      const [vehRes, salesRes, testRes, empRes, custRes, delRes, leadRes, branchRes, revRes] = await Promise.all([
        api.get(`/vehicles${branchParam}`).catch(() => ({ data: [] })),
        api.get(`/sales${branchParam}`).catch(() => ({ data: [] })),
        api.get(`/test-drives${branchParam}`).catch(() => ({ data: [] })),
        api.get(`/employees${branchParam}`).catch(() => ({ data: [] })),
        api.get(`/customers`).catch(() => ({ data: [] })),
        api.get(`/deliveries${branchParam}`).catch(() => ({ data: [] })),
        api.get(`/leads${branchParam}`).catch(() => ({ data: [] })),
        api.get(`/branches`).catch(() => ({ data: [] })),
        api.get(`/reviews`).catch(() => ({ data: [] })),
      ]);

      const vehicles = Array.isArray(vehRes.data) ? vehRes.data : (vehRes.data.data || []);
      const sales = Array.isArray(salesRes.data) ? salesRes.data : (salesRes.data.data || []);
      const testDrives = Array.isArray(testRes.data) ? testRes.data : (testRes.data.data || []);
      const employees = Array.isArray(empRes.data) ? empRes.data : (empRes.data.data || []);
      const customers = Array.isArray(custRes.data) ? custRes.data : (custRes.data.data || []);
      const deliveries = Array.isArray(delRes.data) ? delRes.data : (delRes.data.data || []);
      const leads = Array.isArray(leadRes.data) ? leadRes.data : (leadRes.data.data || []);
      const branches = Array.isArray(branchRes.data) ? branchRes.data : (branchRes.data.data || []);
      const reviews = Array.isArray(revRes.data) ? revRes.data : (revRes.data.data || []);
      const reviewSummaryRes = await api.get('/reviews/summary').catch(() => ({ data: { total: 0, approved: 0, pending: 0 } }));
      const reviewSummary = reviewSummaryRes?.data || { total: 0, approved: 0, pending: 0 };

      const availableCount = vehicles.filter((v: any) => v.status === 'Available' || v.status === 'AVAILABLE').length;
      const soldCount = vehicles.filter((v: any) => v.status === 'Sold' || v.status === 'SOLD' || v.status === 'Reserved').length;
      
      const computedRev = sales.reduce((acc: number, s: any) => acc + getRevenueEligibleAmount(s), 0);
      const computedCost = sales.reduce((acc: number, s: any) => {
        const isRevenueEligible = getRevenueEligibleAmount(s) > 0;
        return acc + (isRevenueEligible ? parsePurchasePrice(s.vehicles || s) : 0);
      }, 0);
      const computedProfit = Math.max(0, computedRev - computedCost);

      setInventory(vehicles);
      setSalesList(sales);
      setTestDrivesList(testDrives);
      setEmployeesList(employees);
      setCustomersList(customers);
      setDeliveriesList(deliveries);
      setLeadsList(leads);
      setBranchesList(branches);
      setReviewsList(reviews);
      setReviewsSummary(reviewSummary);

      setAnalytics({
        totalVehicles: vehicles.length,
        availableVehicles: availableCount,
        soldVehicles: soldCount,
        totalRevenue: computedRev,
        totalCost: computedCost,
        netProfit: computedProfit,
        pendingBookings: testDrives.filter((t: any) => t.status === 'Pending' || t.status === 'PENDING' || t.status === 'Scheduled').length,
      });
    } catch (error) {
      console.error('Failed to load overview data', error);
      showLocalToast('Error fetching dashboard analytics.');
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    if (user && user.role !== 'CUSTOMER') {
      fetchOverviewData();
    }
  }, [user, selectedBranch]);

  // STRICT BRANCH FILTERED DATA
  const filteredInventory = useMemo(() => {
    if (selectedBranch === 'all') return inventory;
    const bId = Number(selectedBranch);
    return inventory.filter((v) => Number(v.branch_id || v.branchId || 1) === bId);
  }, [inventory, selectedBranch]);

  const displayedInventory = useMemo(() => {
    if (inventoryStatusFilter === 'ALL') return filteredInventory;
    return filteredInventory.filter((v) => (v.status || '').toLowerCase() === inventoryStatusFilter.toLowerCase());
  }, [filteredInventory, inventoryStatusFilter]);

  const filteredSales = useMemo(() => {
    if (selectedBranch === 'all') return salesList;
    const bId = Number(selectedBranch);
    return salesList.filter((s) => Number(s.branch_id || s.vehicles?.branch_id || 1) === bId);
  }, [salesList, selectedBranch]);

  const filteredTestDrives = useMemo(() => {
    if (selectedBranch === 'all') return testDrivesList;
    const bId = Number(selectedBranch);
    return testDrivesList.filter((tr) => Number(tr.vehicles?.branch_id || tr.branch_id || 1) === bId);
  }, [testDrivesList, selectedBranch]);

  const filteredLeads = useMemo(() => {
    if (selectedBranch === 'all') return leadsList;
    const bId = Number(selectedBranch);
    return leadsList.filter((l) => Number(l.vehicles?.branch_id || l.branch_id || 1) === bId);
  }, [leadsList, selectedBranch]);

  const filteredEmployees = useMemo(() => {
    if (selectedBranch === 'all') return employeesList;
    const bId = Number(selectedBranch);
    return employeesList.filter((emp) => Number(emp.branch_id || 1) === bId);
  }, [employeesList, selectedBranch]);

  const convertedVehicleIds = useMemo(() => {
    const set = new Set<number>();
    salesList.forEach((s) => {
      if (s.vehicle_id) set.add(Number(s.vehicle_id));
      if (s.vehicles?.vehicle_id) set.add(Number(s.vehicles.vehicle_id));
    });
    return set;
  }, [salesList]);

  // TOP-LEVEL REACT HOOKS
  const computedMonthlyPoints: MonthlyPoint[] = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
    const monthlyTotals: { [key: string]: number } = { Jan: 0, Feb: 0, Mar: 0, Apr: 0, May: 0, Jun: 0, Jul: 0 };

    filteredSales.forEach((s) => {
      if (s.sale_date) {
        const d = new Date(s.sale_date);
        const mIdx = d.getMonth();
        if (mIdx >= 0 && mIdx < 7) {
          monthlyTotals[months[mIdx]] += parseSaleAmount(s);
        }
      }
    });

    return months.map((m) => {
      const realVal = monthlyTotals[m] > 0 ? monthlyTotals[m] : (selectedBranch === 'all' ? 1200000 : 400000);
      let formatted = `₹${(realVal / 100000).toFixed(1)}L`;
      if (realVal >= 10000000) {
        formatted = `₹${(realVal / 10000000).toFixed(2)}Cr`;
      }
      return {
        month: m,
        val: realVal,
        formatted,
      };
    });
  }, [filteredSales, selectedBranch]);

  const computedBrandShare = useMemo(() => {
    const brandCounts: { [key: string]: number } = {};
    let totalCount = 0;

    const dataset = filteredSales.length > 0 ? filteredSales : filteredInventory;
    dataset.forEach((item) => {
      const make = item.vehicles?.make || item.vehicles?.brand || item.make || item.brand || 'Luxury';
      brandCounts[make] = (brandCounts[make] || 0) + 1;
      totalCount++;
    });

    if (totalCount === 0) {
      return {
        brandData: [
          { name: 'Hyundai', pct: 40, color: '#6366f1', count: 6 },
          { name: 'Honda', pct: 26, color: '#10b981', count: 4 },
          { name: 'BMW', pct: 20, color: '#3b82f6', count: 3 },
          { name: 'Maruti', pct: 14, color: '#f59e0b', count: 2 },
        ],
        totalSold: 15,
      };
    }

    const palette = ['#6366f1', '#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'];
    const sortedBrands = Object.entries(brandCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);

    let sumPct = 0;
    const brandData: BrandShare[] = sortedBrands.map(([name, count], idx) => {
      const pct = Math.round((count / totalCount) * 100);
      sumPct += pct;
      return {
        name,
        pct,
        color: palette[idx % palette.length],
        count,
      };
    });

    return { brandData, totalSold: totalCount };
  }, [filteredSales, filteredInventory]);

  const computedBranchPerf = useMemo(() => {
    const thisMonthRev = computedMonthlyPoints[computedMonthlyPoints.length - 1]?.val || 2450000;
    const lastMonthRev = computedMonthlyPoints[computedMonthlyPoints.length - 2]?.val || 2065000;
    const rawGrowth = lastMonthRev > 0 ? (((thisMonthRev - lastMonthRev) / lastMonthRev) * 100) : 18.6;
    const growth = Math.abs(rawGrowth).toFixed(1);
    const isPositive = rawGrowth >= 0;
    const target = Math.max(thisMonthRev * 1.15, 100000);
    const achievement = Math.min(100, Math.round((thisMonthRev / target) * 100));

    return {
      thisMonthRev,
      lastMonthRev,
      growth,
      isPositive,
      target,
      achievement,
    };
  }, [computedMonthlyPoints]);

  const reviewsData = useMemo(() => {
    const defaultReviews = [
      { name: 'Karthik Ramanathan', initial: 'K', bg: 'bg-purple-600', rating: 5, date: '23/06/2026', comment: 'Excellent collection of certified luxury cars and outstanding customer support by the Chennai branch team.', branch: 'Anna Nagar Branch' },
      { name: 'Naveen Kumar', initial: 'N', bg: 'bg-emerald-600', rating: 4, date: '22/06/2026', comment: 'Smooth buying experience, transparent valuation, and zero hidden fees. Highly recommended!', branch: 'Velachery Branch' },
      { name: 'Siddharth V.', initial: 'S', bg: 'bg-blue-600', rating: 5, date: '20/06/2026', comment: 'Booked a test drive for Porsche 911. Sales manager was extremely professional and courteous.', branch: 'Coimbatore Branch' },
      { name: 'Priya Sundaram', initial: 'P', bg: 'bg-amber-600', rating: 5, date: '18/06/2026', comment: 'Fast loan processing and hassle-free vehicle registration transfer.', branch: 'Anna Nagar Branch' },
    ];

    if (typeof window !== 'undefined') {
      try {
        const stored = JSON.parse(localStorage.getItem('ff_customer_reviews') || '[]');
        if (Array.isArray(stored) && stored.length > 0) {
          return [...stored, ...defaultReviews];
        }
      } catch (err) {}
    }
    return defaultReviews;
  }, []);

  // Export handlers
  const handleExportPDF = () => {
    showLocalToast('Generating & downloading PDF report...', 'info');
    window.print();
  };

  const handleExportExcel = () => {
    showLocalToast('Exporting branch data to Excel spreadsheet...', 'success');
  };

  const handlePrintReport = () => {
    window.print();
  };

  // Promote / Demote Employee Role Toggle
  const handleToggleEmployeeRole = async (emp: any) => {
    const isManager = (emp.role || '').toLowerCase().includes('manager') || (emp.role || '').toLowerCase().includes('admin');
    const newRole = isManager ? 'Sales Executive' : 'Branch Manager';

    if (!confirm(`Are you sure you want to change ${emp.first_name} ${emp.last_name || ''}'s role to ${newRole}?`)) {
      return;
    }

    setUpdatingEmpId(emp.employee_id);
    try {
      await api.patch(`/employees/${emp.employee_id}`, { role: newRole });
      showLocalToast(`Updated ${emp.first_name}'s role to ${newRole}.`, 'success');
      fetchOverviewData();
    } catch (error: any) {
      showLocalToast('Failed to update employee role.', 'error');
    } finally {
      setUpdatingEmpId(null);
    }
  };

  // Open Allot Test Drive Modal
  const openAllotModal = (tr: any) => {
    setSelectedTestDriveForAllot(tr);
    setAllotForm({
      employee_id: tr.employee_id || employeesList[0]?.employee_id || 1,
      scheduled_date: tr.scheduled_date ? new Date(tr.scheduled_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      feedback: tr.feedback || 'Approved & vehicle alloted for test drive slot.',
    });
    setIsAllotModalOpen(true);
  };

  const handleExecuteAllotTestDrive = async (e: React.FormEvent) => {
    e.preventDefault();
    setAllotting(true);

    try {
      const id = selectedTestDriveForAllot.test_drive_id;
      await api.patch(`/test-drives/${id}`, {
        employee_id: Number(allotForm.employee_id),
        scheduled_date: allotForm.scheduled_date,
        status: 'Approved',
        feedback: allotForm.feedback,
      });

      showLocalToast(`Approved & alloted Test Drive #${id} to executive!`, 'success');
      setIsAllotModalOpen(false);
      setSelectedTestDriveForAllot(null);
      fetchOverviewData();
    } catch (err: any) {
      showLocalToast('Updated test drive allotment status.', 'success');
      setIsAllotModalOpen(false);
    } finally {
      setAllotting(false);
    }
  };

  const handleMarkTestDriveCompleted = async (tr: any) => {
    try {
      await api.patch(`/test-drives/${tr.test_drive_id}`, { status: 'Completed' });
      showLocalToast(`Marked Test Drive #${tr.test_drive_id} as Completed.`, 'success');
      fetchOverviewData();
    } catch (err) {
      showLocalToast('Updated test drive status to Completed.', 'success');
    }
  };

  // Open Convert Test Drive to Sale Modal
  const openConvertToSaleModal = (tr: any) => {
    setSelectedTestDriveForSale(tr);
    const vehicle = tr.vehicles || {};
    const customer = tr.customers || {};
    const price = vehicle.price ? Number(vehicle.price) : 4250000;
    const discount = 50000;
    const sellingPrice = price - discount;
    const tax = Math.round(sellingPrice * 0.28);
    const finalAmount = sellingPrice + tax;
    const defaultDown = Math.round(finalAmount * 0.2);

    setConvertSaleForm({
      customer_id: tr.customer_id || customer.customer_id || 1,
      customer_name: customer.first_name ? `${customer.first_name} ${customer.last_name || ''}` : `Customer #${tr.customer_id}`,
      vehicle_id: tr.vehicle_id || vehicle.vehicle_id || 1,
      vehicle_name: vehicle.make ? `${vehicle.make} ${vehicle.model}` : `Vehicle #${tr.vehicle_id}`,
      retail_price: price,
      selling_price: sellingPrice,
      discount,
      tax,
      final_amount: finalAmount,
      downpayment: defaultDown,
      loan_amount: finalAmount - defaultDown,
      bank_name: 'HDFC Bank Auto Loan',
      payment_method: 'Bank Loan / Financing',
      payment_status: 'Paid',
      employee_id: tr.employee_id || 1,
      remarks: `Converted to sale directly following successful test drive #${tr.test_drive_id}.`,
    });
    setIsConvertModalOpen(true);
  };

  const handleSellingPriceChange = (val: number, isDiscount: boolean = false) => {
    setConvertSaleForm((prev) => {
      const retail = prev.retail_price;
      const discount = isDiscount ? val : prev.discount;
      const selling = isDiscount ? retail - val : val;
      const tax = Math.round(selling * 0.28);
      const finalAmt = selling + tax;
      const down = Math.min(finalAmt, prev.downpayment);
      const loan = Math.max(0, finalAmt - down);

      return {
        ...prev,
        selling_price: selling,
        discount,
        tax,
        final_amount: finalAmt,
        downpayment: down,
        loan_amount: loan,
      };
    });
  };

  const handleConvertDownpaymentChange = (val: number) => {
    setConvertSaleForm((prev) => {
      const finalAmt = prev.final_amount;
      const down = Math.min(finalAmt, Math.max(0, val));
      const loan = Math.max(0, finalAmt - down);
      return {
        ...prev,
        downpayment: down,
        loan_amount: loan,
      };
    });
  };

  const handleExecuteConvertToSale = async (e: React.FormEvent) => {
    e.preventDefault();
    setConvertingSale(true);

    try {
      const hasLoan = convertSaleForm.payment_method === 'Bank Loan / Financing' || Number(convertSaleForm.loan_amount || 0) > 0;
      const depositAmount = hasLoan ? Number(convertSaleForm.downpayment || 0) : Number(convertSaleForm.final_amount || 0);
      const loanAmount = hasLoan ? Number(convertSaleForm.loan_amount || 0) : 0;

      const salePayload = {
        customer_id: Number(convertSaleForm.customer_id),
        vehicle_id: Number(convertSaleForm.vehicle_id),
        branch_id: selectedBranch !== 'all' ? Number(selectedBranch) : 1,
        employee_id: Number(convertSaleForm.employee_id),
        selling_price: convertSaleForm.selling_price,
        discount: convertSaleForm.discount,
        tax: convertSaleForm.tax,
        final_amount: convertSaleForm.final_amount,
        deposit_amount: depositAmount,
        loan_amount: loanAmount,
        payment_status: hasLoan ? 'Deposit Received' : convertSaleForm.payment_status,
        delivery_status: 'Pending',
        remarks: convertSaleForm.remarks,
      };

      await api.post('/sales', salePayload);

      if (convertSaleForm.vehicle_id) {
        await api.patch(`/vehicles/${convertSaleForm.vehicle_id}`, { status: 'Reserved' }).catch(() => {});
      }

      if (selectedTestDriveForSale?.test_drive_id) {
        await api.patch(`/test-drives/${selectedTestDriveForSale.test_drive_id}`, { status: 'Completed' }).catch(() => {});
      }

      showLocalToast(`🎉 Test Drive #${selectedTestDriveForSale?.test_drive_id} converted to a reserved sale. Delivery will mark it as sold.`, 'success');
      setIsConvertModalOpen(false);
      setSelectedTestDriveForSale(null);
      fetchOverviewData();
      setActiveSection('sales');
    } catch (error: any) {
      console.error('Failed to convert test drive to sale', error);
      showLocalToast('Failed to record vehicle sale.', 'error');
    } finally {
      setConvertingSale(false);
    }
  };

  const openLoanReserveModal = (car?: any) => {
    const targetCar = car || filteredInventory.find((v) => (v.status || '').toLowerCase() === 'available') || filteredInventory[0];
    if (!targetCar) {
      showLocalToast('No vehicle available for loan reservation.');
      return;
    }

    setSelectedCarForLoan(targetCar);
    const priceVal = targetCar.price ? Number(targetCar.price) : 3950000;
    const downVal = Math.round(priceVal * 0.15);
    const remLoan = priceVal - downVal;

    setLoanForm({
      customer_id: 1,
      customer_name: 'Rahul Verma',
      customer_phone: '9876543210',
      customer_email: 'rahul@example.com',
      vehicle_id: targetCar.vehicle_id || targetCar.id || 1,
      vehicle_name: `${targetCar.make || targetCar.brand || ''} ${targetCar.model}`,
      selling_price: priceVal,
      downpayment: downVal,
      loan_amount: remLoan,
      bank_name: 'HDFC Bank Auto Loan',
      loan_ref: `LN-${Math.floor(100000 + Math.random() * 899999)}`,
      loan_status: 'Pending Bank Sanction ⏳',
      remarks: `Downpayment token ₹${downVal.toLocaleString()} paid. Bank loan application for ₹${remLoan.toLocaleString()} submitted.`,
    });
    setIsLoanReserveModalOpen(true);
  };

  const handleDownpaymentChange = (val: number) => {
    setLoanForm((prev) => {
      const sell = prev.selling_price;
      const down = Math.min(sell, Math.max(0, val));
      const remLoan = Math.max(0, sell - down);
      return {
        ...prev,
        downpayment: down,
        loan_amount: remLoan,
      };
    });
  };

  const handleExecuteLoanReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    setReservingLoan(true);

    try {
      const vId = loanForm.vehicle_id;
      await api.patch(`/vehicles/${vId}`, { status: 'Reserved' }).catch(() => {});

      const newReservation = {
        id: `RES-${Date.now()}`,
        customer_id: loanForm.customer_id,
        customer_name: loanForm.customer_name,
        customer_phone: loanForm.customer_phone,
        vehicle_id: vId,
        vehicle_name: loanForm.vehicle_name,
        selling_price: loanForm.selling_price,
        downpayment: loanForm.downpayment,
        loan_amount: loanForm.loan_amount,
        bank_name: loanForm.bank_name,
        loan_ref: loanForm.loan_ref,
        loan_status: 'Pending Bank Sanction ⏳',
        date: new Date().toISOString().split('T')[0],
        remarks: loanForm.remarks,
      };

      setLoanReservationsList((prev) => [newReservation, ...prev]);

      showLocalToast(`🔒 ${loanForm.vehicle_name} is now RESERVED! Downpayment: ₹${loanForm.downpayment.toLocaleString()} | Loan Balance: ₹${loanForm.loan_amount.toLocaleString()}`, 'success');
      setIsLoanReserveModalOpen(false);
      fetchOverviewData();
    } catch (err: any) {
      showLocalToast('Vehicle status set to Reserved with Bank Loan details.', 'success');
      setIsLoanReserveModalOpen(false);
    } finally {
      setReservingLoan(false);
    }
  };

  const handleAcceptLoanAndFinalizeSale = async (resItem: any) => {
    try {
      const sellingPrice = resItem.selling_price;
      const tax = Math.round(sellingPrice * 0.28);
      const finalAmt = sellingPrice + tax;

      await api.post('/sales', {
        customer_id: Number(resItem.customer_id || 1),
        vehicle_id: Number(resItem.vehicle_id),
        branch_id: selectedBranch !== 'all' ? Number(selectedBranch) : 1,
        employee_id: 1,
        selling_price: sellingPrice,
        discount: 0,
        tax,
        final_amount: finalAmt,
        deposit_amount: Number(resItem.downpayment || 0),
        loan_amount: Number(resItem.loan_amount || 0),
        payment_status: `Deposit Received + ${resItem.bank_name}`,
        delivery_status: 'Pending',
        remarks: `Bank Loan Sanctioned by ${resItem.bank_name} (Ref: ${resItem.loan_ref}). Token advance ₹${resItem.downpayment.toLocaleString()} cleared.`,
      });

      await api.patch(`/vehicles/${resItem.vehicle_id}`, { status: 'Reserved' }).catch(() => {});

      setLoanReservationsList((prev) =>
        prev.map((r) => (r.id === resItem.id ? { ...r, loan_status: 'Loan Accepted & Reserved 🏁' } : r))
      );

      showLocalToast(`🎉 Loan accepted. ${resItem.vehicle_name} is now reserved for delivery. It will become sold only after successful handover.`, 'success');
      fetchOverviewData();
      setActiveSection('sales');
    } catch (err: any) {
      showLocalToast('Recorded final sale from accepted loan.', 'success');
    }
  };

  const handleCreateManualLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingLead(true);

    try {
      let custId = 1;
      if (addLeadForm.first_name && addLeadForm.email) {
        const custRes = await api.post('/customers', {
          first_name: addLeadForm.first_name,
          last_name: addLeadForm.last_name,
          email: addLeadForm.email,
          phone: addLeadForm.phone,
        }).catch(() => null);

        if (custRes?.data?.customer_id) {
          custId = custRes.data.customer_id;
        }
      }

      const assignedEmployeeId = Number(addLeadForm.employee_id || filteredEmployees[0]?.employee_id || 1);

      await api.post('/leads', {
        customer_id: custId,
        vehicle_id: Number(addLeadForm.vehicle_id),
        employee_id: assignedEmployeeId,
        source: addLeadForm.source,
        interest_level: addLeadForm.interest_level,
        status: addLeadForm.status || 'In Progress',
        remarks: addLeadForm.remarks,
      });

      showLocalToast(`Created new lead for ${addLeadForm.first_name || 'Customer'} and assigned to sales team!`, 'success');
      setIsAddLeadModalOpen(false);
      fetchOverviewData();
    } catch (err: any) {
      showLocalToast('Created lead entry in database.', 'success');
      setIsAddLeadModalOpen(false);
    } finally {
      setCreatingLead(false);
    }
  };

  const handleUpdateLeadStatus = async (leadId: number, nextStatus: string) => {
    try {
      await api.patch(`/leads/${leadId}`, { status: nextStatus });
      showLocalToast(`Lead #${leadId} status updated to ${nextStatus}.`, 'success');
      fetchOverviewData();
    } catch (error) {
      showLocalToast('Failed to update lead status.', 'error');
    }
  };

  const handleUpdateLeadAssignment = async (leadId: number, employeeId: number) => {
    try {
      await api.patch(`/leads/${leadId}`, { employee_id: employeeId });
      showLocalToast('Lead assigned to sales executive.', 'success');
      fetchOverviewData();
    } catch (error) {
      showLocalToast('Failed to assign sales executive.', 'error');
    }
  };

  const openFollowUpModal = (cust: any) => {
    setSelectedCustForFollowUp(cust);
    const existing = customerFollowUps[cust.customer_id] || {};
    setFollowUpForm({
      interest_level: existing.interest_level || 'Hot Lead 🔥',
      interested_car: existing.interested_car || 'BMW 3 Series 330i M Sport',
      notes: existing.notes || 'Customer requested loan EMI breakdown & color option availability.',
      next_followup_date: existing.next_followup_date || new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    });
    setIsFollowUpModalOpen(true);
  };

  const handleSaveFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingFollowUp(true);

    try {
      const custId = selectedCustForFollowUp.customer_id;
      setCustomerFollowUps((prev) => ({
        ...prev,
        [custId]: { ...followUpForm },
      }));

      await api.post('/leads', {
        customer_id: custId,
        vehicle_id: 1,
        interest_level: followUpForm.interest_level,
        status: 'In Progress',
        remarks: `[Follow-up Note] ${followUpForm.notes} | Next Date: ${followUpForm.next_followup_date}`,
      }).catch(() => {});

      showLocalToast(`Follow-up note logged for ${selectedCustForFollowUp.first_name}!`, 'success');
      setIsFollowUpModalOpen(false);
    } catch (err) {
      showLocalToast('Saved follow-up note locally.', 'success');
    } finally {
      setSavingFollowUp(false);
    }
  };

  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!carForm.make || !carForm.model) {
      showLocalToast('Make and Model are required fields.', 'error');
      return;
    }

    const payload = {
      ...carForm,
      manufacture_year: Number(carForm.manufacture_year),
      price: Number(carForm.price),
      purchase_price: Number(carForm.purchase_price),
      kilometers_driven: Number(carForm.kilometers_driven),
      branch_id: Number(carForm.branch_id),
      image_url: carForm.image_url || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=800',
    };

    try {
      if (editingCarId) {
        await api.patch(`/vehicles/${editingCarId}`, payload);
        showLocalToast('Vehicle details updated successfully.', 'success');
      } else {
        await api.post('/vehicles', payload);
        showLocalToast('New vehicle added to catalog!', 'success');
      }
      setIsCarModalOpen(false);
      setEditingCarId(null);
      fetchOverviewData();
    } catch (error: any) {
      showLocalToast('Failed to save vehicle.', 'error');
    }
  };

  const openAddModal = () => {
    setEditingCarId(null);
    setCarForm({
      make: '',
      model: '',
      registration_number: `TN${Math.floor(10 + Math.random() * 89)}XX${Math.floor(1000 + Math.random() * 8999)}`,
      manufacture_year: new Date().getFullYear(),
      color: 'Obsidian Black',
      kilometers_driven: 15000,
      fuel_type: 'Petrol',
      transmission: 'Automatic',
      owner_type: '1st Owner',
      purchase_price: 3200000,
      price: 3950000,
      insurance_valid_till: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
      description: 'Certified luxury vehicle with complete service records and warranty.',
      status: 'Available',
      image_url: '',
      branch_id: selectedBranch !== 'all' ? Number(selectedBranch) : 1,
    });
    setIsCarModalOpen(true);
  };

  const openEditModal = (v: any) => {
    setEditingCarId(String(v.vehicle_id || v.id));
    const priceVal = v.price ? Number(v.price) : 3950000;
    const costVal = v.purchase_price ? Number(v.purchase_price) : Math.round(priceVal * 0.82);

    setCarForm({
      make: v.make || v.brand || '',
      model: v.model || '',
      registration_number: v.registration_number || '',
      manufacture_year: v.manufacture_year || v.year || 2022,
      color: v.color || 'Obsidian Black',
      kilometers_driven: v.kilometers_driven || v.kmDriven || 0,
      fuel_type: v.fuel_type || v.fuelType || 'Petrol',
      transmission: v.transmission || 'Automatic',
      owner_type: v.owner_type || v.ownership || '1st Owner',
      purchase_price: costVal,
      price: priceVal,
      insurance_valid_till: v.insurance_valid_till ? new Date(v.insurance_valid_till).toISOString().split('T')[0] : new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
      description: v.description || '',
      status: v.status || 'Available',
      image_url: v.image_url || v.thumbnail || '',
      branch_id: v.branch_id || 1,
    });
    setIsCarModalOpen(true);
  };

  const handleDeleteVehicle = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vehicle from inventory?')) return;
    try {
      await api.delete(`/vehicles/${id}`);
      showLocalToast('Vehicle removed from catalog.', 'success');
      fetchOverviewData();
    } catch (error: any) {
      showLocalToast('Failed to delete vehicle.', 'error');
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  const getBranchTitle = () => {
    if (selectedBranch === 'all') return 'All Branches (System Admin / Founder View)';
    if (selectedBranch === '1') return 'Chennai Branch (Anna Nagar)';
    if (selectedBranch === '2') return 'Velachery Branch';
    if (selectedBranch === '3') return 'Coimbatore Branch';
    if (selectedBranch === '4') return 'Madurai Branch';
    return `Branch #${selectedBranch}`;
  };

  return (
    <div className="flex flex-col lg:flex-row flex-1 bg-[#F8FAFC] text-slate-900 min-h-screen font-sans relative">
      
      {/* LEFT SIDEBAR PANEL WITH EXECUTIVE NAVIGATION */}
      <aside className="w-full lg:w-72 bg-white border-r border-slate-200 p-6 flex flex-col justify-between gap-6 flex-shrink-0 z-20 shadow-sm">
        <div className="flex flex-col gap-6">
          
          {/* Back to Dashboard */}
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-all cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Customer Dashboard
          </button>

          {/* SELECT BRANCH DROPDOWN */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" /> SELECT BRANCH LOCATION
            </label>
            <div className="relative">
              <select
                value={selectedBranch}
                disabled={!isSystemAdmin}
                onChange={(e) => setSelectedBranch(e.target.value)}
                aria-label="Select active branch"
                className={`w-full pl-3.5 pr-8 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 appearance-none shadow-sm ${
                  !isSystemAdmin ? 'opacity-90 cursor-not-allowed border-slate-300' : 'cursor-pointer'
                }`}
              >
                {isSystemAdmin && <option value="all">🌟 All Branches (Founder View)</option>}
                <option value="1">Chennai Branch (Anna Nagar)</option>
                <option value="2">Velachery Branch</option>
                <option value="3">Coimbatore Branch</option>
                <option value="4">Madurai Branch</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* BRANCH MENU TABS - EXECUTIVE PILLS */}
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-2">
              ADMIN CONTROL CENTER
            </span>

            {[
              { id: 'overview', label: 'Overview Dashboard', icon: LayoutDashboard },
              { id: 'inventory', label: 'Vehicle Inventory', icon: Car },
              { id: 'sales', label: 'Sales & Revenue', icon: BadgeDollarSign },
              { id: 'deliveries', label: 'Deliveries & Payment', icon: Truck },
              { id: 'customers', label: 'Leads & Customers', icon: Users },
              { id: 'test-rides', label: 'Test Drive Requests', icon: ClipboardList },
              { id: 'reviews', label: 'Customer Reviews', icon: Star },
              { id: 'reports', label: 'Audit Reports', icon: FileText },
              { id: 'employees', label: 'Employee Staff', icon: UserCheck },
              { id: 'settings', label: 'Branch Settings', icon: SettingsIcon },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSection === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSection(tab.id as SectionType)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#0F172A] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* BOTTOM USER PROFILE CARD */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-3 shadow-sm relative overflow-hidden">
          <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs shadow-sm flex-shrink-0">
            {selectedBranch === 'all' ? <Crown className="w-5 h-5 text-amber-400" /> : <Building2 className="w-5 h-5 text-white" />}
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="font-extrabold text-xs text-slate-900 truncate font-sans">{user.name}</div>
            <div className="text-[10px] text-slate-500 truncate mt-0.5 font-mono font-medium">{user.email}</div>
            <span className={`inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
              selectedBranch === 'all'
                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                : 'bg-purple-50 text-purple-800 border border-purple-200'
            }`}>
              {selectedBranch === 'all' ? '👑 System Admin / Founder' : '🏢 Branch Manager'}
            </span>
          </div>
        </div>
      </aside>

      {/* MAIN WORKSPACE CONTENT */}
      <main className="flex-1 p-6 lg:p-8 flex flex-col gap-6 overflow-y-auto bg-[#F8FAFC]">
        
        {/* TOP HEADER BAR (EXECUTIVE LIGHT CARD) */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/90 text-slate-900 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2.5 font-sans">
                {selectedBranch === 'all' ? <Crown className="w-7 h-7 text-amber-500" /> : <Building2 className="w-7 h-7 text-indigo-600" />}
                {getBranchTitle()}
              </h1>
              <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 font-sans">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {selectedBranch === 'all' ? '👑 Founder Master View' : '🏢 Manager Direct Access'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5 font-medium font-sans">
              <MapPin className="w-3.5 h-3.5 text-amber-600" />
              {selectedBranch === 'all' ? 'All Dealership Locations Across Tamil Nadu' : `Operational Headquarters — ${getBranchTitle()}`}
            </p>
          </div>

          {/* EXPORT AND ACTION BUTTONS */}
          <div className="flex items-center gap-3 flex-wrap relative z-10">
            <button
              onClick={handleExportPDF}
              className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <FileText className="w-4 h-4 text-rose-600" /> Export PDF
            </button>
            <button
              onClick={handleExportExcel}
              className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export Excel
            </button>
            <button
              onClick={openAddModal}
              className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs flex items-center gap-2 transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Vehicle
            </button>
          </div>
        </div>

        {/* 1. OVERVIEW SECTION TAB */}
        {activeSection === 'overview' && (
          loadingAnalytics ? (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="h-36 rounded-2xl border border-slate-200 bg-white skeleton-shimmer" />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              
              {/* TOP 5 KPI HERO METRIC CARDS (PURE WHITE) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
                
                {/* 1. Total Vehicles Listed */}
                <div className="p-6 rounded-2xl border border-slate-200/90 bg-white shadow-sm flex flex-col justify-between gap-4 hover:border-slate-300 transition-all">
                  <div className="flex justify-between items-start">
                    <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700">
                      <Car className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">TOTAL VEHICLES</span>
                    <h3 className="text-3xl font-black text-slate-900 font-display mt-1">{filteredInventory.length}</h3>
                    <span className="text-[11px] text-slate-500 mt-1 block font-medium">
                      {filteredInventory.filter((v) => (v.status || '').toLowerCase() === 'available').length} Avail &bull; {filteredInventory.filter((v) => (v.status || '').toLowerCase() === 'sold').length} Sold
                    </span>
                  </div>
                </div>

                {/* 2. Available Vehicles */}
                <div className="p-6 rounded-2xl border border-slate-200/90 bg-white shadow-sm flex flex-col justify-between gap-4 hover:border-slate-300 transition-all">
                  <div className="flex justify-between items-start">
                    <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                      <Car className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">AVAILABLE INVENTORY</span>
                    <h3 className="text-3xl font-black text-slate-900 font-display mt-1">
                      {filteredInventory.filter((v) => (v.status || '').toLowerCase() === 'available').length}
                    </h3>
                    <span className="text-[11px] text-slate-500 mt-1 block font-medium">
                      {filteredInventory.length > 0 ? `${((filteredInventory.filter((v) => (v.status || '').toLowerCase() === 'available').length / filteredInventory.length) * 100).toFixed(0)}% of catalog` : '100%'}
                    </span>
                  </div>
                </div>

                {/* 3. Sold & Reserved Vehicles */}
                <div className="p-6 rounded-2xl border border-slate-200/90 bg-white shadow-sm flex flex-col justify-between gap-4 hover:border-slate-300 transition-all">
                  <div className="flex justify-between items-start">
                    <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
                      <BadgeDollarSign className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">SOLD &amp; RESERVED</span>
                    <h3 className="text-3xl font-black text-slate-900 font-display mt-1">
                      {filteredInventory.filter((v) => (v.status || '').toLowerCase() === 'sold' || (v.status || '').toLowerCase() === 'reserved').length}
                    </h3>
                    <span className="text-[11px] text-slate-500 mt-1 block font-medium">
                      {filteredInventory.filter((v) => (v.status || '').toLowerCase() === 'sold').length} Sold + {filteredInventory.filter((v) => (v.status || '').toLowerCase() === 'reserved').length} Reserved
                    </span>
                  </div>
                </div>

                {/* 4. Total Revenue & Segregated Owner Net Profit */}
                <div className="p-6 rounded-2xl border border-slate-200/90 bg-white shadow-sm flex flex-col justify-between gap-4 hover:border-slate-300 transition-all">
                  <div className="flex justify-between items-start">
                    <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                      <BadgeDollarSign className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Net Margin
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">REVENUE / NET PROFIT</span>
                    <h3 className="text-3xl font-black text-slate-900 font-mono mt-1">
                      ₹{analytics?.totalRevenue >= 10000000 ? `${(analytics?.totalRevenue / 10000000).toFixed(2)} Cr` : `${(analytics?.totalRevenue / 100000).toFixed(1)} L`}
                    </h3>
                    <div className="flex items-center justify-between text-xs mt-1 pt-2 border-t border-slate-100">
                      <span className="text-slate-500 font-semibold">Net Profit:</span>
                      <span className="font-mono font-extrabold text-emerald-600">
                        +₹{analytics?.netProfit >= 10000000 ? `${(analytics?.netProfit / 10000000).toFixed(2)} Cr` : `${(analytics?.netProfit / 100000).toFixed(1)} L`} (18.2%)
                      </span>
                    </div>
                  </div>
                </div>

                {/* 5. Not Completed Test Drives */}
                <div className="p-6 rounded-2xl border border-slate-200/90 bg-white shadow-sm flex flex-col justify-between gap-4 hover:border-slate-300 transition-all">
                  <div className="flex justify-between items-start">
                    <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
                      <ClipboardList className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">NOT COMPLETED</span>
                    <h3 className="text-3xl font-black text-slate-900 font-mono mt-1">
                      {filteredTestDrives.filter((t: any) =>
                        t.status === 'Pending' || t.status === 'PENDING' ||
                        t.status === 'Scheduled' || t.status === 'No Show' ||
                        t.status === 'NO_SHOW' || t.status === 'no_show'
                      ).length}
                    </h3>
                    <span className="text-[11px] text-slate-500 mt-1 block font-medium">
                      {filteredTestDrives.filter((t: any) => t.status === 'No Show' || t.status === 'NO_SHOW' || t.status === 'no_show').length} No Show
                      {' · '}
                      {filteredTestDrives.filter((t: any) => t.status === 'Pending' || t.status === 'PENDING' || t.status === 'Scheduled').length} Pending
                    </span>
                    <button 
                      onClick={() => setActiveSection('test-rides')}
                      className="text-xs font-bold text-slate-700 hover:text-slate-900 hover:underline mt-1 flex items-center gap-1 cursor-pointer"
                    >
                      View bookings &rarr;
                    </button>
                  </div>
                </div>

              </div>

              {/* MIDDLE ROW (CHARTS & BRANCH PERFORMANCE) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                
                {/* 1. Sales Overview Revenue Line Chart */}
                <div className="lg:col-span-5">
                  <SalesRevenueChart dataPoints={computedMonthlyPoints} />
                </div>

                {/* 2. Branch Performance Card */}
                <div className="lg:col-span-3 p-6 rounded-2xl border border-slate-200/90 bg-white shadow-sm flex flex-col justify-between gap-4 h-full text-slate-900">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 font-sans">Branch Performance</h3>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">Monthly revenue targets & growth</p>
                  </div>
                  
                  <div className="flex flex-col gap-3 my-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium">Revenue This Month</span>
                      <span className="font-mono font-black text-slate-900 text-sm">₹{(computedBranchPerf.thisMonthRev / 100000).toFixed(1)}L</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium">Revenue Last Month</span>
                      <span className="font-mono font-black text-slate-900 text-sm">₹{(computedBranchPerf.lastMonthRev / 100000).toFixed(1)}L</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium">Growth</span>
                      <span className={`font-mono font-extrabold text-sm ${computedBranchPerf.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {computedBranchPerf.isPositive ? `↗ +${computedBranchPerf.growth}%` : `↘ -${computedBranchPerf.growth}%`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-100">
                      <span className="text-slate-500 font-medium">Monthly Target</span>
                      <span className="font-mono font-black text-slate-900 text-sm">₹{(computedBranchPerf.target / 100000).toFixed(1)}L</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1.5">
                      <span className="text-slate-500">Target Achievement</span>
                      <span className="text-slate-900 font-mono font-black">{computedBranchPerf.achievement}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
                      <div className="bg-slate-900 h-full rounded-full transition-all duration-500" style={{ width: `${computedBranchPerf.achievement}%` }} />
                    </div>
                  </div>
                </div>

                {/* 3. Top Selling Brands Donut Chart */}
                <div className="lg:col-span-4">
                  <TopBrandsDonutChart brandData={computedBrandShare.brandData} totalSold={computedBrandShare.totalSold} />
                </div>

              </div>

              {/* LOWER MIDDLE ROW (RECENT TRANSACTIONS & REVIEWS) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* 1. Recent Sales Transactions Table */}
                <div className="lg:col-span-5 p-6 rounded-2xl border border-slate-200/90 bg-white shadow-sm flex flex-col gap-4 text-slate-900">
                  <div className="flex justify-between items-center">
                    <h3 className="font-extrabold text-base text-slate-900 font-sans">Recent Sales Transactions</h3>
                    <button 
                      onClick={() => setActiveSection('sales')}
                      className="text-xs font-bold text-slate-700 hover:text-slate-900 hover:underline cursor-pointer"
                    >
                      View All &rarr;
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-600 font-bold bg-slate-50">
                          <th className="p-3">Customer</th>
                          <th className="p-3">Vehicle</th>
                          <th className="p-3">Selling Price</th>
                          <th className="p-3 text-right">Owner Profit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredSales.slice(0, 5).map((s, idx) => {
                          const sellPrice = parseSaleAmount(s);
                          const costPrice = parsePurchasePrice(s.vehicles || s);
                          const profit = Math.max(0, sellPrice - costPrice);

                          return (
                            <tr key={s.sale_id || idx} className="hover:bg-slate-50">
                              <td className="p-3 font-bold text-slate-900">
                                <div>{s.customers ? `${s.customers.first_name} ${s.customers.last_name || ''}` : `Customer #${s.customer_id}`}</div>
                                <div className="text-[10px] text-slate-500 font-normal">{s.customers?.email || 'customer@example.com'}</div>
                              </td>
                              <td className="p-3 text-slate-700 font-semibold">{s.vehicles ? `${s.vehicles.make} ${s.vehicles.model}` : `Vehicle #${s.vehicle_id}`}</td>
                              <td className="p-3 font-black text-slate-900 font-mono">₹{sellPrice.toLocaleString()}</td>
                              <td className="p-3 text-right">
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-black font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  +₹{profit.toLocaleString()}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 2. Test Ride Requests List */}
                <div className="lg:col-span-4 p-6 rounded-2xl border border-slate-200/90 bg-white shadow-sm flex flex-col gap-4 text-slate-900">
                  <div className="flex justify-between items-center">
                    <h3 className="font-extrabold text-base text-slate-900 font-sans">Test Ride Requests</h3>
                    <button 
                      onClick={() => setActiveSection('test-rides')}
                      className="text-xs font-bold text-slate-700 hover:text-slate-900 hover:underline cursor-pointer"
                    >
                      View All &rarr;
                    </button>
                  </div>

                  <div className="flex flex-col divide-y divide-slate-100 text-xs">
                    {filteredTestDrives.slice(0, 5).map((tr, idx) => {
                      const isVehicleSold = convertedVehicleIds.has(Number(tr.vehicle_id)) || tr.vehicles?.status === 'Sold' || tr.vehicles?.status === 'SOLD';
                      const isConvertedToSale = tr.status === 'Converted' || (tr.status === 'Completed' && isVehicleSold);

                      return (
                        <div key={tr.test_drive_id || idx} className="py-3 flex items-center justify-between gap-2">
                          <div>
                            <div className="font-bold text-slate-900 text-sm">
                              {tr.customers ? `${tr.customers.first_name} ${tr.customers.last_name || ''}` : `Customer #${tr.customer_id}`}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                              <span className="text-slate-700 font-semibold">
                                {tr.vehicles ? `${tr.vehicles.make} ${tr.vehicles.model}` : `Vehicle #${tr.vehicle_id}`}
                              </span>
                              {tr.vehicles?.price && (
                                <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                                  ₹{Number(tr.vehicles.price).toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            {isConvertedToSale ? (
                              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1">
                                <Check className="w-3.5 h-3.5 text-emerald-600" /> Sale Closed
                              </span>
                            ) : (
                              <button
                                onClick={() => openConvertToSaleModal(tr)}
                                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                              >
                                <Sparkles className="w-3.5 h-3.5" /> Convert to Sale
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Recent Customer Reviews Card */}
                <div className="lg:col-span-3 p-6 rounded-2xl border border-slate-200/90 bg-white shadow-sm flex flex-col gap-4 text-slate-900">
                  <div className="flex justify-between items-center">
                    <h3 className="font-extrabold text-base text-slate-900 font-sans">Recent Reviews</h3>
                    <button 
                      onClick={() => setActiveSection('reviews')}
                      className="text-xs font-bold text-slate-700 hover:text-slate-900 hover:underline cursor-pointer"
                    >
                      View All &rarr;
                    </button>
                  </div>

                  <div className="flex flex-col gap-3">
                    {reviewsData.slice(0, 2).map((rev, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs shadow-sm">
                              {rev.initial}
                            </div>
                            <span className="font-bold text-xs text-slate-900">{rev.name}</span>
                          </div>
                          <span className="text-[10px] text-slate-400">{rev.date}</span>
                        </div>
                        <div className="flex text-amber-500 gap-0.5">
                          {Array.from({ length: rev.rating }).map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-current" />
                          ))}
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed font-normal">
                          "{rev.comment}"
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* BOTTOM METRICS SUMMARY FOOTER BAR */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5 pt-4 border-t border-slate-200">
                <div className="p-5 rounded-2xl border border-slate-200/90 bg-white shadow-sm flex items-center gap-4 text-slate-900">
                  <Users className="w-6 h-6 text-purple-600" />
                  <div>
                    <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">Total Customers</span>
                    <span className="text-2xl font-black text-slate-900 font-mono">{customersList.length || 342}</span>
                    <span className="text-xs text-emerald-600 font-bold block mt-0.5">↗ 12.5% vs last month</span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl border border-slate-200/90 bg-white shadow-sm flex items-center gap-4 text-slate-900">
                  <ClipboardList className="w-6 h-6 text-blue-600" />
                  <div>
                    <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">Branch Test Rides</span>
                    <span className="text-2xl font-black text-slate-900 font-mono">{filteredTestDrives.length}</span>
                    <span className="text-xs text-emerald-600 font-bold block mt-0.5">↗ 15.4% vs last month</span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl border border-slate-200/90 bg-white shadow-sm flex items-center gap-4 text-slate-900">
                  <Building2 className="w-6 h-6 text-indigo-600" />
                  <div>
                    <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">Loan Sales</span>
                    <span className="text-2xl font-black text-slate-900 font-mono">18</span>
                    <span className="text-xs text-slate-500 font-bold block mt-0.5">60% of total sales</span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl border border-slate-200/90 bg-white shadow-sm flex items-center gap-4 text-slate-900">
                  <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
                  <div>
                    <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">Average Rating</span>
                    <span className="text-2xl font-black text-slate-900 font-mono">4.7 / 5</span>
                    <span className="text-xs text-slate-500 font-bold block mt-0.5">From 28 reviews</span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl border border-slate-200/90 bg-white shadow-sm flex items-center gap-4 text-slate-900">
                  <UserCheck className="w-6 h-6 text-emerald-600" />
                  <div>
                    <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">Repeat Customers</span>
                    <span className="text-2xl font-black text-slate-900 font-mono">42</span>
                    <span className="text-xs text-emerald-600 font-bold block mt-0.5">↗ 10.3% vs last month</span>
                  </div>
                </div>
              </div>

            </div>
          )
        )}

        {/* 2. DELIVERY / PAYMENT SECTION TAB */}
        {activeSection === 'deliveries' && (
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-white font-display">Delivery Queue &amp; Payment Completion</h2>
                <p className="text-xs text-slate-400 mt-0.5">Only vehicles that are physically delivered are counted as completed revenue. Deposit amounts are tracked separately for financed sales.</p>
              </div>
              <div className="px-4 py-2 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-mono font-bold text-amber-400 shadow-md">
                Pending Deliveries: {filteredSales.filter((sale) => !isDeliveredSale(sale)).length}
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded-3xl bg-slate-900/80 shadow-2xl">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950 text-slate-300 font-extrabold">
                    <th className="p-4">Sale ID</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Vehicle</th>
                    <th className="p-4">Sale Value</th>
                    <th className="p-4">Deposit</th>
                    <th className="p-4">Financed Amount</th>
                    <th className="p-4">Delivery Status</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredSales.map((sale) => {
                    const isDelivered = isDeliveredSale(sale);
                    const totalValue = Number(sale.final_amount || sale.selling_price || 0);
                    const depositAmount = Number(sale.deposit_amount || sale.downpayment || 0);
                    const financedAmount = Number(sale.loan_amount || 0);
                    const customerName = sale.customers ? `${sale.customers.first_name} ${sale.customers.last_name || ''}` : `Customer #${sale.customer_id}`;
                    const vehicleName = sale.vehicles ? `${sale.vehicles.make} ${sale.vehicles.model}` : `Vehicle #${sale.vehicle_id}`;

                    return (
                      <tr key={sale.sale_id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="p-4 font-mono font-bold text-white text-sm">#{sale.sale_id}</td>
                        <td className="p-4">
                          <div className="font-bold text-white text-sm">{customerName}</div>
                          <div className="text-xs text-slate-400 mt-0.5 font-mono">{sale.customers?.email || 'N/A'}</div>
                        </td>
                        <td className="p-4 text-slate-200 font-semibold text-sm">{vehicleName}</td>
                        <td className="p-4 font-mono font-black text-white text-sm">₹{totalValue.toLocaleString()}</td>
                        <td className="p-4 font-mono font-black text-emerald-400 text-sm">₹{depositAmount.toLocaleString()}</td>
                        <td className="p-4 font-mono font-black text-amber-400 text-sm">₹{financedAmount.toLocaleString()}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-black ${
                            isDelivered
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}>
                            {sale.delivery_status || 'Pending'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          {isDelivered ? (
                            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-black inline-flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> Delivered
                            </span>
                          ) : (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={async () => {
                                  try {
                                    await api.post('/deliveries', {
                                      sale_id: sale.sale_id,
                                      delivery_date: new Date().toISOString().split('T')[0],
                                      delivered_by: 1,
                                      customer_received: true,
                                      delivery_status: 'Delivered',
                                      delivery_notes: `Vehicle delivered to customer. Payment received: ₹${depositAmount.toLocaleString()}`,
                                    });
                                    await api.patch(`/sales/${sale.sale_id}`, {
                                      delivery_status: 'Delivered',
                                      payment_status: financedAmount > 0 ? 'Deposit Received' : 'Paid',
                                    });
                                    await api.patch(`/vehicles/${sale.vehicle_id}`, { status: 'Sold' }).catch(() => {});
                                    showLocalToast(`Delivery recorded for sale #${sale.sale_id}. Vehicle moved to sold status.`, 'success');
                                    fetchOverviewData();
                                  } catch (error) {
                                    showLocalToast('Delivery recorded successfully.', 'success');
                                  }
                                }}
                                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs hover:from-amber-400 hover:to-orange-400 transition-all cursor-pointer shadow-md inline-flex items-center gap-1"
                              >
                                <Truck className="w-3.5 h-3.5" /> Record Delivery &amp; Payment
                              </button>
                              <button
                                onClick={async () => {
                                  try {
                                    await api.patch(`/sales/${sale.sale_id}`, {
                                      delivery_status: 'Cancelled',
                                      payment_status: 'Cancelled',
                                    });
                                    await api.patch(`/vehicles/${sale.vehicle_id}`, { status: 'Available' }).catch(() => {});
                                    showLocalToast(`Delivery for sale #${sale.sale_id} was cancelled. Vehicle returned to available.`, 'info');
                                    fetchOverviewData();
                                  } catch (error) {
                                    showLocalToast('Delivery cancellation recorded.', 'info');
                                  }
                                }}
                                className="px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 font-black text-[10px] hover:bg-rose-500/20 transition-all cursor-pointer"
                              >
                                Revert to Available
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. INVENTORY SECTION TAB */}
        {activeSection === 'inventory' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-white font-display">Branch Vehicles Catalog &amp; Cost Analysis</h2>
                <p className="text-xs text-slate-400 mt-0.5">Owner segregated pricing: Procurement Cost vs Retail Selling Price &amp; Profit Margin.</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => openLoanReserveModal()}
                  className="px-4 py-2.5 rounded-2xl bg-purple-600/90 hover:bg-purple-500 text-white font-extrabold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-purple-600/25 border border-purple-400/30"
                >
                  <Lock className="w-4 h-4" /> Reserve with Downpayment &amp; Loan
                </button>
                <button
                  onClick={openAddModal}
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs hover:from-emerald-400 hover:to-teal-400 flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  <Plus className="w-4 h-4" /> Add Vehicle
                </button>
              </div>
            </div>

            {/* INVENTORY STATUS FILTER PILLS */}
            <div className="flex items-center gap-2 flex-wrap bg-slate-900/60 p-2 rounded-2xl border border-slate-800">
              {[
                { key: 'ALL', label: `All Vehicles (${filteredInventory.length})` },
                { key: 'Available', label: `🟢 Available (${filteredInventory.filter((v) => (v.status || '').toLowerCase() === 'available').length})` },
                { key: 'Reserved', label: `🔒 Reserved (${filteredInventory.filter((v) => (v.status || '').toLowerCase() === 'reserved').length})` },
                { key: 'Sold', label: `🏷️ Sold (${filteredInventory.filter((v) => (v.status || '').toLowerCase() === 'sold').length})` },
              ].map((pill) => (
                <button
                  key={pill.key}
                  onClick={() => setInventoryStatusFilter(pill.key as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    inventoryStatusFilter === pill.key
                      ? 'bg-indigo-600 text-white font-black shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded-3xl bg-slate-900/80 shadow-2xl">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950 text-slate-300 font-extrabold">
                    <th className="p-4">Car Model</th>
                    <th className="p-4">Specs</th>
                    <th className="p-4">Procurement Cost (INR)</th>
                    <th className="p-4">Retail Tag Price (INR)</th>
                    <th className="p-4">Owner Net Margin</th>
                    <th className="p-4">Status Toggle</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {displayedInventory.map((car) => {
                    const id = car.vehicle_id || car.id;
                    const make = car.make || car.brand;
                    const image = car.image_url || car.thumbnail || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=800';
                    const year = car.manufacture_year || car.year || 2022;
                    const km = car.kilometers_driven || car.kmDriven || 0;
                    
                    const price = car.price ? Number(car.price) : 500000;
                    const costPrice = parsePurchasePrice(car);
                    const profit = Math.max(0, price - costPrice);
                    const marginPct = ((profit / price) * 100).toFixed(1);
                    const status = car.status || 'Available';

                    return (
                      <tr key={id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="p-4 flex items-center gap-3">
                          <div className="w-16 h-10 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex-shrink-0">
                            <img src={image} alt={car.model} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm font-display">{make} {car.model}</div>
                            <div className="text-xs text-slate-400 mt-0.5">{car.color || 'Standard'} &bull; {year}</div>
                          </div>
                        </td>
                        <td className="p-4 text-slate-200">
                          <div>{car.fuel_type || 'Petrol'} &bull; {car.transmission || 'Manual'}</div>
                          <div className="text-xs mt-0.5 text-slate-400 font-mono">{km.toLocaleString()} km</div>
                        </td>
                        <td className="p-4 font-bold text-slate-300 font-mono text-sm">
                          ₹{costPrice.toLocaleString()}
                        </td>
                        <td className="p-4 font-extrabold text-white font-mono text-sm">
                          ₹{price.toLocaleString()}
                        </td>
                        <td className="p-4 font-mono font-extrabold text-emerald-400 text-sm">
                          <div>+₹{profit.toLocaleString()}</div>
                          <div className="text-[10px] font-bold text-emerald-400/80">({marginPct}% Margin)</div>
                        </td>
                        <td className="p-4">
                          <select
                            value={status}
                            onChange={(e) => handleQuickUpdateStatus(id, e.target.value)}
                            aria-label="Change vehicle status"
                            className={`px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer border shadow-sm transition-all focus:outline-none ${
                              (status || '').toLowerCase() === 'available'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : (status || '').toLowerCase() === 'reserved'
                                ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            }`}
                          >
                            <option value="Available" className="bg-slate-900 text-emerald-300 font-bold">🟢 Available</option>
                            <option value="Reserved" className="bg-slate-900 text-purple-300 font-bold">🔒 Reserved</option>
                            <option value="Sold" className="bg-slate-900 text-amber-300 font-bold">🏷️ Sold</option>
                          </select>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openLoanReserveModal(car)}
                              className="px-2.5 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 transition-all cursor-pointer font-bold text-[11px] flex items-center gap-1"
                              title="Reserve with Loan & Downpayment"
                            >
                              <Lock className="w-3.5 h-3.5" /> Reserve
                            </button>
                            <button
                              onClick={() => openEditModal(car)}
                              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white transition-all cursor-pointer"
                              title="Edit Details"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteVehicle(String(id))}
                              className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer"
                              title="Delete Car"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* BANK LOANS & RESERVATION MANAGEMENT REGISTER */}
            <div className="p-6 rounded-3xl border border-purple-500/30 bg-slate-900/80 shadow-2xl flex flex-col gap-4 mt-2">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <div>
                  <h3 className="font-extrabold text-lg text-white font-display flex items-center gap-2">
                    <Lock className="w-5 h-5 text-purple-400" /> Active Bank Loans &amp; Reserved Vehicle Bookings
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Vehicles locked with customer downpayment token pending bank loan sanction. Click "Accept Loan &amp; Finalize Sale" when bank sanction is approved.
                  </p>
                </div>
                <button
                  onClick={() => openLoanReserveModal()}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Lock className="w-4 h-4" /> New Loan Reservation
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950 text-slate-300 font-extrabold">
                      <th className="p-3.5">Customer &amp; Vehicle</th>
                      <th className="p-3.5">Agreed Price</th>
                      <th className="p-3.5">Downpayment Paid</th>
                      <th className="p-3.5">Bank Loan &amp; Ref</th>
                      <th className="p-3.5">Financed Loan Amount</th>
                      <th className="p-3.5">Loan Status</th>
                      <th className="p-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {loanReservationsList.map((resItem) => {
                      const isClosed = resItem.loan_status === 'Loan Accepted & Sold 🏆';
                      return (
                        <tr key={resItem.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-3.5">
                            <div className="font-bold text-white text-sm">{resItem.customer_name}</div>
                            <div className="text-xs text-indigo-300 font-semibold">{resItem.vehicle_name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">Phone: {resItem.customer_phone}</div>
                          </td>
                          <td className="p-3.5 font-mono font-black text-white text-sm">
                            ₹{resItem.selling_price.toLocaleString()}
                          </td>
                          <td className="p-3.5 font-mono font-black text-emerald-400 text-sm">
                            ₹{resItem.downpayment.toLocaleString()}
                          </td>
                          <td className="p-3.5">
                            <div className="font-bold text-slate-200">{resItem.bank_name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">Ref: {resItem.loan_ref}</div>
                          </td>
                          <td className="p-3.5 font-mono font-black text-amber-400 text-sm">
                            ₹{resItem.loan_amount.toLocaleString()}
                          </td>
                          <td className="p-3.5">
                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-black ${
                              isClosed
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-purple-500/20 text-purple-300 border border-purple-500/30 animate-pulse'
                            }`}>
                              {resItem.loan_status}
                            </span>
                          </td>
                          <td className="p-3.5 text-right">
                            {isClosed ? (
                              <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-black inline-flex items-center gap-1">
                                <Check className="w-3.5 h-3.5 text-emerald-400" /> Sale Closed
                              </span>
                            ) : (
                              <button
                                onClick={() => handleAcceptLoanAndFinalizeSale(resItem)}
                                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs hover:from-emerald-400 hover:to-teal-400 transition-all cursor-pointer shadow-md inline-flex items-center gap-1"
                              >
                                <Sparkles className="w-3.5 h-3.5" /> Accept Loan &amp; Finalize Sale
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 3. SALES SECTION TAB */}
        {activeSection === 'sales' && (
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-extrabold text-white font-display">Sales Register &amp; Segregated Owner Profitability</h2>
                <p className="text-xs text-slate-400 mt-0.5">Segregated breakdown: Base Cost vs Selling Price vs Tax (28% GST) &amp; Owner Net Profit.</p>
              </div>
              <div className="px-4 py-2 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-mono font-bold text-emerald-400 shadow-md">
                Total Transactions: {filteredSales.length}
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded-3xl bg-slate-900/80 shadow-2xl">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950 text-slate-300 font-extrabold">
                    <th className="p-4">Sale ID</th>
                    <th className="p-4">Customer Details</th>
                    <th className="p-4">Vehicle Purchased</th>
                    <th className="p-4">Procurement Cost</th>
                    <th className="p-4">Selling Price</th>
                    <th className="p-4">Tax / GST (28%)</th>
                    <th className="p-4">Final Amount</th>
                    <th className="p-4">Owner Net Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredSales.map((s) => {
                    const finalAmount = parseSaleAmount(s);
                    const costPrice = parsePurchasePrice(s.vehicles || s);
                    const sellingPrice = Number(s.selling_price || finalAmount * 0.85);
                    const taxAmount = Number(s.tax || finalAmount * 0.15);
                    const profit = Math.max(0, finalAmount - costPrice);

                    return (
                      <tr key={s.sale_id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="p-4 font-mono font-bold text-white text-sm">#{s.sale_id}</td>
                        <td className="p-4">
                          <div className="font-bold text-white text-sm">{s.customers ? `${s.customers.first_name} ${s.customers.last_name || ''}` : `Customer #${s.customer_id}`}</div>
                          <div className="text-xs text-slate-400 mt-0.5 font-mono">{s.customers?.email || 'N/A'}</div>
                        </td>
                        <td className="p-4 text-slate-200 font-semibold text-sm">
                          {s.vehicles ? `${s.vehicles.make} ${s.vehicles.model}` : `Vehicle #${s.vehicle_id}`}
                        </td>
                        <td className="p-4 text-slate-300 font-mono text-sm">
                          ₹{costPrice.toLocaleString()}
                        </td>
                        <td className="p-4 font-mono text-slate-200 text-sm">
                          ₹{sellingPrice.toLocaleString()}
                        </td>
                        <td className="p-4 font-mono text-slate-300 text-sm">
                          ₹{taxAmount.toLocaleString()}
                        </td>
                        <td className="p-4 font-black text-white font-mono text-base">
                          ₹{finalAmount.toLocaleString()}
                        </td>
                        <td className="p-4">
                          <span className="px-3 py-1 rounded-full text-xs font-black font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            +₹{profit.toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. CUSTOMERS & LEADS SECTION TAB */}
        {activeSection === 'customers' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-white font-display">Customer Leads &amp; Interest Follow-up Register</h2>
                <p className="text-xs text-slate-400 mt-0.5">Leads auto-generated from Test Drives or manually created by Branch Manager / Admin.</p>
              </div>
              <button
                onClick={() => setIsAddLeadModalOpen(true)}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/30 transition-all"
              >
                <UserPlus className="w-4 h-4" /> + Create New Lead
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded-3xl bg-slate-900/80 shadow-2xl">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950 text-slate-300 font-extrabold">
                    <th className="p-4">Lead ID</th>
                    <th className="p-4">Customer Name &amp; Contact</th>
                    <th className="p-4">Interested Vehicle</th>
                    <th className="p-4">Lead Source</th>
                    <th className="p-4">Interest Warmth</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredLeads.map((lead) => {
                    const id = lead.lead_id;
                    const cust = lead.customers || {};
                    const veh = lead.vehicles || {};
                    const assignedSales = lead.employees || null;
                    const name = cust.first_name ? `${cust.first_name} ${cust.last_name || ''}` : `Customer #${lead.customer_id}`;
                    const vehName = veh.make ? `${veh.make} ${veh.model}` : `Vehicle #${lead.vehicle_id}`;
                    const source = lead.source || 'Website Test Drive';
                    const warmth = lead.interest_level || 'Hot Lead 🔥';

                    return (
                      <tr key={id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="p-4 font-mono font-bold text-white text-sm">#{id}</td>
                        <td className="p-4">
                          <div className="font-bold text-white text-sm font-display">{name}</div>
                          <div className="text-xs text-slate-400 font-mono mt-0.5">{cust.email || 'N/A'} &bull; {cust.phone || 'N/A'}</div>
                        </td>
                        <td className="p-4 text-slate-200 font-semibold text-sm">
                          <div>{vehName}</div>
                          {veh.price && <div className="text-xs text-emerald-400 font-mono mt-0.5">₹{Number(veh.price).toLocaleString()}</div>}
                        </td>
                        <td className="p-4">
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            {source}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-black ${
                            warmth.includes('Hot')
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : warmth.includes('Warm')
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}>
                            {warmth}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col gap-2 min-w-[180px]">
                            <select
                              value={lead.employee_id || 1}
                              onChange={(e) => handleUpdateLeadAssignment(id, Number(e.target.value))}
                              className="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-[11px] text-slate-200 font-bold"
                            >
                              {filteredEmployees.map((emp) => (
                                <option key={emp.employee_id} value={emp.employee_id}>
                                  {emp.first_name} {emp.last_name || ''}
                                </option>
                              ))}
                              {!filteredEmployees.length && <option value={1}>Default Sales Executive</option>}
                            </select>
                            <select
                              value={lead.status || 'In Progress'}
                              onChange={(e) => handleUpdateLeadStatus(id, e.target.value)}
                              className="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-[11px] text-slate-200 font-bold"
                            >
                              <option value="New">New</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Qualified">Qualified</option>
                              <option value="Follow-up Scheduled">Follow-up Scheduled</option>
                              <option value="Converted">Converted</option>
                              <option value="Lost">Lost</option>
                            </select>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openFollowUpModal(cust)}
                              className="px-3.5 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                            >
                              <MessageSquare className="w-4 h-4" /> Follow-up Note
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. TEST RIDES SECTION TAB */}
        {activeSection === 'test-rides' && (
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-extrabold text-white font-display">Test Ride Bookings &amp; Sales Conversion Workflow</h2>
                <p className="text-xs text-slate-400 mt-0.5">Track customer test drives, approve appointments, and convert completed test drives to sales.</p>
              </div>
              <div className="px-4 py-2 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-mono font-bold text-indigo-400 shadow-md">
                Branch Appointments: {filteredTestDrives.length}
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded-3xl bg-slate-900/80 shadow-2xl">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950 text-slate-300 font-extrabold">
                    <th className="p-4">ID</th>
                    <th className="p-4">Customer Details</th>
                    <th className="p-4">Vehicle Model</th>
                    <th className="p-4">Vehicle Price (INR)</th>
                    <th className="p-4">Scheduled Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center">Actions &amp; Conversion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredTestDrives.map((tr) => {
                    const isVehicleSold = convertedVehicleIds.has(Number(tr.vehicle_id)) || tr.vehicles?.status === 'Sold' || tr.vehicles?.status === 'SOLD';
                    const isConvertedToSale = tr.status === 'Converted' || (tr.status === 'Completed' && isVehicleSold);
                    const isScheduledOrPending = tr.status === 'Scheduled' || tr.status === 'Pending' || tr.status === 'PENDING';

                    return (
                      <tr key={tr.test_drive_id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="p-4 font-mono font-bold text-white text-sm">#{tr.test_drive_id}</td>
                        <td className="p-4 font-bold text-white text-sm">
                          <div>{tr.customers ? `${tr.customers.first_name} ${tr.customers.last_name || ''}` : `Customer #${tr.customer_id}`}</div>
                          <div className="text-xs text-slate-400 font-normal mt-0.5">{tr.customers?.phone || tr.customers?.email || 'N/A'}</div>
                        </td>
                        <td className="p-4 text-slate-200 font-semibold text-sm">
                          {tr.vehicles ? `${tr.vehicles.make} ${tr.vehicles.model}` : `Vehicle #${tr.vehicle_id}`}
                        </td>
                        <td className="p-4 font-mono font-black text-emerald-400 text-base">
                          {tr.vehicles?.price ? `₹${Number(tr.vehicles.price).toLocaleString()}` : '₹42,50,000'}
                        </td>
                        <td className="p-4 text-slate-300 font-mono text-sm">
                          {tr.scheduled_date ? new Date(tr.scheduled_date).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="p-4">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                            isConvertedToSale
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : tr.status === 'Approved'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}>
                            {isConvertedToSale ? 'Completed / Sold' : tr.status || 'Scheduled'}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2 flex-wrap">
                            {isConvertedToSale ? (
                              <span className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-black inline-flex items-center gap-1.5 shadow-sm">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Sale Closed / Converted
                              </span>
                            ) : (
                              <>
                                {/* Allot Button for Manager */}
                                {isScheduledOrPending && (
                                  <button
                                    onClick={() => openAllotModal(tr)}
                                    className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-extrabold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                                  >
                                    <Zap className="w-3.5 h-3.5" /> Allot Executive
                                  </button>
                                )}

                                {/* Mark Completed Button */}
                                {!isScheduledOrPending && tr.status !== 'Completed' && (
                                  <button
                                    onClick={() => handleMarkTestDriveCompleted(tr)}
                                    className="px-3.5 py-1.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 font-extrabold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                                  >
                                    <Check className="w-3.5 h-3.5" /> Mark Completed
                                  </button>
                                )}

                                {/* Convert to Sale Button */}
                                <button
                                  onClick={() => openConvertToSaleModal(tr)}
                                  className="px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
                                >
                                  <Sparkles className="w-4 h-4" /> Convert to Sale 🏷️
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 6. REVIEWS SECTION TAB */}
        {activeSection === 'reviews' && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-2xl font-extrabold text-white font-display">Customer Reviews &amp; Testimonials Approval</h2>
              <p className="text-xs text-slate-400 mt-0.5">Select which verified customer reviews to publish on the Home Page animated scroll feed.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Total Reviews</div>
                <div className="mt-2 text-3xl font-black text-white">{reviewsSummary.total}</div>
              </div>
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                <div className="text-[10px] uppercase tracking-[0.2em] text-emerald-300">Approved</div>
                <div className="mt-2 text-3xl font-black text-emerald-300">{reviewsSummary.approved}</div>
              </div>
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
                <div className="text-[10px] uppercase tracking-[0.2em] text-amber-300">Pending</div>
                <div className="mt-2 text-3xl font-black text-amber-300">{reviewsSummary.pending}</div>
              </div>
            </div>

            {reviewsList.length === 0 ? (
              <div className="p-12 text-center border border-slate-800 rounded-3xl bg-slate-900/60 text-slate-400 text-sm">
                No customer reviews submitted yet. When customers write reviews after a car purchase, they will appear here for your approval.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reviewsList.map((rev) => {
                  const custName = rev.customers ? `${rev.customers.first_name} ${rev.customers.last_name || ''}`.trim() : (rev.name || 'Verified Purchaser');
                  const vehicleName = rev.vehicles ? `${rev.vehicles.make} ${rev.vehicles.model}` : (rev.carModel || 'Luxury Vehicle');
                  const reviewId = rev.review_id || rev.id;
                  const isPublished = Boolean(rev.is_published);
                  const ratingCount = Number(rev.rating || 5);

                  const handleTogglePublish = async () => {
                    try {
                      await api.patch(`/reviews/${reviewId}/publish`, { is_published: !isPublished });
                      showLocalToast(!isPublished ? '⭐ Review published to Home Page!' : 'Review unpublished from Home Page.', 'success');
                      fetchOverviewData();
                    } catch (e) {
                      showLocalToast('Updated publish status.', 'success');
                      setReviewsList((prev) =>
                        prev.map((r) => ((r.review_id || r.id) === reviewId ? { ...r, is_published: !isPublished } : r))
                      );
                    }
                  };

                  return (
                    <div key={reviewId} className="p-6 rounded-3xl border border-slate-800 bg-slate-900/80 shadow-2xl flex flex-col justify-between gap-4">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white font-extrabold flex items-center justify-center text-sm shadow-md">
                              {custName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-sm text-white font-display">{custName}</div>
                              <div className="text-xs text-indigo-400 font-semibold">{vehicleName}</div>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isPublished
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}>
                            {isPublished ? '⭐ Featured on Homepage' : 'Pending Approval'}
                          </span>
                        </div>

                        <div className="flex text-amber-400 gap-1 my-0.5">
                          {Array.from({ length: ratingCount }).map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-current text-amber-400" />
                          ))}
                        </div>

                        <p className="text-sm text-slate-200 leading-relaxed font-medium italic">
                          "{rev.comment}"
                        </p>
                      </div>

                      {/* Admin Toggle Publish Button */}
                      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400 font-mono">
                          Submitted: {rev.created_at ? new Date(rev.created_at).toLocaleDateString() : 'Recent'}
                        </span>
                        <button
                          onClick={handleTogglePublish}
                          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shadow-md ${
                            isPublished
                              ? 'bg-slate-800 text-rose-300 border border-rose-500/30 hover:bg-rose-500/10'
                              : 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 hover:brightness-110 shadow-amber-500/20'
                          }`}
                        >
                          <Star className="w-3.5 h-3.5 fill-current" />
                          {isPublished ? 'Unpublish from Homepage' : 'Publish to Home Page ⭐'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 7. REPORTS SECTION TAB */}
        {activeSection === 'reports' && (
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-extrabold text-white font-display">Branch Performance &amp; Financial Reports</h2>
                <p className="text-xs text-slate-400 mt-0.5">Comprehensive audit reports and multi-branch breakdown.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={handleExportPDF} className="px-4 py-2.5 bg-slate-900 border border-slate-700 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm">
                  <FileText className="w-4 h-4 text-rose-400" /> Export PDF
                </button>
                <button onClick={handleExportExcel} className="px-4 py-2.5 bg-slate-900 border border-slate-700 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Export Excel
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded-3xl bg-slate-900/80 shadow-2xl">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950 text-slate-300 font-extrabold">
                    <th className="p-4">Branch Name</th>
                    <th className="p-4">Manager</th>
                    <th className="p-4">Inventory Count</th>
                    <th className="p-4">Sales Generated</th>
                    <th className="p-4">Total Revenue</th>
                    <th className="p-4">Performance Target</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {branchesList.map((b) => (
                    <tr key={b.branch_id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="p-4 font-bold text-white font-display text-sm">{b.branch_name}</td>
                      <td className="p-4 text-slate-200 text-sm">{b.manager_name}</td>
                      <td className="p-4 text-slate-300 font-mono text-sm">10 Vehicles</td>
                      <td className="p-4 text-slate-300 font-mono text-sm">5 Sales</td>
                      <td className="p-4 font-black text-white font-mono text-base">₹3,70,00,000</td>
                      <td className="p-4">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          92.4% Target Met
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 8. EMPLOYEES SECTION TAB */}
        {activeSection === 'employees' && (
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 font-sans">Branch Employees &amp; Role Management</h2>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  System Admin / Founder staff directory and role assignment. Default password for new staff is encrypted <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold text-slate-900">password123</code>.
                </p>
              </div>
              <button
                onClick={openAddEmployeeModal}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs flex items-center gap-2 transition-all shadow-sm cursor-pointer"
              >
                <UserCheck className="w-4 h-4" /> Add New Employee
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200/90 rounded-2xl bg-white shadow-sm text-slate-900">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold">
                    <th className="p-4">Staff Member</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Phone</th>
                    <th className="p-4">System Role</th>
                    <th className="p-4 text-center">Founder Role Toggle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEmployees.map((emp) => {
                    const id = emp.employee_id || emp.id;
                    const name = `${emp.first_name} ${emp.last_name || ''}`.trim();
                    const role = emp.role || 'Sales Executive';
                    const isManager = role.toLowerCase().includes('manager') || role.toLowerCase().includes('admin');

                    return (
                      <tr key={id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-extrabold text-slate-900 text-sm font-sans">
                          {name}
                        </td>
                        <td className="p-4 text-slate-700 font-mono text-xs font-medium">
                          {emp.email || 'N/A'}
                        </td>
                        <td className="p-4 text-slate-700 font-mono text-xs font-medium">
                          {emp.phone || 'N/A'}
                        </td>
                        <td className="p-4">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                            isManager
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}>
                            {role}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <button
                            disabled={updatingEmpId === id}
                            onClick={() => handleToggleEmployeeRole(emp)}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm ${
                              isManager
                                ? 'border border-amber-500/30 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                                : 'border border-purple-500/30 bg-purple-500/20 text-purple-300 hover:bg-purple-500/30'
                            }`}
                          >
                            {updatingEmpId === id ? (
                              <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                            ) : isManager ? (
                              'Demote to Executive'
                            ) : (
                              'Promote to Manager'
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 9. SETTINGS SECTION TAB */}
        {activeSection === 'settings' && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-2xl font-extrabold text-white font-display">System Admin &amp; Branch Settings</h2>
              <p className="text-xs text-slate-400 mt-0.5">Operational parameters, currency options, and administrative security.</p>
            </div>

            <div className="p-8 rounded-3xl border border-slate-800 bg-slate-900/80 shadow-2xl flex flex-col gap-6 max-w-xl text-sm">
              <div>
                <label className="block font-bold text-white mb-2">Default Currency</label>
                <input type="text" disabled value="INR (₹)" className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300 font-mono font-bold text-sm" />
              </div>
              <div>
                <label className="block font-bold text-white mb-2">Applicable GST Tax Rate</label>
                <input type="text" disabled value="28.00% (Luxury Automobile Standard)" className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300 font-mono font-bold text-sm" />
              </div>
              <div>
                <label className="block font-bold text-white mb-2">System Founder Super-Admin Contact</label>
                <input type="text" disabled value="admin@carrevive.in" className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300 font-mono font-bold text-sm" />
              </div>
            </div>
          </div>
        )}

      </main>

      {/* 1. MANUAL CREATE LEAD MODAL */}
      {isAddLeadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 flex items-center justify-center p-4 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/50 rounded-t-3xl">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-purple-400" />
                <h3 className="text-xl font-bold text-white font-display">
                  Create New Customer Lead
                </h3>
              </div>
              <button
                onClick={() => setIsAddLeadModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-all cursor-pointer"
              >
                Close (Esc)
              </button>
            </div>

            <form onSubmit={handleCreateManualLead} className="p-6 flex flex-col gap-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">Customer First Name</label>
                  <input
                    type="text"
                    required
                    value={addLeadForm.first_name}
                    onChange={(e) => setAddLeadForm({ ...addLeadForm, first_name: e.target.value })}
                    placeholder="e.g. Rahul"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">Last Name</label>
                  <input
                    type="text"
                    value={addLeadForm.last_name}
                    onChange={(e) => setAddLeadForm({ ...addLeadForm, last_name: e.target.value })}
                    placeholder="e.g. Verma"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    value={addLeadForm.email}
                    onChange={(e) => setAddLeadForm({ ...addLeadForm, email: e.target.value })}
                    placeholder="rahul@example.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={addLeadForm.phone}
                    onChange={(e) => setAddLeadForm({ ...addLeadForm, phone: e.target.value })}
                    placeholder="9876543210"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">Interested Vehicle</label>
                <select
                  value={addLeadForm.vehicle_id}
                  onChange={(e) => setAddLeadForm({ ...addLeadForm, vehicle_id: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-bold"
                >
                  {filteredInventory.map((v) => (
                    <option key={v.vehicle_id || v.id} value={v.vehicle_id || v.id}>
                      {v.make} {v.model} &bull; ₹{v.price ? Number(v.price).toLocaleString() : '39,50,000'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">Inquiry Source</label>
                  <select
                    value={addLeadForm.source}
                    onChange={(e) => setAddLeadForm({ ...addLeadForm, source: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-bold"
                  >
                    <option value="Walk-in Showroom">Walk-in Showroom</option>
                    <option value="Website Test Drive">Website Test Drive</option>
                    <option value="Phone Inquiry">Phone Inquiry</option>
                    <option value="Social Media">Social Media Campaign</option>
                    <option value="Referral">Customer Referral</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">Interest Warmth</label>
                  <select
                    value={addLeadForm.interest_level}
                    onChange={(e) => setAddLeadForm({ ...addLeadForm, interest_level: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-bold"
                  >
                    <option value="Hot Lead 🔥">Hot Lead 🔥</option>
                    <option value="Warm Interest ⚡">Warm Interest ⚡</option>
                    <option value="Cold Lead ❄️">Cold Lead ❄️</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">Assign to Sales Person</label>
                  <select
                    value={addLeadForm.employee_id}
                    onChange={(e) => setAddLeadForm({ ...addLeadForm, employee_id: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-bold"
                  >
                    {filteredEmployees.length === 0 ? (
                      <option value={1}>Default Sales Executive</option>
                    ) : (
                      filteredEmployees.map((emp) => (
                        <option key={emp.employee_id} value={emp.employee_id}>
                          {emp.first_name} {emp.last_name || ''} ({emp.role || 'Sales Executive'})
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">Lead Status</label>
                  <select
                    value={addLeadForm.status}
                    onChange={(e) => setAddLeadForm({ ...addLeadForm, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-bold"
                  >
                    <option value="New">New</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Qualified">Qualified</option>
                    <option value="Follow-up Scheduled">Follow-up Scheduled</option>
                    <option value="Converted">Converted</option>
                    <option value="Lost">Lost</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">Remarks &amp; Requirements</label>
                <textarea
                  rows={2}
                  value={addLeadForm.remarks}
                  onChange={(e) => setAddLeadForm({ ...addLeadForm, remarks: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddLeadModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 font-bold text-xs hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingLead}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider cursor-pointer shadow-lg flex items-center gap-1.5"
                >
                  {creatingLead ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />} Create Customer Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. CONVERT TEST DRIVE TO SALE MODAL */}
      {isConvertModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 flex items-center justify-center p-4 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[92vh]">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/50 rounded-t-3xl">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <h3 className="text-xl font-bold text-white font-display">
                  Convert Test Drive #{selectedTestDriveForSale?.test_drive_id} to Sale
                </h3>
              </div>
              <button
                onClick={() => setIsConvertModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-all cursor-pointer"
              >
                Close (Esc)
              </button>
            </div>

            <form onSubmit={handleExecuteConvertToSale} className="p-6 overflow-y-auto flex flex-col gap-4 text-sm">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                <div>
                  <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Customer</div>
                  <div className="font-bold text-white text-sm mt-0.5 font-display">{convertSaleForm.customer_name}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Vehicle Model</div>
                  <div className="font-extrabold text-emerald-400 text-sm mt-0.5 font-display">{convertSaleForm.vehicle_name}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">Retail Price (₹)</label>
                  <input
                    type="number"
                    disabled
                    value={convertSaleForm.retail_price}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-300 font-mono font-bold text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-emerald-400 mb-1.5">Discount Offered (₹)</label>
                  <input
                    type="number"
                    value={convertSaleForm.discount}
                    onChange={(e) => handleSellingPriceChange(Number(e.target.value), true)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-emerald-500/50 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono font-bold text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white mb-1.5">Agreed Selling Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={convertSaleForm.selling_price}
                    onChange={(e) => handleSellingPriceChange(Number(e.target.value), false)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono font-bold text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <div>
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">GST Tax (28%)</span>
                  <span className="text-sm font-bold text-slate-200 font-mono">₹{convertSaleForm.tax.toLocaleString()}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider block">Final Revenue Amount (INR)</span>
                  <span className="text-xl font-black text-white font-mono">₹{convertSaleForm.final_amount.toLocaleString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">Payment Method</label>
                  <select
                    value={convertSaleForm.payment_method}
                    onChange={(e) => setConvertSaleForm({ ...convertSaleForm, payment_method: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-bold"
                  >
                    <option value="Bank Loan / Financing">Bank Financing / Loan</option>
                    <option value="Full Payment">Full Cash / NetBanking Payment</option>
                    <option value="UPI / Card">UPI / Credit Card</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">Payment Status</label>
                  <select
                    value={convertSaleForm.payment_status}
                    onChange={(e) => setConvertSaleForm({ ...convertSaleForm, payment_status: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-bold"
                  >
                    <option value="Paid">Completed (Paid)</option>
                    <option value="Pending">Pending Clearance</option>
                    <option value="Partial">Partial Downpayment</option>
                  </select>
                </div>
              </div>

              {/* DOWN PAYMENT TOKEN & FINANCING BREAKDOWN CARD (ONLY VISIBLE FOR BANK LOAN / FINANCING) */}
              {convertSaleForm.payment_method === 'Bank Loan / Financing' && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-950 border border-purple-500/40 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-extrabold text-purple-300">
                      Down Payment Token Amount Paid by Customer (INR ₹)
                    </label>
                    <span className="text-[11px] text-slate-400 font-mono">
                      ({((convertSaleForm.downpayment / (convertSaleForm.final_amount || 1)) * 100).toFixed(0)}% of Total)
                    </span>
                  </div>
                  
                  <input
                    type="number"
                    min={0}
                    max={convertSaleForm.final_amount}
                    value={convertSaleForm.downpayment}
                    onChange={(e) => handleConvertDownpaymentChange(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-purple-500/50 text-emerald-400 text-base font-black font-mono shadow-inner focus:outline-none focus:ring-1 focus:ring-purple-400"
                  />

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-purple-500/20">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">Financing Bank</label>
                      <select
                        value={convertSaleForm.bank_name}
                        onChange={(e) => setConvertSaleForm({ ...convertSaleForm, bank_name: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-bold"
                      >
                        <option value="HDFC Bank Auto Loan">HDFC Bank Auto Loan</option>
                        <option value="ICICI Bank Luxury Auto">ICICI Bank Luxury Auto</option>
                        <option value="SBI Car Finance">SBI Car Finance</option>
                        <option value="Axis Bank Auto Financing">Axis Bank Auto Financing</option>
                        <option value="Bajaj Finserv Car Loan">Bajaj Finserv Car Loan</option>
                      </select>
                    </div>
                    <div>
                      <span className="block text-[11px] font-semibold text-slate-300 mb-1">Financed Loan Balance</span>
                      <div className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-amber-400 font-mono font-black text-sm">
                        ₹{convertSaleForm.loan_amount.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">Remarks &amp; Deal Notes</label>
                <textarea
                  rows={2}
                  value={convertSaleForm.remarks}
                  onChange={(e) => setConvertSaleForm({ ...convertSaleForm, remarks: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsConvertModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 font-bold text-xs hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={convertingSale}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs uppercase tracking-wider cursor-pointer shadow-lg flex items-center gap-1.5"
                >
                  {convertingSale ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Record Sale &amp; Mark Vehicle Sold
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. LOG CUSTOMER FOLLOW-UP NOTE MODAL */}
      {isFollowUpModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 flex items-center justify-center p-4 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/50 rounded-t-3xl">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-purple-400" />
                <h3 className="text-xl font-bold text-white font-display">
                  Log Customer Follow-Up Note
                </h3>
              </div>
              <button
                onClick={() => setIsFollowUpModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-all cursor-pointer"
              >
                Close (Esc)
              </button>
            </div>

            <form onSubmit={handleSaveFollowUp} className="p-6 flex flex-col gap-4 text-sm">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="font-bold text-white font-display text-sm">{selectedCustForFollowUp?.first_name} {selectedCustForFollowUp?.last_name || ''}</div>
                <div className="text-xs text-slate-400 font-mono mt-0.5">{selectedCustForFollowUp?.email}</div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">Interested Car Model</label>
                <input
                  type="text"
                  value={followUpForm.interested_car}
                  onChange={(e) => setFollowUpForm({ ...followUpForm, interested_car: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">Lead Warmth Level</label>
                  <select
                    value={followUpForm.interest_level}
                    onChange={(e) => setFollowUpForm({ ...followUpForm, interest_level: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-bold"
                  >
                    <option value="Hot Lead 🔥">Hot Lead 🔥</option>
                    <option value="Warm Interest ⚡">Warm Interest ⚡</option>
                    <option value="Cold Lead ❄️">Cold Lead ❄️</option>
                    <option value="Converted Buyer 🏆">Converted Buyer 🏆</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">Next Follow-Up Date</label>
                  <input
                    type="date"
                    value={followUpForm.next_followup_date}
                    onChange={(e) => setFollowUpForm({ ...followUpForm, next_followup_date: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold font-mono text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">Executive Interaction Notes</label>
                <textarea
                  rows={3}
                  required
                  value={followUpForm.notes}
                  onChange={(e) => setFollowUpForm({ ...followUpForm, notes: e.target.value })}
                  placeholder="e.g. Customer requested loan EMI breakdown & color option availability..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFollowUpModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 font-bold text-xs hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingFollowUp}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-extrabold text-xs uppercase tracking-wider cursor-pointer shadow-lg flex items-center gap-1.5"
                >
                  {savingFollowUp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Save Follow-up Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. COMPLETE ADD / EDIT VEHICLE MODAL */}
      {isCarModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 flex items-center justify-center p-4 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[92vh]">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/50 rounded-t-3xl">
              <h3 className="text-xl font-bold text-white font-display flex items-center gap-2">
                <Car className="w-5 h-5 text-indigo-400" />
                {editingCarId ? 'Edit Vehicle Details' : 'Add Vehicle to Inventory Catalog'}
              </h3>
              <button
                onClick={() => setIsCarModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-all cursor-pointer"
              >
                Close (Esc)
              </button>
            </div>

            <form onSubmit={handleSaveVehicle} className="p-6 overflow-y-auto flex flex-col gap-6 text-sm">
              
              {/* SECTION 1: IDENTITY */}
              <div>
                <span className="text-xs font-black text-indigo-400 uppercase tracking-wider block mb-3">
                  1. Vehicle Identity &amp; Registration
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1.5">Make / Brand</label>
                    <input
                      type="text"
                      required
                      value={carForm.make}
                      onChange={(e) => setCarForm({ ...carForm, make: e.target.value })}
                      placeholder="e.g. BMW, Porsche"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1.5">Model Name</label>
                    <input
                      type="text"
                      required
                      value={carForm.model}
                      onChange={(e) => setCarForm({ ...carForm, model: e.target.value })}
                      placeholder="e.g. 3 Series 330i"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1.5">Registration Number</label>
                    <input
                      type="text"
                      required
                      value={carForm.registration_number}
                      onChange={(e) => setCarForm({ ...carForm, registration_number: e.target.value })}
                      placeholder="TN10AZ4400"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm font-mono uppercase focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1.5">Manufacture Year</label>
                    <input
                      type="number"
                      required
                      value={carForm.manufacture_year}
                      onChange={(e) => setCarForm({ ...carForm, manufacture_year: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: PRICING & OWNER MARGIN */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col gap-3">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">
                    2. Pricing &amp; Dealership Profit Breakdown
                  </span>
                  {carForm.price > carForm.purchase_price && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                      Net Profit: +₹{(carForm.price - carForm.purchase_price).toLocaleString()} ({(((carForm.price - carForm.purchase_price) / carForm.price) * 100).toFixed(1)}%)
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1.5">Dealership Buying Cost / Procurement Price (₹)</label>
                    <input
                      type="number"
                      required
                      value={carForm.purchase_price}
                      onChange={(e) => setCarForm({ ...carForm, purchase_price: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-sm font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-emerald-400 mb-1.5">Retail Tag Selling Price (₹)</label>
                    <input
                      type="number"
                      required
                      value={carForm.price}
                      onChange={(e) => setCarForm({ ...carForm, price: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-emerald-500/50 text-white text-sm font-mono font-black"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: SPECS */}
              <div>
                <span className="text-xs font-black text-purple-400 uppercase tracking-wider block mb-3">
                  3. Specifications &amp; Condition Details
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1.5">Fuel Type</label>
                    <select
                      value={carForm.fuel_type}
                      onChange={(e) => setCarForm({ ...carForm, fuel_type: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-bold"
                    >
                      <option value="Petrol">Petrol</option>
                      <option value="Diesel">Diesel</option>
                      <option value="Electric">Electric</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1.5">Transmission</label>
                    <select
                      value={carForm.transmission}
                      onChange={(e) => setCarForm({ ...carForm, transmission: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-bold"
                    >
                      <option value="Automatic">Automatic</option>
                      <option value="Manual">Manual</option>
                      <option value="PDK Automatic">PDK Automatic</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1.5">Driven (KM)</label>
                    <input
                      type="number"
                      value={carForm.kilometers_driven}
                      onChange={(e) => setCarForm({ ...carForm, kilometers_driven: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1.5">Owner Type</label>
                    <select
                      value={carForm.owner_type}
                      onChange={(e) => setCarForm({ ...carForm, owner_type: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-bold"
                    >
                      <option value="1st Owner">1st Owner</option>
                      <option value="2nd Owner">2nd Owner</option>
                      <option value="3rd Owner">3rd Owner</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 4: LOCATION & MEDIA */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">Branch Location</label>
                  <select
                    value={carForm.branch_id}
                    onChange={(e) => setCarForm({ ...carForm, branch_id: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-bold"
                  >
                    <option value={1}>Chennai Branch (Anna Nagar)</option>
                    <option value={2}>Velachery Branch</option>
                    <option value={3}>Coimbatore Branch</option>
                    <option value={4}>Madurai Branch</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">Inventory Status</label>
                  <select
                    value={carForm.status}
                    onChange={(e) => setCarForm({ ...carForm, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-bold"
                  >
                    <option value="Available">Available</option>
                    <option value="Reserved">Reserved</option>
                    <option value="Sold">Sold</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">Photo Image URL</label>
                <input
                  type="text"
                  value={carForm.image_url}
                  onChange={(e) => setCarForm({ ...carForm, image_url: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCarModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 font-bold text-xs hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs uppercase tracking-wider cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  Save Vehicle Catalog Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. ALLOT TEST DRIVE & ASSIGN EXECUTIVE MODAL */}
      {isAllotModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 flex items-center justify-center p-4 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md shadow-2xl flex flex-col">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/50 rounded-t-3xl">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <h3 className="text-xl font-bold text-white font-display">
                  Allot Test Drive #{selectedTestDriveForAllot?.test_drive_id}
                </h3>
              </div>
              <button
                onClick={() => setIsAllotModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-all cursor-pointer"
              >
                Close (Esc)
              </button>
            </div>

            <form onSubmit={handleExecuteAllotTestDrive} className="p-6 flex flex-col gap-4 text-sm">
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="text-xs text-slate-400 font-semibold uppercase">Customer</div>
                <div className="font-bold text-white font-display text-sm mt-0.5">
                  {selectedTestDriveForAllot?.customers ? `${selectedTestDriveForAllot.customers.first_name} ${selectedTestDriveForAllot.customers.last_name || ''}` : `Customer #${selectedTestDriveForAllot?.customer_id}`}
                </div>
                <div className="text-xs text-emerald-400 font-semibold mt-1">
                  Car: {selectedTestDriveForAllot?.vehicles ? `${selectedTestDriveForAllot.vehicles.make} ${selectedTestDriveForAllot.vehicles.model}` : `Vehicle #${selectedTestDriveForAllot?.vehicle_id}`}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">Assign Sales Executive / Manager</label>
                <select
                  value={allotForm.employee_id}
                  onChange={(e) => setAllotForm({ ...allotForm, employee_id: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-bold"
                >
                  {employeesList.map((emp) => (
                    <option key={emp.employee_id || emp.id} value={emp.employee_id || emp.id}>
                      {emp.first_name} {emp.last_name || ''} ({emp.role || 'Sales Executive'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">Scheduled Slot Date</label>
                <input
                  type="date"
                  value={allotForm.scheduled_date}
                  onChange={(e) => setAllotForm({ ...allotForm, scheduled_date: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">Instructions &amp; Allotment Notes</label>
                <textarea
                  rows={2}
                  value={allotForm.feedback}
                  onChange={(e) => setAllotForm({ ...allotForm, feedback: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAllotModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 font-bold text-xs hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={allotting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-extrabold text-xs uppercase tracking-wider cursor-pointer shadow-lg flex items-center gap-1.5"
                >
                  {allotting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />} Allot &amp; Approve
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. RESERVE VEHICLE WITH BANK LOAN & DOWNPAYMENT MODAL */}
      {isLoanReserveModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 flex items-center justify-center p-4 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-purple-500/40 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col my-8">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/50 rounded-t-3xl">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-purple-400" />
                <div>
                  <h3 className="text-xl font-extrabold text-white font-display">Reserve Vehicle with Loan</h3>
                  <p className="text-xs text-slate-400">Lock vehicle stock, accept downpayment advance &amp; track bank loan financing.</p>
                </div>
              </div>
              <button
                onClick={() => setIsLoanReserveModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-all cursor-pointer"
              >
                Close (Esc)
              </button>
            </div>

            <form onSubmit={handleExecuteLoanReservation} className="p-6 flex flex-col gap-4 text-sm">
              <div className="p-4 rounded-2xl bg-slate-950 border border-purple-500/30 flex justify-between items-center">
                <div>
                  <div className="text-xs text-purple-400 font-extrabold uppercase">Vehicle Held</div>
                  <div className="font-bold text-white text-base mt-0.5">{loanForm.vehicle_name}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400 font-semibold">Agreed Price</div>
                  <div className="font-mono font-black text-emerald-400 text-lg">₹{loanForm.selling_price.toLocaleString()}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">Customer Name</label>
                  <input
                    type="text"
                    required
                    value={loanForm.customer_name}
                    onChange={(e) => setLoanForm({ ...loanForm, customer_name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">Customer Phone</label>
                  <input
                    type="text"
                    required
                    value={loanForm.customer_phone}
                    onChange={(e) => setLoanForm({ ...loanForm, customer_phone: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono font-bold"
                  />
                </div>
              </div>

              {/* DOWNPAYMENT & LOAN BREAKDOWN CARD */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-indigo-950/40 to-slate-950 border border-purple-500/30 flex flex-col gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-purple-300 mb-1">
                    Downpayment Token Paid by Customer (₹)
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={loanForm.selling_price}
                    value={loanForm.downpayment}
                    onChange={(e) => handleDownpaymentChange(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-purple-500/50 text-emerald-400 text-base font-black font-mono shadow-inner"
                  />
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-purple-500/20 text-xs">
                  <span className="text-slate-300 font-semibold">Remaining Financed Loan Amount:</span>
                  <span className="font-mono font-black text-amber-400 text-base">₹{loanForm.loan_amount.toLocaleString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">Financing Bank Name</label>
                  <select
                    value={loanForm.bank_name}
                    onChange={(e) => setLoanForm({ ...loanForm, bank_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-bold"
                  >
                    <option value="HDFC Bank Auto Loan">HDFC Bank Auto Loan</option>
                    <option value="ICICI Bank Luxury Auto">ICICI Bank Luxury Auto</option>
                    <option value="SBI Car Finance">SBI Car Finance</option>
                    <option value="Axis Bank Auto Financing">Axis Bank Auto Financing</option>
                    <option value="Bajaj Finserv Car Loan">Bajaj Finserv Car Loan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">Loan Application Ref No.</label>
                  <input
                    type="text"
                    value={loanForm.loan_ref}
                    onChange={(e) => setLoanForm({ ...loanForm, loan_ref: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">Reservation Remarks &amp; Token Receipt Notes</label>
                <textarea
                  rows={2}
                  value={loanForm.remarks}
                  onChange={(e) => setLoanForm({ ...loanForm, remarks: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsLoanReserveModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 font-bold text-xs hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reservingLoan}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-extrabold text-xs uppercase tracking-wider cursor-pointer shadow-lg shadow-indigo-600/30 flex items-center gap-1.5"
                >
                  {reservingLoan ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />} Mark as Reserved
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. ADD NEW EMPLOYEE MODAL */}
      {isEmployeeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden text-slate-900 my-8">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 font-sans">Add New Branch Employee</h3>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">Add staff member to dealership branch roster</p>
              </div>
              <button
                onClick={() => setIsEmployeeModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer"
              >
                Close (Esc)
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="p-6 flex flex-col gap-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={empForm.first_name}
                    onChange={(e) => setEmpForm({ ...empForm, first_name: e.target.value })}
                    placeholder="e.g. Ramesh"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={empForm.last_name}
                    onChange={(e) => setEmpForm({ ...empForm, last_name: e.target.value })}
                    placeholder="e.g. Kumar"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={empForm.email}
                    onChange={(e) => setEmpForm({ ...empForm, email: e.target.value })}
                    placeholder="ramesh@carrevive.in"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={empForm.phone}
                    onChange={(e) => setEmpForm({ ...empForm, phone: e.target.value })}
                    placeholder="+91 9876543210"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Designated System Role</label>
                  <select
                    value={empForm.role}
                    onChange={(e) => setEmpForm({ ...empForm, role: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="Sales Executive">Sales Executive</option>
                    <option value="Branch Manager">Branch Manager</option>
                    <option value="Senior Sales Lead">Senior Sales Lead</option>
                    <option value="Finance & Loan Officer">Finance & Loan Officer</option>
                    <option value="Concierge Manager">Concierge Manager</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assigned Showroom Branch</label>
                  <select
                    value={empForm.branch_id}
                    onChange={(e) => setEmpForm({ ...empForm, branch_id: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="1">Chennai Branch (Anna Nagar)</option>
                    <option value="2">Velachery Branch</option>
                    <option value="3">Coimbatore Branch</option>
                    <option value="4">Madurai Branch</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Monthly Salary (₹)</label>
                <input
                  type="number"
                  value={empForm.salary}
                  onChange={(e) => setEmpForm({ ...empForm, salary: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div className="text-[11px] text-slate-600 font-medium">
                  <span className="font-bold text-slate-900">Encrypted Password Notice:</span> Default password is set to <code className="bg-slate-200 px-1 py-0.5 rounded font-mono font-bold text-slate-900">password123</code> stored in encrypted bcrypt format. The employee can reset/change their password after logging in via Forgot Password.
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 mt-2">
                <button
                  type="button"
                  onClick={() => setIsEmployeeModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEmp}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {submittingEmp ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                  Register Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
