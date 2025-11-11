// components/app/ServiceArea.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import AssRegionMultiSelect from '../ui/AssRegionMultiSelect';

// ---- 유틸: "서울>강남구" 포맷 ----
const joinKey = (sido: string, sigungu: string) => `${sido}>${sigungu}`;

// "서울>강남구" → 분해
const splitKey = (key: string) => {
  const i = key.indexOf('>');
  if (i < 0) return { sido: key, gugun: '' };
  return { sido: key.slice(0, i), gugun: key.slice(i + 1) };
};

type CompanyItem = {
  id: number;
  name: string;
  ceo: string;
  address: string;
  tel: string;
  lat?: number;
  lng?: number;
  homepage?: string;
  regions: { sido: string; gugun: string }[];
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
};

// ---- 더미데이터 ----
const DUMMY: CompanyItem[] = [
  {
    id: 1,
    name: '한국클린쿱 부산지사',
    ceo: '김남관',
    address: '부산 해운대구 센텀중앙로 90',
    tel: '051-555-1234',
    lat: 35.1698,
    lng: 129.133,
    regions: [
      { sido: '부산', gugun: '해운대구' },
      { sido: '부산', gugun: '수영구' },
      { sido: '부산', gugun: '남구' },
    ],
    status: 'APPROVED',
  },
  {
    id: 2,
    name: '제로브이 서울센터',
    ceo: '이서준',
    address: '서울 강남구 테헤란로 501',
    tel: '02-1234-5678',
    lat: 37.5074,
    lng: 127.055,
    regions: [
      { sido: '서울', gugun: '강남구' },
      { sido: '서울', gugun: '서초구' },
      { sido: '서울', gugun: '송파구' },
    ],
    status: 'APPROVED',
  },
  {
    id: 3,
    name: '경기 남부 클린케어',
    ceo: '박지민',
    address: '경기 수원시 팔달구 매산로1가',
    tel: '031-222-3333',
    lat: 37.2665,
    lng: 127.0005,
    regions: [
      { sido: '경기', gugun: '수원시' },
      { sido: '경기', gugun: '용인시' },
      { sido: '경기', gugun: '화성시' },
    ],
    status: 'APPROVED',
  },
  {
    id: 4,
    name: '대구 시니어케어',
    ceo: '최하늘',
    address: '대구 수성구 달구벌대로',
    tel: '053-987-6543',
    lat: 35.8587,
    lng: 128.6309,
    regions: [
      { sido: '대구', gugun: '수성구' },
      { sido: '대구', gugun: '중구' },
    ],
    status: 'APPROVED',
  },
  {
    id: 5,
    name: '인천 클린파트너스',
    ceo: '한지우',
    address: '인천 남동구 인주대로',
    tel: '032-456-7890',
    lat: 37.4475,
    lng: 126.7318,
    regions: [
      { sido: '인천', gugun: '남동구' },
      { sido: '인천', gugun: '미추홀구' },
    ],
    status: 'APPROVED',
  },
];

// ===========================
// ✅ Kakao SDK 로더 & Map 컴포넌트
// ===========================
declare global {
  interface Window {
    kakao?: any;
  }
}
const KAKAO_APP_KEY = process.env.NEXT_PUBLIC_KAKAO_APP_KEY;

