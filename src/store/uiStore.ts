import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "@/lib/supabase";

// [Rule 18] 재사용 가능한 프로필 타입 분리 (any 금지)
export type UserRole = "ADMIN USER" | "USER";

export interface UserProfile {
    userName: string;
    userEmail: string;
    userDepartment: string;
    userRole: UserRole;
    userAvatar: string;
}

// [Rule 4] 상태(State)와 액션(Action)을 명확히 구분하여 인터페이스 분리
interface UiState extends UserProfile {
    isSidebarOpen: boolean;
    isWatchListOpen: boolean;
}

interface UiActions {
    toggleSidebar: () => void;
    toggleWatchList: () => void;
    // [Rule 20] 개별 setter 5개 → 단일 프로필 업데이트 액션으로 통합
    setProfile: (profile: Partial<UserProfile>) => void;
    // [Rule 33] 조회와 저장 로직을 스토어 액션으로 캡슐화 (컴포넌트에서 supabase 직접 호출 제거)
    fetchProfile: () => Promise<UserProfile | null>;
    saveProfile: (profile: UserProfile, avatarFile: File | null) => Promise<void>;
}

const DEFAULT_PROFILE: UserProfile = {
    userName: "게스트",
    userEmail: "",
    userDepartment: "부서 없음",
    userRole: "USER",
    userAvatar: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSf4lZX2ZWovlNMo9gsrjDnlFs1GocmrsriYw&s",
};

export const useUiStore = create<UiState & UiActions>()(
    persist(
        (set) => ({
            isSidebarOpen: true,
            isWatchListOpen: false,
            ...DEFAULT_PROFILE,

            toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
            toggleWatchList: () => set((state) => ({ isWatchListOpen: !state.isWatchListOpen })),
            setProfile: (profile) => set(profile),

            fetchProfile: async () => {
                const { data, error } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("id", "00000000-0000-0000-0000-000000000000")
                    .single();

                if (error || !data) return null;

                const profile: UserProfile = {
                    userName: data.user_name,
                    userEmail: data.user_email,
                    userDepartment: data.user_department,
                    userRole: data.user_role,
                    userAvatar: data.user_avatar,
                };
                set(profile);
                return profile;
            },

            saveProfile: async (profile, avatarFile) => {
                let finalAvatarUrl = profile.userAvatar;

                // [Rule 20] 이미지 업로드 로직 캡슐화
                if (avatarFile) {
                    const fileExt = avatarFile.name.split(".").pop();
                    const fileName = `profile_${Date.now()}.${fileExt}`;

                    const { error: uploadError } = await supabase.storage
                        .from("avatars")
                        .upload(fileName, avatarFile);

                    if (uploadError) throw uploadError;

                    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(fileName);
                    finalAvatarUrl = urlData.publicUrl;
                }

                const { error: dbError } = await supabase.from("profiles").upsert({
                    id: "00000000-0000-0000-0000-000000000000",
                    user_name: profile.userName,
                    user_email: profile.userEmail,
                    user_department: profile.userDepartment,
                    user_role: profile.userRole,
                    user_avatar: finalAvatarUrl,
                });

                if (dbError) throw dbError;

                // DB 성공 후 스토어 갱신 (진짜 URL로)
                set({ ...profile, userAvatar: finalAvatarUrl });
            },
        }),
        {
            name: "ui-storage",
            partialize: (state) => ({
                isSidebarOpen: state.isSidebarOpen,
                isWatchListOpen: state.isWatchListOpen,
                ...DEFAULT_PROFILE, // 프로필은 항상 서버에서 최신값을 가져오므로 기본값만 persist
            }),
        }
    )
);