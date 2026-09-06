import "server-only";
import { apiRequest } from "@/lib/api/client";
import { addressFormToPayload, mapAddress, mapCustomerProfile } from "@/lib/api/mappers";
import type { ApiAddress, ApiUser } from "@/lib/api/types";
import { getCustomerToken } from "@/lib/session";
import type { Address, CustomerProfile } from "@/lib/types/account";

/**
 * Every /account/* route is behind the backend's get_current_customer
 * dependency, so these all require a real bearer token — the middleware
 * cookie-presence gate is only a UX redirect, never the boundary.
 */
async function customerIdentity() {
  const accessToken = await getCustomerToken();
  if (!accessToken) throw new Error("account API called without a customer token");
  return { accessToken };
}

export async function getProfile(): Promise<CustomerProfile> {
  return mapCustomerProfile(await apiRequest<ApiUser>("/account/me", { identity: await customerIdentity() }));
}

/** Only full_name is editable — phone/email are the login identity. */
export async function updateProfileName(fullName: string): Promise<CustomerProfile> {
  return mapCustomerProfile(
    await apiRequest<ApiUser>("/account/me", {
      method: "PATCH",
      body: { full_name: fullName },
      identity: await customerIdentity(),
    })
  );
}

export async function getAddresses(): Promise<Address[]> {
  const raw = await apiRequest<ApiAddress[]>("/account/addresses", { identity: await customerIdentity() });
  return raw.map(mapAddress);
}

export async function createAddress(values: Parameters<typeof addressFormToPayload>[0]): Promise<Address> {
  return mapAddress(
    await apiRequest<ApiAddress>("/account/addresses", {
      method: "POST",
      body: addressFormToPayload(values),
      identity: await customerIdentity(),
    })
  );
}

export async function setDefaultAddress(addressId: string): Promise<Address> {
  return mapAddress(
    await apiRequest<ApiAddress>(`/account/addresses/${encodeURIComponent(addressId)}`, {
      method: "PATCH",
      body: { is_default: true },
      identity: await customerIdentity(),
    })
  );
}

export async function deleteAddress(addressId: string): Promise<void> {
  await apiRequest<null>(`/account/addresses/${encodeURIComponent(addressId)}`, {
    method: "DELETE",
    identity: await customerIdentity(),
  });
}
