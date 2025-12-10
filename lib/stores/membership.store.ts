import { create } from 'zustand';
import { Membership } from '@/types';

interface MembershipState {
    memberships: Membership[];
    isLoading: boolean;
    error: string | null;

    // Actions
    setMemberships: (memberships: Membership[]) => void;
    updateMembership: (id: number, data: Partial<Membership>) => void;
    decrementCredits: (disciplineId: number) => void;
    fetchMemberships: () => Promise<void>;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    clear: () => void;
}

export const useMembershipStore = create<MembershipState>((set) => ({
    memberships: [],
    isLoading: false,
    error: null,

    setMemberships: (memberships: Membership[]) => {
        set({ memberships, isLoading: false, error: null });
    },

    updateMembership: (id: number, data: Partial<Membership>) => {
        set((state) => ({
            memberships: state.memberships.map((m) =>
                m.id === id ? { ...m, ...data } : m
            ),
        }));
    },

    decrementCredits: (disciplineId: number) => {
        set((state) => ({
            memberships: state.memberships.map((m) =>
                m.discipline_id === disciplineId && !m.is_unlimited
                    ? { ...m, remaining_credits: Math.max(0, m.remaining_credits - 1) }
                    : m
            ),
        }));
    },

    fetchMemberships: async () => {
        set({ isLoading: true, error: null });
        try {
            const { useAuthStore } = await import('./auth.store');
            const token = useAuthStore.getState().token;

            if (!token) {
                set({ isLoading: false, error: 'No hay token de autenticación' });
                return;
            }

            const response = await fetch('/api/my-memberships', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Error al cargar membresías');
            }

            // Verificar si hay contenido antes de parsear JSON
            const text = await response.text();
            const data = text ? JSON.parse(text) : { memberships: [] };

            set({ memberships: data.memberships || [], isLoading: false, error: null });
        } catch (error) {
            console.error('Error fetching memberships:', error);
            set({ error: 'Error al cargar membresías', isLoading: false, memberships: [] });
        }
    },

    setLoading: (loading: boolean) => {
        set({ isLoading: loading });
    },

    setError: (error: string | null) => {
        set({ error, isLoading: false });
    },

    clear: () => {
        set({ memberships: [], isLoading: false, error: null });
    },
}));

// Selectores
export const useActiveMemberships = () =>
    useMembershipStore((state) =>
        state.memberships.filter((m) => m.status === 'ACTIVE')
    );

export const useMembershipByDiscipline = (disciplineId: number) =>
    useMembershipStore((state) =>
        state.memberships.find((m) => m.discipline_id === disciplineId && m.status === 'ACTIVE')
    );

export const hasCreditsForDiscipline = (disciplineId: number) => {
    const membership = useMembershipStore.getState().memberships.find(
        (m) => m.discipline_id === disciplineId && m.status === 'ACTIVE'
    );

    if (!membership) return false;
    return membership.is_unlimited || membership.remaining_credits > 0;
};