// SDK를 1회만 로드
let kakaoLoadingPromise: Promise<void> | null = null;
function ensureKakao(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.kakao?.maps) return Promise.resolve();
  if (kakaoLoadingPromise) return kakaoLoadingPromise;

  kakaoLoadingPromise = new Promise<void>((resolve, reject) => {
    if (!KAKAO_APP_KEY) {
      console.warn('NEXT_PUBLIC_KAKAO_MAP_KEY 가 설정되어 있지 않습니다.');
    }
    const existing = document.getElementById('kakao-map-sdk') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => window.kakao.maps.load(() => resolve()));
      existing.addEventListener('error', (e) => reject(e));
      return;
    }
    const script = document.createElement('script');
    script.id = 'kakao-map-sdk';
    script.async = true;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_APP_KEY}&autoload=false`;
    console.log(script.src);
    script.addEventListener('load', () => {
      try {
        window.kakao.maps.load(() => resolve());
      } catch (e) {
        reject(e);
      }
    });
    script.addEventListener('error', (e) => reject(e));
    document.head.appendChild(script);
  });

  return kakaoLoadingPromise;
}

function KakaoMap({
  lat,
  lng,
  title,
  level = 3,
  height = 360,
}: {
  lat: number;
  lng: number;
  title?: string;
  level?: number;   // 1(가까움) ~ 14(멀어짐)
  height?: number;
}) {
  const mapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let map: any;
    let control: any;
    let marker: any;

    (async () => {
      await ensureKakao();
      if (!mapRef.current || !window.kakao?.maps) return;

      const { maps } = window.kakao;
      const center = new maps.LatLng(lat, lng);

      map = new maps.Map(mapRef.current, { center, level });
      // 줌 컨트롤
      control = new maps.ZoomControl();
      map.addControl(control, maps.ControlPosition.RIGHT);

      // 마커
      marker = new maps.Marker({ position: center, map, title });

      // 인포윈도우
      if (title) {
        const iw = new maps.InfoWindow({ content: `<div style="padding:6px 8px;">${title}</div>` });
        iw.open(map, marker);
      }
    })();

    return () => {
      // Kakao Maps는 dispose가 따로 없어 DOM만 정리
      marker = null;
      control = null;
      map = null;
    };
  }, [lat, lng, title, level]);

  return <div ref={mapRef} style={{ width: '100%', height }} className="rounded-lg border" />;
}

// ===========================
// 공용 UI
// ===========================
const Chip = ({
  children,
  selected,
  onClick,
}: {
  children: React.ReactNode;
  selected?: boolean;
  onClick?: () => void;
}) => (
  <button
    onClick={onClick}
    className={`px-3 py-1 rounded-full text-sm border transition ${
      selected ? 'bg-black text-white border-black' : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100'
    }`}
  >
    {children}
  </button>
);

const Modal = ({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-lg">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold">{title || '지도'}</h3>
          <button onClick={onClose} className="rounded px-2 py-1 hover:bg-neutral-100">
            닫기
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
};

// 지역 요약 (ex: "부산 해운대구 외 2")
const summarizeRegions = (regions: CompanyItem['regions']) => {
  if (!regions || regions.length === 0) return '-';
  const [first, ...rest] = regions;
  if (rest.length === 0) return `${first.sido} ${first.gugun}`;
  return `${first.sido} ${first.gugun} 외 ${rest.length}`;
};

export default function ServiceArea() {
  // RegionMultiSelect 값: "시도>구군" 배열
  const [regions, setRegions] = useState<string[]>([]);
  // 검색
  const [searchBy, setSearchBy] = useState<'name' | 'ceo'>('name');
  const [keyword, setKeyword] = useState('');
  // 지도
  const [mapOpen, setMapOpen] = useState(false);
  const [targetId, setTargetId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();

    return DUMMY.filter((c) => {
      // 지역 필터
      const regionOK =
        regions.length === 0
          ? true
          : c.regions.some((r) => regions.includes(joinKey(r.sido, r.gugun)));

      // 텍스트 필터
      const textOK =
        q.length === 0
          ? true
          : searchBy === 'name'
          ? c.name.toLowerCase().includes(q)
          : (c.ceo || '').toLowerCase().includes(q);

      return regionOK && textOK;
    });
  }, [regions, searchBy, keyword]);

  const target = useMemo(
    () => DUMMY.find((d) => d.id === targetId) || null,
    [targetId]
  );

  const reset = () => {
    setRegions([]);
    setSearchBy('name');
    setKeyword('');
  };

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="mb-3 font-semibold">주요 서비스 지역</div>

      {/* --- 지역 멀티셀렉트 --- */}
      <AssRegionMultiSelect
        label="지역 선택"
        value={regions}
        onChange={setRegions}
        onApply={setRegions}
        className="mb-4"
      />

      {/* 선택칩 + 개별 삭제 */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          onClick={reset}
          className="rounded-md border border-neutral-300 px-3 py-1 text-sm hover:bg-neutral-50"
        >
          초기화
        </button>

        {regions.length > 0 && (
          <span className="text-sm text-neutral-600">{regions.length}개 지역 선택됨</span>
        )}

        {regions.map((k) => {
          const { sido, gugun } = splitKey(k);
          return (
            <span
              key={k}
              className="inline-flex items-center gap-1 rounded-full border border-neutral-300 bg-neutral-50 px-2 py-1 text-xs"
              title={k}
            >
              {sido} {gugun}
              <button
                type="button"
                onClick={() => setRegions((prev) => prev.filter((v) => v !== k))}
                className="ml-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full hover:bg-neutral-100"
                aria-label={`${sido} ${gugun} 삭제`}
                title="삭제"
              >
                ×
              </button>
            </span>
          );
        })}
      </div>

      {/* --- 검색 (돋보기 버튼 포함) --- */}
      <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-[140px_1fr]">
        <div className="inline-flex items-center gap-2">
          <select
            value={searchBy}
            onChange={(e) => setSearchBy(e.target.value as 'name' | 'ceo')}
            className="rounded-md border border-neutral-300 px-2 py-1 text-sm"
          >
            <option value="name">업체명</option>
            <option value="ceo">대표명</option>
          </select>
        </div>

        <div className="relative">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur();
            }}
            placeholder={searchBy === 'name' ? '업체명을 입력하세요' : '대표명을 입력하세요'}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-800"
          />
          <button
            type="button"
            aria-label="검색"
            title="검색"
            onClick={() => (document.activeElement as HTMLElement)?.blur()}
            className="absolute inset-y-0 right-0 my-1 mr-1 inline-flex items-center justify-center rounded-md border border-neutral-300 bg-white px-2 hover:bg-neutral-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="7" strokeWidth="2" />
              <line x1="16.65" y1="16.65" x2="21" y2="21" strokeWidth="2" />
            </svg>
          </button>
        </div>
      </div>

      {/* --- 결과 카운트 --- */}
      <div className="mt-6 text-sm text-neutral-600">
        총 <b>{filtered.length}</b>개 업체
      </div>

      {/* PC: 게시판(표)형 */}
      <div className="mt-3 hidden md:block">
        <div className="overflow-x-auto rounded-xl border border-neutral-200">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50 text-neutral-600">
              <tr className="[&>th]:px-4 [&>th]:py-3 [&>th]:text-left">
                <th style={{ width: '26%' }}>업체명</th>
                <th style={{ width: '12%' }}>대표명</th>
                <th style={{ width: '16%' }}>연락처</th>
                <th style={{ width: '26%' }}>주소</th>
                <th style={{ width: '14%' }}>주요 지역</th>
                <th style={{ width: '6%' }}>지도</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <div className="font-semibold">{c.name}</div>
                    <div className="mt-0.5 text-xs text-neutral-500">
                      {c.status === 'APPROVED' ? '승인됨' : c.status || '승인 대기'}
                    </div>
                  </td>
                  <td className="px-4 py-3">{c.ceo}</td>
                  <td className="px-4 py-3">{c.tel}</td>
                  <td className="px-4 py-3"><div className="line-clamp-2">{c.address}</div></td>
                  <td className="px-4 py-3"><div className="truncate">{summarizeRegions(c.regions)}</div></td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => { setTargetId(c.id); setMapOpen(true); }}
                      className="rounded-md border px-2 py-1 text-xs hover:bg-neutral-100"
                    >
                      보기
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-neutral-400">검색 조건에 맞는 결과가 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 모바일: 카드 리스트형 */}
      <div className="mt-3 grid grid-cols-1 gap-3 md:hidden">
        {filtered.map((c) => (
          <div key={c.id} className="rounded-xl border border-neutral-200 bg-white p-4">
            <div className="mb-1 text-xs text-neutral-500">{c.status === 'APPROVED' ? '승인됨' : c.status || '승인 대기'}</div>
            <div className="mb-1 text-base font-bold">{c.name}</div>
            <div className="mb-1 text-sm text-neutral-700">대표: {c.ceo}</div>
            <div className="mb-1 text-sm text-neutral-700">연락처: {c.tel}</div>
            <div className="text-sm text-neutral-700">
              <div className="mb-1">주소</div>
              <div className="line-clamp-2 text-neutral-600">{c.address}</div>
            </div>
            <div className="mt-2">
              <div className="mb-1 text-xs text-neutral-500">주요 서비스 지역</div>
              <div className="text-sm">{summarizeRegions(c.regions)}</div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => { setTargetId(c.id); setMapOpen(true); }}
                className="rounded-md bg-black px-3 py-2 text-xs text-white"
              >
                지도 보기
              </button>
              {c.homepage && (
                <a href={c.homepage} target="_blank" className="rounded-md border border-neutral-300 px-3 py-2 text-xs hover:bg-neutral-50">
                  홈페이지
                </a>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center text-neutral-400">검색 조건에 맞는 결과가 없습니다.</div>
        )}
      </div>

      {/* --- 지도 모달: ✅ 카카오지도 적용 --- */}
      <Modal
        open={mapOpen}
        onClose={() => setMapOpen(false)}
        title={target ? `${target.name} 위치` : '지도'}
      >
        {!target?.lat || !target?.lng ? (
          <div className="text-sm text-neutral-600">좌표 정보가 없습니다.</div>
        ) : (
          <div className="space-y-3">
            <div className="text-sm">
              주소: {target.address}
              <br />
              좌표: {target.lat}, {target.lng}
            </div>

            {/* 카카오 지도 */}
            <KakaoMap lat={target.lat} lng={target.lng} title={target.name} height={360} level={3} />

            {/* 카카오맵 링크 (지도보기/길찾기) */}
            <div className="flex items-center justify-end gap-3 text-sm">
              <a
                className="underline"
                href={`https://map.kakao.com/link/map/${encodeURIComponent(target.name)},${target.lat},${target.lng}`}
                target="_blank"
              >
                카카오맵에서 보기
              </a>
              <a
                className="underline"
                href={`https://map.kakao.com/link/to/${encodeURIComponent(target.name)},${target.lat},${target.lng}`}
                target="_blank"
              >
                길찾기
              </a>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
