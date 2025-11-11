'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

declare global {
  interface Window {
    kakao?: any;
  }
}

const KAKAO_APP_KEY = process.env.NEXT_PUBLIC_KAKAO_APP_KEY;

// SDK 로더 (전역 싱글톤)
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
    // services 라이브러리 포함(지오코더)
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_APP_KEY}&autoload=false&libraries=services`;
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

export type KakaoMapProps = {
  /** 위도/경도(우선 적용) */
  lat?: number;
  lng?: number;
  /** 주소(위도/경도가 없을 때 지오코딩해서 사용) */
  address?: string;

  /** 마커/인포윈도우 제목 */
  title?: string;
  /** 지도 레벨(줌): 1(가까움) ~ 14(멀어짐) */
  level?: number;
  /** 높이(px 또는 CSS 값) */
  height?: number | string;
  /** 상호작용 옵션 */
  draggable?: boolean;
  scrollwheel?: boolean;

  /** 주소 지오코딩 성공 시 전달 (좌표/정규화주소) */
  onResolve?: (info: { lat: number; lng: number; address?: string }) => void;

  className?: string;
  style?: React.CSSProperties;
};

/**
 * KakaoMap
 * - lat/lng이 있으면 그대로 표시
 * - 없으면 address 지오코딩해서 표시
 */
export default function KakaoMap({
  lat,
  lng,
  address,
  title,
  level = 3,
  height = 360,
  draggable = true,
  scrollwheel = true,
  onResolve,
  className,
  style,
}: KakaoMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);

  // 우선순위: 좌표 > 주소
  const wantCoords = useMemo(() => {
    if (typeof lat === 'number' && typeof lng === 'number') {
      return { lat, lng };
    }
    return null;
  }, [lat, lng]);

  useEffect(() => {
    let canceled = false;

    async function init() {
      setError(null);
      await ensureKakao();
      if (canceled || !containerRef.current || !window.kakao?.maps) return;

      const { maps } = window.kakao;

      // 지오코딩이 필요한 경우
      if (!wantCoords && address) {
        try {
          const geocoder = new maps.services.Geocoder();

          geocoder.addressSearch(address, (results: any[], status: any) => {
            if (canceled) return;
            if (status === maps.services.Status.OK && results?.[0]) {
              const r = results[0];
              const y = parseFloat(r.y); // lat
              const x = parseFloat(r.x); // lng
              console.log(y)
              createOrUpdateMap({ lat: y, lng: x }, r.road_address?.address_name || r.address?.address_name || address);
              onResolve?.({ lat: y, lng: x, address: r.road_address?.address_name || r.address?.address_name || address });
            } else {
              setError('주소를 좌표로 변환하지 못했습니다.');
              // 지도 컨테이너 초기화만
              createOrUpdateMap(null, undefined);
            }
          });
        } catch (e) {
          setError('지오코딩 중 오류가 발생했습니다.');
          createOrUpdateMap(null, undefined);
        }
      } else if (wantCoords) {
        // 좌표가 있는 경우
        createOrUpdateMap(wantCoords, address);
      } else {
        // 아무 정보도 없는 경우
        setError('지도를 표시할 좌표/주소가 없습니다.');
      }
    }

    function createOrUpdateMap(
      coords: { lat: number; lng: number } | null,
      resolvedAddress?: string
    ) {
      const { maps } = window.kakao;

      // 지도 생성(최초 1회)
      if (!mapRef.current) {
        mapRef.current = new maps.Map(containerRef.current!, {
          center: new maps.LatLng(coords?.lat ?? 37.5665, coords?.lng ?? 126.9780), // 기본: 서울시청
          level,
        });
        // 인터랙션 옵션
        mapRef.current.setDraggable(draggable);
        mapRef.current.setZoomable(scrollwheel);

        // 줌컨트롤
        const zc = new maps.ZoomControl();
        mapRef.current.addControl(zc, maps.ControlPosition.RIGHT);
      }

      // 좌표가 있으면 마커/센터 갱신
      if (coords) {
        const center = new maps.LatLng(coords.lat, coords.lng);
        mapRef.current.setLevel(level);
        mapRef.current.setCenter(center);

        if (!markerRef.current) {
          markerRef.current = new maps.Marker({ position: center, map: mapRef.current });
        } else {
          markerRef.current.setPosition(center);
          markerRef.current.setMap(mapRef.current);
        }

        // 인포윈도우
        if (title || resolvedAddress) {
          const iw = new maps.InfoWindow({
            content: `<div style="padding:6px 8px;">${title ?? ''}${title && resolvedAddress ? '<br/>' : ''}${resolvedAddress ?? ''}</div>`,
          });
          iw.open(mapRef.current, markerRef.current);
        }
      } else {
        // 좌표가 없으면 마커 제거
        if (markerRef.current) {
          markerRef.current.setMap(null);
          markerRef.current = null;
        }
      }

      // 최신 옵션 반영
      mapRef.current.setDraggable(draggable);
      mapRef.current.setZoomable(scrollwheel);
    }

    init();

    return () => {
      canceled = true;
      // kakao maps는 특별한 dispose가 없어 참조만 정리
      markerRef.current = null;
      mapRef.current = null;
    };
  }, [wantCoords, address, title, level, draggable, scrollwheel, onResolve]);

  return (
    <div className={className} style={{ ...style }}>
      <div
        ref={containerRef}
        className="rounded-lg border"
        style={{ width: '100%', height: typeof height === 'number' ? `${height}px` : height }}
      />
      {error && (
        <div className="mt-2 text-xs text-red-500">{error}</div>
      )}
    </div>
  );
}
