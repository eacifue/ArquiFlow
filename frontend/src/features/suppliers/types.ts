export interface Supplier {
  id: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  taxId: string | null;
  category: string | null;
}

export interface SupplierFormInput {
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  taxId?: string;
  category?: string;
}
