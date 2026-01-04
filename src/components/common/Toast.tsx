'use client'

import { useErrorStore } from "@/store/errorStore"

export default function Toast() {
    const { isVisible, message } = useErrorStore();

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-10 right-10 z-50 animate-bounce">
            <div className="rounded-lg bg-red-500 px-6 py-3 text-white shadow-2xl shadow-red-500/20">
                <div className="flex items-center gap-2">
                    <span className="font-bold">⚠️ Error:</span>
                    <span>{message}</span>
                </div>
            </div>
        </div>
    )
}