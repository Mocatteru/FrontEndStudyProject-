import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

// [Rule 18] 재사용 가능한 프로필 타입 분리 (any 금지)
export type UserRole = "ADMIN USER" | "USER";

export interface UserProfile {
    id: string;
    userName: string; // [Rule 8] Naming Clarity: UI에서 사용하는 이름
    userEmail: string;
    userDepartment: string;
    userRole: UserRole;
    userAvatar: string;
}

// [Rule 4] 상태(State)와 액션(Action)을 명확히 구분하여 인터페이스 분리
interface UiState extends UserProfile {
    isSidebarOpen: boolean;
    isWatchListOpen: boolean;
    isProfileLoading: boolean; // [UX] 스켈레톤 UI를 위한 로딩 상태 추가
}

interface UiActions {
    toggleSidebar: () => void;
    toggleWatchList: () => void;
    // [Rule 20] 개별 setter 5개 → 단일 프로필 업데이트 액션으로 통합
    setProfile: (profile: Partial<UserProfile>) => void;
    // [Rule 33] 조회와 저장 로직을 스토어 액션으로 캡슐화 (컴포넌트에서 supabase 직접 호출 제거)
    fetchProfile: (UID?: string) => Promise<UserProfile | null>;
    saveProfile: (profile: UserProfile, avatarFile: File | null) => Promise<void>;
}

const DEFAULT_PROFILE: UserProfile = {
    id: "",
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
            isProfileLoading: false,
            ...DEFAULT_PROFILE,

            toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
            toggleWatchList: () => set((state) => ({ isWatchListOpen: !state.isWatchListOpen })),
            setProfile: (profile) => set(profile),

            fetchProfile: async (UID?: string) => {
                set({ isProfileLoading: true });

                // 1. UID가 인자로 넘어오지 않았다면 현재 세션에서 추출
                let targetUID = UID;
                const { data: { user: authUser } } = await supabase.auth.getUser();

                if (!targetUID && authUser) {
                    targetUID = authUser.id;
                }

                // [Rule 30] 방어 로직: UID가 유효하지 않으면 조회를 중단합니다.
                if (!targetUID || targetUID === "undefined") {
                    set({ isProfileLoading: false });
                    return null;
                }

                try {
                    // 2. DB에서 프로필 정보 가져오기
                    const { data: profileData } = await supabase
                        .from("profiles")
                        .select("*")
                        .eq("id", targetUID)
                        .maybeSingle();

                    // 3. [Rule 30] DB 데이터가 없으면 세션의 메타데이터를 우선적으로 활용합니다.
                    const mappedProfile: UserProfile = {
                        id: targetUID,
                        userName: profileData?.display_name || authUser?.user_metadata?.display_name || "사용자",
                        userEmail: authUser?.email || profileData?.user_email || "",
                        userDepartment: profileData?.user_department || "미지정",
                        userRole: profileData?.user_role || "USER",
                        userAvatar: profileData?.avatar_url || authUser?.user_metadata?.avatar_url || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSf4lZX2ZWovlNMo9gsrjDnlFs1GocmrsriYw&s",
                    };

                    set({ ...mappedProfile, isProfileLoading: false });
                    return mappedProfile;
                } catch (error) {
                    console.error("fetchProfile Error:", error);
                    set({ isProfileLoading: false });
                    return null;
                }
            },

            saveProfile: async (profile: UserProfile, avatarFile: File | null) => {
                // 1. [Vibe Check] 세션에서 진짜 자신의 UID를 다시 한번 가져와서 RLS 위반 방지
                const { data: { user: currentUser } } = await supabase.auth.getUser();
                if (!currentUser) throw new Error("Authentication failed");
                const realUID = currentUser.id;

                let finalAvatarUrl = profile.userAvatar;

                // 2. 이미지 업로드 (이미지가 변경된 경우)
                if (avatarFile) {
                    const fileExt = avatarFile.name.split(".").pop();
                    const fileName = `${realUID}_${Date.now()}.${fileExt}`;
                    const { error: uploadError } = await supabase.storage.from("avatars").upload(fileName, avatarFile);
                    if (uploadError) {
                        toast.error("이미지 업로드 실패");
                        throw uploadError;
                    }
                    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(fileName);
                    finalAvatarUrl = publicUrl;
                }

                // 3. [Rule 18] profiles 테이블 업데이트 (검증된 realUID 사용)
                const { error: profileError } = await supabase
                    .from("profiles")
                    .upsert({
                        id: realUID,
                        display_name: profile.userName,
                        user_email: profile.userEmail,
                        user_department: profile.userDepartment,
                        user_role: profile.userRole,
                        avatar_url: finalAvatarUrl,
                    });

                if (profileError) {
                    console.error("Profile DB Sync Error:", profileError);
                    toast.error("프로필 정보 동기화 실패 (RLS 확인 필요)");
                    throw profileError;
                }

                // 4. [핵심] 수파베이스 Auth 메타데이터에도 동일한 정보 업데이트 (헤더 등 실시간 사용)
                await supabase.auth.updateUser({
                    data: {
                        display_name: profile.userName,
                        avatar_url: finalAvatarUrl
                    }
                });

                set({ ...profile, id: realUID, userAvatar: finalAvatarUrl });
                toast.success("프로필 정보가 안전하게 저장되었습니다.");
            }
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