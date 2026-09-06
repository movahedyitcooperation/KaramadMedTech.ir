export interface CustomerProfile {
  id: string;
  /** Latin digits, rendered LTR — see CLAUDE.md §3's numeral policy. */
  phone: string | null;
  email: string | null;
  fullName: string | null;
}

export interface Address {
  id: string;
  title: string;
  fullName: string;
  phone: string;
  province: string;
  city: string;
  addressLine: string;
  postalCode: string | null;
  isDefault: boolean;
}
