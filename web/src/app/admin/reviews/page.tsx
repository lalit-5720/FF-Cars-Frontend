'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import { usePermissions } from '../../../hooks/usePermissions';
import { RequireRole } from '../../../components/auth/RequireRole';
import { showLocalToast } from '../../../components/Toast';
import { Award, Star, CheckCircle, XCircle } from 'lucide-react';

export default function ReviewsPage() {
  const permissions = usePermissions();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reviews');
      setReviews(res.data);
    } catch (err) {
      showLocalToast('Failed to load reviews.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleTogglePublish = async (id: number, current: boolean) => {
    try {
      await api.patch(`/reviews/${id}/publish`, { is_published: !current });
      showLocalToast(`Review ${!current ? 'published' : 'un-published'}`);
      fetchReviews();
    } catch (err) {
      showLocalToast('Failed to update review status.');
    }
  };

  return (
    <RequireRole allow={['SYSTEM_ADMIN', 'BRANCH_MANAGER']}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card border border-border p-5 rounded-2xl">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" /> Customer Reviews & Ratings Moderation
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Moderate and publish customer testimonials & vehicle feedback
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl bg-card border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-border bg-secondary/30 text-muted-foreground uppercase text-[10px] tracking-wider font-bold">
                  <th className="py-3 px-4">Review ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Rating</th>
                  <th className="py-3 px-4">Comment</th>
                  <th className="py-3 px-4">Published Status</th>
                  <th className="py-3 px-4 text-right">Moderation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground">
                      Loading customer reviews...
                    </td>
                  </tr>
                ) : reviews.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground">
                      No reviews submitted yet.
                    </td>
                  </tr>
                ) : (
                  reviews.map((r) => (
                    <tr key={r.review_id} className="hover:bg-secondary/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-sky-400">#REV-{r.review_id}</td>
                      <td className="py-3.5 px-4 font-bold text-foreground">
                        {r.customers ? `${r.customers.first_name} ${r.customers.last_name || ''}` : `Customer #${r.customer_id}`}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="flex items-center gap-1 text-amber-400 font-bold">
                          <Star className="w-3.5 h-3.5 fill-amber-400" /> {r.rating}/5
                        </span>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs truncate text-slate-300">{r.comment}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          r.is_published ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {r.is_published ? 'Published' : 'Pending Approval'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleTogglePublish(r.review_id, r.is_published)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                            r.is_published
                              ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {r.is_published ? 'Unpublish' : 'Approve & Publish'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </RequireRole>
  );
}
