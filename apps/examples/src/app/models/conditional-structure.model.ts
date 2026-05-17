import { NgxDeepPartial, NgxDeepRequired } from 'ngx-vest-forms';

export type DeliveryMode = 'pickup' | 'shipment' | 'digital';

export type ConditionalStructureModel = NgxDeepPartial<{
  contactName: string;
  deliveryMode: DeliveryMode;
  shippingAddress: string;
  deliveryEmail: string;
}>;

export const conditionalStructureContract: NgxDeepRequired<ConditionalStructureModel> = {
  contactName: '',
  deliveryMode: 'pickup',
  shippingAddress: '',
  deliveryEmail: '',
};

export const initialConditionalStructureValue: ConditionalStructureModel = {
  deliveryMode: 'pickup',
};
