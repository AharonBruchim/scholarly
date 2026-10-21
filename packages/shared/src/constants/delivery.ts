import { DeliveryChannel } from '../types/user';

export const ENABLED_DELIVERY_CHANNELS = [DeliveryChannel.EMAIL] as const;

export function isDeliveryChannelEnabled(channel: string): boolean {
    return (ENABLED_DELIVERY_CHANNELS as readonly string[]).includes(channel);
}
