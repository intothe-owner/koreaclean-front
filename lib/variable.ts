import { RowKey } from "@/hooks/usePricing";
import { useQuery } from "@tanstack/react-query";
export const baseUrl = 'http://3.36.49.217';
// export const baseUrl = 'http://localhost:4500';
export type MenuItem = {
    id?: string;
    label: string;
    href?: string;
    children?: { id?: string; label: string; href: string }[];
};
export const MENUS: MenuItem[] = [
    {
        id: 'home',
        label: '홈',
        children: [
            { id: 'home1', label: '서비스 개요 소개', href: '/home/intro' },
            { id: 'home2', label: '주요 서비스 지역', href: '/home/area' },
            { id: 'home3', label: '연락처 및 위치', href: '/home/contact' },
            { id: 'home4', label: '간단한 성과 현황', href: '/home/achieve' },
            { id: 'home5', label: '고객 후기', href: '/home/review' },
        ],
        href: '/home/intro'
    },
    {
        id: 'service',
        label: '서비스 소개',
        children: [
            { id: 'service1', label: '경로당 청소 서비스', href: '/service/clean' },
            { id: 'service2', label: '서비스 절차 안내', href: '/service/step' },
            { id: 'service3', label: '요금표', href: '/service/pricing' },
            { id: 'service4', label: '서비스 지역', href: '/service/area' },
            { id: 'service5', label: '이용 안내', href: '/service/guide' },
            { id: 'service6', label: '품질 보증 정책', href: '/service/quality' },
        ],
        href: '/service/clean'
    },
    {
        label: '서비스 신청',
        href: '/request'
    },
    {
        label: '업체 등록',
        href: '/company'
    },
    {
        label: '고객센터',
        children: [
            { label: '공지사항', href: '/customer/notice/list' },
            { label: '자주 묻는 질문', href: '/customer/faq' },
            { label: '문의하기', href: '/customer/qna' },
            { label: '다운로드', href: '/customer/download/list' },
        ],
        href: '/customer/notice/list'
    },
];

export type User = {
    id: number;
    email: string;
    name: string;
    mobile: string;
    level: number;
    is_confirm: boolean;
}



export type CompanyItem = {
    id?: number;              // Users.id
    name?: string;            // 기업명
    ceo?:string;              //대표명
    biz_no?:string;           //사업자번호
    corp_no?:string;          //법인번호
    start_date?:string;       //설립일
    company_type?:string;     //회사형태
    post_code?:string;        //우편번호
    address?:string;          //주소
    address_detail?:string;    //상세주소
    lat?:number;              //위도
    lng?:number;              //경도
    tel?:string;              //연락처
    fax?:string;              //팩스번호
    email?:string;            //이메일
    homepage?:string;        //홈페이지
    regions?:string[];            //주력 지역
    certs?:string[];              //자격증/경력
    documents?:JSON;          //첨부파일
    status?:string;           //상태
};

export const companyStatus = {
  PENDING:  "대기",
  APPROVED: "승인",
  REJECTED: "반려",
} as const;
export type CompanyStatus = keyof typeof companyStatus; 




//경로당 정보
export type SeniorItem = {
  id: number;
  uniq_id?:string;
  name: string;     // 경로당명
  address: string;    // 주소
  address_detail?: string;   // 상세주소
  post_code?: string; // 우편번호
  lat?: number | null;
  lng?: number | null;
  client_id?:number;
};

export type AssignmentStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "CANCELLED";

export type LatestAssignment = {
  id?: number;
  request_id?: number;
  company_id?: number;
  status?: AssignmentStatus;
  cancel_memo?: string | null;
  created_at?: string;
  updated_at?: string;
};



export type RequestForm = {
  id?:number,
  org_name: string,//기관명
  contact_name: string,//담당자명
  contact_tel: string,//사무실연락처
  contact_phone: string,//담당자 연락처
  contact_email: string,//담당자 이메일주소
  seniors: JSON,//경로당 정보
  service_type?: JSON,//서비스타입
  service_types_other?:string,
  hope_date?: string,//희망일
  etc?: string,//특이사항
  files?: JSON,//파일
  created_at?: string;         // 서버가 created_at로 주는 경우
  createdAt?: string;          // createdAt으로 주는 경우
  user_id?: number;//회원 번호
  price?:number;
  estimate?:string;
  status?:string;
  latest_assignment?: LatestAssignment | null; // ← JSON 대신 구체 타입
  unread_count?:number;
}

export type SiteInfoDto = {
  id: number | null;
  site_name: string;
  post_code: string;
  address: string;
  address_detail: string;
  biz_no: string;
  ceoName: string;
  tel: string;
  fax: string;
  email: string;
  emailPublic: boolean;
  site_description: string;
  meta_tags: string[];
  terms_text: string;
  privacy_text: string;
  icon_url: string | null;
  icon_key: string | null;
  created_at: string | null;
  updated_at: string | null;
};
export const LABELS: Record<RowKey, string> = {
  totalCare: "토탈케어서비스",
  generalCleaning: "대행청소",
  disinfection: "소독방역",
  acDeepClean: "에어컨종합세척",
  etc: "기타",
};
//카카오 api key
export const appKey = 'c78ff6a6e87cf23cb658be44859dc5d1';