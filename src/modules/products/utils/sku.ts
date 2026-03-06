import { slugify } from './slugify';

export function generateSku(params: {
  vendorSlug: string;
  productName: string;
  attributeValues: string[];
}): string {
  const vendor = slugify(params.vendorSlug);
  const product = slugify(params.productName);
  const attrs = params.attributeValues.map((v) => slugify(v)).join('-');
  return [vendor, product, attrs].filter(Boolean).join('-');
}
