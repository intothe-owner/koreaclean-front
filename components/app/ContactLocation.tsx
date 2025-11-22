// components/app/ContactLocation.tsx
'use client';

import { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Building2, Send, Copy, Bus,PrinterCheck } from 'lucide-react';
import KakaoMap from '../ui/KakaoMap';
import { useSiteInfo } from '@/hooks/useSiteInfo';

export default function ContactLocation() {
  const { data, isLoading, isError } = useSiteInfo();
  return (
    <div className="space-y-12">
      {/* 1) 타이틀 & 리드 */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-900">연락처 및 위치</h2>
        <p className="text-neutral-600 mt-1">본부 및 지사 연락처, 운영 시간, 방문/우편 주소를 한눈에 확인하세요.</p>
      </section>

      {/* 2) 연락 카드 */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ContactCard
          icon={<Phone className="w-5 h-5" />}
          title="대표 전화"
          lines={[data?.tel??'', "평일 09:00~17:00"]}
          copyText={data?.tel??'01042421950'}
        />
        {
          data?.emailPublic?
            <ContactCard
              icon={<Mail className="w-5 h-5" />}
              title="이메일"
              lines={[data?.email??'', "문의 24시간 접수"]}
              copyText="support@cleancoop.kr"
            />:<ContactCard
              icon={<PrinterCheck className="w-5 h-5" />}
              title="팩스"
              lines={[data?.fax??'', "문의 24시간 접수"]}
              copyText={data?.fax??'01000000000'}
            />
        }
        
        <ContactCard
          icon={<Clock className="w-5 h-5" />}
          title="운영 시간"
          lines={["평일 09:00~18:00", "점심 12:00~13:00", "주말/공휴일 휴무"]}
        />
      </section>

      {/* 3) 본부 위치 + 지도 플레이스홀더 */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-3">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-neutral-600 mt-0.5" />
            <div>
              <div className="font-semibold text-neutral-900">본부 주소</div>
              <p className="text-sm text-neutral-600 mt-1">{data?.address??''} {data?.address_detail??''}</p>
              
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Phone className="w-4 h-4 text-neutral-500" /> {data?.tel??''}
          </div>
        </div>
        <div className="relative aspect-[16/10] w-full rounded-2xl border border-dashed border-neutral-300 bg-white/60 grid place-items-center text-neutral-400">
          {/* <span className="text-sm">지도(이미지)</span> */}
          <div style={{width:'100%'}}>
            <KakaoMap address={data?.address??''} title={data?.site_name??''} height={360} level={3}/>
          </div>
          
        </div>
      </section>
    </div>
  );
}

function ContactCard({ icon, title, lines, copyText }: { icon: React.ReactNode; title: string; lines: string[]; copyText?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5">
      <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-neutral-100 text-neutral-700 mb-3">
        {icon}
      </div>
      <div className="font-semibold text-neutral-900">{title}</div>
      <div className="mt-1 space-y-0.5 text-sm text-neutral-600">
        {lines.map((l) => (
          <div key={l}>{l}</div>
        ))}
      </div>
      {copyText && (
        <button
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(copyText);
              setCopied(true);
              setTimeout(() => setCopied(false), 1200);
            } catch {}
          }}
          className="mt-3 inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-neutral-800 hover:bg-neutral-50"
        >
          <Copy className="w-3.5 h-3.5" /> {copied ? '복사됨!' : '복사하기'}
        </button>
      )}
    </div>
  );
}

function BranchCard({ name, address, phone }: { name: string; address: string; phone: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
      <div className="font-medium text-neutral-900">{name}</div>
      <div className="text-xs text-neutral-600 mt-1">{address}</div>
      <div className="text-xs text-neutral-600 mt-0.5">{phone}</div>
      <div className="mt-2 flex gap-2">
        <button className="rounded-lg bg-neutral-900 text-white px-3 py-2 text-xs font-semibold">연락하기</button>
        <button className="rounded-lg bg-white border border-neutral-300 text-neutral-800 px-3 py-2 text-xs font-semibold">지도 보기</button>
      </div>
    </div>
  );
}

function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [sent, setSent] = useState(false);

  const canSend = name.trim() && email.includes('@') && message.trim() && agreed;

  const onSubmit = async () => {
    if (!canSend) return;
    // TODO: 실제 API 연동
    setSent(true);
    setTimeout(() => setSent(false), 1500);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-3">
        <Input label="이름" value={name} onChange={setName} placeholder="홍길동" />
        <Input label="이메일" value={email} onChange={setEmail} placeholder="you@example.com" />
        <div className="flex items-start gap-2 pt-1">
          <input id="agree" type="checkbox" className="mt-1 h-4 w-4 rounded border-neutral-300" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
          <label htmlFor="agree" className="text-xs text-neutral-600">문의 처리 및 회신을 위한 개인정보 수집·이용에 동의합니다.</label>
        </div>
      </div>
      <div className="flex flex-col">
        <label className="text-sm font-medium text-neutral-800">문의 내용</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="필요하신 서비스/지역/일정 등을 적어주세요."
          className="mt-1 h-40 w-full resize-none rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-900/10"
        />
        <div className="mt-3 flex justify-end">
          <button
            disabled={!canSend}
            onClick={onSubmit}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold ${
              canSend ? 'bg-neutral-900 text-white hover:bg-neutral-800' : 'bg-neutral-200 text-neutral-500 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" /> {sent ? '전송 완료!' : '문의 보내기'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="text-sm font-medium text-neutral-800">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 h-11 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-900/10"
      />
    </div>
  );
}
