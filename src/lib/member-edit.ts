import type { MemberListItem } from '@/services/members.service'

type RegistrationStatus = MemberListItem['registration_status']

/**
 * ¿El admin puede editar los datos personales del miembro?
 *
 * Solo mientras el perfil está `pending` (aún sin cuenta vinculada: el gimnasio
 * captura nombre, correo, teléfono y rol). Con cuenta (`claimed`/`registered`)
 * el miembro gestiona su propio perfil y el admin únicamente puede cambiar la
 * referencia interna.
 */
export function canAdminEditProfile(registrationStatus: RegistrationStatus | null | undefined): boolean {
  return (registrationStatus ?? 'registered') === 'pending'
}
