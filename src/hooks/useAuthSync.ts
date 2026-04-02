import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";
import { useUiStore } from "@/store/uiStore";

export const useAuthSync = () => {
    const { setUser } = useAuthStore();
    const { fetchProfile } = useUiStore();

    useEffect(() => {
        const checkInitialSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const user = session?.user ?? null;
            setUser(user);
            if (user) fetchProfile(user.id);
        }
        checkInitialSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            const user = session?.user ?? null;
            setUser(user);
            if (user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
                fetchProfile(user.id);
            }
        })

        return (
            subscription.unsubscribe()
        )
    }, [setUser, fetchProfile])
};