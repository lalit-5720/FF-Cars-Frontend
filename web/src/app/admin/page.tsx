'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import { showLocalToast } from '../../components/Toast';
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
  Upload,
  Image as ImageIcon,
  Check,
  AlertCircle
} from 'lucide-react';

type SectionType = 'analytics' | 'inventory' | 'bookings' | 'users';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const authLoading = !mounted;

  const [activeSection, setActiveSection] = useState<SectionType>('analytics');
  
  // Analytics State
  const [analytics, setAnalytics] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  // Inventory State
  const [inventory, setInventory] = useState<any[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [isCarModalOpen, setIsCarModalOpen] = useState(false);
  const [editingCarId, setEditingCarId] = useState<string | null>(null);
  const [uploadingSingle, setUploadingSingle] = useState(false);
  const [uploadingMultiple, setUploadingMultiple] = useState(false);

  // Car Form State
  const [carForm, setCarForm] = useState({
    brand: '',
    model: '',
    variant: '',
    year: new Date().getFullYear(),
    fuelType: 'Petrol',
    transmission: 'Automatic',
    kmDriven: 0,
    ownership: 'First',
    price: 0,
    description: '',
    status: 'AVAILABLE',
    thumbnail: '',
    images: [] as string[]
  });

  // Bookings State
  const [bookings, setBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [processingBookingId, setProcessingBookingId] = useState<string | null>(null);

  // Users State
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  // Access check
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        showLocalToast('Please log in first.');
        router.push('/login?redirect=/admin');
      } else if (user?.role !== 'ADMIN') {
        showLocalToast('Access denied. Admin privileges required.');
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, authLoading, user, router]);

  // Fetch Analytics
  const fetchAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const response = await api.get('/admin/analytics');
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to load admin analytics', error);
      showLocalToast('Error fetching dashboard analytics.');
    } finally {
      setLoadingAnalytics(false);
    }
  };

  // Fetch Inventory
  const fetchInventory = async () => {
    setLoadingInventory(true);
    try {
      const response = await api.get('/cars?limit=100'); // Fetch all cars
      setInventory(response.data.data);
    } catch (error) {
      console.error('Failed to load inventory', error);
      showLocalToast('Error fetching inventory list.');
    } finally {
      setLoadingInventory(false);
    }
  };

  // Fetch Bookings
  const fetchAllBookings = async () => {
    setLoadingBookings(true);
    try {
      const response = await api.get('/bookings');
      setBookings(response.data);
    } catch (error) {
      console.error('Failed to load bookings', error);
      showLocalToast('Error fetching booking requests.');
    } finally {
      setLoadingBookings(false);
    }
  };

  // Fetch Users List
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await api.get('/admin/users');
      setUsersList(response.data);
    } catch (error) {
      console.error('Failed to load users', error);
      showLocalToast('Error fetching user list.', 'error');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleToggleUserRole = async (targetUser: any) => {
    if (targetUser.id === user?.id) {
      showLocalToast('You cannot change your own role.', 'error');
      return;
    }
    const nextRole = targetUser.role === 'ADMIN' ? 'CUSTOMER' : 'ADMIN';
    if (!confirm(`Are you sure you want to change ${targetUser.name}'s role to ${nextRole}?`)) {
      return;
    }
    setUpdatingUserId(targetUser.id);
    try {
      await api.patch(`/admin/users/${targetUser.id}/role`, { role: nextRole });
      showLocalToast(`User ${targetUser.name} is now a ${nextRole}.`, 'success');
      await fetchUsers();
    } catch (error: any) {
      showLocalToast(error.response?.data?.message || 'Failed to update user role.', 'error');
    } finally {
      setUpdatingUserId(null);
    }
  };

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      if (activeSection === 'analytics') fetchAnalytics();
      if (activeSection === 'inventory') fetchInventory();
      if (activeSection === 'bookings') fetchAllBookings();
      if (activeSection === 'users') fetchUsers();
    }
  }, [activeSection, user]);

  // Handle Booking approval/rejection
  const handleConfirmBooking = async (bookingId: string) => {
    setProcessingBookingId(bookingId);
    try {
      await api.post(`/bookings/${bookingId}/confirm`);
      showLocalToast('Booking confirmed & paid status updated.', 'success');
      await fetchAllBookings();
    } catch (error: any) {
      const errMsg = error.response?.data?.message || 'Failed to confirm booking.';
      showLocalToast(errMsg, 'error');
    } finally {
      setProcessingBookingId(null);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to reject/cancel this booking?')) return;
    setProcessingBookingId(bookingId);
    try {
      await api.post(`/bookings/${bookingId}/cancel`);
      showLocalToast('Booking cancelled.', 'success');
      await fetchAllBookings();
    } catch (error: any) {
      const errMsg = error.response?.data?.message || 'Failed to cancel booking.';
      showLocalToast(errMsg, 'error');
    } finally {
      setProcessingBookingId(null);
    }
  };

  // Handle image uploads
  const handleSingleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploadingSingle(true);
    try {
      const response = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setCarForm((prev) => ({ ...prev, thumbnail: response.data.url }));
      showLocalToast('Thumbnail uploaded successfully.', 'success');
    } catch (error) {
      console.error('Upload failed', error);
      showLocalToast('Image upload failed. Storing locally fallback.', 'error');
    } finally {
      setUploadingSingle(false);
    }
  };

  const handleMultipleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    setUploadingMultiple(true);
    try {
      const response = await api.post('/upload/images', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setCarForm((prev) => ({ 
        ...prev, 
        images: [...prev.images, ...response.data.urls] 
      }));
      showLocalToast('Supplementary images uploaded.', 'success');
    } catch (error) {
      console.error('Upload failed', error);
      showLocalToast('Images upload failed.', 'error');
    } finally {
      setUploadingMultiple(false);
    }
  };

  // Delete car
  const handleDeleteCar = async (carId: string) => {
    if (!confirm('Are you sure you want to delete this vehicle from inventory?')) return;
    try {
      await api.delete(`/cars/${carId}`);
      showLocalToast('Vehicle deleted successfully.', 'success');
      setInventory((prev) => prev.filter((c) => c.id !== carId));
    } catch (error: any) {
      showLocalToast(error.response?.data?.message || 'Failed to delete car.', 'error');
    }
  };

  // Save car (create or edit)
  const handleSaveCar = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validations
    if (!carForm.brand || !carForm.model || !carForm.thumbnail) {
      showLocalToast('Brand, Model, and Thumbnail are required fields.', 'error');
      return;
    }

    const payload = {
      ...carForm,
      year: Number(carForm.year),
      price: Number(carForm.price),
      kmDriven: Number(carForm.kmDriven),
    };

    try {
      if (editingCarId) {
        await api.patch(`/cars/${editingCarId}`, payload);
        showLocalToast('Vehicle updated successfully.', 'success');
      } else {
        await api.post('/cars', payload);
        showLocalToast('New vehicle added to inventory.', 'success');
      }
      setIsCarModalOpen(false);
      setEditingCarId(null);
      fetchInventory();
    } catch (error: any) {
      showLocalToast(error.response?.data?.message || 'Failed to save vehicle details.', 'error');
    }
  };

  const openAddModal = () => {
    setEditingCarId(null);
    setCarForm({
      brand: '',
      model: '',
      variant: '',
      year: new Date().getFullYear(),
      fuelType: 'Petrol',
      transmission: 'Automatic',
      kmDriven: 0,
      ownership: 'First',
      price: 0,
      description: '',
      status: 'AVAILABLE',
      thumbnail: '',
      images: []
    });
    setIsCarModalOpen(true);
  };

  const openEditModal = (car: any) => {
    setEditingCarId(car.id);
    let imagesList: string[] = [];
    try {
      imagesList = typeof car.images === 'string' ? JSON.parse(car.images) : car.images;
    } catch (e) {
      imagesList = [];
    }

    setCarForm({
      brand: car.brand,
      model: car.model,
      variant: car.variant,
      year: car.year,
      fuelType: car.fuelType,
      transmission: car.transmission,
      kmDriven: car.kmDriven,
      ownership: car.ownership,
      price: car.price,
      description: car.description,
      status: car.status,
      thumbnail: car.thumbnail,
      images: imagesList || []
    });
    setIsCarModalOpen(true);
  };

  if (authLoading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col gap-8">
      {/* Title Header */}
      <div className="p-6 sm:p-8 rounded-2xl border border-border bg-card shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-extrabold tracking-tight">Admin Terminal</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Authorized session for <strong className="text-primary">{user.name}</strong> &bull; Full CRUD, locking control &amp; live dashboards enabled.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 border border-zinc-700 hover:bg-zinc-800 rounded-xl text-xs font-semibold text-white transition-all cursor-pointer"
          >
            Customer View
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveSection('analytics')}
          className={`px-6 py-3.5 text-sm font-semibold tracking-wide border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeSection === 'analytics'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <BadgeDollarSign className="w-4.5 h-4.5" />
          Analytics Dashboard
        </button>
        <button
          onClick={() => setActiveSection('inventory')}
          className={`px-6 py-3.5 text-sm font-semibold tracking-wide border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeSection === 'inventory'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Car className="w-4.5 h-4.5" />
          Inventory Management
        </button>
        <button
          onClick={() => setActiveSection('bookings')}
          className={`px-6 py-3.5 text-sm font-semibold tracking-wide border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeSection === 'bookings'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <ClipboardList className="w-4.5 h-4.5" />
          Test Ride Requests
        </button>
        <button
          onClick={() => setActiveSection('users')}
          className={`px-6 py-3.5 text-sm font-semibold tracking-wide border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeSection === 'users'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users className="w-4.5 h-4.5" />
          Users Management
        </button>
      </div>

      {/* Main Sections */}
      <div className="flex-1 flex flex-col">
        
        {/* Section 1: Analytics */}
        {activeSection === 'analytics' && (
          loadingAnalytics ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-28 rounded-2xl border border-border bg-card skeleton-shimmer" />
              ))}
            </div>
          ) : analytics ? (
            <div className="flex flex-col gap-8">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="p-5 rounded-2xl border border-border bg-card flex items-center gap-4">
                  <div className="p-3 bg-primary/10 text-primary rounded-xl border border-primary/20">
                    <BadgeDollarSign className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total Revenue</span>
                    <h3 className="text-2xl font-extrabold text-foreground mt-0.5">₹{(analytics.revenue).toLocaleString()}</h3>
                  </div>
                </div>

                <div className="p-5 rounded-2xl border border-border bg-card flex items-center gap-4">
                  <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl border border-indigo-500/20">
                    <Car className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Cars Listed</span>
                    <h3 className="text-2xl font-extrabold text-foreground mt-0.5">{analytics.cars?.total}</h3>
                    <p className="text-[9px] text-muted-foreground mt-0.5">
                      {analytics.cars?.available} Available &bull; {analytics.cars?.booked} Sold
                    </p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl border border-border bg-card flex items-center gap-4">
                  <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl border border-emerald-500/20">
                    <ClipboardList className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Test Rides</span>
                    <h3 className="text-2xl font-extrabold text-foreground mt-0.5">{analytics.bookings?.total}</h3>
                    <p className="text-[9px] text-muted-foreground mt-0.5">
                      {analytics.bookings?.pending} Pending &bull; {analytics.bookings?.confirmed} Paid
                    </p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl border border-border bg-card flex items-center gap-4">
                  <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/20">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Customers</span>
                    <h3 className="text-2xl font-extrabold text-foreground mt-0.5">{analytics.users?.customers}</h3>
                    <p className="text-[9px] text-muted-foreground mt-0.5">
                      + {analytics.users?.admins} Admins
                    </p>
                  </div>
                </div>
              </div>

              {/* Recent Bookings List */}
              <div className="p-6 rounded-2xl border border-border bg-card shadow-sm flex flex-col gap-4">
                <h2 className="text-lg font-bold">Recent Booking Transactions</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground font-semibold">
                        <th className="pb-3 pr-4">Customer</th>
                        <th className="pb-3 pr-4">Car</th>
                        <th className="pb-3 pr-4">Date</th>
                        <th className="pb-3 pr-4">Price Paid</th>
                        <th className="pb-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {analytics.recentBookings?.map((b: any) => (
                        <tr key={b.id} className="hover:bg-secondary/5">
                          <td className="py-3.5 pr-4 font-semibold text-foreground">
                            <div>{b.user?.name}</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5 font-normal">{b.user?.email}</div>
                          </td>
                          <td className="py-3.5 pr-4">
                            {b.car?.brand} {b.car?.model} ({b.car?.year})
                          </td>
                          <td className="py-3.5 pr-4 text-muted-foreground">
                            {new Date(b.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3.5 pr-4 font-bold">
                            ₹{(b.bookingAmount).toLocaleString()}
                          </td>
                          <td className="py-3.5 text-right">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              b.bookingStatus === 'CONFIRMED' 
                                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                                : b.bookingStatus === 'PENDING'
                                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                : 'bg-red-500/10 text-red-500 border border-red-500/20'
                            }`}>
                              {b.bookingStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null
        )}

        {/* Section 2: Inventory Management */}
        {activeSection === 'inventory' && (
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">Car Inventory</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Manage details, edit status, and upload vehicle media.</p>
              </div>
              <button
                onClick={openAddModal}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/95 flex items-center gap-1 shadow-md shadow-primary/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add New Car
              </button>
            </div>

            {loadingInventory ? (
              <div className="grid grid-cols-1 gap-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-16 rounded-xl border border-border bg-card skeleton-shimmer" />
                ))}
              </div>
            ) : inventory.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-border rounded-xl">
                No vehicles listed yet. Click add new car to get started.
              </div>
            ) : (
              <div className="overflow-x-auto border border-border rounded-2xl bg-card">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-secondary/15 text-muted-foreground font-semibold">
                      <th className="p-4">Car Model</th>
                      <th className="p-4">Specs</th>
                      <th className="p-4">Pricing (INR)</th>
                      <th className="p-4">Inventory Status</th>
                      <th className="p-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {inventory.map((car) => (
                      <tr key={car.id} className="hover:bg-secondary/5">
                        <td className="p-4 flex items-center gap-3">
                          <div className="w-16 h-10 rounded overflow-hidden bg-secondary border border-border flex-shrink-0">
                            <img src={car.thumbnail} alt={car.model} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <div className="font-bold text-foreground text-sm">{car.brand} {car.model}</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">{car.variant} &bull; {car.year}</div>
                          </div>
                        </td>
                        <td className="p-4 text-muted-foreground">
                          <div>{car.fuelType} &bull; {car.transmission}</div>
                          <div className="text-[10px] mt-0.5">{(car.kmDriven).toLocaleString()} km &bull; {car.ownership} Owner</div>
                        </td>
                        <td className="p-4 font-bold text-foreground text-sm">
                          ₹{(car.price).toLocaleString()}
                        </td>
                        <td className="p-4">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            car.status === 'AVAILABLE' 
                              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                              : car.status === 'BOOKED'
                              ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                              : 'bg-zinc-700/10 text-zinc-400 border border-zinc-700/20'
                          }`}>
                            {car.status}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openEditModal(car)}
                              className="p-1.5 rounded bg-secondary hover:bg-secondary/80 border border-border text-foreground transition-all cursor-pointer"
                              title="Edit Details"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteCar(car.id)}
                              className="p-1.5 rounded bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 transition-all cursor-pointer"
                              title="Delete Car"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Section 3: Booking Requests */}
        {activeSection === 'bookings' && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-xl font-bold">Test Ride Requests &amp; Approvals</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Confirm payments and manage test ride request lifecycle statuses.</p>
            </div>

            {loadingBookings ? (
              <div className="grid grid-cols-1 gap-4">
                {[1, 2].map((n) => (
                  <div key={n} className="h-20 rounded-xl border border-border bg-card skeleton-shimmer" />
                ))}
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-border rounded-xl">
                No bookings registered in system.
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {bookings.map((booking) => {
                  const car = booking.car;
                  const u = booking.user;
                  return (
                    <div
                      key={booking.id}
                      className="p-5 rounded-2xl border border-border bg-card flex flex-col md:flex-row gap-5 items-stretch md:items-center justify-between"
                    >
                      {/* Customer + Car summary */}
                      <div className="flex gap-4 items-center">
                        <div className="w-20 h-14 rounded overflow-hidden bg-secondary border border-border flex-shrink-0">
                          <img src={car.thumbnail} alt={car.model} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <div className="font-bold text-foreground">
                            {car.brand} {car.model} ({car.year})
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            Customer: <strong className="text-foreground">{u?.name}</strong> ({u?.email})
                          </div>
                          <div className="text-[9px] text-muted-foreground">
                            Requested: {new Date(booking.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {/* Financial info */}
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-[9px] text-muted-foreground block uppercase font-bold">Booking Amt</span>
                          <span className="font-bold text-foreground">₹{(booking.bookingAmount).toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-muted-foreground block uppercase font-bold">Statuses</span>
                          <div className="flex gap-1.5 items-center mt-0.5">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              booking.bookingStatus === 'CONFIRMED'
                                ? 'bg-emerald-500/10 text-emerald-500'
                                : booking.bookingStatus === 'PENDING'
                                ? 'bg-amber-500/10 text-amber-500'
                                : 'bg-red-500/10 text-red-500'
                            }`}>
                              {booking.bookingStatus}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                              booking.paymentStatus === 'PAID'
                                ? 'bg-emerald-500/10 text-emerald-500'
                                : booking.paymentStatus === 'PENDING'
                                ? 'bg-amber-500/10 text-amber-500'
                                : 'bg-red-500/10 text-red-500'
                            }`}>
                              {booking.paymentStatus}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-end gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-border">
                        {booking.bookingStatus === 'PENDING' ? (
                          <>
                            <button
                              disabled={processingBookingId === booking.id}
                              onClick={() => handleConfirmBooking(booking.id)}
                              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-[0.97]"
                            >
                              <CheckCircle2 className="w-4 h-4" /> Confirm Payment
                            </button>
                            <button
                              disabled={processingBookingId === booking.id}
                              onClick={() => handleCancelBooking(booking.id)}
                              className="px-3.5 py-2 rounded-xl border border-red-500/30 text-red-500 bg-red-500/5 hover:bg-red-500/10 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer active:scale-[0.97]"
                            >
                              <XCircle className="w-4 h-4" /> Reject/Cancel
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1 select-none">
                            {booking.bookingStatus === 'CONFIRMED' ? (
                              <>
                                <Check className="w-4 h-4 text-emerald-500" /> Confirmed &amp; Paid
                              </>
                            ) : (
                              <>
                                <XCircle className="w-4 h-4 text-red-500" /> Cancelled Request
                              </>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Section 4: Users Management */}
        {activeSection === 'users' && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            <div>
              <h2 className="text-xl font-bold">Signed Up Users</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                View registered user accounts and manage administrator access.
              </p>
            </div>

            {loadingUsers ? (
              <div className="grid grid-cols-1 gap-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-16 rounded-2xl border border-border bg-card skeleton-shimmer" />
                ))}
              </div>
            ) : usersList.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-border rounded-2xl">
                No users found.
              </div>
            ) : (
              <div className="overflow-x-auto border border-border rounded-2xl bg-card">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-secondary/15 text-muted-foreground font-semibold">
                      <th className="p-4">User Details</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Registration Date</th>
                      <th className="p-4">System Role</th>
                      <th className="p-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {usersList.map((targetUser) => (
                      <tr key={targetUser.id} className="hover:bg-secondary/5">
                        <td className="p-4 font-bold text-foreground text-sm">
                          {targetUser.name}
                        </td>
                        <td className="p-4 text-muted-foreground">
                          {targetUser.email}
                        </td>
                        <td className="p-4 text-muted-foreground font-mono">
                          {new Date(targetUser.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-4">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            targetUser.role === 'ADMIN'
                              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                              : 'bg-zinc-800 text-zinc-400 border border-zinc-700/60'
                          }`}>
                            {targetUser.role}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <button
                            disabled={updatingUserId === targetUser.id || targetUser.id === user?.id}
                            onClick={() => handleToggleUserRole(targetUser)}
                            className={`px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                              targetUser.id === user?.id
                                ? 'bg-zinc-800 text-zinc-600 border border-zinc-900 cursor-not-allowed select-none'
                                : targetUser.role === 'ADMIN'
                                ? 'border border-red-500/20 text-red-500 bg-red-500/5 hover:bg-red-500/15 hover:border-red-500/30'
                                : 'border border-white/20 text-white bg-zinc-900 hover:bg-white hover:text-black hover:border-white'
                            }`}
                          >
                            {updatingUserId === targetUser.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" />
                            ) : targetUser.id === user?.id ? (
                              'You (Active)'
                            ) : targetUser.role === 'ADMIN' ? (
                              'Demote to Customer'
                            ) : (
                              'Promote to Admin'
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Car Form Modal (Add / Edit) */}
      {isCarModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-card border border-border rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h3 className="text-lg font-bold text-foreground">
                {editingCarId ? 'Modify Vehicle Details' : 'Add Vehicle to Catalog'}
              </h3>
              <button
                onClick={() => setIsCarModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm cursor-pointer font-bold"
              >
                Close (Esc)
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveCar} className="p-6 overflow-y-auto flex flex-col gap-5">
              {/* Row 1: Brand & Model */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Brand</label>
                  <input
                    type="text"
                    required
                    value={carForm.brand}
                    onChange={(e) => setCarForm((prev) => ({ ...prev, brand: e.target.value }))}
                    placeholder="e.g. Honda, Hyundai, BMW"
                    className="w-full py-2 px-3 border border-border rounded-lg bg-secondary/15 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Model Name</label>
                  <input
                    type="text"
                    required
                    value={carForm.model}
                    onChange={(e) => setCarForm((prev) => ({ ...prev, model: e.target.value }))}
                    placeholder="e.g. Civic, Creta, i8"
                    className="w-full py-2 px-3 border border-border rounded-lg bg-secondary/15 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Row 2: Variant & Year */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Variant / Version</label>
                  <input
                    type="text"
                    value={carForm.variant}
                    onChange={(e) => setCarForm((prev) => ({ ...prev, variant: e.target.value }))}
                    placeholder="e.g. 1.5 VTEC, SX (O), LXi"
                    className="w-full py-2 px-3 border border-border rounded-lg bg-secondary/15 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Registration Year</label>
                  <input
                    type="number"
                    required
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    value={carForm.year}
                    onChange={(e) => setCarForm((prev) => ({ ...prev, year: parseInt(e.target.value, 10) }))}
                    className="w-full py-2 px-3 border border-border rounded-lg bg-secondary/15 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Row 3: Fuel Type, Transmission, Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Fuel Type</label>
                  <select
                    value={carForm.fuelType}
                    onChange={(e) => setCarForm((prev) => ({ ...prev, fuelType: e.target.value }))}
                    className="w-full py-2 px-3 border border-border rounded-lg bg-secondary/15 text-xs text-foreground focus:outline-none"
                  >
                    <option value="Petrol">Petrol</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Electric">Electric</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Transmission</label>
                  <select
                    value={carForm.transmission}
                    onChange={(e) => setCarForm((prev) => ({ ...prev, transmission: e.target.value }))}
                    className="w-full py-2 px-3 border border-border rounded-lg bg-secondary/15 text-xs text-foreground focus:outline-none"
                  >
                    <option value="Automatic">Automatic</option>
                    <option value="Manual">Manual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Current Status</label>
                  <select
                    value={carForm.status}
                    onChange={(e) => setCarForm((prev) => ({ ...prev, status: e.target.value }))}
                    className="w-full py-2 px-3 border border-border rounded-lg bg-secondary/15 text-xs text-foreground focus:outline-none"
                  >
                    <option value="AVAILABLE">AVAILABLE</option>
                    <option value="BOOKED">BOOKED</option>
                    <option value="MAINTENANCE">MAINTENANCE</option>
                  </select>
                </div>
              </div>

              {/* Row 4: KM Driven, Ownership, Price */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">KMs Driven</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={carForm.kmDriven}
                    onChange={(e) => setCarForm((prev) => ({ ...prev, kmDriven: parseInt(e.target.value, 10) }))}
                    className="w-full py-2 px-3 border border-border rounded-lg bg-secondary/15 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Ownership</label>
                  <select
                    value={carForm.ownership}
                    onChange={(e) => setCarForm((prev) => ({ ...prev, ownership: e.target.value }))}
                    className="w-full py-2 px-3 border border-border rounded-lg bg-secondary/15 text-xs text-foreground focus:outline-none"
                  >
                    <option value="First">First Owner</option>
                    <option value="Second">Second Owner</option>
                    <option value="Third">Third Owner</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Price (INR)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={carForm.price}
                    onChange={(e) => setCarForm((prev) => ({ ...prev, price: parseFloat(e.target.value) }))}
                    className="w-full py-2 px-3 border border-border rounded-lg bg-secondary/15 text-xs text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Description details</label>
                <textarea
                  rows={3}
                  value={carForm.description}
                  onChange={(e) => setCarForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Insert mechanical updates, key issues, cosmetic features..."
                  className="w-full py-2 px-3 border border-border rounded-lg bg-secondary/15 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Image Uploads */}
              <div className="p-4 rounded-2xl border border-border bg-secondary/5 flex flex-col gap-4">
                <h4 className="text-xs font-bold uppercase tracking-wider">Media Files (PNG, JPG)</h4>
                
                {/* 1. Thumbnail Image Upload */}
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <div className="flex-1">
                    <span className="block text-xs font-semibold text-muted-foreground mb-1">Catalog Cover (Thumbnail)</span>
                    <div className="relative border border-dashed border-border rounded-lg p-3 hover:bg-secondary/10 flex items-center justify-center gap-2 cursor-pointer text-xs">
                      <Upload className="w-4 h-4 text-primary" />
                      <span>{uploadingSingle ? 'Uploading Cover Image...' : 'Click to Upload Thumbnail'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleSingleImageUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                  </div>
                  {carForm.thumbnail && (
                    <div className="w-20 aspect-video rounded overflow-hidden border border-border bg-black/25 flex-shrink-0">
                      <img src={carForm.thumbnail} alt="thumbnail preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                {/* 2. Multiple Gallery Images Upload */}
                <div>
                  <span className="block text-xs font-semibold text-muted-foreground mb-1">Gallery Images (Max 10)</span>
                  <div className="relative border border-dashed border-border rounded-lg p-3 hover:bg-secondary/10 flex items-center justify-center gap-2 cursor-pointer text-xs">
                    <ImageIcon className="w-4 h-4 text-primary" />
                    <span>{uploadingMultiple ? 'Uploading Gallery Files...' : 'Select Multiple Images'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleMultipleImageUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                  
                  {/* Gallery Previews */}
                  {carForm.images.length > 0 && (
                    <div className="flex gap-2 flex-wrap mt-3">
                      {carForm.images.map((url, i) => (
                        <div key={i} className="relative w-16 aspect-video rounded overflow-hidden border border-border bg-black/25">
                          <img src={url} alt="preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setCarForm((prev) => ({
                              ...prev,
                              images: prev.images.filter((_, idx) => idx !== i)
                            }))}
                            className="absolute top-0 right-0 bg-red-600 text-white rounded-full p-0.5 text-[8px] font-bold w-4 h-4 flex items-center justify-center hover:bg-red-500 shadow-md"
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setIsCarModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold border border-zinc-700 hover:bg-zinc-800 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/95 flex items-center gap-1 shadow-md shadow-primary/20 cursor-pointer"
                >
                  {editingCarId ? 'Update Car' : 'Save Car'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
