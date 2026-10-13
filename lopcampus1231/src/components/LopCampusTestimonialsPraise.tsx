import React from 'react';
import { Sparkles, Star, ThumbsUp, Heart, CheckCircle2 } from 'lucide-react';

interface PraiseTestimonial {
  name: string;
  collegeOrCity: string;
  avatarText: string;
  avatarBg: string;
  emoji: string;
  text: string;
  stars: number;
  highlight?: string;
}

const PRAISES: PraiseTestimonial[] = [
  {
    name: 'Kelvin M.',
    collegeOrCity: 'Mwanafunzi UDSM (Y2)',
    avatarText: 'KM',
    avatarBg: 'bg-blue-600',
    emoji: '🔥🏠',
    text: 'LopCampus imenisaidia sana! Nilipata chumba kizuri Sinza ndani ya saa 2 tu bila kuzungushwa mtaani na madalali! Asante sana LopCampus 🙌💯',
    stars: 5,
    highlight: 'Nimepata chumba ndani ya saa 2!'
  },
  {
    name: 'Amina S.',
    collegeOrCity: 'IFM, Posta',
    avatarText: 'AS',
    avatarBg: 'bg-emerald-600',
    emoji: '✨🥰',
    text: 'Huduma ni safi sana 👌 Video za vyumba zilinisaidia kuona chumba halisi kabla ya kwenda. Nimerahisishiwa sana maisha ya chuo! LopCampus kiboko 🚀',
    stars: 5,
    highlight: 'Video zimenisaidia kuona chumba halisi!'
  },
  {
    name: 'Baraka J.',
    collegeOrCity: 'UDOM, Dodoma',
    avatarText: 'BJ',
    avatarBg: 'bg-indigo-600',
    emoji: '👏🎉',
    text: 'Kupata chumba safi chenye maji na umeme Dodoma haijawahi kuwa rahisi hivi! Nili-chat na dalali direct nikamaliza dili. Big up LopCampus team 🙏❤️',
    stars: 5,
    highlight: 'Nili-chat direct na dalali nikamaliza dili!'
  },
  {
    name: 'Neema K.',
    collegeOrCity: 'CBE, Dar es Salaam',
    avatarText: 'NK',
    avatarBg: 'bg-rose-600',
    emoji: '🥳💃',
    text: 'Hamna tena kupoteza hela ya nauli kutafuta vyumba mtaani! App hii ni suluhisho kubwa kwa sisi wanafunzi. Asanteni sana LopCampus 🌟🏡',
    stars: 5,
    highlight: 'Hakuna tena kupoteza nauli mtaani!'
  },
  {
    name: 'Innocent P.',
    collegeOrCity: 'DIT, Ilala',
    avatarText: 'IP',
    avatarBg: 'bg-amber-600',
    emoji: '💪🤩',
    text: 'Nimepata master room safi Magomeni kwa bei nafuu kabisa! Mfumo wa chat na video ni moto wa kuotea mbali. LopCampus oyee! 🏆✨',
    stars: 5,
    highlight: 'Master room safi kwa bei nafuu!'
  }
];

export const LopCampusTestimonialsPraise: React.FC = () => {
  return (
    <div className="bg-gradient-to-br from-blue-50 via-indigo-50/40 to-emerald-50 border border-blue-200/80 rounded-2xl p-4 sm:p-5 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-blue-200/60">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4 text-yellow-300" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-black text-neutral-900 flex items-center gap-1.5">
              <span>Shukrani & Maoni ya Wateja wa LopCampus</span>
              <span className="text-xs">🎉❤️</span>
            </h4>
            <p className="text-[11px] text-neutral-600">
              Wanafunzi na wapangaji waliofanikiwa kupata vyumba kwa urahisi kupitia LopCampus
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-full self-start sm:self-auto">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Wateja 1,200+ Wameridhika</span>
        </div>
      </div>

      {/* Testimonials cards */}
      <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {PRAISES.map((item, idx) => (
          <div
            key={idx}
            className="bg-white rounded-xl p-3 border border-blue-100 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between"
          >
            <div>
              {/* Card top */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-full ${item.avatarBg} text-white text-[11px] font-bold flex items-center justify-center shadow-2xs`}
                  >
                    {item.avatarText}
                  </div>
                  <div>
                    <span className="font-bold text-xs text-neutral-800 block leading-tight">
                      {item.name}
                    </span>
                    <span className="text-[10px] text-neutral-500 block leading-none">
                      {item.collegeOrCity}
                    </span>
                  </div>
                </div>

                <span className="text-base" title="Furaha ya mteja">{item.emoji}</span>
              </div>

              {/* Stars */}
              <div className="flex items-center gap-0.5 mb-1.5">
                {[...Array(item.stars)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                ))}
              </div>

              {/* Quote text */}
              <p className="text-[11px] text-neutral-700 leading-relaxed font-medium">
                "{item.text}"
              </p>
            </div>

            {/* Badge */}
            {item.highlight && (
              <div className="mt-2.5 pt-2 border-t border-neutral-100 flex items-center justify-between text-[10px] text-blue-700 font-semibold">
                <span className="truncate">✓ {item.highlight}</span>
                <ThumbsUp className="w-3 h-3 text-blue-600 shrink-0 ml-1" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Small live praise marquee / ticker for extra short praises */}
      <div className="mt-3 pt-2.5 border-t border-blue-200/50 flex flex-wrap items-center justify-between gap-2 text-[11px] text-neutral-600">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-bold text-blue-900">Ushuhuda wa haraka:</span>
          <span className="bg-white/80 border border-blue-200 px-2 py-0.5 rounded-full text-neutral-700 font-medium">
            "Chumba kizuri nimekipata chap! LopCampus nomaa 🔥🙌" — <em>Daud (Mbezi)</em>
          </span>
          <span className="bg-white/80 border border-blue-200 px-2 py-0.5 rounded-full text-neutral-700 font-medium">
            "Huduma ya chat imeniokoa sana kutumia muda mwingi 🚀" — <em>Happy (Kijitonyama)</em>
          </span>
        </div>

        <div className="flex items-center gap-1 text-[11px] font-bold text-blue-800">
          <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
          <span>Asanteni sana kwa kuamini LopCampus!</span>
        </div>
      </div>
    </div>
  );
};
