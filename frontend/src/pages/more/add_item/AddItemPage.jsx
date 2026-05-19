// 관리자 전용 아이템 추가 페이지
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../store/useThemeStore';
import { getAssetUrl } from '../../../utils/AssetHelper';
import { authFetch } from '../../../utils/AuthHelper';
import Header from '../../../components/common/Header';

const ITEM_TYPES = ['app_theme', 'diary_theme', 'sticker', 'emoji', 'ticket'];

// 메인 페이지: AddItemPage
export default function AddItemPage() {
    const navigate = useNavigate();
    const currentTheme = useTheme((state) => state.currentTheme);

    // 폼 데이터 상태 관리
    const [formData, setFormData] = useState({
        item_name: '',
        item_type: 'app_theme',
        item_price: '',
        item_info: '',
        item_image_url: '',
    });

    // 로딩 및 결과 메시지 상태 관리
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', isError: false });

    // 입력값 변경 핸들러
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'item_price' ? (value === '' ? '' : Number(value)) : value,
        }));
    };

    // 아이템 추가 제출 핸들러
    const handleSubmit = async () => {
        // 필수값 확인
        if (!formData.item_name || !formData.item_type || !formData.item_info) {
            setMessage({ text: '필수값을 모두 입력해주세요.', isError: true });
            return;
        }

        setLoading(true);
        setMessage({ text: '', isError: false });

        try {
            // 빈 문자열이면 0으로 처리
            const submitData = {
                ...formData,
                item_price: formData.item_price === '' ? 0 : Number(formData.item_price),
            };

            const result = await authFetch(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/admin/items/`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(submitData),  // formData → submitData
                }
            );

            setMessage({ text: `아이템이 추가되었습니다. (ID: ${result.item_id})`, isError: false });

            // 폼 초기화
            setFormData({
                item_name: '',
                item_type: 'app_theme',
                item_price: '',
                item_info: '',
                item_image_url: '',
            });
        } catch (error) {
            setMessage({ text: error.message || '아이템 추가에 실패했습니다.', isError: true });
        } finally {
            setLoading(false);
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
            <Header title="아이템 추가" backPath="/more" />

            {/* 폼 영역 */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-3 flex flex-col gap-4">

                {/* 아이템 이름 */}
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-bold" style={{ color: '#333' }}>아이템 이름 *</label>
                    <input
                        type="text"
                        name="item_name"
                        value={formData.item_name}
                        onChange={handleChange}
                        placeholder="아이템 이름 입력"
                        className="px-3 py-2 border-4 text-sm outline-none bg-white"
                        style={{ borderColor: '#333' }}
                    />
                </div>

                {/* 아이템 타입 */}
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-bold" style={{ color: '#333' }}>아이템 타입 *</label>
                    <select
                        name="item_type"
                        value={formData.item_type}
                        onChange={handleChange}
                        className="px-3 py-2 border-4 text-sm outline-none bg-white"
                        style={{ borderColor: '#333' }}
                    >
                        {ITEM_TYPES.map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                </div>

                {/* 아이템 가격 */}
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-bold" style={{ color: '#333' }}>아이템 가격 (미입력 시 0)</label>
                    <input
                        type="number"
                        name="item_price"
                        value={formData.item_price}
                        onChange={handleChange}
                        min="0"
                        placeholder="아이템 가격 입력"
                        className="px-3 py-2 border-4 text-sm outline-none bg-white"
                        style={{ borderColor: '#333' }}
                    />
                </div>

                {/* 아이템 설명 */}
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-bold" style={{ color: '#333' }}>아이템 설명 *</label>
                    <textarea
                        name="item_info"
                        value={formData.item_info}
                        onChange={handleChange}
                        placeholder="아이템 설명 입력"
                        rows={3}
                        className="px-3 py-2 border-4 text-sm outline-none bg-white resize-none"
                        style={{ borderColor: '#333' }}
                    />
                </div>

                {/* 아이템 이미지 URL */}
                {/* 현재 이미지는 필수가 아니기 때문에 선택이라는 문구를 적어두었습니다. */}
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-bold" style={{ color: '#333' }}>아이템 이미지 URL (선택)</label>
                    <input
                        type="text"
                        name="item_image_url"
                        value={formData.item_image_url}
                        onChange={handleChange}
                        placeholder="이미지 URL 입력"
                        className="px-3 py-2 border-4 text-sm outline-none bg-white"
                        style={{ borderColor: '#333' }}
                    />
                </div>

                {/* 결과 메시지 */}
                {message.text && (
                    <p className={`text-sm font-bold ${message.isError ? 'text-red-500' : 'text-green-500'}`}>
                        {message.text}
                    </p>
                )}

                {/* 아이템 추가 버튼 */}
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full py-2 text-sm font-bold border-4 active:translate-y-0.5 transition-transform disabled:opacity-50"
                    style={{ borderColor: '#333', backgroundColor: '#fff' }}
                >
                    {loading ? '추가 중...' : '아이템 추가'}
                </button>
            </div>
        </div>
    );
}