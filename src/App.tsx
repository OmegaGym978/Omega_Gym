import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { FINGERPRINT_ENABLED } from '@/lib/features'
import { AuthInit } from '@/components/auth/AuthProvider'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { TrainerLayout } from '@/components/layout/TrainerLayout'
import { MemberLayout } from '@/components/layout/MemberLayout'
import { AuthLayout } from '@/components/layout/AuthLayout'

import LoginPage from '@/pages/auth/Login'
import RegisterPage from '@/pages/auth/Register'
import ForgotPasswordPage from '@/pages/auth/ForgotPassword'
import ResetPasswordPage from '@/pages/auth/ResetPassword'
import AuthCallbackPage from '@/pages/auth/AuthCallback'
import DashboardPage from '@/pages/dashboard/Dashboard'
import MembersPage from '@/pages/dashboard/Members'
import MemberDetailPage from '@/pages/dashboard/MemberDetail'
import MembershipsPage from '@/pages/dashboard/Memberships'
import MembershipTypesPage from '@/pages/admin/MembershipTypes'
import PaymentsPage from '@/pages/dashboard/Payments'
import TrainingPlansPage from '@/pages/dashboard/TrainingPlans'
import MyPlanPage from '@/pages/member/MyPlan'
import MyRoutinesPage from '@/pages/member/MyRoutines'
import MyMembershipPage from '@/pages/member/MyMembership'
import MyProfilePage from '@/pages/member/MyProfile'
import MyExercisesPage from '@/pages/member/MyExercises'
import ExerciseDetailPage from '@/pages/member/ExerciseDetail'
import LandingPage from '@/pages/landing/Landing'
import { PwaUpdateBanner } from '@/components/layout/PwaUpdateBanner'

/**
 * Pantallas de huella/check-in: no liberadas. En producción no se importan,
 * así que su código no viaja en el bundle y las rutas redirigen (ver
 * `unreleasedElement`). Flag en `src/lib/features.ts`.
 */
const FingerprintPage = FINGERPRINT_ENABLED
  ? lazy(() => import('@/pages/dashboard/Fingerprint'))
  : null
const CheckInPage = FINGERPRINT_ENABLED
  ? lazy(() => import('@/pages/kiosk/CheckIn'))
  : null
const MyCheckinsPage = FINGERPRINT_ENABLED
  ? lazy(() => import('@/pages/member/MyCheckins'))
  : null

/** Elemento de una pantalla no liberada: existe en dev, redirige en producción. */
function unreleasedElement(Page: LazyExoticComponent<ComponentType> | null, fallback: string) {
  return Page ? <Page /> : <Navigate to={fallback} replace />
}

function AppLayout() {
  const user = useAuthStore((s) => s.user)
  if (user?.role === 'trainer') return <TrainerLayout />
  return <AdminLayout />
}

/** Landing pública: visible también con sesión iniciada. */
function HomeRoute() {
  return <LandingPage />
}

export default function App() {
  return (
    <AuthInit>
      <Suspense fallback={null}>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
          </Route>

          <Route path="/check-in" element={unreleasedElement(CheckInPage, '/')} />

          <Route path="/auth/callback" element={<AuthCallbackPage />} />

          {/* Shared routes — admin + trainer */}
          <Route element={<ProtectedRoute roles={['admin', 'trainer']}><AppLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/members" element={<MembersPage />} />
            <Route path="/memberships" element={<MembershipsPage />} />
            <Route path="/training-plans" element={<TrainingPlansPage />} />
          </Route>

          {/* Admin-only routes */}
          <Route element={<ProtectedRoute roles={['admin']}><AdminLayout /></ProtectedRoute>}>
            <Route path="/payments" element={<PaymentsPage />} />
            <Route path="/members/:id" element={<MemberDetailPage />} />
            <Route path="/membership-types" element={<MembershipTypesPage />} />
            <Route path="/fingerprint" element={unreleasedElement(FingerprintPage, '/dashboard')} />
          </Route>

          <Route element={<ProtectedRoute roles={['member', 'admin', 'trainer']}><MemberLayout /></ProtectedRoute>}>
            <Route path="/my-plan" element={<MyPlanPage />} />
            <Route path="/my-routines" element={<MyRoutinesPage />} />
            <Route path="/my-membership" element={<MyMembershipPage />} />
            <Route path="/my-payments" element={<Navigate to="/my-membership?tab=pagos" replace />} />
            <Route path="/my-checkins" element={unreleasedElement(MyCheckinsPage, '/my-profile')} />
            <Route path="/my-profile" element={<MyProfilePage />} />
            <Route path="/my-profile/exercises" element={<MyExercisesPage />} />
            <Route path="/my-profile/exercises/:exerciseId" element={<ExerciseDetailPage />} />
          </Route>

          <Route path="/" element={<HomeRoute />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <PwaUpdateBanner />
    </AuthInit>
  )
}
