// AdminUserList.jsx
// 관리자 전용 유저 관리 페이지
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../store/useThemeStore';
import { getAssetUrl } from '../../../utils/AssetHelper';
import { authFetch } from '../../../utils/AuthHelper';
import Header from '../../../components/common/Header';


// ─────────────────────────────────────────────
// 유저 카드 컴포넌트
// ─────────────────────────────────────────────
function UserCard({ user, onDeleteClick, currentTheme }) {
    return (
        <div
            className="flex items-center justify-between w-full px-4 py-3 mb-2 border-4 bg-white"
            style={{ borderColor: '#333' }}
        >
            {/* 유저 정보 영역 */}
            <div className="flex flex-col gap-1">
                {/* 유저명 */}
                <span className="font-bold text-sm" style={{ color: '#333' }}>
                    {user.user_name || '이름 없음'}
                </span>
                {/* 성별 / 나이 */}
                <span className="text-xs text-gray-500">
                    {user.gender || '-'} · {user.age ? `${user.age}세` : '-'}
                </span>
                {/* 코인 */}
                <span className="text-xs text-gray-400">
                    💖 {user.coin ?? 0}
                </span>
            </div>

            {/* 삭제 버튼 영역 */}
            <div className="flex flex-col items-end gap-2">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDeleteClick(user); // prop 이름과 일치
                    }}
                    className="px-3 py-1 text-xs font-bold border-4 active:translate-y-0.5 transition-transform"
                    style={{ borderColor: '#333', backgroundColor: '#ff4444', color: '#fff' }}
                >
                    삭제
                </button>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// 유저 삭제 확인 다이얼로그
// ─────────────────────────────────────────────
function DeleteDialog({ targetUser, onConfirm, onCancel }) {
    if (!targetUser) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
            <div
                className="w-[85%] max-w-sm p-5 border-4 bg-white flex flex-col gap-4"
                style={{ borderColor: '#333' }}
            >
                {/* 제목 */}
                <h2 className="text-base font-bold" style={{ color: '#333' }}>
                    ⚠️ 유저 삭제
                </h2>

                {/* 경고 메시지 */}
                <p className="text-sm text-gray-600 leading-relaxed">
                    <span className="font-bold text-red-500">{targetUser.user_name}</span> 님의
                    계정과 모든 데이터(일기 등)가 <span className="font-bold">영구 삭제</span>됩니다.
                    <br />이 작업은 되돌릴 수 없습니다.
                </p>

                {/* 버튼 */}
                <div className="flex gap-2">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-2 text-sm font-bold border-4 active:translate-y-0.5 transition-transform"
                        style={{ borderColor: '#333', backgroundColor: '#eee' }}
                    >
                        취소
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 py-2 text-sm font-bold border-4 active:translate-y-0.5 transition-transform"
                        style={{ borderColor: '#333', backgroundColor: '#ff4444', color: '#fff' }}
                    >
                        삭제 확인
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// 메인 페이지: AdminUserList
// ─────────────────────────────────────────────
export default function AdminUserList() {
    const navigate = useNavigate();
    const currentTheme = useTheme((state) => state.currentTheme);

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [pageNumber, setPageNumber] = useState(1);
    const [hasMore, setHasMore] = useState(true); // 
    const [deleteTarget, setDeleteTarget] = useState(null);

    const fetchUsers = useCallback(async (page = 1, keyword = '', reset = false) => {
        try {
            setLoading(true);

            const params = new URLSearchParams({
                page_number: page,
                page_size: 20,
                ...(keyword && { search_keyword: keyword }),
            });

            // authFetch로 교체 (세션 체크 불필요 - authFetch가 401 시 자동 로그인 이동)
            const result = await authFetch(
                `${import.meta.env.VITE_BACKEND_URL}api/v1/admin/users/?${params}`
            );
            const newUsers = result.data.users || [];

            // reset이면 목록 교체 (검색 시), 아니면 기존에 추가 (스크롤 시)
            setUsers((prev) => reset ? newUsers : [...prev, ...newUsers]);

            // 받아온 데이터가 page_size(20)보다 적으면 마지막 페이지
            setHasMore(newUsers.length === 20);
        } catch (error) {
            console.error('Fetch Error:', error);
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    // 마운트 시 첫 로드
    useEffect(() => {
        fetchUsers(1, '', true);
    }, []);

    // 스크롤 감지 - 바닥 근처 도달 시 다음 페이지 로드
    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

        if (isNearBottom && !loading && hasMore) {
            const nextPage = pageNumber + 1;
            setPageNumber(nextPage);
            fetchUsers(nextPage, searchKeyword);
        }
    };

    // 검색 시 1페이지부터 다시 로드
    const handleSearch = () => {
        setPageNumber(1);
        fetchUsers(1, searchKeyword, true); // reset: true
    };

    const handleDeleteConfirm = async () => {
        try {
            await authFetch(
                `${import.meta.env.VITE_BACKEND_URL}api/v1/admin/users/${deleteTarget.user_id}/`,
                { method: 'DELETE' }
            );
            setDeleteTarget(null);
            // 삭제 후 목록 처음부터 다시 로드
            setPageNumber(1);
            fetchUsers(1, searchKeyword, true);
        } catch (error) {
            console.error('Delete Error:', error);
        }
    };

    return (
        <div
            className="w-full h-full overflow-hidden flex flex-col pt-[16%]"
            style={{
                backgroundImage: `url(${getAssetUrl(currentTheme, 'backgrounds', 'menu_background_x3')})`,
                backgroundSize: '100% 100%',
            }}
        >
            <Header title="유저 관리" backPath="/more" />

            {/* 검색바 */}
            <div className="flex gap-2 px-4 py-2">
                <input
                    type="text"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="유저명 검색"
                    className="flex-1 px-3 py-2 border-4 text-sm outline-none bg-white"
                    style={{ borderColor: '#333' }}
                />
                <button
                    onClick={handleSearch}
                    className="px-4 py-2 text-sm font-bold border-4 active:translate-y-0.5 transition-transform"
                    style={{ borderColor: '#333', backgroundColor: '#fff' }}
                >
                    검색
                </button>
            </div>

            {/* onScroll 핸들러 */}
            <div
                className="flex-1 overflow-y-auto no-scrollbar flex justify-center"
                onScroll={handleScroll}
            >
                {loading && users.length === 0 ? (
                    <div className="flex justify-center mt-[50%] text-3xl text-gray-600 font-bold animate-bounce">
                        불러오는 중...
                    </div>
                ) : users.length === 0 ? (
                    <div className="flex justify-center mt-[50%] text-sm text-gray-500 font-bold">
                        유저가 없습니다.
                    </div>
                ) : (
                    <div className="flex flex-col w-[95%]">
                        {users.map((user) => (
                            <UserCard
                                key={user.user_id}
                                user={user}
                                onDeleteClick={setDeleteTarget}
                                currentTheme={currentTheme}
                            />
                        ))}
                        {/* ✅ 추가 로딩 중 표시 */}
                        {loading && (
                            <div className="flex justify-center py-4 text-sm text-gray-500 font-bold animate-bounce">
                                불러오는 중...
                            </div>
                        )}
                        {/* ✅ 마지막 페이지 도달 시 표시 */}
                        {!hasMore && (
                            <div className="flex justify-center py-4 text-xs text-gray-400">
                                모든 유저를 불러왔습니다.
                            </div>
                        )}
                    </div>
                )}
            </div>

            <DeleteDialog
                targetUser={deleteTarget}
                onConfirm={handleDeleteConfirm}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
}