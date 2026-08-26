export interface ShippingSetting {
  mode: "flat" | "free";
  cost: number;
  freeOver: number;
}

export interface ContactSetting {
  phone: string;
  whatsapp: string;
  telegram: string;
  address: string;
}

export interface SocialLinks {
  telegram?: string;
  instagram?: string;
  youtube?: string;
  aparat?: string;
}

export interface HeroSlide {
  id: string;
  title: string;
  highlight: string;
  ctaLabel: string;
  ctaHref: string;
  imageAlt: string;
}

export interface SiteSettings {
  shipping: ShippingSetting;
  contact: ContactSetting;
  social: SocialLinks;
  heroSlides: HeroSlide[];
}
