import type { SiteSettings } from "@/lib/types/settings";

export const mockSettings: SiteSettings = {
  shipping: {
    mode: "flat",
    cost: 50000,
    freeOver: 1000000,
  },
  contact: {
    phone: "021-91234567",
    whatsapp: "989121234567",
    telegram: "karamadmedtech",
    address: "تهران، خیابان ولیعصر، بالاتر از میدان ونک، پلاک ۱۲۴",
  },
  social: {
    telegram: "https://t.me/karamadmedtech",
    instagram: "https://instagram.com/karamadmedtech",
    aparat: "https://aparat.com/karamadmedtech",
  },
  heroSlides: [
    {
      id: "slide-1",
      title: "تجهیزات پزشکی با تضمین اصالت و بهترین قیمت",
      highlight: "تضمین اصالت",
      ctaLabel: "مشاهده محصولات",
      ctaHref: "/category/tajhizat-tashkhisi",
      imageAlt: "تجهیزات تشخیصی پزشکی",
    },
    {
      id: "slide-2",
      title: "مراقبت در منزل، ساده و مطمئن برای خانواده شما",
      highlight: "مراقبت در منزل",
      ctaLabel: "خرید تجهیزات مراقبتی",
      ctaHref: "/category/moraghebat-dar-manzel",
      imageAlt: "تجهیزات مراقبت در منزل",
    },
    {
      id: "slide-3",
      title: "تجهیزات مطب و کلینیک با فاکتور رسمی و مشاوره تخصصی",
      highlight: "فاکتور رسمی",
      ctaLabel: "مشاوره خرید",
      ctaHref: "/category/tajhizat-matb-clinic",
      imageAlt: "تجهیزات مطب و کلینیک",
    },
  ],
};
