'use client';

import Navbar from '@/components/Navbar';
import { CreditCard, Plus } from 'lucide-react';

export default function AdminPlansPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-900">
            <Navbar activeTab="planes" />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center justify-between mb-8 animate-slide-in-up">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">
                            Gestionar Planes 💳
                        </h1>
                        <p className="text-gray-400">
                            Administra los planes de membresía
                        </p>
                    </div>
                    <button
                        className="flex items-center gap-2 px-4 py-3 rounded-lg gradient-primary text-white font-semibold hover:opacity-90 transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        Nuevo Plan
                    </button>
                </div>

                {/* Placeholder */}
                <div className="glass rounded-xl p-12 text-center">
                    <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">Gestión de planes</p>
                    <p className="text-gray-500 text-sm mt-2">
                        Funcionalidad en desarrollo
                    </p>
                </div>
            </main>
        </div>
    );
}
