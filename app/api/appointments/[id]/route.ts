import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Supabase no está configurado. Por favor configura las variables de entorno.' },
        { status: 503 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { professional_id, status } = body;

    // Validar que el turno existe
    const { data: existingAppointment, error: fetchError } = await supabaseAdmin
      .from('appointments')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingAppointment) {
      return NextResponse.json(
        { error: 'Turno no encontrado' },
        { status: 404 }
      );
    }

    // Preparar los campos a actualizar
    const updates: any = {};

    if (professional_id !== undefined) {
      updates.professional_id = professional_id || null;
    }

    if (status !== undefined) {
      const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Estado inválido' },
          { status: 400 }
        );
      }
      updates.status = status;
    }

    // Actualizar el turno
    const { data: updatedAppointment, error: updateError } = await supabaseAdmin
      .from('appointments')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        professional:professionals(*),
        services:appointment_services(
          service:services(*)
        )
      `)
      .single();

    if (updateError) {
      console.error('Error updating appointment:', updateError);
      return NextResponse.json(
        { error: 'Error al actualizar el turno' },
        { status: 500 }
      );
    }

    // Transformar los datos para incluir servicios en formato más amigable
    const appointment = {
      ...updatedAppointment,
      services: updatedAppointment.services?.map((as: any) => as.service) || [],
    };

    return NextResponse.json({
      success: true,
      appointment,
      message: 'Turno actualizado exitosamente',
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Error inesperado al actualizar el turno' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Supabase no está configurado. Por favor configura las variables de entorno.' },
        { status: 503 }
      );
    }

    const { id } = await params;

    // Verificar que el turno existe
    const { data: existingAppointment, error: fetchError } = await supabaseAdmin
      .from('appointments')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingAppointment) {
      return NextResponse.json(
        { error: 'Turno no encontrado' },
        { status: 404 }
      );
    }

    // Un turno con seña cobrada no se borra: hay plata de por medio y el
    // historial de pagos tiene que seguir apuntando a algo. Lo marcamos
    // cancelado, que libera el horario igual (la búsqueda de conflictos
    // solo mira 'pending' y 'confirmed').
    const hasPayment =
      existingAppointment.payment_status === 'approved' || !!existingAppointment.payment_id;

    if (hasPayment) {
      const { error: cancelError } = await supabaseAdmin
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', id);

      if (cancelError) {
        console.error('Error cancelling paid appointment:', cancelError);
        return NextResponse.json(
          { error: 'Error al cancelar el turno' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        refundRequired: existingAppointment.payment_status === 'approved',
        message:
          existingAppointment.payment_status === 'approved'
            ? 'Turno cancelado. La seña ya cobrada hay que devolverla desde el panel de MercadoPago.'
            : 'Turno cancelado exitosamente',
      });
    }

    // Eliminar el turno (las relaciones en appointment_services se eliminarán automáticamente por CASCADE)
    const { error: deleteError } = await supabaseAdmin
      .from('appointments')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting appointment:', deleteError);
      return NextResponse.json(
        { error: 'Error al cancelar el turno' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Turno cancelado exitosamente',
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Error inesperado al cancelar el turno' },
      { status: 500 }
    );
  }
}

