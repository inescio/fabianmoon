'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, User, Mail, Phone, Scissors, CheckCircle, XCircle, Loader2, LogOut } from 'lucide-react';
import { Button } from '@/components/Button';
import { AppointmentWithDetails, Professional } from '@/lib/supabase';
import { formatDate, getDayName } from '@/lib/booking-utils';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function ManagementDashboard() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  // Filtros
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  useEffect(() => {
    loadData();
  }, [selectedDate, selectedProfessionalId, selectedStatus]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedDate) params.append('date', selectedDate);
      if (selectedProfessionalId) params.append('professionalId', selectedProfessionalId);
      if (selectedStatus) params.append('status', selectedStatus);

      const [appointmentsRes, professionalsRes] = await Promise.all([
        fetch(`/api/appointments?${params}`).then(r => r.json()),
        fetch('/api/professionals').then(r => r.json()),
      ]);

      setAppointments(Array.isArray(appointmentsRes) ? appointmentsRes : []);
      setProfessionals(Array.isArray(professionalsRes) ? professionalsRes : []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTakeAppointment = async (appointmentId: string, professionalId: string) => {
    setUpdating(appointmentId);
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ professional_id: professionalId }),
      });

      if (response.ok) {
        await loadData();
      } else {
        const data = await response.json();
        alert(data.error || 'Error al tomar el turno');
      }
    } catch (error) {
      console.error('Error taking appointment:', error);
      alert('Error inesperado');
    } finally {
      setUpdating(null);
    }
  };

  const handleUpdateStatus = async (appointmentId: string, newStatus: string) => {
    setUpdating(appointmentId);
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        await loadData();
      } else {
        const data = await response.json();
        alert(data.error || 'Error al actualizar el estado');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error inesperado');
    } finally {
      setUpdating(null);
    }
  };

  const handleCancel = async (appointmentId: string) => {
    if (!confirm('¿Estás seguro de cancelar este turno?')) return;

    setUpdating(appointmentId);
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadData();
      } else {
        const data = await response.json();
        alert(data.error || 'Error al cancelar el turno');
      }
    } catch (error) {
      console.error('Error canceling appointment:', error);
      alert('Error inesperado');
    } finally {
      setUpdating(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-400';
      case 'confirmed':
        return 'text-blue-400';
      case 'completed':
        return 'text-green-400';
      case 'cancelled':
        return 'text-red-400';
      default:
        return 'text-foreground/60';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'confirmed':
        return 'Confirmado';
      case 'completed':
        return 'Completado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  // Separar turnos sin profesional asignado
  const unassignedAppointments = appointments.filter(apt => !apt.professional_id);
  const assignedAppointments = appointments.filter(apt => apt.professional_id);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  const handleLogout = () => {
    localStorage.removeItem('management_access');
    router.push('/login');
  };

  return (
    <div className="space-y-8">
      {/* Botón de cerrar sesión */}
      <div className="flex justify-end">
        <Button
          onClick={handleLogout}
          variant="outline"
          className="flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Cerrar Sesión
        </Button>
      </div>

      {/* Filtros */}
      <div className="glass rounded-2xl p-6">
        <h2 className="text-xl font-bold mb-4">Filtros</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-base font-medium mb-2">Fecha</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label className="block text-base font-medium mb-2">Profesional</label>
            <select
              value={selectedProfessionalId}
              onChange={(e) => setSelectedProfessionalId(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">Todos</option>
              {professionals.map((prof) => (
                <option key={prof.id} value={prof.id}>
                  {prof.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-base font-medium mb-2">Estado</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">Todos</option>
              <option value="pending">Pendiente</option>
              <option value="confirmed">Confirmado</option>
              <option value="completed">Completado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>
        </div>
        {(selectedDate || selectedProfessionalId || selectedStatus) && (
          <button
            onClick={() => {
              setSelectedDate('');
              setSelectedProfessionalId('');
              setSelectedStatus('');
            }}
            className="mt-4 text-base text-accent hover:underline"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Turnos sin asignar */}
      {unassignedAppointments.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">
            Turnos sin Profesional Asignado ({unassignedAppointments.length})
          </h2>
          <div className="grid gap-4">
            {unassignedAppointments.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                professionals={professionals}
                updating={updating === appointment.id}
                onTake={handleTakeAppointment}
                onUpdateStatus={handleUpdateStatus}
                onCancel={handleCancel}
                getStatusColor={getStatusColor}
                getStatusLabel={getStatusLabel}
              />
            ))}
          </div>
        </div>
      )}

      {/* Turnos asignados */}
      <div>
        <h2 className="text-2xl font-display font-bold mb-4">
          Turnos Asignados ({assignedAppointments.length})
        </h2>
        {assignedAppointments.length === 0 ? (
          <p className="text-foreground/60 text-center py-12">
            No hay turnos asignados con los filtros seleccionados
          </p>
        ) : (
          <div className="grid gap-4">
            {assignedAppointments.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                professionals={professionals}
                updating={updating === appointment.id}
                onTake={handleTakeAppointment}
                onUpdateStatus={handleUpdateStatus}
                onCancel={handleCancel}
                getStatusColor={getStatusColor}
                getStatusLabel={getStatusLabel}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface AppointmentCardProps {
  appointment: AppointmentWithDetails;
  professionals: Professional[];
  updating: boolean;
  onTake: (appointmentId: string, professionalId: string) => void;
  onUpdateStatus: (appointmentId: string, newStatus: string) => void;
  onCancel: (appointmentId: string) => void;
  getStatusColor: (status: string) => string;
  getStatusLabel: (status: string) => string;
}

function AppointmentCard({
  appointment,
  professionals,
  updating,
  onTake,
  onUpdateStatus,
  onCancel,
  getStatusColor,
  getStatusLabel,
}: AppointmentCardProps) {
  const appointmentDate = new Date(appointment.appointment_date);
  const isUnassigned = !appointment.professional_id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'glass rounded-xl p-6',
        isUnassigned && 'border-2 border-accent/50'
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-4 flex-wrap">
            <span className={cn('text-base font-semibold', getStatusColor(appointment.status))}>
              {getStatusLabel(appointment.status)}
            </span>
            {isUnassigned && (
              <span className="text-sm bg-yellow-400/20 text-yellow-400 px-2 py-1 rounded">
                Sin asignar
              </span>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-3 text-base">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-accent" />
              <span>{formatDate(appointmentDate)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-accent" />
              <span>{appointment.appointment_time}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-accent" />
              <span>{appointment.client_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-accent" />
              <span>{appointment.client_phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-accent" />
              <span>{appointment.client_email}</span>
            </div>
            {appointment.professional && (
              <div className="flex items-center gap-2">
                <Scissors className="h-4 w-4 text-accent" />
                <span>{appointment.professional.name}</span>
              </div>
            )}
          </div>

          {appointment.services && appointment.services.length > 0 && (
            <div>
              <p className="text-sm text-foreground/60 mb-1">Servicios:</p>
              <div className="flex flex-wrap gap-2">
                {appointment.services.map((service) => (
                  <span
                    key={service.id}
                    className="text-xs bg-accent/20 text-accent px-2 py-1 rounded"
                  >
                    {service.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {appointment.client_notes && (
            <div>
              <p className="text-xs text-foreground/60 mb-1">Notas:</p>
              <p className="text-sm text-foreground/80">{appointment.client_notes}</p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:items-end">
          {isUnassigned && (
            <select
              onChange={(e) => {
                if (e.target.value) {
                  onTake(appointment.id, e.target.value);
                  e.target.value = '';
                }
              }}
              disabled={updating}
              className="px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">Tomar turno...</option>
              {professionals.map((prof) => (
                <option key={prof.id} value={prof.id}>
                  {prof.name}
                </option>
              ))}
            </select>
          )}

          {appointment.status !== 'cancelled' && (
            <select
              value={appointment.status}
              onChange={(e) => onUpdateStatus(appointment.id, e.target.value)}
              disabled={updating}
              className="px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="pending">Pendiente</option>
              <option value="confirmed">Confirmado</option>
              <option value="completed">Completado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          )}

          {updating && (
            <Loader2 className="h-4 w-4 animate-spin text-accent" />
          )}
        </div>
      </div>
    </motion.div>
  );
}

