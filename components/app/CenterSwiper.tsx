'use client'
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-fade';
const CenterSwiper = () => {
    const heroImages = [
        '/images/main01.png',
        '/images/main02.png',
    ];
    return (
        <div className="absolute inset-x-0 top-0 z-0 h-[120vh] md:h-[110vh]">
            <Swiper
                modules={[Autoplay, EffectFade]}
                effect="fade"
                fadeEffect={{ crossFade: true }}
                autoplay={{ delay: 5000, disableOnInteraction: false }}
                speed={3000}
                loop
                allowTouchMove={false}
                className="w-full h-full"
            >
                {heroImages.map((f, i) => (
                    <SwiperSlide key={i} className="!h-full">
                        <div className="relative w-full h-full">
                            <Image src={f} alt="" fill className="object-cover object-[100%_center]" priority={i === 0} />
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>
        </div>
    )
}

export default CenterSwiper;